-- Saved Candidates Table
CREATE TABLE IF NOT EXISTS saved_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recruiter_id, student_id)
);

-- Enable RLS for saved_candidates
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage their saved candidates" 
ON saved_candidates FOR ALL 
USING (auth.uid() = recruiter_id);

-- Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for interviews
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interviews" 
ON interviews FOR SELECT 
USING (auth.uid() = recruiter_id OR auth.uid() = student_id);

CREATE POLICY "Recruiters can manage interviews" 
ON interviews FOR ALL 
USING (auth.uid() = recruiter_id);

-- Learning Resources Table
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category TEXT,
  type TEXT CHECK (type IN ('video', 'article', 'course', 'book')),
  is_free BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for learning_resources
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view learning resources" 
ON learning_resources FOR SELECT 
USING (true);

-- Insert some sample learning resources
INSERT INTO learning_resources (title, description, url, category, type) VALUES
('Introduction to React', 'Learn the basics of React.js', 'https://react.dev/learn', 'Development', 'course'),
('System Design Interview Guide', 'Prepare for technical interviews', 'https://github.com/donnemartin/system-design-primer', 'Career', 'article'),
('Mastering Python', 'Advanced Python concepts', 'https://docs.python.org/3/tutorial/', 'Development', 'book');
