-- Add user_preferences to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_preferences JSONB DEFAULT '{
    "viewStudentInfo": true,
    "gradeAssignments": true,
    "createAssignments": true,
    "sendMessages": true,
    "accessAnalytics": true,
    "downloadGrades": true,
    "shareResources": true
}'::jsonb;
