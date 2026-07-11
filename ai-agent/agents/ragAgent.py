from __future__ import annotations

import getpass
import json
import os
from pathlib import Path
from typing import Any, Optional, Union

from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_core.documents import Document
from langchain_core.messages import AIMessage
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langgraph.graph import END, START, MessagesState, StateGraph
from pymongo import MongoClient
from pymongo.collection import Collection
from pydantic import BaseModel, Field, ValidationError

load_dotenv()

DEFAULT_MONGODB_DB = "TCOP_AIAgent"
DEFAULT_MONGODB_COLLECTION = "pyq_chunks"
DEFAULT_VECTOR_INDEX_NAME = "vector_index"


def ensure_api_key() -> None:
    if not os.environ.get("GEMINI_API_KEY"):
        os.environ["GEMINI_API_KEY"] = getpass.getpass("Enter your Google Gemini API key: ")


def get_required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def get_collection() -> Collection[Any]:
    mongodb_uri = get_required_env("MONGODB_URI")
    database_name = os.environ.get("MONGODB_DB", DEFAULT_MONGODB_DB)
    collection_name = os.environ.get("MONGODB_COLLECTION", DEFAULT_MONGODB_COLLECTION)

    client = MongoClient(mongodb_uri)
    database = client[database_name]
    return database[collection_name]


def atlas_similarity_search(
    collection: Collection[Any],
    embeddings: GoogleGenerativeAIEmbeddings,
    vector_index_name: str,
    query: str,
    k: int,
    subject: str,
) -> list[Document]:
    query_embedding = embeddings.embed_query(query if query else "all")

    pipeline: list[dict[str, Any]] = [
        {
            "$vectorSearch": {
                "index": vector_index_name,
                "path": "embedding",
                "queryVector": query_embedding,
                "numCandidates": max(25, k * 5),
                "limit": k,
                "filter": {"subject": subject},
            }
        },
        {
            "$project": {
                "_id": 1,
                "text": 1,
                "subject": 1,
                "year": 1,
                "marks": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
    ]

    # print(f"Pipeline for subject '{subject}' and query '{query}': {json.dumps(pipeline, indent=2)}\n")
    results = list(collection.aggregate(pipeline))
    print(f"Atlas similarity search results for subject '{subject}' and query '{query}' and query embedding {len(query_embedding)}: {results}\n")
    documents: list[Document] = []
    for item in results:
        metadata = {
            "subject": item.get("subject"),
            "year": item.get("year"),
            "marks": item.get("marks"),
            "score": item.get("score"),
            "source_id": str(item.get("_id", "")),
        }
        documents.append(Document(page_content=str(item.get("text", "")), metadata=metadata))

    return documents


def build_rag_agent(dataset_dir: Path):
    ensure_api_key()

    model = init_chat_model("google_genai:gemini-2.5-flash-lite")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001", output_dimensionality=1536)
    collection = get_collection()
    vector_index_name = os.environ.get("MONGODB_VECTOR_INDEX", DEFAULT_VECTOR_INDEX_NAME)
    indexed_subjects = {
        str(subject).strip()
        for subject in collection.distinct("subject")
        if str(subject).strip()
    }

    def answer_query(input_payload: Union[str, dict, list]) -> str:
        """Retrieve target PYQ items filtering strictly by subject context metadata."""
        if not indexed_subjects:
            return "No records indexed in MongoDB Atlas. Run ingestion and try again."
    
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
        print("Filter context:", filter_ctx)
        print("Search context:", search_ctx)
        
        target_subject = str(filter_ctx.get("subject_name", "")).strip()
        target_topic = search_ctx.get("topic", "")

        if not target_subject:
            print("No target subject specified.")
            return json.dumps([])

        if target_subject not in indexed_subjects:
            print(f"Subject '{target_subject}' is not indexed.")
            return json.dumps([])

        # Query MongoDB Atlas Vector Search with deterministic subject filtering.
        retrieved_docs = atlas_similarity_search(
            collection=collection,
            embeddings=embeddings,
            vector_index_name=vector_index_name,
            query=str(target_topic),
            k=11,
            subject=target_subject,
        )
        print("Retrieved documents: ", retrieved_docs, "\n")

        if not retrieved_docs:
            print("No relevant documents found.")
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

    return answer_query


class PYQItem(BaseModel):
    question_text: str = Field(description="The exact text of the question from the context")
    marks: Optional[int] = Field(description="The marks allocated to the question, null if unknown")
    year: Optional[str] = Field(description="The year the question appeared, null if unknown")


class RAGState(MessagesState):
    agent_answer: str


def build_graph(dataset_dir: Path):
    answer_query = build_rag_agent(dataset_dir)

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