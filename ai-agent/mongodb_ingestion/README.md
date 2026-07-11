# MongoDB Atlas Ingestion

This folder contains a standalone ingestion flow that reads the local PYQ JSON data, splits it into chunks, embeds the chunks, and stores them in MongoDB Atlas for later vector search.

## What it does

- Reads JSON files from `pyq_dataset/` and `extra_data/`
- Splits long text into chunks with `RecursiveCharacterTextSplitter`
- Generates embeddings with `GoogleGenerativeAIEmbeddings`
- Stores `text`, `embedding`, and metadata in MongoDB Atlas
- Uses stable document IDs so reruns update the same records

## Files

- `ingest_to_atlas.py` - standalone ingestion script
- `.env.example` - required environment variables
- `atlas_vector_search_index.json` - example Atlas vector search index definition

## Step-by-step setup

1. Install the new dependency.
   - Add `pymongo[srv]` to `ai-agent/requirements.txt`.
   - Then run:

   ```powershell
   pip install -r ai-agent/requirements.txt
   ```

2. Create a `.env` file in `ai-agent/`.
   - Copy the values from `mongodb_ingestion/.env.example`.
   - Fill in your Gemini API key and MongoDB Atlas connection string.

3. Create a MongoDB Atlas cluster.
   - Create a database, for example `teachers_copilot`.
   - Create a collection, for example `pyq_chunks`.

4. Create an Atlas Vector Search index.
   - Use the example in `atlas_vector_search_index.json`.
   - Make sure the vector field name matches the script: `embedding`.

5. Run the ingestion script.

   ```powershell
   python ai-agent\mongodb_ingestion\ingest_to_atlas.py
   ```

   Optional example with explicit arguments:

   ```powershell
   python ai-agent\mongodb_ingestion\ingest_to_atlas.py --chunk-size 1000 --chunk-overlap 200 --embed-batch-size 32
   ```

6. Rebuild the collection when data changes.
   - If you want to replace all existing records first:

   ```powershell
   python ai-agent\mongodb_ingestion\ingest_to_atlas.py --drop-existing
   ```

## Required environment variables

- `GEMINI_API_KEY`
- `MONGODB_URI`
- `MONGODB_DB` - optional, defaults to `teachers_copilot`
- `MONGODB_COLLECTION` - optional, defaults to `pyq_chunks`

## Notes

- The script uses the same embedding model for ingestion and later retrieval.
- Startup of the RAG agent should query MongoDB Atlas only; it should not rebuild embeddings.
- If your dataset is large, reduce `--embed-batch-size` to lower request pressure.
