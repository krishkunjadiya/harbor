-- Add enrolled_students column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS enrolled_students INTEGER DEFAULT 0;

-- Update the count based on existing enrollments (if any)
UPDATE public.courses c
SET enrolled_students = (
  SELECT COUNT(*) 
  FROM public.course_enrollments ce 
  WHERE ce.course_id = c.id
);
