-- =============================================
-- STEP 3: RESTORE FOREIGN KEY CONSTRAINT ON PROFILES TABLE
-- Run this AFTER importing all CSV data
-- =============================================

-- NOTE: Since we cannot disable triggers on auth.users in Supabase,
-- we'll work around the handle_new_user() trigger by ensuring profiles already exist

-- FIRST: Create auth.users records for all profiles
-- The trigger will try to create profiles, but they already exist, so we need to handle this
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  p.email,
  crypt('Harbor@2024', gen_salt('bf')), -- Default password
  NOW(),
  p.created_at,
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', p.full_name, 'user_type', p.user_type),
  false,
  '',
  '',
  '',
  ''
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
)
ON CONFLICT (id) DO NOTHING;

-- SECOND: Add back the foreign key constraint
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- =============================================
-- ALTERNATIVE FOR DEVELOPMENT: Skip the constraint
-- If you want to keep profiles without auth.users for testing,
-- just don't run this script at all
-- =============================================

-- Verify the constraint is restored
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname = 'profiles_id_fkey';
-- This should return 1 row showing the constraint

-- Verify all profiles now have matching auth.users records
SELECT COUNT(*) as profile_count,
       (SELECT COUNT(*) FROM auth.users WHERE id IN (SELECT id FROM public.profiles)) as auth_users_count
FROM public.profiles;
-- Both counts should match (157 profiles = 157 auth users)
