import faiss
import numpy as np
import json
import copy
from tqdm import tqdm

# -----------------------------
# Configuration
# -----------------------------

INPUT_FILE = ""

OUTPUT_INDEX = "jobs.faiss"
OUTPUT_VECTOR_METADATA = "vector_metadata.jsonl"
OUTPUT_JOB_METADATA = "jobs_metadata.jsonl"

DIM = 1536
NLIST = 4096      # IVF cluster count
M = 64            # PQ segments
NBITS = 8         # bits per segment

# -----------------------------
# Storage
# -----------------------------

embeddings = []
vector_metadata = []
job_metadata = {}

vector_id = 0

print("Loading jobs and extracting embeddings...")

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    for line in tqdm(f):
        job = json.loads(line)
        job_id = job.get("id")

        if not job_id:
            raise ValueError("Job missing stable job_id")

        vdata = job["v7_processed_job_data"]

        inferred = vdata["embedding_inferred_vector"]
        company = vdata["embedding_company_vector"]
        explicit = vdata["embedding_explicit_vector"]

        # ---- Store full job metadata once ----
        if job_id not in job_metadata:
            job_copy = copy.deepcopy(job)

            del job_copy["v7_processed_job_data"]["embedding_inferred_vector"]
            del job_copy["v7_processed_job_data"]["embedding_company_vector"]
            del job_copy["v7_processed_job_data"]["embedding_explicit_vector"]

            job_metadata[job_id] = job_copy

        # ---- Add 3 embeddings with explicit vector_id mapping ----
        for embedding, emb_type in [
            (inferred, "inferred"),
            (company, "company"),
            (explicit, "explicit"),
        ]:
            embeddings.append(embedding)

            vector_metadata.append({
                "vector_id": vector_id,
                "job_id": job_id,
                "embedding_type": emb_type
            })

            vector_id += 1


print("Total vectors:", len(embeddings))
print("Total unique jobs:", len(job_metadata))

# -----------------------------
# Convert to NumPy
# -----------------------------

embeddings = np.array(embeddings, dtype="float32")

print("Normalizing for cosine similarity...")
faiss.normalize_L2(embeddings)

# -----------------------------
# Build FAISS index (IVFPQ)
# -----------------------------

print("Building IVFPQ index...")

quantizer = faiss.IndexFlatIP(DIM)

base_index = faiss.IndexIVFPQ(
    quantizer,
    DIM,
    NLIST,
    M,
    NBITS
)

# Wrap with IDMap for stable IDs
index = faiss.IndexIDMap(base_index)

print("Training index...")
index.train(embeddings)

print("Adding vectors with IDs...")
ids = np.arange(len(embeddings)).astype("int64")
index.add_with_ids(embeddings, ids)

print("Index total vectors:", index.ntotal)

# -----------------------------
# Save artifacts
# -----------------------------

print("Saving FAISS index...")
faiss.write_index(index, OUTPUT_INDEX)

print("Saving vector metadata...")
with open(OUTPUT_VECTOR_METADATA, "w", encoding="utf-8") as f:
    for row in vector_metadata:
        f.write(json.dumps(row) + "\n")

print("Saving job metadata...")
with open(OUTPUT_JOB_METADATA, "w", encoding="utf-8") as f:
    for job in job_metadata.values():
        f.write(json.dumps(job) + "\n")

print("Done.")