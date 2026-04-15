"""
Harbor Python AI Workers
FastAPI microservice for AI-powered background processing
"""

import os
import uuid
import logging
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from db import supabase

# In-memory job store for background tasks (keyed by job_id)
# For multi-instance deployments, replace with Redis or Supabase table
_job_store: Dict[str, Dict[str, Any]] = {}

# Initialize FastAPI app
app = FastAPI(
    title="Harbor AI Workers",
    description="Production-ready AI microservice for resume analysis, embeddings, fuzzy logic, taxonomy syncing, candidate matching, analytics, and badge signing",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Allow requests from Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Root endpoint - API information"""
    return {
        "service": "Harbor AI Workers",
        "version": "3.0.0",
        "status": "operational",
        "workers": [
            "document_parser",
            "embedding_generator",
            "fuzzy_logic",
            "taxonomy_sync",
            "candidate_matcher",
            "analytics",
            "badge_signer",
        ],
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "analyze_resume": "/analyze-resume",
            "analyze_resume_async": "/analyze-resume-async",
            "evaluate_interview_answer": "/evaluate-interview-answer",
            "generate_personalized_interview_question": "/generate-personalized-interview-question",
            "job_status": "/job-status/{job_id}",
            "fuzzy_score": "/fuzzy-score",
            "generate_embedding": "/generate-embedding",
            "save_embedding": "/save-embedding",
            "sync_taxonomy": "/sync-taxonomy",
            "match_candidates": "/match-candidates",
            "skill_gap": "/skill-gap",
            "career_readiness": "/career-readiness",
            "institution_insights": "/institution-insights/{university_id}",
            "sign_badge": "/sign-badge",
            "verify_badge": "/verify-badge",
        },
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring
    Verifies critical services are operational
    """
    health_status = {
        "status": "healthy",
        "version": "3.0.0",
        "services": {}
    }
    
    # Check Supabase connection
    try:
        if supabase:
            supabase.table("profiles").select("id").limit(1).execute()
            health_status["services"]["supabase"] = "connected"
        else:
            health_status["services"]["supabase"] = "not_configured"
            health_status["status"] = "degraded"
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
        health_status["services"]["supabase"] = "error"
        health_status["status"] = "degraded"
    
    # Check environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        health_status["status"] = "degraded"
        health_status["missing_config"] = missing_vars
    
    # Check AI configuration
    health_status["services"]["gemini_ai"] = "configured" if os.getenv("GEMINI_API_KEY") else "mock_mode"
    health_status["services"]["onet_taxonomy"] = "configured" if os.getenv("ONET_USERNAME") else "mock_mode"
    
    return JSONResponse(content=health_status)

@app.get("/status")
def detailed_status():
    """Detailed system status — lists all 7 active workers."""
    return {
        "workers": {
            "document_parser": {
                "status": "active",
                "description": "PDF and DOCX resume text extraction",
                "endpoints": ["/analyze-resume", "/analyze-resume-async"],
            },
            "embedding_generator": {
                "status": "active",
                "description": "Sentence-transformer profile embeddings (384-dim)",
                "endpoints": ["/generate-embedding", "/save-embedding", "/batch-embed-students"],
            },
            "fuzzy_logic": {
                "status": "active",
                "description": "Fuzzy inference skill confidence scoring",
                "endpoints": ["/fuzzy-score", "/batch-fuzzy-score"],
            },
            "taxonomy_sync": {
                "status": "active",
                "description": "O*NET skill taxonomy sync to Supabase",
                "endpoints": ["/sync-taxonomy"],
            },
            "candidate_matcher": {
                "status": "active",
                "description": "Vectorized semantic candidate ranking",
                "endpoints": ["/match-candidates"],
            },
            "analytics": {
                "status": "active",
                "description": "Gemini-powered skill gap & career readiness",
                "endpoints": ["/skill-gap", "/career-readiness", "/institution-insights/{university_id}"],
            },
            "badge_signer": {
                "status": "active",
                "description": "RSA-PSS cryptographic badge signing",
                "endpoints": ["/sign-badge", "/verify-badge"],
            },
        },
        "environment": os.getenv("ENVIRONMENT", "development"),
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
    }


# =============================================
# DIRECT HTTP ENDPOINT — Resume Analysis
# Bypasses Inngest for direct dev/prod calls
# =============================================

class ResumeAnalysisRequest(BaseModel):
    studentId: str
    fileUrl: str
    filePath: Optional[str] = ""
    documentType: Optional[str] = "resume"


class InterviewEvaluationRequest(BaseModel):
    question: str
    answer: str
    role: Optional[str] = "software engineer"
    prompt: Optional[str] = None


class PersonalizedInterviewQuestionRequest(BaseModel):
    role: Optional[str] = "software engineer"
    skills: Optional[List[str]] = []


@app.post("/analyze-resume")
async def analyze_resume_direct(request: ResumeAnalysisRequest):
    """
    Direct HTTP endpoint for resume analysis.
    Runs extract → AI analysis → DB save without Inngest.
    Called by the Next.js API proxy at /api/analyze-resume.
    """
    from workers.document_parser import process_pdf
    from llm import analyze_resume_with_ai

    student_id = request.studentId
    file_url = request.fileUrl
    file_path = request.filePath
    document_type = request.documentType or "resume"

    logger.info(f"[direct] Analyzing resume for student: {student_id}")

    bucket_name = "resumes" if document_type == "resume" else "documents"

    # Step 1: Extract PDF text
    try:
        extracted_text = await process_pdf(bucket_name, file_path, file_url)
        if extracted_text.startswith("Error:"):
            raise HTTPException(status_code=422, detail=extracted_text)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract PDF: {str(e)}")

    # Step 2: AI analysis
    try:
        ai_feedback = analyze_resume_with_ai(extracted_text)
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # Step 3: Save to database
    try:
        if supabase:
            update_data = {
                "resume_url": file_url,
                "resume_score": ai_feedback.get("overall_score", 0),
                "resume_feedback": ai_feedback,
            }
            result = supabase.table("students").update(update_data).eq("profile_id", student_id).execute()
            db_saved = bool(result.data)
        else:
            db_saved = False
            logger.warning("Supabase not initialized — skipping DB save")
    except Exception as e:
        logger.error(f"DB save failed: {e}")
        db_saved = False

    logger.info(f"[direct] Analysis complete for {student_id} — score={ai_feedback.get('overall_score')}")

    return {
        "status": "success" if db_saved else "partial",
        "studentId": student_id,
        "textLength": len(extracted_text),
        "overallScore": ai_feedback.get("overall_score", 0),
        "dbSaved": db_saved,
        "feedback": ai_feedback,
    }


@app.post("/evaluate-interview-answer")
async def evaluate_interview_answer(request: InterviewEvaluationRequest):
    """Evaluates a student's interview response using Gemini with strict JSON output."""
    from llm import evaluate_interview_answer_with_ai

    question = request.question.strip()
    answer = request.answer.strip()
    role = (request.role or "software engineer").strip()

    if not question or not answer:
        raise HTTPException(status_code=400, detail="question and answer are required")

    try:
        result = evaluate_interview_answer_with_ai(question=question, answer=answer, role=role)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to evaluate interview answer: {str(e)}")


@app.post("/generate-personalized-interview-question")
async def generate_personalized_interview_question(request: PersonalizedInterviewQuestionRequest):
    """Generates one personalized interview question using role + top skills."""
    from llm import generate_personalized_interview_question

    role = (request.role or "software engineer").strip()
    skills = request.skills or []

    try:
        question = generate_personalized_interview_question(role=role, skills=skills)
        return {
            "question": question,
            "role": role,
            "skills": skills[:8],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Personalized question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate personalized interview question: {str(e)}")


# =============================================
# FUZZY LOGIC — Skill Confidence Scoring
# =============================================

class FuzzyScoreRequest(BaseModel):
    grade: float           # 0–100
    bloomLevel: float      # 1–6 (Bloom's taxonomy level)
    difficulty: float      # 1–5 (course difficulty)
    skillName: Optional[str] = "General"
    studentId: Optional[str] = None


@app.post("/fuzzy-score")
def calculate_fuzzy_score(request: FuzzyScoreRequest):
    """
    Calculates skill confidence using fuzzy logic inference.
    Input: grade (0-100), bloomLevel (1-6), difficulty (1-5).
    Returns: confidence score (0-100) and proficiency label.
    """
    from workers.fuzzy_logic import calculate_skill_confidence

    try:
        score = calculate_skill_confidence(
            request.grade,
            request.bloomLevel,
            request.difficulty,
        )
    except Exception as e:
        logger.error(f"Fuzzy score failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if score >= 70:
        proficiency = "Expert"
    elif score >= 40:
        proficiency = "Competent"
    else:
        proficiency = "Novice"

    return {
        "confidenceScore": score,
        "proficiencyLevel": proficiency,
        "inputs": {
            "grade": request.grade,
            "bloomLevel": request.bloomLevel,
            "difficulty": request.difficulty,
        },
        "skillName": request.skillName,
    }


# =============================================
# EMBEDDING GENERATOR — Profile Embeddings
# =============================================

class EmbeddingRequest(BaseModel):
    text: str
    studentId: Optional[str] = None


@app.post("/generate-embedding")
def generate_embedding(request: EmbeddingRequest):
    """
    Generates a 384-dimensional semantic embedding for the given text.
    Requires sentence-transformers to be installed.
    """
    from workers.embedding_generator import generate_profile_embedding, _ST_AVAILABLE

    if not _ST_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="sentence-transformers is not installed on this server. Run: pip install sentence-transformers"
        )

    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text field is required and cannot be empty")

    try:
        vector = generate_profile_embedding(request.text)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "studentId": request.studentId,
        "dimensions": len(vector),
        "preview": vector[:5],  # First 5 values — full vector is 384-dim and intentionally omitted
        "status": "success",
    }


# =============================================
# TAXONOMY SYNC — O*NET Skill Taxonomy
# =============================================

@app.post("/sync-taxonomy")
def trigger_taxonomy_sync():
    """
    Fetches the latest skill taxonomy from O*NET and upserts it into the
    skills_taxonomy table. Falls back to mock data when O*NET is unavailable.
    """
    from workers.taxonomy_sync import fetch_onet_taxonomy, sync_taxonomy_to_db

    try:
        skills = fetch_onet_taxonomy()
    except Exception as e:
        logger.error(f"Taxonomy fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    if not skills:
        raise HTTPException(status_code=502, detail="No skills returned from taxonomy source")

    # Save to database
    try:
        db_result = sync_taxonomy_to_db(skills)
    except Exception as e:
        logger.error(f"Taxonomy DB save failed: {e}")
        # Return partial success — data was fetched but not persisted
        return {
            "status": "partial",
            "skillsFetched": len(skills),
            "dbSaved": False,
            "error": str(e),
            "source": skills[0].get("source", "unknown"),
            "sample": skills[:3],
        }

    return {
        "status": "success",
        "skillsFetched": len(skills),
        "dbSaved": db_result["saved"],
        "dbFailed": db_result["failed"],
        "source": skills[0].get("source", "unknown"),
        "sample": skills[:3],
    }


# =============================================
# EMBEDDING — Save to DB
# =============================================

class SaveEmbeddingRequest(BaseModel):
    studentId: str
    text: str


@app.post("/save-embedding")
def save_embedding_for_student(request: SaveEmbeddingRequest):
    """
    Generates a 384-dim embedding for the given profile text and persists
    it to profiles.skills_embedding for the specified student.
    """
    from workers.embedding_generator import generate_profile_embedding, save_embedding_to_db, _ST_AVAILABLE

    if not _ST_AVAILABLE:
        raise HTTPException(status_code=503, detail="sentence-transformers not installed")

    if not request.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")

    try:
        vector = generate_profile_embedding(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")

    saved = save_embedding_to_db(request.studentId, vector)

    return {
        "studentId": request.studentId,
        "dimensions": len(vector),
        "dbSaved": saved,
        "status": "success" if saved else "partial",
    }


# =============================================
# CANDIDATE MATCHING
# =============================================

class MatchCandidatesRequest(BaseModel):
    jobDescription: str
    topK: Optional[int] = 10
    universityId: Optional[str] = None
    requiredSkills: Optional[List[str]] = None   # keyword pre-filter (AND)
    minScore: Optional[float] = 0.0              # minimum cosine similarity threshold


@app.post("/match-candidates")
def match_candidates_endpoint(request: MatchCandidatesRequest):
    """
    Ranks student candidates against a job description using vectorized
    cosine similarity on stored 384-dim profile embeddings.
    Returns top-K enriched candidates with match scores and quality labels.
    """
    from workers.candidate_matcher import match_candidates

    if not request.jobDescription.strip():
        raise HTTPException(status_code=400, detail="jobDescription cannot be empty")

    top_k = max(1, min(request.topK or 10, 100))  # clamp 1–100

    try:
        result = match_candidates(
            job_description=request.jobDescription,
            top_k=top_k,
            university_id=request.universityId,
            required_skills=request.requiredSkills,
            min_score=request.minScore or 0.0,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Candidate matching failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return result


# =============================================
# AI ANALYTICS — Skill Gap
# =============================================

class SkillGapRequest(BaseModel):
    studentSkills: List[str]
    targetRole: str
    targetDescription: Optional[str] = None


@app.post("/skill-gap")
def skill_gap_analysis(request: SkillGapRequest):
    """
    Analyzes the gap between a student's skills and a target role using
    Gemini AI. Returns missing skills, assessment, and a learning roadmap.
    """
    from workers.analytics import analyze_skill_gap

    if not request.targetRole.strip():
        raise HTTPException(status_code=400, detail="targetRole cannot be empty")

    try:
        result = analyze_skill_gap(
            student_skills=request.studentSkills,
            target_role=request.targetRole,
            target_description=request.targetDescription,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Skill gap analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return result


# =============================================
# AI ANALYTICS — Career Readiness
# =============================================

class CareerReadinessRequest(BaseModel):
    studentId: str
    targetRole: str


@app.post("/career-readiness")
def career_readiness_score(request: CareerReadinessRequest):
    """
    Scores a student's career readiness for a target role using Gemini AI.
    Fetches the student profile from Supabase automatically.
    Returns overall readiness score, breakdown, gaps, and recommendations.
    """
    from workers.analytics import score_career_readiness

    try:
        result = score_career_readiness(
            student_id=request.studentId,
            target_role=request.targetRole,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Career readiness scoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return result


# =============================================
# AI ANALYTICS — Institution Insights
# =============================================

@app.get("/institution-insights/{university_id}")
def institution_insights(university_id: str):
    """
    Generates aggregate AI-powered analytics for a university's student cohort.
    Returns skill trends, placement readiness, and Gemini AI recommendations.
    """
    from workers.analytics import get_institution_insights

    if not university_id.strip():
        raise HTTPException(status_code=400, detail="university_id cannot be empty")

    try:
        result = get_institution_insights(university_id)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Institution insights failed for {university_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return result


# =============================================
# BADGE SIGNING
# =============================================

class SignBadgeRequest(BaseModel):
    badgeData: Dict[str, Any]


@app.post("/sign-badge")
def sign_badge_endpoint(request: SignBadgeRequest):
    """
    Digitally signs a badge credential payload using RSA-PSS + SHA-256.
    Returns the original badge with a _signature block appended.
    Set BADGE_SIGNING_PRIVATE_KEY env var (PEM) for production use.
    """
    from workers.badge_signer import sign_badge, _CRYPTO_AVAILABLE

    if not _CRYPTO_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="cryptography package not installed. Run: pip install cryptography"
        )

    if not request.badgeData:
        raise HTTPException(status_code=400, detail="badgeData cannot be empty")

    try:
        signed = sign_badge(request.badgeData)
    except Exception as e:
        logger.error(f"Badge signing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "signed", "badge": signed}


class VerifyBadgeRequest(BaseModel):
    signedBadge: Dict[str, Any]


@app.post("/verify-badge")
def verify_badge_endpoint(request: VerifyBadgeRequest):
    """
    Verifies the cryptographic integrity and signature of a signed badge.
    Returns valid=True only if fingerprint AND RSA signature both pass.
    """
    from workers.badge_signer import verify_badge, _CRYPTO_AVAILABLE

    if not _CRYPTO_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="cryptography package not installed. Run: pip install cryptography"
        )

    try:
        result = verify_badge(request.signedBadge)
    except Exception as e:
        logger.error(f"Badge verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return result


# =============================================
# BATCH FUZZY SCORING
# =============================================

class BatchFuzzyRequest(BaseModel):
    assessments: List[FuzzyScoreRequest]


@app.post("/batch-fuzzy-score")
def batch_fuzzy_score(request: BatchFuzzyRequest):
    """
    Scores multiple grade assessments in a single request.
    Each item must have grade, bloomLevel, difficulty.
    Returns a list of confidence scores with proficiency labels.
    """
    from workers.fuzzy_logic import batch_calculate_skill_confidence

    if not request.assessments:
        raise HTTPException(status_code=400, detail="assessments list cannot be empty")

    raw = [
        {
            "grade": a.grade,
            "bloom": a.bloomLevel,
            "difficulty": a.difficulty,
            "skill_name": a.skillName,
            "student_id": a.studentId,
        }
        for a in request.assessments
    ]

    try:
        results = batch_calculate_skill_confidence(raw)
    except Exception as e:
        logger.error(f"Batch fuzzy scoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "count": len(results), "results": results}


# =============================================
# BATCH EMBEDDING STUDENTS
# =============================================

class BatchEmbedRequest(BaseModel):
    studentIds: List[str]


@app.post("/batch-embed-students")
def batch_embed_students(request: BatchEmbedRequest):
    """
    Regenerates and saves profile embeddings for a list of student IDs.
    Fetches each student's profile text from the DB, embeds it with
    sentence-transformers, and upserts into profiles.skills_embedding.
    """
    from workers.embedding_generator import build_and_save_profile_embedding, _ST_AVAILABLE

    if not _ST_AVAILABLE:
        raise HTTPException(status_code=503, detail="sentence-transformers not installed")

    if not request.studentIds:
        raise HTTPException(status_code=400, detail="studentIds list cannot be empty")

    if len(request.studentIds) > 200:
        raise HTTPException(status_code=400, detail="Maximum 200 students per batch")

    results = []
    for sid in request.studentIds:
        try:
            outcome = build_and_save_profile_embedding(sid)
            results.append({"studentId": sid, "status": "success", **outcome})
        except Exception as e:
            logger.error(f"Embedding failed for student {sid}: {e}")
            results.append({"studentId": sid, "status": "error", "error": str(e)})

    success_count = sum(1 for r in results if r["status"] == "success")
    return {
        "status": "success" if success_count == len(results) else "partial",
        "total": len(results),
        "succeeded": success_count,
        "failed": len(results) - success_count,
        "results": results,
    }


# =============================================
# BACKGROUND JOB PROCESSING
# =============================================

async def _run_resume_analysis_bg(
    job_id: str,
    student_id: str,
    file_url: str,
    file_path: str,
    document_type: str,
):
    """Background task: runs resume analysis and updates job store with result."""
    _job_store[job_id]["status"] = "processing"
    try:
        from workers.document_parser import process_pdf
        from llm import analyze_resume_with_ai

        bucket_name = "resumes" if document_type == "resume" else "documents"
        extracted_text = await process_pdf(bucket_name, file_path, file_url)

        if extracted_text.startswith("Error:"):
            _job_store[job_id].update({"status": "failed", "error": extracted_text})
            return

        ai_feedback = analyze_resume_with_ai(extracted_text)

        db_saved = False
        if supabase:
            try:
                result = supabase.table("students").update({
                    "resume_url": file_url,
                    "resume_score": ai_feedback.get("overall_score", 0),
                    "resume_feedback": ai_feedback,
                }).eq("profile_id", student_id).execute()
                db_saved = bool(result.data)
            except Exception as e:
                logger.error(f"[job:{job_id}] DB save failed: {e}")

        _job_store[job_id].update({
            "status": "completed",
            "overallScore": ai_feedback.get("overall_score", 0),
            "dbSaved": db_saved,
            "feedback": ai_feedback,
        })
        logger.info(f"[job:{job_id}] Background analysis complete — score={ai_feedback.get('overall_score')}")

    except Exception as e:
        logger.error(f"[job:{job_id}] Background task failed: {e}")
        _job_store[job_id].update({"status": "failed", "error": str(e)})


@app.post("/analyze-resume-async")
async def analyze_resume_async(
    request: ResumeAnalysisRequest,
    background_tasks: BackgroundTasks,
):
    """
    Queues a resume analysis as a background job and immediately returns a job ID.
    Poll GET /job-status/{job_id} for results.
    """
    job_id = str(uuid.uuid4())
    _job_store[job_id] = {
        "jobId": job_id,
        "status": "queued",
        "studentId": request.studentId,
    }

    background_tasks.add_task(
        _run_resume_analysis_bg,
        job_id=job_id,
        student_id=request.studentId,
        file_url=request.fileUrl,
        file_path=request.filePath or "",
        document_type=request.documentType or "resume",
    )

    logger.info(f"[job:{job_id}] Resume analysis queued for student {request.studentId}")
    return {"jobId": job_id, "status": "queued", "pollUrl": f"/job-status/{job_id}"}


@app.get("/job-status/{job_id}")
def get_job_status(job_id: str):
    """
    Returns the current status of a background job.
    Status values: queued | processing | completed | failed
    """
    job = _job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return job


logger.info("Harbor AI Workers v3.0.0 started successfully")

