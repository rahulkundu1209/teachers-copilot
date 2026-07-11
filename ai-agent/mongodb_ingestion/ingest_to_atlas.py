from __future__ import annotations

import argparse
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Sequence

from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection

load_dotenv()

AI_AGENT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_DIRS = [AI_AGENT_ROOT / "pyq_dataset"]
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
DEFAULT_EMBED_BATCH_SIZE = 32
DEFAULT_BATCH_SLEEP_SECONDS = 20
DEFAULT_EMBEDDING_MODEL = "models/gemini-embedding-001"


def get_required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def iter_question_items(data: Any) -> Iterable[dict[str, Any]]:
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                yield item
        return

    if isinstance(data, dict):
        for key in ("questions", "items", "data", "records"):
            nested_items = data.get(key)
            if isinstance(nested_items, list):
                for item in nested_items:
                    if isinstance(item, dict):
                        yield item
                return

        if data:
            yield data


def load_documents_from_dataset_dir(dataset_dir: Path) -> list[Document]:
    documents: list[Document] = []

    if not dataset_dir.exists():
        print(f"Skipping missing dataset directory: {dataset_dir}")
        return documents

    for json_file in sorted(dataset_dir.glob("*.json")):
        try:
            with json_file.open("r", encoding="utf-8") as handle:
                payload = json.load(handle)
        except json.JSONDecodeError:
            print(f"Skipping invalid JSON file: {json_file}")
            continue

        for item_index, item in enumerate(iter_question_items(payload)):
            question_text = str(item.get("question_title", "")).strip()
            subject = str(item.get("subject", "")).strip()
            year = item.get("year")
            marks = item.get("marks")

            if not question_text:
                continue

            content = (
                f"Question: {question_text}\n"
                f"Subject: {subject}\n"
                f"Marks: {marks}\n"
                f"Year: {year}\n"
                f"Source file: {json_file.name}"
            )
            metadata = {
                "subject": subject,
                "year": year,
                "marks": marks,
                "source_file": json_file.name,
                "source_path": str(json_file),
                "item_index": item_index,
            }
            documents.append(Document(page_content=content, metadata=metadata))

    return documents


def split_documents(documents: Sequence[Document], chunk_size: int, chunk_overlap: int) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    chunked_documents = splitter.split_documents(list(documents))

    normalized_chunks: list[Document] = []
    for chunk_index, chunk in enumerate(chunked_documents):
        metadata = dict(chunk.metadata)
        metadata["chunk_index"] = chunk_index
        normalized_chunks.append(Document(page_content=chunk.page_content, metadata=metadata))

    return normalized_chunks


def build_embedding_model() -> GoogleGenerativeAIEmbeddings:
    return GoogleGenerativeAIEmbeddings(model=DEFAULT_EMBEDDING_MODEL, output_dimensionality=1536)


def chunk_id(document: Document) -> str:
    fingerprint = "|".join(
        [
            str(document.metadata.get("source_path", "")),
            str(document.metadata.get("item_index", "")),
            str(document.metadata.get("chunk_index", "")),
            document.page_content,
        ]
    )
    return hashlib.sha1(fingerprint.encode("utf-8")).hexdigest()


def ensure_indexes(collection: Collection[Any]) -> None:
    collection.create_index("subject")
    collection.create_index("year")
    collection.create_index("marks")
    collection.create_index("source_file")


def get_collection() -> Collection[Any]:
    mongodb_uri = get_required_env("MONGODB_URI")
    database_name = os.environ.get("MONGODB_DB", "TCOP_AIAgent")
    collection_name = os.environ.get("MONGODB_COLLECTION", "pyq_chunks")

    client = MongoClient(mongodb_uri)
    database = client[database_name]
    return database[collection_name]


def ingest(
    dataset_dirs: Sequence[Path],
    chunk_size: int,
    chunk_overlap: int,
    embed_batch_size: int,
    batch_sleep_seconds: int,
    drop_existing: bool,
) -> None:
    ensure_required_keys = ["GEMINI_API_KEY", "MONGODB_URI"]
    for key in ensure_required_keys:
        get_required_env(key)

    embeddings = build_embedding_model()
    collection = get_collection()
    ensure_indexes(collection)

    if drop_existing:
        deleted = collection.delete_many({})
        print(f"Cleared {deleted.deleted_count} existing documents")

    source_documents: list[Document] = []
    for dataset_dir in dataset_dirs:
        source_documents.extend(load_documents_from_dataset_dir(dataset_dir))

    if not source_documents:
        print("No source documents found. Nothing to ingest.")
        return

    chunked_documents = split_documents(source_documents, chunk_size, chunk_overlap)
    print(f"Loaded {len(source_documents)} source documents")
    print(f"Split into {len(chunked_documents)} chunks")

    # Metrics trackers
    total_upserted = 0
    total_modified = 0
    total_matched = 0

    total_chunks = len(chunked_documents)
    total_batches = (total_chunks + embed_batch_size - 1) // embed_batch_size
    created_at = datetime.now(timezone.utc)

    # Core incremental batching loop
    for batch_number, start in enumerate(range(0, total_chunks, embed_batch_size), start=1):
        batch = chunked_documents[start : start + embed_batch_size]
        texts = [doc.page_content for doc in batch]
        
        # 1. Generate embeddings for the current batch
        vectors = embeddings.embed_documents(texts, batch_size=embed_batch_size)
        
        # 2. Build MongoDB operations for the current batch
        operations: list[UpdateOne] = []
        for document, vector in zip(batch, vectors, strict=False):
            document_id = chunk_id(document)
            record = {
                "_id": document_id,
                "text": document.page_content,
                "embedding": vector,
                "subject": document.metadata.get("subject"),
                "year": document.metadata.get("year"),
                "marks": document.metadata.get("marks"),
                "item_index": document.metadata.get("item_index"),
                "chunk_index": document.metadata.get("chunk_index"),
                "created_at": created_at,
            }
            operations.append(UpdateOne({"_id": document_id}, {"$set": record}, upsert=True))

        # 3. Write current batch data directly to MongoDB
        if operations:
            result = collection.bulk_write(operations, ordered=False)
            total_upserted += result.upserted_count
            total_modified += result.modified_count
            total_matched += result.matched_count

        print(
            f"Processed & Saved {min(start + embed_batch_size, total_chunks)}/{total_chunks} chunks "
            f"({batch_number}/{total_batches} batches)"
        )

        # 4. Rate-limiting sleep delay between API requests
        if batch_number < total_batches and batch_sleep_seconds > 0:
            print(f"Sleeping {batch_sleep_seconds} seconds before the next batch...")
            time.sleep(batch_sleep_seconds)

    print(
        "\nMongoDB ingestion completely successfully:\n"
        f"  Total Upserted: {total_upserted}\n"
        f"  Total Modified: {total_modified}\n"
        f"  Total Matched: {total_matched}"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ingest PYQ data into MongoDB Atlas Vector Search.")
    parser.add_argument(
        "--dataset-dir",
        action="append",
        dest="dataset_dirs",
        help="Dataset directory to ingest. You can pass this multiple times.",
    )
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE)
    parser.add_argument("--chunk-overlap", type=int, default=DEFAULT_CHUNK_OVERLAP)
    parser.add_argument("--embed-batch-size", type=int, default=DEFAULT_EMBED_BATCH_SIZE)
    parser.add_argument(
        "--batch-sleep-seconds",
        type=int,
        default=DEFAULT_BATCH_SLEEP_SECONDS,
        help="Seconds to sleep between embedding batches.",
    )
    parser.add_argument(
        "--drop-existing",
        action="store_true",
        help="Delete all existing documents in the target MongoDB collection before ingesting.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    dataset_dirs = [Path(path).resolve() for path in args.dataset_dirs] if args.dataset_dirs else DEFAULT_DATASET_DIRS
    ingest(
        dataset_dirs=dataset_dirs,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        embed_batch_size=args.embed_batch_size,
        batch_sleep_seconds=args.batch_sleep_seconds,
        drop_existing=args.drop_existing,
    )


if __name__ == "__main__":
    main()