-- Fix RLS Policies for Faculty Dashboard
-- Run this in Supabase SQL Editor to fix Row Level Security policies

-- Drop ALL existing policies first

DROP POLICY IF EXISTS "Faculty can create courses" ON public.courses;
DROP POLICY IF EXISTS "Faculty can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can enroll in courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Course students can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Faculty can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Faculty can update assignments" ON public.assignments;
DROP POLICY IF EXISTS "Faculty can delete assignments" ON public.assignments;
DROP POLICY IF EXISTS "Students can view own records" ON public.academic_records;
DROP POLICY IF EXISTS "Faculty can view records for their courses" ON public.academic_records;
DROP POLICY IF EXISTS "Faculty can create academic records" ON public.academic_records;
DROP POLICY IF EXISTS "Faculty can view own profile" ON public.faculty;
DROP POLICY IF EXISTS "Faculty can update own profile" ON public.faculty;
DROP POLICY IF EXISTS "University admins can view faculty" ON public.faculty;



CREATE POLICY "Users can view courses they are enrolled in or teach"
  ON public.courses FOR SELECT
  USING (
    -- Admins can see all courses
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    -- Instructors can see their own courses
    instructor_id IN (SELECT id FROM public.faculty WHERE profile_id = auth.uid()) OR
    -- Students can see the courses they are enrolled in
    EXISTS (SELECT 1 FROM public.course_enrollments WHERE course_id = id AND student_id = auth.uid())
  );

CREATE POLICY "Faculty can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    -- Check if user's profile_id exists in faculty table and matches instructor_id
    instructor_id IN (SELECT id FROM public.faculty WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Faculty can update own courses"
  ON public.courses FOR UPDATE
  USING (
    instructor_id IN (SELECT id FROM public.faculty WHERE profile_id = auth.uid()) OR
    department_id IN (SELECT d.id FROM public.departments d WHERE d.university_id = auth.uid())
  );

-- Create corrected policies for COURSE_ENROLLMENTS table
CREATE POLICY "Users can view enrollments"
  ON public.course_enrollments FOR SELECT
  USING (
    auth.uid() = student_id OR
    -- Faculty can view enrollments for their courses
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll in courses"
  ON public.course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Create corrected policies for ASSIGNMENTS table
CREATE POLICY "Course students can view assignments"
  ON public.assignments FOR SELECT
  USING (
    -- Students enrolled in the course can view
    EXISTS (
      SELECT 1 FROM public.course_enrollments 
      WHERE course_id = assignments.course_id AND student_id = auth.uid()
    ) OR
    -- Faculty teaching the course can view
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    -- Faculty can create assignments for their courses
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can update assignments"
  ON public.assignments FOR UPDATE
  USING (
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can delete assignments"
  ON public.assignments FOR DELETE
  USING (
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

-- Fix ACADEMIC_RECORDS policies
CREATE POLICY "Students can view own records"
  ON public.academic_records FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Faculty can view records for their courses"
  ON public.academic_records FOR SELECT
  USING (
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

CREATE POLICY "Faculty can create academic records"
  ON public.academic_records FOR INSERT
  WITH CHECK (
    course_id IN (
      SELECT c.id FROM public.courses c
      JOIN public.faculty f ON c.instructor_id = f.id
      WHERE f.profile_id = auth.uid()
    )
  );

-- Enable RLS on faculty table if not already enabled
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Faculty can view their own profile
CREATE POLICY "Faculty can view own profile"
  ON public.faculty FOR SELECT
  USING (profile_id = auth.uid());

-- Faculty can update their own profile
CREATE POLICY "Faculty can update own profile"
  ON public.faculty FOR UPDATE
  USING (profile_id = auth.uid());

-- University admins can view all faculty
CREATE POLICY "University admins can view faculty"
  ON public.faculty FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
