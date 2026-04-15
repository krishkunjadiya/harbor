"""
Candidate Matching Worker for Harbor Platform

Semantic vector-based candidate ranking using batch cosine similarity.
Embeds a job description → compares against ALL stored student profile
embeddings in a single vectorized numpy operation → returns ranked results
enriched with student metadata.

Key design choices:
  - Single matrix multiply instead of N dot-product calls (vectorized batch)
  - Optional required-skills keyword pre-filter to reduce scoring pool
  - Minimum similarity threshold support
  - Results enriched with major, verified skills, resume score, GPA
  - University filtering done server-side on the DB query (not in Python)
"""

import logging
import time
from typing import List, Dict, Any, Optional

import numpy as np

from db import supabase

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Core similarity engine
# ─────────────────────────────────────────────

def _batch_cosine_similarity(
    query_vec: np.ndarray,
    candidate_matrix: np.ndarray,
) -> np.ndarray:
    """
    Computes cosine similarity between a single query vector and a matrix
    of candidate vectors in one vectorized operation.

    Args:
        query_vec:        1-D float32 array of shape (D,)
        candidate_matrix: 2-D float32 array of shape (N, D)

    Returns:
        1-D float32 array of shape (N,) with scores in [-1, 1]
    """
    q_norm = np.linalg.norm(query_vec)
    if q_norm == 0:
        return np.zeros(len(candidate_matrix), dtype=np.float32)
    query_unit = query_vec / q_norm

    norms = np.linalg.norm(candidate_matrix, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    candidates_unit = candidate_matrix / norms

    return (candidates_unit @ query_unit).astype(np.float32)


def _embed_text(text: str) -> List[float]:
    """Generates embedding for the given text using the shared sentence-transformers model."""
    from workers.embedding_generator import generate_profile_embedding
    return generate_profile_embedding(text)


# ─────────────────────────────────────────────
# Data fetching
# ─────────────────────────────────────────────

def _fetch_profiles_with_embeddings(university_id: Optional[str]) -> List[Dict[str, Any]]:
    """
    Fetches profiles that have a stored embedding, enriched with student metadata.
    University filtering is applied server-side when provided.
    """
    if not supabase:
        raise RuntimeError("Supabase client not initialized")

    try:
        profiles_res = supabase.table("profiles").select(
            "id, full_name, avatar_url, skills_embedding"
        ).not_.is_("skills_embedding", "null").execute()
        profiles = profiles_res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch profiles: {e}")
        raise

    if not profiles:
        return []

    profile_ids = [p["id"] for p in profiles]

    # Fetch enrichment data from students table
    student_lookup: Dict[str, Dict[str, Any]] = {}
    try:
        query = supabase.table("students").select(
            "profile_id, major, skills, gpa, resume_score, university_id"
        ).in_("profile_id", profile_ids[:500])

        if university_id:
            query = query.eq("university_id", university_id)

        students_res = query.execute()
        for s in (students_res.data or []):
            student_lookup[s["profile_id"]] = s
    except Exception as e:
        logger.warning(f"Student enrichment fetch failed (continuing without): {e}")

    enriched: List[Dict[str, Any]] = []
    for p in profiles:
        pid = p["id"]
        # If university filter active, skip profiles not in the filtered student set
        if university_id and pid not in student_lookup:
            continue
        student = student_lookup.get(pid, {})
        enriched.append({
            "id":               pid,
            "full_name":        p.get("full_name", "Unknown"),
            "avatar_url":       p.get("avatar_url"),
            "major":            student.get("major"),
            "skills":           student.get("skills") or [],
            "gpa":              student.get("gpa"),
            "resume_score":     student.get("resume_score"),
            "skills_embedding": p["skills_embedding"],
        })

    logger.info(f"Fetched {len(enriched)} candidate profiles with embeddings")
    return enriched


# ─────────────────────────────────────────────
# Required-skills pre-filter
# ─────────────────────────────────────────────

def _filter_by_required_skills(
    profiles: List[Dict[str, Any]],
    required_skills: List[str],
) -> List[Dict[str, Any]]:
    """
    Keeps only candidates who have ALL listed required skills.
    Case-insensitive substring match (e.g. "react" matches "React.js").
    """
    if not required_skills:
        return profiles

    required_lower = [r.lower() for r in required_skills]
    matched = [
        p for p in profiles
        if all(
            any(req in s.lower() for s in (p.get("skills") or []))
            for req in required_lower
        )
    ]
    logger.info(
        f"Required-skills filter: {len(profiles)} → {len(matched)} "
        f"(required: {required_skills})"
    )
    return matched


# ─────────────────────────────────────────────
# Main public function
# ─────────────────────────────────────────────

def match_candidates(
    job_description: str,
    top_k: int = 10,
    university_id: Optional[str] = None,
    required_skills: Optional[List[str]] = None,
    min_score: float = 0.0,
) -> Dict[str, Any]:
    """
    Ranks student candidates against a job description using batch
    cosine similarity on stored profile embeddings.

    Algorithm:
        1. Embed the job description using all-MiniLM-L6-v2
        2. Fetch all student profiles that have stored embeddings
           (optionally filtered by university, server-side)
        3. Pre-filter by required skills (optional AND keyword filter)
        4. Compute batch cosine similarity via single matrix operation
        5. Apply minimum score threshold, rank, and enrich results

    Args:
        job_description:  Full job posting text to match against.
        top_k:            Max candidates to return (1–100). Default 10.
        university_id:    Optional UUID — limits to one institution.
        required_skills:  Skills candidates MUST have (AND filter).
        min_score:        Minimum similarity percentage (0–100). Default 0.

    Returns:
        Dict with candidates list, counts, applied filters, and timing.
    """
    if not supabase:
        raise RuntimeError("Supabase client not initialized")

    t_start = time.perf_counter()
    top_k = max(1, min(top_k, 100))

    # Step 1 — Embed job description
    logger.info(f"Embedding job description ({len(job_description)} chars)...")
    t0 = time.perf_counter()
    job_vector = np.array(_embed_text(job_description), dtype=np.float32)
    t_embed = round((time.perf_counter() - t0) * 1000, 1)
    logger.info(f"Job embedded in {t_embed}ms ({len(job_vector)} dims)")

    # Step 2 — Fetch candidates
    profiles = _fetch_profiles_with_embeddings(university_id)
    if not profiles:
        return {
            "candidates": [], "totalScored": 0, "totalReturned": 0,
            "timingMs": {}, "appliedFilters": {},
            "message": "No stored profile embeddings found. Run /save-embedding for students first.",
        }

    # Step 3 — Keyword pre-filter
    if required_skills:
        profiles = _filter_by_required_skills(profiles, required_skills)
        if not profiles:
            return {
                "candidates": [], "totalScored": 0, "totalReturned": 0,
                "timingMs": {}, "appliedFilters": {},
                "message": f"No candidates matched all required skills: {required_skills}",
            }

    total_candidates = len(profiles)

    # Step 4 — Batch vectorized cosine similarity
    t0 = time.perf_counter()
    candidate_matrix = np.array(
        [p["skills_embedding"] for p in profiles], dtype=np.float32
    )  # shape (N, 384)
    similarities = _batch_cosine_similarity(job_vector, candidate_matrix)  # shape (N,)
    t_score = round((time.perf_counter() - t0) * 1000, 2)
    logger.info(f"Scored {total_candidates} candidates in {t_score}ms (vectorized)")

    # Step 5 — Build results with threshold, labels and ranking
    min_raw = min_score / 100.0
    scored: List[Dict[str, Any]] = []

    for i, profile in enumerate(profiles):
        raw = float(similarities[i])
        if raw < min_raw:
            continue
        pct = round(raw * 100, 2)

        if pct >= 80:
            quality = "Excellent"
        elif pct >= 65:
            quality = "Strong"
        elif pct >= 50:
            quality = "Good"
        elif pct >= 35:
            quality = "Fair"
        else:
            quality = "Low"

        skills = profile.get("skills") or []
        scored.append({
            "studentId":       profile["id"],
            "name":            profile.get("full_name", "Unknown"),
            "avatarUrl":       profile.get("avatar_url"),
            "major":           profile.get("major"),
            "skills":          skills[:10],
            "skillCount":      len(skills),
            "gpa":             profile.get("gpa"),
            "resumeScore":     profile.get("resume_score"),
            "similarityScore": pct,
            "matchQuality":    quality,
        })

    scored.sort(key=lambda x: x["similarityScore"], reverse=True)
    top = scored[:top_k]
    for rank, c in enumerate(top, start=1):
        c["rank"] = rank

    t_total = round((time.perf_counter() - t_start) * 1000, 1)
    logger.info(
        f"Matching done: {len(top)} returned / {total_candidates} scored "
        f"[total {t_total}ms]"
    )

    return {
        "candidates":    top,
        "totalScored":   total_candidates,
        "totalReturned": len(top),
        "appliedFilters": {
            "universityId":   university_id,
            "requiredSkills": required_skills or [],
            "minScore":       min_score,
            "topK":           top_k,
        },
        "timingMs": {
            "embeddingMs": t_embed,
            "scoringMs":   t_score,
            "totalMs":     t_total,
        },
    }
