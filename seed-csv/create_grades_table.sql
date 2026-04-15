-- Create grades table only
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id TEXT UNIQUE,
  assignment_id UUID,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER,
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy
CREATE POLICY "Students can view their grades"
  ON public.grades FOR SELECT
  USING (auth.uid() = student_id);
