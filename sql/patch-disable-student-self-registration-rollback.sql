-- Harbor rollback patch: re-enable public student self-registration
-- Date: 2026-04-15
-- Scope: reverts patch-disable-student-self-registration.sql
--
-- Behavior after rollback:
-- 1) user_type = 'student' no longer requires created_by_university metadata
-- 2) signup handling returns to prior function behavior

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
