"""
AI Analytics Worker for Harbor Platform
Skill gap analysis, career readiness scoring, and institution-level insights
powered by Google Gemini AI.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from db import supabase

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Internal Gemini helper (with retry)
# ─────────────────────────────────────────────

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def _call_gemini(prompt: str) -> Dict[str, Any]:
    """Sends prompt to Gemini 2.5 Flash and returns parsed JSON (up to 3 retries)."""
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
            top_p=0.8,
        ),
    )
    return json.loads(response.text)


def _require_keys(data: Dict[str, Any], keys: List[str], context: str) -> None:
    """Raises ValueError if any expected top-level key is absent from *data*."""
    missing = [k for k in keys if k not in data]
    if missing:
        raise ValueError(f"[{context}] Gemini response missing keys: {missing}. Got: {list(data.keys())}")


# ─────────────────────────────────────────────
# Feature 1 — Skill Gap Analysis
# ─────────────────────────────────────────────

def analyze_skill_gap(
    student_skills: List[str],
    target_role: str,
    target_description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Analyzes the skill gap between a student's current skills and a target role.

    Args:
        student_skills: Skills the student currently has.
        target_role: Job title or role (e.g., "Backend Engineer").
        target_description: Optional full job description for richer analysis.

    Returns:
        Skill gap analysis with missing skills, learning roadmap, and summary.
    """
    skills_text = ", ".join(student_skills) if student_skills else "None listed"
    jd_section = (
        f"\n\n**JOB DESCRIPTION:**\n{target_description[:2000]}"
        if target_description
        else ""
    )

    prompt = f"""You are an expert career coach and technical talent advisor.

A student wants to become a "{target_role}". Analyze their skill gap.

**STUDENT'S CURRENT SKILLS:** {skills_text}{jd_section}

Provide a JSON response with EXACTLY this structure:
{{
  "readinessPercentage": <integer 0-100>,
  "missingCriticalSkills": ["skill1", "skill2"],
  "missingNiceToHaveSkills": ["skill1", "skill2"],
  "studentSkillsAssessment": {{
    "strong": ["skills student does well"],
    "moderate": ["skills needing improvement"],
    "weak": ["skills barely present"]
  }},
  "learningRoadmap": [
    {{
      "skill": "Skill Name",
      "priority": "high|medium|low",
      "estimatedWeeks": <integer>,
      "resources": ["resource1", "resource2"]
    }}
  ],
  "summary": "<2-3 sentence summary>"
}}"""

    logger.info(f"Analyzing skill gap for role: {target_role} ({len(student_skills)} student skills)")
    result = _call_gemini(prompt)
    _require_keys(result, ["readinessPercentage", "missingCriticalSkills", "learningRoadmap", "summary"], "analyze_skill_gap")
    return result


# ─────────────────────────────────────────────
# Feature 2 — Career Readiness Scoring
# ─────────────────────────────────────────────

def score_career_readiness(
    student_id: str,
    target_role: str,
    student_profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Scores a student's overall career readiness for a target role.

    Args:
        student_id: Student's profile UUID.
        target_role: Target job role (e.g., "Full Stack Developer").
        student_profile: Pre-fetched profile dict; fetched from DB if not provided.

    Returns:
        Career readiness score (0-100) with breakdown, gaps, and recommendations.
    """
    # Fetch from DB if profile not provided
    if not student_profile and supabase:
        try:
            p_res = supabase.table("profiles").select(
                "full_name, bio"
            ).eq("id", student_id).single().execute()

            s_res = supabase.table("students").select(
                "major, bio, skills, gpa, graduation_year"
            ).eq("profile_id", student_id).single().execute()

            student_profile = {
                **(p_res.data or {}),
                **(s_res.data or {}),
            }
        except Exception as e:
            logger.error(f"Failed to fetch profile for {student_id}: {e}")
            student_profile = {}

    profile = student_profile or {}
    skills = profile.get("skills") or []
    skills_text = ", ".join(skills) if isinstance(skills, list) else str(skills) or "None listed"

    prompt = f"""You are a senior career advisor evaluating a student's readiness for the role of "{target_role}".

**STUDENT PROFILE:**
- Name: {profile.get("full_name", "Unknown")}
- Major: {profile.get("major", "Not specified")}
- GPA: {profile.get("gpa", "Not specified")}
- Graduation Year: {profile.get("graduation_year", "Not specified")}
- Skills: {skills_text}
- Bio: {str(profile.get("bio", "Not provided"))[:500]}

Return EXACTLY this JSON structure:
{{
  "overallReadinessScore": <integer 0-100>,
  "breakdown": {{
    "technicalSkills": <integer 0-100>,
    "academicBackground": <integer 0-100>,
    "practicalExperience": <integer 0-100>,
    "industryAlignment": <integer 0-100>
  }},
  "strengths": ["strength1", "strength2", "strength3"],
  "criticalGaps": ["gap1", "gap2", "gap3"],
  "topRecommendations": ["action1", "action2", "action3"],
  "hiringLikelihood": "low|moderate|high",
  "summary": "<2-3 sentence summary of readiness>"
}}"""

    logger.info(f"Scoring career readiness for student {student_id}, role: {target_role}")
    result = _call_gemini(prompt)
    _require_keys(result, ["overallReadinessScore", "breakdown", "hiringLikelihood", "summary"], "score_career_readiness")
    result["studentId"] = student_id
    result["targetRole"] = target_role
    return result


# ─────────────────────────────────────────────
# Feature 3 — Institution-Level Insights
# ─────────────────────────────────────────────

def get_institution_insights(university_id: str) -> Dict[str, Any]:
    """
    Generates aggregate skill analytics for a university's student body.

    Args:
        university_id: The university's profile UUID.

    Returns:
        Aggregated skill trends, top skills, gap areas, and placement readiness.
    """
    if not supabase:
        raise RuntimeError("Supabase client not initialized")

    try:
        students_res = supabase.table("students").select(
            "skills, major, gpa"
        ).eq("university_id", university_id).execute()
        students = students_res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch students for university {university_id}: {e}")
        raise

    if not students:
        return {
            "universityId": university_id,
            "totalStudents": 0,
            "message": "No student data found for this university",
        }

    # Aggregate skill frequencies, major distribution, and GPA
    all_skills: Dict[str, int] = {}
    majors: Dict[str, int] = {}
    gpa_values: List[float] = []

    for s in students:
        for skill in (s.get("skills") or []):
            all_skills[skill] = all_skills.get(skill, 0) + 1
        if s.get("major"):
            m = s["major"]
            majors[m] = majors.get(m, 0) + 1
        if s.get("gpa"):
            try:
                gpa_values.append(float(s["gpa"]))
            except (ValueError, TypeError):
                pass

    top_skills = sorted(all_skills.items(), key=lambda x: x[1], reverse=True)[:20]
    avg_gpa = round(sum(gpa_values) / len(gpa_values), 2) if gpa_values else None

    prompt = f"""You are a higher education analytics expert reviewing data for {len(students)} students.

**TOP SKILLS (skill: count):** {dict(top_skills)}
**MAJORS DISTRIBUTION:** {majors}
**AVERAGE GPA:** {avg_gpa}

Return EXACTLY this JSON:
{{
  "placementReadinessScore": <integer 0-100>,
  "industryAlignmentScore": <integer 0-100>,
  "topSkillsInDemand": ["skill1", "skill2", "skill3"],
  "skillGapAreas": ["area1", "area2", "area3"],
  "majorStrengths": ["strength1", "strength2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "summary": "<2-3 sentence summary of the cohort>"
}}"""

    logger.info(f"Generating institution insights for university {university_id} ({len(students)} students)")
    ai_insights = _call_gemini(prompt)
    _require_keys(ai_insights, ["placementReadinessScore", "skillGapAreas", "recommendations", "summary"], "get_institution_insights")

    return {
        "universityId": university_id,
        "totalStudents": len(students),
        "averageGpa": avg_gpa,
        "topSkills": dict(top_skills[:10]),
        "majorDistribution": majors,
        "aiInsights": ai_insights,
    }
