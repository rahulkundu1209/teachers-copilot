from __future__ import annotations

import getpass
import json
import os
from pathlib import Path
from typing import Optional, Union

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langgraph.graph import END, START, MessagesState, StateGraph
from pydantic import BaseModel, Field, ValidationError

load_dotenv()


def ensure_api_key() -> None:
    if not os.environ.get("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = getpass.getpass("Enter your Google Gemini API key: ")


def load_all_json_subjects(dataset_dir: Path) -> list[Document]:
    """Scans a directory of JSON subject files and loads questions into memory blocks."""
    if not dataset_dir.exists():
        print(f"Warning: Dataset directory {dataset_dir} does not exist.")
        return []

    documents: list[Document] = []
    
    # Iterate through every JSON file in the target directory
    for json_file in dataset_dir.glob("*.json"):
        with open(json_file, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                for item in data:
                    # Construct a semantic presentation text string for the vector embeddings
                    content = f"Question: {item.get('question_title')}\nMarks: {item.get('marks')}\nYear: {item.get('year')}"
                    
                    # Store only the mandatory filter variables within document metadata
                    metadata = {
                        "subject": item.get("subject"),
                        "year": item.get("year"),
                        "marks": item.get("marks")
                    }
                    documents.append(Document(page_content=content, metadata=metadata))
            except json.JSONDecodeError:
                print(f"Error reading file: {json_file.name}. Skipping corrupt file.")
                
    return documents


def build_rag_agent(dataset_dir: Path):
    ensure_api_key()

    model = init_chat_model("google_genai:gemini-2.5-flash-lite")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vector_store = InMemoryVectorStore(embeddings)

    # Ingest the multi-file dataset folder directly
    documents = load_all_json_subjects(dataset_dir)

    indexed_subjects = {
        str(doc.metadata.get("subject", "")).strip()
        for doc in documents
        if doc.metadata.get("subject")
    }
    
    if documents:
        vector_store.add_documents(documents)

    def answer_query(input_payload: Union[str, dict, list]) -> str:
        """Retrieve target PYQ items filtering strictly by subject context metadata."""
        if not documents:
            return "No records indexed. Populate the JSON dataset folder and try again."
    
        # 1. Handle case where LangChain sends content as a list of blocks
        if isinstance(input_payload, list):
            if len(input_payload) > 0 and isinstance(input_payload[0], dict) and "text" in input_payload[0]:
                input_payload = input_payload[0]["text"]
            else:
                # Fallback if it's some other list format
                input_payload = str(input_payload)
    
        # 2. Parse request payload structure securely
        if isinstance(input_payload, str):
            try:
                payload = json.loads(input_payload)
                # Just in case json.loads still yields a list
                if isinstance(payload, list):
                    payload = {"filter_context": {"subject_name": ""}, "search_context": {"topic": input_payload}}
            except json.JSONDecodeError:
                # Fallback handler if a raw string query enters the execution pipeline
                payload = {"filter_context": {"subject_name": ""}, "search_context": {"topic": input_payload}}
        else:
            payload = input_payload
    
        # 3. Double check that payload is definitely a dictionary now
        if not isinstance(payload, dict):
            payload = {"filter_context": {"subject_name": ""}, "search_context": {"topic": str(payload)}}
    
        # Unpack request properties safely
        filter_ctx = payload.get("filter_context", {}) or {}
        search_ctx = payload.get("search_context", {}) or {}
        
        target_subject = str(filter_ctx.get("subject_name", "")).strip()
        target_topic = search_ctx.get("topic", "")

        if not target_subject:
            return json.dumps([])

        if target_subject not in indexed_subjects:
            return json.dumps([])
    
        # Construct deterministic hard pre-filtering condition
        search_filter = lambda doc: str(doc.metadata.get("subject", "")).strip() == target_subject
    
        # Query vector store index with strict metadata filtering applied
        retrieved_docs = vector_store.similarity_search(
            query=target_topic if target_topic else "all", 
            k=5, 
            filter=search_filter
        )

        if not retrieved_docs:
            return json.dumps([])
    
        context = "\n\n".join(
            f"Subject: {doc.metadata.get('subject')}\n"
            f"Year: {doc.metadata.get('year')}\n"
            f"Marks: {doc.metadata.get('marks')}\n"
            f"Text: {doc.page_content}"
            for doc in retrieved_docs
        )
    
        system_prompt = (
            "You are an academic retrieval assistant. Your sole task is to extract previous year questions (PYQs) "
            "from the provided context that match the user's requested topic.\n\n"
            "Strict Grounding Rules:\n"
            "1. Extract all the questions mentioned in the provided context that are related to the given topic by the user.\n"
            "2. If a question is relevant but missing specific details like marks or year in the text, set those fields to null.\n"
            "3. Do not invent, extrapolate, or assume any information outside of the provided context.\n"
            "4. If no questions are present related to the requested topic, return an empty list."
        )
        json_prompt = (
            "Respond only with a JSON array of PYQItem objects using keys: question_text, marks, year. "
            "If there are no matching questions, return an empty array."
        )
        
        response = model.invoke(
            [
                ("system", system_prompt),
                ("human", f"Target Subject: {target_subject}\nTopic: {target_topic}\n\nContext:\n{context}\n\n{json_prompt}"),
            ]
        )
    
        raw_content = response.content if hasattr(response, "content") else str(response)
    
        # Output structuring and strict type validation with Pydantic
        parsed_items: list[PYQItem] = []
        try:
            parsed_json = json.loads(raw_content)
            if isinstance(parsed_json, list):
                for item in parsed_json:
                    parsed_items.append(PYQItem.model_validate(item))
            else:
                raise ValueError("Output is not a valid JSON array.")
        except (json.JSONDecodeError, ValidationError, ValueError):
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

    return answer_query, documents


class PYQItem(BaseModel):
    question_text: str = Field(description="The exact text of the question from the context")
    marks: Optional[int] = Field(description="The marks allocated to the question, null if unknown")
    year: Optional[str] = Field(description="The year the question appeared, null if unknown")


class RAGState(MessagesState):
    agent_answer: str


def build_graph(dataset_dir: Path):
    answer_query, _ = build_rag_agent(dataset_dir)

    def answer_node(state: RAGState):
        last_message = state["messages"][-1].content if state["messages"] else ""
        answer = answer_query(last_message)
        return {"agent_answer": answer, "messages": [AIMessage(content=answer)]}

    workflow = StateGraph(RAGState)
    workflow.add_node("generate_answer", answer_node)
    workflow.add_edge(START, "generate_answer")
    workflow.add_edge("generate_answer", END)
    return workflow.compile()


# Points safely to your local subdirectory of subject items
DEFAULT_DATASET_DIR = Path("../pyq_dataset")
agent = build_graph(DEFAULT_DATASET_DIR)