from __future__ import annotations

import getpass
import json
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import END, START, MessagesState, StateGraph
from pypdf import PdfReader
from pydantic import BaseModel, Field, ValidationError

load_dotenv()


def normalize_text_content(content: object) -> str:
    if content is None:
        return ""

    if isinstance(content, str):
        return content

    if isinstance(content, dict):
        if "text" in content and isinstance(content["text"], str):
            return content["text"]
        if "content" in content:
            return normalize_text_content(content["content"])
        return str(content)

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            text = normalize_text_content(item)
            if text:
                parts.append(text)
        return "\n".join(parts)

    return str(content)


def ensure_api_key() -> None:
    if not os.environ.get("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = getpass.getpass("Enter your Google Gemini API key: ")


def load_pdf_documents(pdf_dir: Path) -> list[Document]:
    if not pdf_dir.exists():
        return []

    pdf_files = sorted(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        return []

    documents: list[Document] = []
    for pdf_path in pdf_files:
        reader = PdfReader(str(pdf_path))
        text_parts: list[str] = []
        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                text_parts.append(f"[Page {page_num}]\n{text.strip()}")

        full_text = "\n\n".join(text_parts).strip()
        if full_text:
            documents.append(
                Document(
                    page_content=full_text,
                    metadata={"source": str(pdf_path.name)},
                )
            )

    return documents


def build_rag_agent(pdf_dir: Path):
    ensure_api_key()

    model = init_chat_model("google_genai:gemini-2.5-flash-lite")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector_store = InMemoryVectorStore(embeddings)

    documents = load_pdf_documents(pdf_dir)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=180,
        add_start_index=True,
    )
    chunks = splitter.split_documents(documents)
    if chunks:
        vector_store.add_documents(chunks)

    def answer_query(query: str) -> str:
        """Retrieve relevant PYQ content and answer the user query."""
        normalized_query = normalize_text_content(query)
        if not chunks:
            return "No PDF documents were indexed yet. Add PYQ PDFs to the specified folder and try again."

        retrieved_docs = vector_store.similarity_search(normalized_query, k=3)
        context = "\n\n".join(
            f"Source: {doc.metadata.get('source', 'unknown')}\nContent: {doc.page_content}"
            for doc in retrieved_docs
        )

        system_prompt = (
            "You are an academic retrieval assistant. Your sole task is to extract previous year questions (PYQs) "
            "from the provided context that match the user's requested topic.\n\n"
            "Strict Grounding Rules:\n"
            "1. Extract ONLY questions directly mentioned in the provided context that match the given topic of the given subject.\n"
            "2. If a question is relevant but missing specific details like marks or year in the text, set those fields to null.\n"
            "3. Do not invent, extrapolate, or assume any information outside of the provided context.\n"
            "4. If no questions match the requested topic, return an empty list."
        )
        json_prompt = (
            "Respond only with a JSON array of PYQItem objects using keys: question_text, marks, year. "
            "If there are no matching questions, return an empty array."
        )
        response = model.invoke(
            [
                ("system", system_prompt),
                ("human", f"Question: {normalized_query}\n\nContext:\n{context}\n\n{json_prompt}"),
            ]
        )

        raw_content = response.content if hasattr(response, "content") else str(response)

        # Prefer a JSON output from the model and validate it with pydantic for consistent structure.
        parsed_items: list[PYQItem] = []
        try:
            parsed_json = json.loads(raw_content)
            if isinstance(parsed_json, list):
                for item in parsed_json:
                    parsed_items.append(PYQItem.model_validate(item))
            else:
                raise ValueError("Expected the model output to be a JSON array of PYQItem objects.")
        except (json.JSONDecodeError, ValidationError, ValueError):
            # Fallback: try to extract JSON from the text if the model wraps it in markdown or extra text.
            json_start = raw_content.find("[")
            json_end = raw_content.rfind("]")
            if json_start != -1 and json_end != -1 and json_end > json_start:
                try:
                    parsed_json = json.loads(raw_content[json_start : json_end + 1])
                    if isinstance(parsed_json, list):
                        for item in parsed_json:
                            parsed_items.append(PYQItem.model_validate(item))
                except (json.JSONDecodeError, ValidationError):
                    parsed_items = []

        return json.dumps([item.model_dump(mode="json") for item in parsed_items], ensure_ascii=False)

    return answer_query, documents, chunks


class PYQItem(BaseModel):
    question_text: str = Field(description="The exact text of the question from the context")
    marks: Optional[int] = Field(description="The marks allocated to the question, null if unknown")
    year: Optional[str] = Field(description="The year the question appeared, null if unknown")


class RAGState(MessagesState):
    agent_answer: str


def build_graph(pdf_dir: Path):
    answer_query, _, _ = build_rag_agent(pdf_dir)

    def answer_node(state: RAGState):
        last_message = state["messages"][-1].content if state["messages"] else ""
        answer = answer_query(normalize_text_content(last_message))
        return {"agent_answer": answer, "messages": [AIMessage(content=answer)]}

    workflow = StateGraph(RAGState)
    workflow.add_node("generate_answer", answer_node)
    workflow.add_edge(START, "generate_answer")
    workflow.add_edge("generate_answer", END)
    return workflow.compile()


DEFAULT_PDF_DIR = Path("../pdfs")
agent = build_graph(DEFAULT_PDF_DIR)