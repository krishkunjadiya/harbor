"""
Fuzzy Logic Worker for Harbor Platform

Calculates skill confidence scores using a 3-input Mamdani fuzzy inference
system.  Inputs are grade (0-100), Bloom's taxonomy level (1-6), and course
difficulty (1-5).  The output is a skill_confidence score in [0, 100].

The fuzzy system (rules + control system) is built once at module import, then
a fresh ControlSystemSimulation is created per scoring call to avoid stale
internal state in scikit-fuzzy.

Public API
----------
calculate_skill_confidence(grade, bloom_level, difficulty) -> float
batch_calculate_skill_confidence(assessments)              -> list[dict]
calculate_and_save_skill(student_id, skill_name, ...)      -> dict
"""

import logging
from typing import List, Dict, Any, Optional
from db import supabase
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

logger = logging.getLogger(__name__)

# ================================================
# FUZZY LOGIC SYSTEM DEFINITION
# ================================================

# Input Variables
grade = ctrl.Antecedent(np.arange(0, 101, 1), 'grade')
bloom = ctrl.Antecedent(np.arange(1, 7, 1), 'bloom')
difficulty = ctrl.Antecedent(np.arange(1, 6, 1), 'difficulty')

# Output Variable
skill_confidence = ctrl.Consequent(np.arange(0, 101, 1), 'skill_confidence')

# Define membership functions
grade['low'] = fuzz.trimf(grade.universe, [0, 0, 50])
grade['medium'] = fuzz.trimf(grade.universe, [30, 50, 70])
grade['high'] = fuzz.trimf(grade.universe, [60, 100, 100])

bloom['recall'] = fuzz.trimf(bloom.universe, [1, 1, 3])
bloom['apply'] = fuzz.trimf(bloom.universe, [2, 3.5, 5])
bloom['create'] = fuzz.trimf(bloom.universe, [4, 6, 6])

difficulty['easy'] = fuzz.trimf(difficulty.universe, [1, 1, 3])
difficulty['medium'] = fuzz.trimf(difficulty.universe, [2, 3, 4])
difficulty['hard'] = fuzz.trimf(difficulty.universe, [3, 5, 5])

skill_confidence['novice'] = fuzz.trimf(skill_confidence.universe, [0, 0, 40])
skill_confidence['competent'] = fuzz.trimf(skill_confidence.universe, [30, 50, 70])
skill_confidence['expert'] = fuzz.trimf(skill_confidence.universe, [60, 100, 100])

# Define fuzzy rules
# Rule 1: High grade + high bloom (create/evaluate) → expert, regardless of difficulty
rule1 = ctrl.Rule(
    grade['high'] & bloom['create'],
    skill_confidence['expert']
)
# Rule 2: High grade + apply-level bloom → expert
rule2 = ctrl.Rule(
    grade['high'] & bloom['apply'],
    skill_confidence['expert']
)
# Rule 3: Medium grade + apply-level bloom → competent
rule3 = ctrl.Rule(
    grade['medium'] & bloom['apply'],
    skill_confidence['competent']
)
# Rule 4: Medium grade or only recall-level bloom → competent
rule4 = ctrl.Rule(
    grade['medium'] | bloom['recall'],
    skill_confidence['competent']
)
# Rule 5: Low grade → novice
rule5 = ctrl.Rule(
    grade['low'],
    skill_confidence['novice']
)
# Rule 6: High grade + hard difficulty → expert (proves mastery under pressure)
rule6 = ctrl.Rule(
    grade['high'] & difficulty['hard'],
    skill_confidence['expert']
)
# Rule 7: High grade + easy difficulty (could be easy course) → competent
rule7 = ctrl.Rule(
    grade['high'] & difficulty['easy'],
    skill_confidence['competent']
)

# Create control system (rules shared across calls; simulation is per-call)
try:
    confidence_ctrl = ctrl.ControlSystem([rule1, rule2, rule3, rule4, rule5, rule6, rule7])
    logger.info("Fuzzy logic system initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize fuzzy logic system: {e}")
    raise


def calculate_skill_confidence(grade_value: float, bloom_level: float, course_difficulty: float) -> float:
    """
    Calculates skill confidence using fuzzy logic inference
    
    Args:
        grade_value: Student grade (0-100)
        bloom_level: Bloom's taxonomy level (1-6)
        course_difficulty: Course difficulty (1-5)
        
    Returns:
        Skill confidence score (0-100)
    """
    try:
        # Validate inputs
        grade_value = max(0, min(100, grade_value))
        bloom_level = max(1, min(6, bloom_level))
        course_difficulty = max(1, min(5, course_difficulty))
        
        # Create a fresh simulation per call (avoids stale state in scikit-fuzzy 0.5+)
        sim = ctrl.ControlSystemSimulation(confidence_ctrl)
        sim.input['grade'] = grade_value
        sim.input['bloom'] = bloom_level
        sim.input['difficulty'] = course_difficulty
        
        # Compute
        sim.compute()
        
        # Get output
        score = sim.output['skill_confidence']
        return round(float(score), 2)
        
    except Exception as e:
        logger.error(f"Fuzzy calculation error: {e}")
        # Fallback to simple weighted average
        return round((grade_value * 0.5) + (bloom_level * 8.33) + (course_difficulty * 5), 2)


def batch_calculate_skill_confidence(assessments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Score multiple grade assessments in a single call.

    Each item in *assessments* must have:
        grade      (0-100)
        bloom      (1-6)
        difficulty (1-5)
    Optional keys (passed through unchanged):
        student_id, skill_name, course_id

    Returns a list of dicts with all input keys plus:
        confidence_score (float)
        proficiency      ("Novice" | "Competent" | "Expert")
        error            (str, only present on failure)
    """
    results = []
    for item in assessments:
        try:
            score = calculate_skill_confidence(
                grade_value=float(item.get("grade", 0)),
                bloom_level=float(item.get("bloom", 1)),
                course_difficulty=float(item.get("difficulty", 1)),
            )
            proficiency = _proficiency_label(score)
            results.append({
                **item,
                "confidence_score": score,
                "proficiency": proficiency,
            })
        except Exception as exc:
            logger.error(f"Batch item error: {exc} — item={item}")
            results.append({**item, "confidence_score": 0.0, "proficiency": "Novice", "error": str(exc)})
    return results


def calculate_and_save_skill(
    student_id: str,
    skill_name: str,
    grade_value: float,
    bloom_level: float,
    course_difficulty: float,
    course_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Full pipeline: calculate fuzzy confidence → upsert to `user_skills` table.

    Returns a result dict with keys:
        student_id, skill_name, confidence_score, proficiency, db_saved, error?
    """
    confidence_score = calculate_skill_confidence(grade_value, bloom_level, course_difficulty)
    proficiency = _proficiency_label(confidence_score)

    db_saved = False
    error_msg: Optional[str] = None

    if supabase:
        try:
            # Upsert — unique on (user_id, skill_name)
            result = supabase.table("user_skills").upsert(
                {
                    "user_id": student_id,
                    "skill_name": skill_name,
                    "skill_category": "Academic",
                    "proficiency_level": proficiency,
                    "verified": True,
                },
                on_conflict="user_id,skill_name",
            ).execute()
            db_saved = bool(result.data)
        except Exception as exc:
            error_msg = str(exc)
            logger.error(f"DB save failed for student={student_id} skill={skill_name}: {exc}")
    else:
        error_msg = "Supabase client not initialized"

    payload: Dict[str, Any] = {
        "student_id": student_id,
        "skill_name": skill_name,
        "confidence_score": confidence_score,
        "proficiency": proficiency,
        "db_saved": db_saved,
    }
    if course_id:
        payload["course_id"] = course_id
    if error_msg:
        payload["error"] = error_msg
    return payload


def _proficiency_label(score: float) -> str:
    if score >= 70:
        return "Expert"
    if score >= 40:
        return "Competent"
    return "Novice"
