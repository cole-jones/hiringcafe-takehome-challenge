import faiss
import numpy as np
import json
from tqdm import tqdm

INPUT_FILE = "C:/Users/jones/Desktop/jobs.jsonl"
OUTPUT_INDEX = "jobs.faiss"
OUTPUT_METADATA = "metadata.jsonl"

DIM = 1536
NLIST = 4096     # number of clusters
M = 64           # PQ segments
NBITS = 8        # bits per segment

embeddings = []
metadata = []

print("Loading data...")

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    for line in tqdm(f):
        job = json.loads(line)

        # Extract embedding
        embedding_inferred_vector = job["v7_processed_job_data"]["embedding_inferred_vector"]
        embedding_company_vector = job["v7_processed_job_data"]["embedding_company_vector"]
        embedding_explicit_vector = job["v7_processed_job_data"]["embedding_explicit_vector"]

        # Remove embedding from metadata copy
        job_copy = dict(job)
        del job_copy["v7_processed_job_data"]["embedding_inferred_vector"]
        del job_copy["v7_processed_job_data"]["embedding_company_vector"]
        del job_copy["v7_processed_job_data"]["embedding_explicit_vector"]

        embeddings.append(embedding_inferred_vector)
        embeddings.append(embedding_company_vector)
        embeddings.append(embedding_explicit_vector)
        metadata.append(job_copy)

embeddings = np.array(embeddings).astype("float32")

print("Normalizing vectors for cosine similarity...")
faiss.normalize_L2(embeddings)

print("Building IVF-PQ index...")

quantizer = faiss.IndexFlatIP(DIM)

index = faiss.IndexIVFPQ(
    quantizer,
    DIM,
    NLIST,
    M,
    NBITS
)

print("Training index...")
index.train(embeddings)

print("Adding vectors...")
index.add(embeddings)

print("Saving index...")
faiss.write_index(index, OUTPUT_INDEX)

print("Saving metadata...")
with open(OUTPUT_METADATA, "w") as f:
    for job in metadata:
        f.write(json.dumps(job) + "\n")

print("Done.")