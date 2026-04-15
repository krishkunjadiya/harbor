"""
Embedding Generator Worker for Harbor Platform

Generates semantic embeddings for student profiles using Sentence Transformers.
Model: all-MiniLM-L6-v2 (384 dimensions, fast, production-quality).

Features:
  - Lazy model loading (singleton, loaded once per process)
  - Single-text embedding for on-demand generation
  - Batch embedding for bulk student refresh
  - Full profile text builder from Supabase (name + major + bio + skills)
  - DB persistence to profiles.skills_embedding
"""

import logging
from typing import List, Optional, Any, Dict
import warnings

logger = logging.getLogger(__name__)

# Suppress noisy model loading warnings
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)
warnings.filterwarnings("ignore", message=".*HF Hub.*unauthenticated.*")
warnings.filterwarnings("ignore", message=".*position_ids.*")

from db import supabase

try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except ImportError:
    _ST_AVAILABLE = False
    logger.warning(
        "sentence-transformers not installed. Embedding generation will be unavailable. "
        "Run: pip install sentence-transformers"
    )

# Singleton model instance — loaded once, reused across all calls
_embedding_model: Optional[Any] = None
_MODEL_NAME = "all-MiniLM-L6-v2"
_EMBEDDING_DIM = 384


def get_embedding_model() -> Any:
    """
    Lazy-loads and returns the embedding model singleton.
    Thread-safe for single-process FastAPI (uvicorn default).
    """
    global _embedding_model

    if not _ST_AVAILABLE:
        raise RuntimeError(
            "sentence-transformers is not installed. Run: pip install sentence-transformers"
        )

    if _embedding_model is None:
        logger.info(f"Loading sentence-transformers model '{_MODEL_NAME}'...")
        try:
            _embedding_model = SentenceTransformer(_MODEL_NAME)
            logger.info(f"Embedding model loaded ({_EMBEDDING_DIM} dimensions)")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    return _embedding_model


def generate_profile_embedding(text: str) -> List[float]:
    """
    Generates a 384-dimensional semantic embedding for a single text string.

    Args:
        text: Profile text to embed (name, skills, bio, etc.)

    Returns:
        384-dimensional float list. Returns zero vector for empty input.
    """
    if not _ST_AVAILABLE:
        raise RuntimeError("sentence-transformers is not installed.")

    if not text or not text.strip():
        logger.warning("Empty text provided for embedding — returning zero vector")
        return [0.0] * _EMBEDDING_DIM

    model = get_embedding_model()
    embedding = model.encode(text.strip(), convert_to_numpy=True)
    return embedding.tolist()


def generate_batch_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates embeddings for a list of texts in a single model call.
    Significantly faster than calling generate_profile_embedding() in a loop.

    Args:
        texts: List of text strings to embed.

    Returns:
        List of 384-dim float lists, one per input text.
        Zero vectors are returned for empty strings.
    """
    if not _ST_AVAILABLE:
        raise RuntimeError("sentence-transformers is not installed.")

    if not texts:
        return []

    model = get_embedding_model()

    # Replace empty strings with a placeholder so model doesn't error
    cleaned = [t.strip() if t and t.strip() else "__empty__" for t in texts]
    embeddings = model.encode(cleaned, convert_to_numpy=True, batch_size=64, show_progress_bar=False)

    result = []
    for i, emb in enumerate(embeddings):
        if texts[i] and texts[i].strip():
            result.append(emb.tolist())
        else:
            result.append([0.0] * _EMBEDDING_DIM)
    return result


def build_profile_text(profile: Dict[str, Any], student: Dict[str, Any]) -> str:
    """
    Assembles a rich text representation of a student profile for embedding.
    Concatenates name, major, bio, and skills into a single meaningful string.

    Args:
        profile: Row from profiles table (full_name, bio).
        student: Row from students table (major, bio, skills).

    Returns:
        Combined profile text string.
    """
    parts: List[str] = []

    name = profile.get("full_name", "").strip()
    if name:
        parts.append(f"Name: {name}")

    major = student.get("major", "").strip() if student else ""
    if major:
        parts.append(f"Major: {major}")

    # Use whichever bio is richer
    profile_bio = (profile.get("bio") or "").strip()
    student_bio = (student.get("bio") or "") .strip() if student else ""
    bio = profile_bio or student_bio
    if bio:
        parts.append(bio)

    skills = student.get("skills") if student else None
    if isinstance(skills, list) and skills:
        parts.append(f"Skills: {', '.join(str(s) for s in skills)}")

    return " | ".join(parts)


def build_and_save_profile_embedding(student_id: str) -> Dict[str, Any]:
    """
    Full pipeline: fetches a student's profile from Supabase, builds profile
    text, generates embedding, and saves it to profiles.skills_embedding.

    Args:
        student_id: Profile UUID of the student.

    Returns:
        Dict with status, dimensions, and dbSaved flag.
    """
    if not supabase:
        raise RuntimeError("Supabase client not initialized")

    # Fetch profile + student rows
    try:
        p_res = supabase.table("profiles").select(
            "id, full_name, bio"
        ).eq("id", student_id).single().execute()
        profile = p_res.data or {}
    except Exception as e:
        logger.error(f"Failed to fetch profile for {student_id}: {e}")
        profile = {}

    try:
        s_res = supabase.table("students").select(
            "major, bio, skills"
        ).eq("profile_id", student_id).single().execute()
        student = s_res.data or {}
    except Exception as e:
        logger.warning(f"Student row not found for {student_id}: {e}")
        student = {}

    profile_text = build_profile_text(profile, student)

    if not profile_text.strip():
        logger.warning(f"No profile content for student {student_id} — skipping embedding")
        return {"studentId": student_id, "status": "skipped", "reason": "empty_profile", "dbSaved": False}

    vector = generate_profile_embedding(profile_text)
    saved = save_embedding_to_db(student_id, vector)

    return {
        "studentId":  student_id,
        "status":     "success" if saved else "partial",
        "dimensions": len(vector),
        "dbSaved":    saved,
    }


def save_embedding_to_db(student_id: str, vector: List[float]) -> bool:
    """
    Persists a 384-dim embedding vector to profiles.skills_embedding.

    Args:
        student_id: Profile UUID.
        vector: 384-dimensional float list.

    Returns:
        True if row was updated, False otherwise.
    """
    if not supabase:
        logger.error("Supabase client not initialized")
        return False

    try:
        result = supabase.table("profiles").update(
            {"skills_embedding": vector}
        ).eq("id", student_id).execute()

        if result.data:
            logger.info(f"Embedding saved for student {student_id} ({len(vector)} dims)")
            return True
        else:
            logger.warning(f"No profile row matched for student_id={student_id}")
            return False
    except Exception as e:
        logger.error(f"DB save failed for embedding: {type(e).__name__}: {e}")
        return False


def get_embedding_model():
    """Alias kept for backward compatibility. Prefer get_embedding_model() from the module top."""
    global _embedding_model
    if not _ST_AVAILABLE:
        raise RuntimeError("sentence-transformers is not installed. Run: pip install sentence-transformers")
    if _embedding_model is None:
        logger.info(f"Loading sentence-transformers model '{_MODEL_NAME}'...")
        _embedding_model = SentenceTransformer(_MODEL_NAME)
        logger.info(f"Embedding model loaded ({_EMBEDDING_DIM} dimensions)")
    return _embedding_model


def generate_profile_embedding(text: str) -> List[float]:
    """Alias kept for backward compatibility — delegates to the module-level implementation above."""
    if not _ST_AVAILABLE:
        raise RuntimeError("sentence-transformers is not installed. Run: pip install sentence-transformers")
    if not text or not text.strip():
        return [0.0] * _EMBEDDING_DIM
    model = get_embedding_model()
    return model.encode(text.strip(), convert_to_numpy=True).tolist()
