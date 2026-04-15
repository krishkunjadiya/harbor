"""
Database Client Configuration for Harbor Platform
Initializes Supabase client with service role key
"""

import os
import logging
from typing import Optional
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)


def get_supabase_client() -> Optional[Client]:
    """
    Initializes and returns a Supabase client using the Service Role Key.
    
    This client bypasses Row Level Security (RLS) and should only be used
    in secure backend contexts like this Python worker.
    
    Returns:
        Supabase client instance or None if configuration is missing
    """
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url:
        logger.error("SUPABASE_URL environment variable is not set")
        return None
    
    if not key:
        logger.error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")
        return None
    
    if not url.startswith("https://"):
        logger.warning(f"SUPABASE_URL does not start with https://: {url}")

    try:
        client = create_client(url, key)
        logger.info(f"Supabase client initialized successfully: {url[:30]}...")
        return client
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {type(e).__name__}: {e}")
        return None


# Create singleton instance
try:
    supabase = get_supabase_client()
    
    if supabase is None:
        logger.warning(
            "Supabase client not initialized. "
            "Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment."
        )
except Exception as e:
    logger.error(f"Unexpected error initializing Supabase: {e}")
    supabase = None
