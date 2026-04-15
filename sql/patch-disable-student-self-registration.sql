-- Harbor production patch: disable public student self-registration
-- Date: 2026-04-15
-- Scope: only updates auth signup handling logic
--
-- Behavior after patch:
-- 1) user_type = 'student' is allowed only when metadata includes created_by_university = true
-- 2) all other user types continue to work as before

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'user_type'
  );

  IF NEW.raw_user_meta_data->>'user_type' = 'student' THEN
    IF COALESCE((NEW.raw_user_meta_data->>'created_by_university')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'Student self-registration is disabled. Student accounts must be created by a university administrator.';
    END IF;

    INSERT INTO public.students (id, university, major, graduation_year)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'university',
      NEW.raw_user_meta_data->>'major',
      NEW.raw_user_meta_data->>'graduation_year'
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'university' THEN
    INSERT INTO public.universities (id, university_name, address, city, country)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'university_name',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'country'
    );
  ELSIF NEW.raw_user_meta_data->>'user_type' = 'recruiter' THEN
    INSERT INTO public.recruiters (id, company, job_title)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company',
      NEW.raw_user_meta_data->>'job_title'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger to ensure the function is active in all environments.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
