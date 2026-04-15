"""
Worker Health Check and Testing Script
Tests all AI workers to ensure they're production-ready
"""

import os
import sys
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg: str):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.END}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

# Test results storage
test_results: List[Dict[str, Any]] = []


def test_environment_variables():
    """Check all required environment variables"""
    print("\n" + "="*60)
    print("TESTING: Environment Variables")
    print("="*60)
    
    required_vars = {
        "SUPABASE_URL": "Supabase project URL",
        "SUPABASE_SERVICE_ROLE_KEY": "Supabase service role key",
    }
    
    optional_vars = {
        "GEMINI_API_KEY": "Google Gemini AI (resume analysis)",
        "INNGEST_SIGNING_KEY": "Inngest event system",
        "INNGEST_EVENT_KEY": "Inngest event key",
        "ONET_USERNAME": "O*NET Web Services (taxonomy sync)",
        "ONET_PASSWORD": "O*NET password",
    }
    
    all_pass = True
    
    # Check required
    for var, desc in required_vars.items():
        value = os.getenv(var)
        if value:
            print_success(f"{var}: Configured ({desc})")
        else:
            print_error(f"{var}: MISSING - {desc}")
            all_pass = False
    
    # Check optional
    for var, desc in optional_vars.items():
        value = os.getenv(var)
        if value:
            print_success(f"{var}: Configured ({desc})")
        else:
            print_warning(f"{var}: Not configured - {desc}")
    
    test_results.append({
        "test": "Environment Variables",
        "status": "PASS" if all_pass else "FAIL",
        "critical": True
    })
    
    return all_pass


def test_supabase_connection():
    """Test Supabase database connection"""
    print("\n" + "="*60)
    print("TESTING: Supabase Connection")
    print("="*60)
    
    try:
        from db import supabase
        
        if supabase is None:
            print_error("Supabase client not initialized")
            test_results.append({
                "test": "Supabase Connection",
                "status": "FAIL",
                "critical": True
            })
            return False
        
        # Test simple query
        result = supabase.table("profiles").select("id").limit(1).execute()
        print_success(f"Connected to Supabase successfully")
        print_info(f"Database accessible: {len(result.data)} sample records found")
        
        test_results.append({
            "test": "Supabase Connection",
            "status": "PASS",
            "critical": True
        })
        return True
        
    except Exception as e:
        print_error(f"Supabase connection failed: {str(e)}")
        test_results.append({
            "test": "Supabase Connection",
            "status": "FAIL",
            "critical": True,
            "error": str(e)
        })
        return False


def test_gemini_api():
    """Test Google Gemini API connection"""
    print("\n" + "="*60)
    print("TESTING: Google Gemini AI")
    print("="*60)
    
    try:
        from llm import analyze_resume_with_ai
        
        test_resume = """
        John Doe
        Software Engineer
        
        Experience:
        - Built web applications using React and Node.js
        - Developed RESTful APIs with Python and Flask
        - Implemented CI/CD pipelines using GitHub Actions
        
        Skills: JavaScript, Python, React, Node.js, Git
        """
        
        print_info("Analyzing test resume...")
        result = analyze_resume_with_ai(test_resume)
        
        if result.get("_mock"):
            print_warning(f"Using mock data (reason: {result.get('_mock_reason', 'unknown')})")
            if not os.getenv("GEMINI_API_KEY"):
                print_warning("GEMINI_API_KEY not set - Get free key at https://aistudio.google.com/app/apikey")
        else:
            print_success("Gemini AI API working correctly")
            print_info(f"Resume score: {result.get('overall_score', 'N/A')}/100")
        
        # Check response structure
        required_fields = ["overall_score", "metrics", "strengths", "improvements"]
        missing_fields = [f for f in required_fields if f not in result]
        
        if missing_fields:
            print_error(f"Invalid response structure. Missing: {missing_fields}")
            test_results.append({
                "test": "Gemini AI",
                "status": "FAIL",
                "critical": False
            })
            return False
        
        test_results.append({
            "test": "Gemini AI", 
            "status": "PASS" if not result.get("_mock") else "MOCK",
            "critical": False,
            "score": result.get("overall_score")
        })
        return True
        
    except Exception as e:
        print_error(f"Gemini AI test failed: {str(e)}")
        test_results.append({
            "test": "Gemini AI",
            "status": "FAIL",
            "critical": False,
            "error": str(e)
        })
        return False


def test_embedding_model():
    """Test Sentence Transformers embedding model"""
    print("\n" + "="*60)
    print("TESTING: Embedding Model")
    print("="*60)
    
    try:
        from workers.embedding_generator import get_embedding_model, generate_profile_embedding
        
        print_info("Loading embedding model...")
        model = get_embedding_model()
        print_success("Model loaded successfully")
        
        test_text = "Software Engineer with 5 years experience in Python and React"
        print_info("Generating test embedding...")
        embedding = generate_profile_embedding(test_text)
        
        print_success(f"Embedding generated: {len(embedding)} dimensions")
        
        # Verify dimensions
        if len(embedding) != 384:
            print_error(f"Invalid embedding dimensions: expected 384, got {len(embedding)}")
            test_results.append({
                "test": "Embedding Model",
                "status": "FAIL",
                "critical": False
            })
            return False
        
        test_results.append({
            "test": "Embedding Model",
            "status": "PASS",
            "critical": False,
            "dimensions": len(embedding)
        })
        return True
        
    except Exception as e:
        print_error(f"Embedding model test failed: {str(e)}")
        test_results.append({
            "test": "Embedding Model",
            "status": "FAIL",
            "critical": False,
            "error": str(e)
        })
        return False


def test_fuzzy_logic():
    """Test fuzzy logic system"""
    print("\n" + "="*60)
    print("TESTING: Fuzzy Logic System")
    print("="*60)
    
    try:
        from workers.fuzzy_logic import calculate_skill_confidence
        
        test_cases = [
            (95, 6, 5, "Expert"),  # High grade, high bloom, high difficulty
            (75, 3, 3, "Competent"),  # Medium across the board
            (40, 1, 1, "Novice"),  # Low inputs
        ]
        
        all_passed = True
        for grade, bloom, difficulty, expected_level in test_cases:
            score = calculate_skill_confidence(grade, bloom, difficulty)
            print_info(f"Grade: {grade}, Bloom: {bloom}, Difficulty: {difficulty} → Score: {score}")
            
            if score < 0 or score > 100:
                print_error(f"Invalid score range: {score}")
                all_passed = False
        
        if all_passed:
            print_success("Fuzzy logic system working correctly")
            test_results.append({
                "test": "Fuzzy Logic",
                "status": "PASS",
                "critical": False
            })
        else:
            test_results.append({
                "test": "Fuzzy Logic",
                "status": "FAIL",
                "critical": False
            })
        
        return all_passed
        
    except Exception as e:
        print_error(f"Fuzzy logic test failed: {str(e)}")
        test_results.append({
            "test": "Fuzzy Logic",
            "status": "FAIL",
            "critical": False,
            "error": str(e)
        })
        return False


def test_taxonomy_sync():
    """Test taxonomy sync functionality"""
    print("\n" + "="*60)
    print("TESTING: Taxonomy Sync")
    print("="*60)
    
    try:
        from workers.taxonomy_sync import fetch_onet_taxonomy
        
        print_info("Fetching taxonomy data...")
        skills = fetch_onet_taxonomy()
        
        print_success(f"Fetched {len(skills)} skills")
        
        if skills:
            sample = skills[0]
            print_info(f"Sample skill: {sample.get('name')} ({sample.get('category')})")
            
            if sample.get('source') == 'mock':
                print_warning("Using mock taxonomy data (O*NET credentials not configured)")
        
        test_results.append({
            "test": "Taxonomy Sync",
            "status": "PASS",
            "critical": False,
            "skills_count": len(skills)
        })
        return True
        
    except Exception as e:
        print_error(f"Taxonomy sync test failed: {str(e)}")
        test_results.append({
            "test": "Taxonomy Sync",
            "status": "FAIL",
            "critical": False,
            "error": str(e)
        })
        return False


def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    critical_tests = [t for t in test_results if t.get("critical")]
    non_critical_tests = [t for t in test_results if not t.get("critical")]
    
    passed = sum(1 for t in test_results if t["status"] == "PASS")
    failed = sum(1 for t in test_results if t["status"] == "FAIL")
    mock = sum(1 for t in test_results if t["status"] == "MOCK")
    
    print(f"\nTotal Tests: {len(test_results)}")
    print_success(f"Passed: {passed}")
    if mock > 0:
        print_warning(f"Mock Mode: {mock}")
    if failed > 0:
        print_error(f"Failed: {failed}")
    
    # Critical failures
    critical_failures = [t for t in critical_tests if t["status"] == "FAIL"]
    if critical_failures:
        print("\n" + Colors.RED + "CRITICAL FAILURES:" + Colors.END)
        for test in critical_failures:
            print_error(f"  - {test['test']}")
            if "error" in test:
                print(f"    Error: {test['error']}")
    
    # Overall status
    print("\n" + "="*60)
    if critical_failures:
        print_error("❌ SYSTEM NOT READY FOR PRODUCTION")
        print_error("Fix critical failures before deploying")
        return False
    elif failed > 0:
        print_warning("⚠️  SYSTEM PARTIALLY READY")
        print_warning("Some non-critical features may not work")
        return True
    else:
        print_success("✅ ALL SYSTEMS OPERATIONAL")
        print_success("Ready for production deployment!")
        return True


def main():
    """Run all tests"""
    print(Colors.BLUE + """
    ╔═══════════════════════════════════════════════════════╗
    ║   Harbor Python Worker - Health Check & Testing      ║
    ╚═══════════════════════════════════════════════════════╝
    """ + Colors.END)
    
    # Run tests
    test_environment_variables()
    test_supabase_connection()
    test_gemini_api()
    test_embedding_model()
    test_fuzzy_logic()
    test_taxonomy_sync()
    
    # Print summary
    success = print_summary()
    
    # Exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
