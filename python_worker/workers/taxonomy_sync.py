"""
Taxonomy Sync Worker for Harbor Platform

Fetches the latest skill taxonomy from O*NET Web Services (or a mock dataset
when credentials are absent) and persists it to the `skills_taxonomy` table in
Supabase, recording each run in `taxonomy_sync_log`.

Public API
----------
fetch_onet_taxonomy()        -> List[Dict]  — fetch from O*NET (or mock)
sync_taxonomy_to_db(skills)  -> Dict        — upsert to DB + log run
"""

import logging
import os
from typing import List, Dict, Any, Generator
import httpx
from db import supabase

logger = logging.getLogger(__name__)


def fetch_onet_taxonomy() -> List[Dict[str, Any]]:
    """
    Fetches latest skill taxonomy from O*NET Web Services
    
    Returns:
        List of skill records with name and category
    """
    onet_username = os.getenv("ONET_USERNAME")
    onet_password = os.getenv("ONET_PASSWORD")
    
    if not onet_username or not onet_password:
        logger.warning("O*NET credentials not configured. Using mock taxonomy data.")
        return _get_mock_taxonomy()
    
    try:
        logger.info("Fetching skill taxonomy from O*NET Web Services...")
        
        # O*NET API endpoint for technology skills
        url = "https://services.onetcenter.org/ws/online/technology_skills"
        
        response = httpx.get(
            url,
            auth=(onet_username, onet_password),
            headers={"Accept": "application/json"},
            timeout=30.0
        )
        response.raise_for_status()
        
        data = response.json()
        skills = []
        
        # Parse O*NET response format
        for item in data.get("technology_skill", [])[:500]:  # Limit to 500 skills
            skills.append({
                "name": item.get("title", "Unknown"),
                "category": item.get("commodity_title", "Uncategorized"),
                "onet_code": item.get("id", ""),
                "description": item.get("description", ""),
                "source": "onet"
            })
        
        logger.info(f"Fetched {len(skills)} skills from O*NET")
        return skills
        
    except httpx.HTTPError as e:
        logger.error(f"HTTP error fetching from O*NET: {e}")
        return _get_mock_taxonomy()
    except Exception as e:
        logger.error(f"Failed to fetch from O*NET: {type(e).__name__}: {e}")
        return _get_mock_taxonomy()


def _get_mock_taxonomy() -> List[Dict[str, Any]]:
    """Returns mock taxonomy data for testing/development"""
    logger.info("Using mock taxonomy data")
    return [
        {
            "name": "React.js",
            "category": "Frontend Frameworks",
            "description": "JavaScript library for building user interfaces",
            "source": "mock"
        },
        {
            "name": "Python",
            "category": "Programming Languages",
            "description": "High-level programming language",
            "source": "mock"
        },
        {
            "name": "Node.js",
            "category": "Backend Frameworks",
            "description": "JavaScript runtime for server-side development",
            "source": "mock"
        },
        {
            "name": "PostgreSQL",
            "category": "Databases",
            "description": "Advanced open-source relational database",
            "source": "mock"
        },
        {
            "name": "Docker",
            "category": "DevOps Tools",
            "description": "Platform for containerized applications",
            "source": "mock"
        },
        {
            "name": "AWS",
            "category": "Cloud Platforms",
            "description": "Amazon Web Services cloud computing platform",
            "source": "mock"
        },
        {
            "name": "TypeScript",
            "category": "Programming Languages",
            "description": "Typed superset of JavaScript",
            "source": "mock"
        },
        {
            "name": "Git",
            "category": "Version Control",
            "description": "Distributed version control system",
            "source": "mock"
        },
        {
            "name": "Kubernetes",
            "category": "DevOps Tools",
            "description": "Container orchestration platform",
            "source": "mock"
        },
        {
            "name": "Software Architecture",
            "category": "System Design",
            "description": "High-level structure of software systems",
            "source": "mock"
        }
    ]


def sync_taxonomy_to_db(skills: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Upserts a list of skills into the skills_taxonomy table.
    Called directly from the /sync-taxonomy HTTP endpoint.

    Args:
        skills: List of skill dicts with name, category, description, source

    Returns:
        Dict with status details
    """
    if not supabase:
        raise RuntimeError("Supabase client not initialized")

    saved = 0
    failed = 0

    for batch in _batch(skills, 100):
        try:
            supabase.table("skills_taxonomy").upsert(
                batch, on_conflict="name"
            ).execute()
            saved += len(batch)
            logger.debug(f"Upserted batch of {len(batch)} skills")
        except Exception as e:
            logger.error(f"Batch upsert failed: {e}")
            failed += len(batch)

    # Log sync metadata (non-critical)
    try:
        supabase.table("taxonomy_sync_log").insert({
            "sync_date": "now()",
            "skills_synced": saved,
            "source": skills[0].get("source", "unknown") if skills else "none",
            "status": "success" if failed == 0 else "partial",
        }).execute()
    except Exception as e:
        logger.warning(f"Failed to write sync log: {e}")

    logger.info(f"Taxonomy sync complete: {saved} saved, {failed} failed")
    return {"saved": saved, "failed": failed}


def _batch(items: List[Any], batch_size: int) -> Generator[List[Any], None, None]:
    """Splits a list into fixed-size chunks."""
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]
