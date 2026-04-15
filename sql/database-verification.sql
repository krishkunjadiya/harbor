-- Database Migration Verification Script
-- Run this in Supabase SQL Editor AFTER running database-schema-extended.sql

-- =============================================
-- TABLE EXISTENCE CHECK
-- =============================================

SELECT 'TABLE CHECK' as check_type, 
       COUNT(*) as tables_created,
       '9 expected' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
);

-- =============================================
-- DETAILED TABLE LIST
-- =============================================

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY table_name;

-- =============================================
-- INDEX CHECK
-- =============================================

SELECT 'INDEX CHECK' as check_type,
       COUNT(*) as indexes_created,
       '18+ expected' as expected
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
);

-- =============================================
-- DETAILED INDEX LIST
-- =============================================

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY tablename, indexname;

-- =============================================
-- RLS POLICY CHECK
-- =============================================

SELECT 'RLS POLICY CHECK' as check_type,
       COUNT(*) as policies_created,
       '20+ expected' as expected
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
);

-- =============================================
-- DETAILED RLS POLICIES
-- =============================================

SELECT tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY tablename, policyname;

-- =============================================
-- RLS ENABLED CHECK
-- =============================================

SELECT tablename, 
       rowsecurity as rls_enabled,
       CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY tablename;

-- =============================================
-- FOREIGN KEY RELATIONSHIPS
-- =============================================

SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN (
  'departments', 'faculty', 'admin_staff', 'courses',
  'student_projects', 'academic_records', 'student_full_records',
  'user_skills', 'career_insights'
)
ORDER BY tc.table_name, kcu.column_name;

-- =============================================
-- SAMPLE DATA COUNTS
-- =============================================

SELECT 'departments' as table_name, COUNT(*) as row_count FROM departments
UNION ALL
SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL
SELECT 'admin_staff', COUNT(*) FROM admin_staff
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'student_projects', COUNT(*) FROM student_projects
UNION ALL
SELECT 'academic_records', COUNT(*) FROM academic_records
UNION ALL
SELECT 'student_full_records', COUNT(*) FROM student_full_records
UNION ALL
SELECT 'user_skills', COUNT(*) FROM user_skills
UNION ALL
SELECT 'career_insights', COUNT(*) FROM career_insights
ORDER BY table_name;

-- =============================================
-- VERIFICATION SUMMARY
-- =============================================

WITH table_check AS (
  SELECT COUNT(*) = 9 as tables_ok
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'departments', 'faculty', 'admin_staff', 'courses',
    'student_projects', 'academic_records', 'student_full_records',
    'user_skills', 'career_insights'
  )
),
index_check AS (
  SELECT COUNT(*) >= 18 as indexes_ok
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN (
    'departments', 'faculty', 'admin_staff', 'courses',
    'student_projects', 'academic_records', 'student_full_records',
    'user_skills', 'career_insights'
  )
),
rls_check AS (
  SELECT COUNT(*) = 9 as rls_ok
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true
  AND tablename IN (
    'departments', 'faculty', 'admin_staff', 'courses',
    'student_projects', 'academic_records', 'student_full_records',
    'user_skills', 'career_insights'
  )
)
SELECT 
  CASE WHEN t.tables_ok THEN '✅' ELSE '❌' END as tables_status,
  CASE WHEN i.indexes_ok THEN '✅' ELSE '❌' END as indexes_status,
  CASE WHEN r.rls_ok THEN '✅' ELSE '❌' END as rls_status,
  CASE 
    WHEN t.tables_ok AND i.indexes_ok AND r.rls_ok 
    THEN '🎉 MIGRATION SUCCESSFUL! All checks passed.'
    ELSE '⚠️ MIGRATION INCOMPLETE. Check individual sections above.'
  END as overall_status
FROM table_check t, index_check i, rls_check r;

-- =============================================
-- EXPECTED RESULTS
-- =============================================

/*
If migration was successful, you should see:

TABLE CHECK: 9 tables created
INDEX CHECK: 18+ indexes created  
RLS POLICY CHECK: 20+ policies created
RLS ENABLED: All 9 tables showing "✅ Enabled"
VERIFICATION SUMMARY: 🎉 MIGRATION SUCCESSFUL!

If you see fewer tables/indexes/policies:
1. Check for error messages in the SQL execution output
2. Verify you ran the COMPLETE database-schema-extended.sql file
3. Check that you have proper permissions in Supabase
4. Try running the schema again (CREATE IF NOT EXISTS prevents duplicates)

Next Steps After Successful Verification:
1. Proceed to ACTION-PLAN.md Step 2: Replace Mock Data Components
2. Test the student profile edit page
3. Test the departments page
4. Continue with remaining conversions
*/
