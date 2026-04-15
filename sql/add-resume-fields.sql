-- Add resume analysis fields to students table
-- This enables the Resume Analyzer feature to store AI-generated feedback

-- Add resume_score column (0-100 score from AI analysis)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS resume_score INTEGER CHECK (resume_score >= 0 AND resume_score <= 100);

-- Add resume_feedback column (stores full AI analysis as JSONB)
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS resume_feedback JSONB;

-- Add index for faster queries on resume_score
CREATE INDEX IF NOT EXISTS idx_students_resume_score ON public.students(resume_score);

-- Verify the columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'resume_score'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'resume_feedback'
  ) THEN
    RAISE NOTICE '✅ Resume fields successfully added to students table';
  ELSE
    RAISE EXCEPTION '❌ Failed to add resume fields to students table';
  END IF;
END $$;
