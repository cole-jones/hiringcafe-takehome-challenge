import faiss
import numpy as np
import json
from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI

import os
from dotenv import load_dotenv

load_dotenv('.env.local')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# Load index at startup
index = faiss.read_index("jobs.faiss")
index.nprobe = 20

with open("metadata.jsonl") as f:
    metadata = [json.loads(line) for line in f]

class Query(BaseModel):
    query: str
    k: int = 10

@app.post("/search")
def search(query: Query):
    embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=query.query
    ).data[0].embedding

    vector = np.array([embedding]).astype("float32")
    faiss.normalize_L2(vector)

    distances, indices = index.search(vector, query.k)

    results = [metadata[i] for i in indices[0]]

    return {"results": results}