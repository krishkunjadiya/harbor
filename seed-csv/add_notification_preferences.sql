-- Add notification_preferences to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "emailNotifications": true,
    "assignmentNotifications": true,
    "studentMessages": true,
    "gradeUpdates": true,
    "courseUpdates": true,
    "systemNotifications": true,
    "weeklyDigest": true,
    "newsAndUpdates": false
}'::jsonb;
