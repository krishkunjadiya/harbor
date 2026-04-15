-- Verification Script for user_skills Table
-- Run this in Supabase SQL Editor to verify the table setup

-- 1. Check if user_skills table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_skills';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_skills'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'user_skills';

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_skills';

-- 5. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'user_skills';

-- 6. Test query (should return empty or existing data)
-- This will fail if table doesn't exist or RLS blocks access
SELECT 
  id,
  user_id,
  skill_name,
  proficiency_level,
  created_at
FROM user_skills
LIMIT 5;

-- 7. Check for any existing data
SELECT COUNT(*) as total_skills
FROM user_skills;
