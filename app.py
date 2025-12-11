"""
app.py

FastAPI backend for CivicRAG-like RAG demo:
- Uses sentence-transformers for query embeddings
- Uses chromadb (local) for vector retrieval
- Sends a synthesis prompt to an LLM (OpenAI or Google Gemini) or uses local fallback
"""

import os
import json
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

# Embeddings + Vector DB
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# HTTP for calling LLM endpoints
import requests

# Load environment
from dotenv import load_dotenv
load_dotenv()

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("civicrag")

# Configuration: choose LLM provider via env
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai").lower()  # options: openai | gemini | local
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
# Basic service config
CHROMA_PERSIST_DIR = os.environ.get("CHROMA_PERSIST_DIR", "./chroma_db")
EMBED_MODEL_NAME = os.environ.get("EMBED_MODEL_NAME", "all-MiniLM-L6-v2")
TOP_K = int(os.environ.get("TOP_K", "6"))
MAX_SNIPPET_CHARS = int(os.environ.get("MAX_SNIPPET_CHARS", "320"))

# Initialize FastAPI
app = FastAPI(title="CivicRAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Profile(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    annual_income: Optional[float] = None
    occupation: Optional[str] = None
    text: Optional[str] = None  # free-form description (english/hindi)

class RecommendationSnippet(BaseModel):
    text: str
    scheme_id: Optional[str] = None
    url: Optional[str] = None
    page_no: Optional[int] = None
    score: Optional[float] = None

class Recommendation(BaseModel):
    scheme_id: str
    title: str
    eligibility_label: str
    confidence: float
    required_documents: Optional[List[str]] = []
    apply_link: Optional[str] = None
    supporting_snippets: List[RecommendationSnippet]

class RecommendResponse(BaseModel):
    profile: Profile
    recommendations: List[Recommendation]

# Initialize embeddings model
logger.info("Loading embedding model: %s", EMBED_MODEL_NAME)
embed_model = SentenceTransformer(EMBED_MODEL_NAME)

# Initialize Chroma client (local persistent)
logger.info("Initializing Chroma client (persist dir: %s)", CHROMA_PERSIST_DIR)
chroma_client = chromadb.Client(
    Settings(
        chroma_db_impl="duckdb+parquet",
        persist_directory=CHROMA_PERSIST_DIR,
    )
)

# Expect a collection named "schemes" to already exist (ingestion step populates it)
COLLECTION_NAME = "schemes"
try:
    collection = chroma_client.get_collection(name=COLLECTION_NAME)
    logger.info("Loaded existing Chroma collection: %s", COLLECTION_NAME)
except Exception:
    logger.info("Collection '%s' not found. Creating an empty collection.", COLLECTION_NAME)
    collection = chroma_client.create_collection(name=COLLECTION_NAME)

# Utility: retrieve top-k chunks from Chroma
def retrieve_chunks(query: str, k: int = TOP_K, metadata_filter: Optional[Dict[str, Any]] = None):
    if not query:
        return []
    q_emb = embed_model.encode([query])[0].tolist()
    # chroma's query API
    try:
        # filter may be None or dict
        results = collection.query(
            query_embeddings=[q_emb],
            n_results=k,
            where=metadata_filter or {},
            include=["metadatas", "distances", "documents", "ids"]
        )
    except Exception as e:
        logger.exception("Chroma query failed: %s", e)
        return []

    # results: dict with lists under keys
    out = []
    if results and "documents" in results and len(results["documents"]) > 0:
        docs = results["documents"][0]
        metas = results.get("metadatas", [{}])[0]
        dists = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]
        for i, doc in enumerate(docs):
            meta = metas[i] if i < len(metas) else {}
            dist = dists[i] if i < len(dists) else None
            doc_text = doc if isinstance(doc, str) else str(doc)
            snippet_text = doc_text[:MAX_SNIPPET_CHARS]
            out.append({
                "text": snippet_text,
                "full_text": doc_text,
                "scheme_id": meta.get("scheme_id"),
                "title": meta.get("title"),
                "url": meta.get("source_url"),
                "page_no": meta.get("page_no"),
                "score": float(dist) if dist is not None else None,
                "id": ids[i] if i < len(ids) else None
            })
    return out

# Utility: call LLM to synthesize answer given profile and snippets
def synthesize_answer(profile: Profile, snippets: List[Dict[str, Any]]):
    # Build a controlled prompt for the LLM
    user_profile_text = json.dumps(profile.dict(), ensure_ascii=False)
    snippet_texts = []
    for s in snippets:
        t = s.get("full_text") or s.get("text")
        src = s.get("url") or s.get("scheme_id") or "unknown"
        snippet_texts.append(f"- \"{t}\" (source: {src})")
    prompt = (
        "You are an assistant that helps match citizens to government schemes.\n"
        "Do not provide legal advice — only advisory guidance.\n\n"
        f"User profile:\n{user_profile_text}\n\n"
        "Retrieved relevant clauses/snippets:\n"
        f"{chr(10).join(snippet_texts)}\n\n"
        "Task:\n1) Return up to 5 recommended schemes with: scheme id/title (if available), "
        "eligibility label (Eligible / Not eligible / Possibly eligible), "
        "a short reason (one sentence), required documents (bullet list if available), "
        "apply link (if present), and supporting snippet references (cite the snippet index).\n"
        "2) Provide a confidence score (0-100) for each recommendation.\n\n"
        "Return JSON only in the following format:\n"
        "{\"recommendations\": [{\"scheme_id\":\"\",\"title\":\"\",\"eligibility_label\":\"\",\"confidence\":0.0,"
        "\"required_documents\":[],\"apply_link\":\"\",\"supporting_snippets\":[{\"text\":\"\",\"url\":\"\",\"score\":0.0}]}]}"
    )

    # Call selected LLM provider
    if LLM_PROVIDER == "openai" and OPENAI_API_KEY:
        try:
            # OpenAI completions (chat) example using Chat Completions API (replace with your library)
            headers = {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
            body = {
                "model": "gpt-4o-mini",  # adjust as available
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 800,
                "temperature": 0.0,
            }
            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=body, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.exception("OpenAI request failed: %s", e)
            text = None
    elif LLM_PROVIDER == "gemini" and GEMINI_API_KEY:
        try:
            # Example: Google Gemini HTTP call — user must adapt to exact endpoint used in project
            headers = {"Authorization": f"Bearer {GEMINI_API_KEY}", "Content-Type": "application/json"}
            body = {"prompt": prompt, "max_output_tokens": 800}
            # NOTE: update URL for your Gemini endpoint / AI Studio endpoint
            gemini_url = os.environ.get("GEMINI_URL", "https://api.generativeai.google/v1/models/gemini:generate")
            resp = requests.post(gemini_url, headers=headers, json=body, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            # Extract text depending on response format
            text = data.get("candidates", [{}])[0].get("content") or data.get("output", {}).get("text")
        except Exception as e:
            logger.exception("Gemini request failed: %s", e)
            text = None
    else:
        # Local fallback: craft a simple JSON from the top snippets (safe for demos)
        logger.info("LLM not configured or provider not available; using local fallback synthesizer.")
        recommendations = []
        # group snippets by scheme_id if present
        by_scheme = {}
        for idx, s in enumerate(snippets):
            sid = s.get("scheme_id") or f"unknown_{idx}"
            by_scheme.setdefault(sid, []).append((idx, s))
        for sid, items in list(by_scheme.items())[:5]:
            title = items[0][1].get("title") or f"Scheme {sid}"
            supporting = []
            for idx, s in items:
                supporting.append({
                    "text": s.get("text")[:MAX_SNIPPET_CHARS],
                    "url": s.get("url"),
                    "score": s.get("score")
                })
            recommendations.append({
                "scheme_id": sid,
                "title": title,
                "eligibility_label": "Possibly eligible",
                "confidence": 60.0,
                "required_documents": [],
                "apply_link": None,
                "supporting_snippets": supporting
            })
        return {"recommendations": recommendations}

    # If the LLM returned text attempt to parse the JSON block they were asked to return
    if text:
        # attempt to find JSON object inside the returned text
        try:
            # find first '{' to start JSON (simple heuristic)
            first_brace = text.find("{")
            json_text = text[first_brace:] if first_brace != -1 else text
            parsed = json.loads(json_text)
            # Expect parsed["recommendations"]
            if isinstance(parsed, dict) and "recommendations" in parsed:
                return parsed
            # fallback: return simple wrapper with LLM text as explanation
            return {"recommendations": [], "llm_text": text}
        except Exception as e:
            logger.exception("Failed to parse LLM JSON output: %s", e)
            return {"recommendations": [], "llm_text": text}
    else:
        return {"recommendations": []}

# Endpoint: health
@app.get("/health")
async def health():
    return {"status": "ok", "provider": LLM_PROVIDER, "collection": COLLECTION_NAME}

# Endpoint: recommend
@app.post("/recommend", response_model=RecommendResponse)
async def recommend(profile: Profile):
    # Build a canonical query string from profile: prefer free-form text if provided
    if profile.text and profile.text.strip():
        query = profile.text.strip()
    else:
        # simple canonicalization
        parts = []
        if profile.age: parts.append(f"age:{profile.age}")
        if profile.gender: parts.append(f"gender:{profile.gender}")
        if profile.state: parts.append(f"state:{profile.state}")
        if profile.occupation: parts.append(f"occupation:{profile.occupation}")
        if profile.annual_income is not None: parts.append(f"income:{profile.annual_income}")
        query = " | ".join(parts) if parts else "general welfare schemes"

    # Optionally apply metadata filter (e.g., jurisdiction)
    metadata_filter = {}
    if profile.state:
        # the ingestion should store jurisdiction/state in metadata
        metadata_filter = {"jurisdiction": profile.state}

    # Retrieve candidate chunks
    snippets = retrieve_chunks(query, k=TOP_K, metadata_filter=metadata_filter)
    if not snippets:
        # try without filter
        snippets = retrieve_chunks(query, k=TOP_K, metadata_filter=None)

    # Synthesize answer with LLM (or fallback)
    synth = synthesize_answer(profile, snippets)

    # Normalize output into Recommendation model
    recs = []
    recommendations_json = synth.get("recommendations") if isinstance(synth, dict) else None
    if recommendations_json:
        # shape to our Pydantic model
        for r in recommendations_json:
            supporting = []
            for s in r.get("supporting_snippets", []):
                supporting.append(RecommendationSnippet(
                    text=s.get("text", "")[:MAX_SNIPPET_CHARS],
                    scheme_id=s.get("scheme_id"),
                    url=s.get("url"),
                    page_no=s.get("page_no"),
                    score=s.get("score")
                ))
            rec = Recommendation(
                scheme_id=r.get("scheme_id", "") or "",
                title=r.get("title", "") or "",
                eligibility_label=r.get("eligibility_label", "Possibly eligible"),
                confidence=float(r.get("confidence", 0.0)),
                required_documents=r.get("required_documents", []),
                apply_link=r.get("apply_link"),
                supporting_snippets=supporting
            )
            recs.append(rec)
    else:
        # fallback: transform snippets into simple recommendations (grouped)
        by_sid = {}
        for s in snippets:
            sid = s.get("scheme_id") or s.get("id") or "unknown"
            by_sid.setdefault(sid, []).append(s)
        for sid, items in list(by_sid.items())[:5]:
            supporting = []
            for s in items:
                supporting.append(RecommendationSnippet(
                    text=s.get("text")[:MAX_SNIPPET_CHARS],
                    scheme_id=s.get("scheme_id"),
                    url=s.get("url"),
                    page_no=s.get("page_no"),
                    score=s.get("score")
                ))
            recs.append(Recommendation(
                scheme_id=sid,
                title=items[0].get("title") or sid,
                eligibility_label="Possibly eligible",
                confidence=60.0,
                required_documents=[],
                apply_link=items[0].get("url"),
                supporting_snippets=supporting
            ))

    resp = RecommendResponse(profile=profile, recommendations=recs)
    return JSONResponse(status_code=200, content=json.loads(resp.json()))

# Run with: uvicorn app:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), reload=True)
