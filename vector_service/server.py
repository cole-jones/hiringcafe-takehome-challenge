import os
import faiss
import numpy as np
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from dataclasses import dataclass, is_dataclass, asdict
from typing import Any, List, Optional
from enum import Enum

# ---------- Configuration ----------
DIM = 1536
INDEX_PATH = "jobs.faiss"
VECTOR_METADATA_PATH = "vector_metadata.jsonl"
JOB_METADATA_PATH = "jobs_metadata.jsonl"

DEFAULT_K = 10
OVERFETCH_MULTIPLIER = 20   # fetch more vectors before collapsing

# Optional embedding type weighting
EMBEDDING_WEIGHTS = {
    "explicit": 1.5,
    "inferred": 1.0,
    "company": 0.75,
}

# ---- Class definitions ----
# Enums
class SeniorityLevel(str, Enum):
    INTERNSHIP = "Internship"
    ENTRY_LEVEL = "Entry Level"
    MID_LEVEL = "Mid Level"
    SENIOR_LEVEL = "Senior Level"
    DIRECTOR = "Director"
    EXECUTIVE = "Executive"

class DegreeType(str, Enum):
    HIGHSCHOOL = "HighSchool"
    ASSOCIATES = "Associates"
    BACHELORS = "Bachelors"
    MASTERS = "Masters"
    DOCTORATE = "Doctorate"

class WorkplaceType(str, Enum):
    REMOTE = "Remote"
    HYBRID = "Hybrid"
    ONSITE = "Onsite"

class Frequency(str, Enum):
    HOURLY = "Hourly"
    DAILY = "Daily"
    WEEKLY = "Weekly"
    BIWEEKLY = "Bi-Weekly"
    MONTHLY = "Monthly"
    YEARLY = "Yearly"

class CommitmentType(str, Enum):
    FULL_TIME = "Full Time"
    PART_TIME = "Part Time"
    CONTRACT = "Contract"
    TEMPORARY = "Temporary"
    INTERNSHIP = "Internship"

class TravelRequirement(str, Enum):
    NONE = "None"
    MINIMAL = "Minimal"
    MODERATE = "Moderate"
    FREQUENT = "Frequent"

# Nested Data Classes
@dataclass
class Experience:
    minYears: Optional[float] = None
    maxYears: Optional[float] = None
    seniorityLevels: Optional[List[SeniorityLevel]] = None
    managementRequired: Optional[bool] = None

@dataclass
class Education:
    degreeTypes: Optional[List[DegreeType]] = None
    fieldsOfStudy: Optional[List[str]] = None
    required: Optional[bool] = None

@dataclass
class Compensation:
    minSalary: Optional[float] = None
    maxSalary: Optional[float] = None
    currency: Optional[str] = None
    frequency: Optional[Frequency] = None

@dataclass
class Location:
    continents: Optional[List[str]] = None
    countries: Optional[List[str]] = None
    states: Optional[List[str]] = None
    cities: Optional[List[str]] = None
    remoteAllowed: Optional[bool] = None
    workplaceType: Optional[List[WorkplaceType]] = None

@dataclass
class WorkArrangement:
    commitmentTypes: Optional[List[CommitmentType]] = None
    travelRequirements: Optional[List[TravelRequirement]] = None

@dataclass
class Company:
    names: Optional[List[str]] = None
    industries: Optional[List[str]] = None
    organizationTypes: Optional[List[str]] = None
    publicCompanyOnly: Optional[bool] = None
    nonProfitOnly: Optional[bool] = None
    headquartersCountries: Optional[List[str]] = None

@dataclass
class Benefits:
    visaSponsorship: Optional[bool] = None
    relocationAssistance: Optional[bool] = None
    retirementPlan: Optional[bool] = None
    tuitionReimbursement: Optional[bool] = None
    parentalLeave: Optional[bool] = None
    fourDayWorkWeek: Optional[bool] = None
    fairChance: Optional[bool] = None
    militaryVeterans: Optional[bool] = None

@dataclass
class Security:
    clearanceRequired: Optional[List[str]] = None

@dataclass
class Schedule:
    weekendRequired: Optional[bool] = None
    holidayRequired: Optional[bool] = None
    overtimeRequired: Optional[bool] = None
    shiftTypes: Optional[List[str]] = None

@dataclass
class JobFilterTokens:
    semanticIntent: str
    jobTitles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience: Optional[Experience] = None
    education: Optional[Education] = None
    compensation: Optional[Compensation] = None
    location: Optional[Location] = None
    workArrangement: Optional[WorkArrangement] = None
    company: Optional[Company] = None
    benefits: Optional[Benefits] = None
    security: Optional[Security] = None
    schedule: Optional[Schedule] = None
    languages: Optional[List[str]] = None
    companyActivities: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    k: int = DEFAULT_K

# ---------- App + OpenAI client ----------
# Get OpenAI Key from .env.local
load_dotenv('../.env.local')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# ---------- Load FAISS index ----------
print("Loading FAISS index...")
index = faiss.read_index("jobs.faiss")
if hasattr(index, "nprobe"):
    index.nprobe = 20

print("Index loaded. Vector count:", index.ntotal)

# ---------- Load vector metadata ----------
print("Loading vector metadata...")
vector_metadata_lookup = {}

with open(VECTOR_METADATA_PATH, "r", encoding="utf-8") as f:
    for line in f:
        row = json.loads(line)
        vector_metadata_lookup[row["vector_id"]] = {
            "job_id": row["job_id"],
            "embedding_type": row["embedding_type"],
        }

print("Vector metadata loaded:", len(vector_metadata_lookup))

if len(vector_metadata_lookup) != index.ntotal:
    raise RuntimeError(
        f"Vector metadata count ({len(vector_metadata_lookup)}) "
        f"does not match index count ({index.ntotal})"
    )

# ---------- Load job metadata ----------
print("Loading job metadata...")

job_lookup = {}

with open(JOB_METADATA_PATH, "r", encoding="utf-8") as f:
    for line in f:
        job = json.loads(line)
        job_id = job.get("id")

        if not job_id:
            raise RuntimeError("Job metadata missing stable id")

        job_lookup[job_id] = job

print("Job metadata loaded:", len(job_lookup))


# ---------- Methods for converting search tokens into FAISS string ----------
def _normalize_value(value: Any) -> Any:
    """
    Converts Enums to their string values.
    Leaves primitives unchanged.
    """
    if isinstance(value, Enum):
        return value.value
    return value


def _flatten(obj: Any, prefix: str = "") -> List[str]:
    """
    Recursively flattens a dataclass into semantic fragments.
    """
    fragments = []

    if obj is None:
        return fragments

    # Convert dataclass to dict
    if is_dataclass(obj):
        obj = asdict(obj)

    if isinstance(obj, dict):
        for key in sorted(obj.keys()):
            value = obj[key]
            if value is None:
                continue

            new_prefix = f"{prefix}.{key}" if prefix else key
            fragments.extend(_flatten(value, new_prefix))

    elif isinstance(obj, list):
        values = [_normalize_value(v) for v in obj if v is not None]
        if values:
            joined = ", ".join(map(str, values))
            fragments.append(f"{prefix}: {joined}")

    else:
        value = _normalize_value(obj)
        fragments.append(f"{prefix}: {value}")

    return fragments


def job_filters_to_faiss_string(filters: JobFilterTokens) -> str:
    """
    Converts JobFilterTokens into a deterministic FAISS-ready string.
    """

    # Always include semanticIntent first for primary signal
    fragments = [f"intent: {filters.semanticIntent}"]

    # Flatten the rest
    data = asdict(filters)

    # Remove semanticIntent and k (we don't embed k)
    data.pop("semanticIntent", None)
    data.pop("k", None)

    fragments.extend(_flatten(data))

    # Join into final string
    return " | ".join(fragments)





# ---------- Search endpoint ----------
@app.post("/search_faiss")
def search_faiss(req: JobFilterTokens):
    if not req.semanticIntent:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if req.k <= 0:
        raise HTTPException(status_code=400, detail="k must be > 0")

    # ---- Step 0: Build embedding prompt using obtained filters ----
    embedding_prompt = job_filters_to_faiss_string(req)

    # ---- Step 1: Embed query ----
    embedding_response = client.embeddings.create(
        model="text-embedding-3-small",
        input=embedding_prompt
    )

    tokens_used = embedding_response.usage.total_tokens

    query_vector = np.array([embedding_response.data[0].embedding], dtype="float32")

    # Normalize for cosine similarity
    faiss.normalize_L2(query_vector)

    # ---- Step 2: Overfetch ----
    fetch_k = req.k * OVERFETCH_MULTIPLIER

    distances, ids = index.search(query_vector, fetch_k)

    # ---- Step 3: Collect candidates ----
    best_per_job = {}

    for score, vector_id in zip(distances[0], ids[0]):
        if vector_id == -1:
            continue

        vector_id = int(vector_id)

        vmeta = vector_metadata_lookup.get(vector_id)
        if not vmeta:
            continue

        job_id = vmeta["job_id"]
        emb_type = vmeta["embedding_type"]

        # Apply embedding-type weight
        weighted_score = float(score) * EMBEDDING_WEIGHTS.get(emb_type, 1.0)

        if (
            job_id not in best_per_job
            or weighted_score > best_per_job[job_id]["score"]
        ):
            best_per_job[job_id] = {
                "job_id": job_id,
                "score": weighted_score,
                "embedding_type": emb_type,
            }

    # ---- Step 4: Rank unique jobs ----
    ranked = sorted(
        best_per_job.values(),
        key=lambda x: x["score"],
        reverse=True
    )

    # ---- Step 5: Attach job metadata, ignore processed job data (irrelevent to user) ----
    results = []

    for item in ranked:#top_jobs:
        job_id = item["job_id"]

        job_data = job_lookup.get(job_id)
        if not job_data:
            continue

        # Keeping all the processed metadata isn't totally necessary. Can save some space by just taking what's important.
        if "job_information" in job_data:
            # Sometimes job_information is missing "company_info: { name: "" }", so get it from "v5_processed_company_data.name".
            if "company_info" not in job_data["job_information"] and "v5_processed_company_data" in job_data:
                job_data["job_information"]["company_info"] = { "name": job_data["v5_processed_company_data"].get("name", "Unknown Company") }
            
            # Add salary information. Get it from "compensation_and_benefits" if it exists, otherwise from "v5_processed_job_data.yearly_min/max_compensation".
            salaryMin = None
            salaryMax = None
            if "v7_processed_job_data" in job_data:
                if "compensation_and_benefits" in job_data["v7_processed_job_data"]:
                    if "salary" in job_data["v7_processed_job_data"]["compensation_and_benefits"]:
                        salaryMin = job_data["v7_processed_job_data"]["compensation_and_benefits"]["salary"].get("low", None)
                        salaryMax = job_data["v7_processed_job_data"]["compensation_and_benefits"]["salary"].get("high", None)
            elif "v5_processed_job_data" in job_data:
                if salaryMin is None:
                    salaryMin = job_data["v5_processed_job_data"].get("yearly_min_compensation", None)
                if salaryMax is None:
                    salaryMax = job_data["v5_processed_job_data"].get("yearly_max_compensation", None)
            
            job_data["job_information"]["salary"] = {
                "yearly_min_compensation": salaryMin,
                "yearly_max_compensation": salaryMax
            }
        
        # If requiring salary constraints, filter the jobs here
        append = True
        if req.compensation is not None:
            if req.compensation.minSalary is not None:
                if job_data["job_information"]["salary"]["yearly_min_compensation"] is not None:
                    if job_data["job_information"]["salary"]["yearly_min_compensation"] < req.compensation.minSalary:
                        append = False
                else:
                    append = False
            if req.compensation.maxSalary is not None:
                if job_data["job_information"]["salary"]["yearly_max_compensation"] is not None:
                    if job_data["job_information"]["salary"]["yearly_max_compensation"] > req.compensation.maxSalary:
                        append = False
                else:
                    append = False
        
        if append:
            results.append({
                "score": item["score"],
                "matched_on": item["embedding_type"],
                "job": {
                    "id": job_data.get("id", "Unknown ID"),
                    "apply_url": job_data.get("apply_url", "Unknown URL"),
                    "job_information": job_data.get("job_information", None)
                }
            })

        # Once DEFAULT_K jobs have been added, ignore the rest and break out
        if len(results) == DEFAULT_K:
            break

    return {
        "query": embedding_prompt,
        "count": len(results),
        "results": results,
        "tokens_used": tokens_used
    }
