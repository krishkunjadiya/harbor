"""
AI/LLM Integration Module for Harbor Platform
Handles all interactions with Google Gemini AI for resume analysis
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google import genai
from google.genai import types

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Define strict JSON schema for Gemini responses
RESUME_ANALYSIS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "overall_score": {
            "type": "INTEGER", 
            "description": "Overall resume quality score from 0 to 100"
        },
        "metrics": {
            "type": "OBJECT",
            "properties": {
                "content_quality": {
                    "type": "INTEGER", 
                    "description": "Quality of resume content and descriptions (0-100)"
                },
                "keyword_match": {
                    "type": "INTEGER", 
                    "description": "Industry keyword density and relevance (0-100)"
                },
                "format_structure": {
                    "type": "INTEGER", 
                    "description": "Formatting, layout, and organization (0-100)"
                },
                "ats_compatibility": {
                    "type": "INTEGER", 
                    "description": "Applicant Tracking System compatibility (0-100)"
                }
            },
            "required": ["content_quality", "keyword_match", "format_structure", "ats_compatibility"]
        },
        "strengths": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3-5 strongest points in the resume"
        },
        "improvements": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3-5 specific actionable improvements"
        },
        "found_keywords": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Important industry keywords found in resume"
        },
        "missing_keywords": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "High-value keywords missing from resume"
        },
        "suggestions": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "3-5 strategic recommendations for career advancement"
        }
    },
    "required": [
        "overall_score", 
        "metrics", 
        "strengths", 
        "improvements", 
        "found_keywords", 
        "missing_keywords", 
        "suggestions"
    ]
}

INTERVIEW_EVALUATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "score": {
            "type": "NUMBER",
            "description": "Answer score out of 10"
        },
        "strengths": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Exactly 2 strengths"
        },
        "weaknesses": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Exactly 2 weaknesses"
        },
        "improved_answer": {
            "type": "STRING",
            "description": "Improved answer in exactly 3 sentences"
        }
    },
    "required": ["score", "strengths", "weaknesses", "improved_answer"]
}

PERSONALIZED_QUESTION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "question": {
            "type": "STRING",
            "description": "A single interview question tailored to role and skills"
        }
    },
    "required": ["question"]
}


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((Exception,)),
    reraise=True
)
def _call_gemini_api(prompt: str, api_key: str) -> Dict[str, Any]:
    """
    Makes API call to Google Gemini with retry logic
    
    Args:
        prompt: The analysis prompt
        api_key: Gemini API key
        
    Returns:
        Parsed JSON response from Gemini
        
    Raises:
        Exception: If API call fails after retries
    """
    try:
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RESUME_ANALYSIS_SCHEMA,
                temperature=0.2,  # Low temperature for analytical consistency
                top_p=0.8,
                top_k=20,
            ),
        )
        
        return json.loads(response.text)
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        raise


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((Exception,)),
    reraise=True
)
def _call_gemini_json(prompt: str, api_key: str, schema: Dict[str, Any], temperature: float = 0.2) -> Dict[str, Any]:
    """Generic JSON-safe Gemini call with schema validation and retries."""
    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                temperature=temperature,
                top_p=0.8,
                top_k=20,
            ),
        )

        return json.loads(response.text)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        raise
    except Exception as e:
        logger.error(f"Gemini API error: {type(e).__name__}: {e}")
        raise
    except Exception as e:
        logger.error(f"Gemini API error: {type(e).__name__}: {e}")
        raise


def analyze_resume_with_ai(resume_text: str) -> Dict[str, Any]:
    """
    Analyzes resume text using Google Gemini AI
    
    Args:
        resume_text: Extracted text from resume document
        
    Returns:
        Comprehensive resume analysis with scores and recommendations
    """
    # Validate input
    if not resume_text or not resume_text.strip():
        logger.warning("Empty resume text provided")
        return _generate_mock_feedback(reason="empty_input")
    
    # Check API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured. Using mock feedback.")
        return _generate_mock_feedback(reason="no_api_key")
    
    try:
        # Construct comprehensive analysis prompt
        prompt = f"""You are an expert technical recruiter and ATS software analyzer with 10+ years of experience.

Analyze the following resume comprehensively and provide detailed, actionable feedback.

**ANALYSIS CRITERIA:**
1. Content Quality: Clarity, impact, quantifiable achievements
2. Keyword Match: Industry-specific technical and soft skills
3. Format & Structure: Organization, readability, sections
4. ATS Compatibility: Parsability, keyword optimization, formatting

**RESUME TEXT:**
{resume_text[:5000]}  

**REQUIREMENTS:**
- Be specific and constructive in all feedback
- Provide actionable improvements, not generic advice
- Consider modern hiring practices and ATS systems
- Focus on measurable impact and quantifiable results
- Identify both technical and soft skills
- Suggest role-specific keywords based on content

Provide your analysis in the specified JSON format."""

        logger.info(f"Analyzing resume ({len(resume_text)} characters)")
        result = _call_gemini_api(prompt, api_key)
        
        # Validate response structure
        if not _validate_response(result):
            logger.error("Invalid response structure from Gemini")
            return _generate_mock_feedback(reason="invalid_response")
        
        logger.info(f"Resume analyzed successfully (Score: {result.get('overall_score', 0)})")
        return result
        
    except Exception as e:
        logger.error(f"Resume analysis failed: {type(e).__name__}: {e}")
        # Return fallback data instead of crashing
        return _generate_mock_feedback(reason="api_error")


def _validate_response(data: Dict[str, Any]) -> bool:
    """Validates the AI response has required fields"""
    required_fields = ["overall_score", "metrics", "strengths", "improvements"]
    return all(field in data for field in required_fields)


def _generate_mock_feedback(reason: str = "fallback") -> Dict[str, Any]:
    """
    Generates mock feedback for development/fallback scenarios
    
    Args:
        reason: Why mock data is being used
        
    Returns:
        Mock resume analysis data
    """
    logger.info(f"Generating mock feedback: {reason}")
    
    return {
        "overall_score": 72,
        "metrics": {
            "content_quality": 75,
            "keyword_match": 68,
            "format_structure": 80,
            "ats_compatibility": 65
        },
        "strengths": [
            "Clear professional summary with measurable impact",
            "Strong use of action verbs in experience descriptions",
            "Well-organized sections with logical flow",
            "Quantifiable achievements with specific metrics"
        ],
        "improvements": [
            "Add technical skills section with proficiency levels",
            "Include more industry-specific keywords throughout",
            "Expand on project outcomes with ROI or performance metrics",
            "Add certifications or professional development section",
            "Consider adding a portfolio link or GitHub profile"
        ],
        "found_keywords": [
            "JavaScript", "React", "Node.js", "Git", 
            "Agile", "Team Leadership", "Problem Solving"
        ],
        "missing_keywords": [
            "TypeScript", "CI/CD", "Docker", "Kubernetes", 
            "AWS", "Unit Testing", "RESTful APIs", "Microservices"
        ],
        "suggestions": [
            "Tailor keywords for each job application based on the job description",
            "Add measurable business impact to technical achievements (e.g., '30% performance improvement')",
            "Consider obtaining AWS certification to strengthen cloud computing credibility",
            "Include links to live projects or portfolio to demonstrate practical skills",
            "Update summary to highlight 2-3 unique value propositions for employers"
        ],
        "_mock": True,
        "_mock_reason": reason
    }


def evaluate_interview_answer_with_ai(question: str, answer: str, role: str) -> Dict[str, Any]:
    """Evaluate a student's interview answer with strict JSON output."""
    if not question.strip() or not answer.strip():
        return _generate_mock_interview_evaluation(reason="empty_input")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured. Using mock interview evaluation.")
        return _generate_mock_interview_evaluation(reason="no_api_key")

    prompt = f"""Question: {question}
Student's answer: {answer}
Role: {role}

Evaluate this answer. Return JSON with:
- score (out of 10)
- strengths (2 points)
- weaknesses (2 points)
- improved answer (3 sentences)

Rules:
- Keep strengths to exactly 2 concise bullet-like points.
- Keep weaknesses to exactly 2 concise bullet-like points.
- Keep improved answer to exactly 3 sentences.
- Score must be between 0 and 10."""

    try:
        result = _call_gemini_json(prompt, api_key, INTERVIEW_EVALUATION_SCHEMA, temperature=0.15)

        score = float(result.get("score", 0))
        strengths = [str(item).strip() for item in result.get("strengths", []) if str(item).strip()]
        weaknesses = [str(item).strip() for item in result.get("weaknesses", []) if str(item).strip()]
        improved_answer = str(result.get("improved_answer", "")).strip()

        normalized = {
            "score": max(0.0, min(10.0, round(score, 1))),
            "strengths": strengths[:2] if strengths else ["Clear attempt to structure the response.", "Relevant concepts are referenced."],
            "weaknesses": weaknesses[:2] if weaknesses else ["Could add more concrete detail.", "Needs stronger outcome-focused examples."],
            "improved_answer": improved_answer or "I would clarify the problem constraints before proposing a solution. Then I would explain my chosen approach with a concrete example and expected trade-offs. Finally, I would summarize how I would validate the solution and improve it iteratively.",
        }

        if len(normalized["strengths"]) < 2:
            normalized["strengths"] = (normalized["strengths"] + ["Shows understanding of the core idea."])[:2]
        if len(normalized["weaknesses"]) < 2:
            normalized["weaknesses"] = (normalized["weaknesses"] + ["Could use clearer structure and specifics."])[:2]

        return normalized
    except Exception as e:
        logger.error(f"Interview evaluation failed: {type(e).__name__}: {e}")
        return _generate_mock_interview_evaluation(reason="api_error")


def generate_personalized_interview_question(role: str, skills: List[str]) -> str:
    """Generate one personalized interview question from role + skills."""
    normalized_role = role.strip() or "software engineer"
    cleaned_skills = [str(skill).strip() for skill in skills if str(skill).strip()][:8]

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _generate_mock_personalized_question(normalized_role, cleaned_skills)

    prompt = f"""Generate exactly one interview question for this role and skill profile.

Role: {normalized_role}
Skills: {', '.join(cleaned_skills) if cleaned_skills else 'General software engineering fundamentals'}

Return JSON with only one field:
- question

Rules:
- Question must be practical and scenario-based.
- Keep it under 40 words.
- Do not include multiple questions."""

    try:
        result = _call_gemini_json(prompt, api_key, PERSONALIZED_QUESTION_SCHEMA, temperature=0.3)
        question = str(result.get("question", "")).strip()
        if not question:
            return _generate_mock_personalized_question(normalized_role, cleaned_skills)
        return question
    except Exception as e:
        logger.error(f"Personalized question generation failed: {type(e).__name__}: {e}")
        return _generate_mock_personalized_question(normalized_role, cleaned_skills)


def _generate_mock_interview_evaluation(reason: str = "fallback") -> Dict[str, Any]:
    logger.info(f"Generating mock interview evaluation: {reason}")
    return {
        "score": 6.8,
        "strengths": [
            "You addressed the core concept with a logical flow.",
            "Your response shows practical awareness of implementation details."
        ],
        "weaknesses": [
            "The answer needs clearer metrics or concrete outcomes.",
            "Trade-offs and edge cases were not discussed in enough depth."
        ],
        "improved_answer": "I would start by clarifying requirements and constraints to avoid assumptions. Then I would propose a solution with concrete technical decisions, trade-offs, and one short example from prior work. Finally, I would describe validation steps, monitoring, and how I would iterate after feedback.",
        "_mock": True,
        "_mock_reason": reason,
    }


def _generate_mock_personalized_question(role: str, skills: List[str]) -> str:
    skill_text = ", ".join(skills[:3]) if skills else "your core stack"
    return f"As a {role}, describe a project where you used {skill_text} to solve a real production problem, including your trade-offs and measurable impact."
