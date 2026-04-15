-- Interview Preparation module schema
-- Date: 2026-04-02

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  role_tags TEXT[] NOT NULL DEFAULT '{}',
  company_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (text, category, difficulty)
);

CREATE TABLE IF NOT EXISTS public.mock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 10),
  questions_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.practiced (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  last_score NUMERIC(4,2) NOT NULL DEFAULT 0 CHECK (last_score >= 0 AND last_score <= 10),
  last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_role_tags ON public.questions USING GIN(role_tags);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_student_date ON public.mock_sessions(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_student ON public.bookmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_practiced_student ON public.practiced(student_id);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practiced ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questions_select_authenticated ON public.questions;
CREATE POLICY questions_select_authenticated
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS mock_sessions_select_own ON public.mock_sessions;
CREATE POLICY mock_sessions_select_own
  ON public.mock_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS mock_sessions_insert_own ON public.mock_sessions;
CREATE POLICY mock_sessions_insert_own
  ON public.mock_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS mock_sessions_update_own ON public.mock_sessions;
CREATE POLICY mock_sessions_update_own
  ON public.mock_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS mock_sessions_delete_own ON public.mock_sessions;
CREATE POLICY mock_sessions_delete_own
  ON public.mock_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS bookmarks_select_own ON public.bookmarks;
CREATE POLICY bookmarks_select_own
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS bookmarks_insert_own ON public.bookmarks;
CREATE POLICY bookmarks_insert_own
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS bookmarks_delete_own ON public.bookmarks;
CREATE POLICY bookmarks_delete_own
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS practiced_select_own ON public.practiced;
CREATE POLICY practiced_select_own
  ON public.practiced FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS practiced_insert_own ON public.practiced;
CREATE POLICY practiced_insert_own
  ON public.practiced FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS practiced_update_own ON public.practiced;
CREATE POLICY practiced_update_own
  ON public.practiced FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Seed role-aware interview questions
INSERT INTO public.questions (text, category, difficulty, role_tags, company_tags)
VALUES
  ('Explain event bubbling and event capturing in JavaScript.', 'frontend', 'easy', ARRAY['frontend developer', 'full stack developer', 'software engineer'], ARRAY['Google', 'Meta']),
  ('How would you optimize a slow React page that rerenders too often?', 'frontend', 'medium', ARRAY['frontend developer', 'full stack developer'], ARRAY['Meta', 'Amazon']),
  ('Describe how hydration works in Next.js and common pitfalls.', 'frontend', 'medium', ARRAY['frontend developer', 'full stack developer'], ARRAY['Vercel']),
  ('What is the difference between SSR, SSG, and ISR?', 'frontend', 'easy', ARRAY['frontend developer', 'full stack developer'], ARRAY['Vercel']),
  ('How would you design an accessible component library?', 'frontend', 'hard', ARRAY['frontend developer', 'ui engineer'], ARRAY['Adobe']),

  ('What are ACID properties in databases?', 'backend', 'easy', ARRAY['backend developer', 'full stack developer', 'software engineer'], ARRAY['Amazon']),
  ('How do you prevent N+1 query issues in an API?', 'backend', 'medium', ARRAY['backend developer', 'full stack developer'], ARRAY['Stripe']),
  ('Design a rate-limiting strategy for a public API.', 'backend', 'hard', ARRAY['backend developer', 'platform engineer'], ARRAY['Cloudflare']),
  ('When would you choose SQL over NoSQL?', 'backend', 'medium', ARRAY['backend developer', 'full stack developer', 'data engineer'], ARRAY['Microsoft']),
  ('How do you secure JWT-based authentication in production?', 'backend', 'hard', ARRAY['backend developer', 'security engineer'], ARRAY['Auth0']),

  ('What is the difference between CI and CD?', 'devops', 'easy', ARRAY['devops engineer', 'platform engineer', 'software engineer'], ARRAY['GitHub']),
  ('How would you set up observability for a distributed service?', 'devops', 'hard', ARRAY['devops engineer', 'site reliability engineer'], ARRAY['Datadog']),
  ('Describe a blue-green deployment strategy.', 'devops', 'medium', ARRAY['devops engineer', 'site reliability engineer'], ARRAY['Netflix']),
  ('How do containers differ from virtual machines?', 'devops', 'easy', ARRAY['devops engineer', 'platform engineer'], ARRAY['Docker']),
  ('How do you approach incident response during production outages?', 'devops', 'hard', ARRAY['site reliability engineer', 'devops engineer'], ARRAY['Google']),

  ('How do you split data into training and validation sets?', 'data science', 'easy', ARRAY['data scientist', 'ml engineer'], ARRAY['NVIDIA']),
  ('Explain bias-variance tradeoff with an example.', 'data science', 'medium', ARRAY['data scientist', 'ml engineer'], ARRAY['Google']),
  ('How would you evaluate an imbalanced classification model?', 'data science', 'hard', ARRAY['data scientist', 'ml engineer'], ARRAY['Kaggle']),
  ('How do you communicate model limitations to non-technical stakeholders?', 'behavioral', 'medium', ARRAY['data scientist', 'product analyst'], ARRAY['Airbnb']),
  ('How would you productionize an ML model?', 'data science', 'hard', ARRAY['ml engineer', 'data engineer'], ARRAY['Uber']),

  ('Tell me about a time you handled a conflict in your team.', 'behavioral', 'medium', ARRAY['software engineer', 'full stack developer', 'product manager'], ARRAY['Amazon']),
  ('Describe a project where you took ownership end-to-end.', 'behavioral', 'medium', ARRAY['software engineer', 'backend developer', 'frontend developer'], ARRAY['Microsoft']),
  ('How do you prioritize tasks when all deadlines look urgent?', 'behavioral', 'easy', ARRAY['software engineer', 'product manager'], ARRAY['Google']),
  ('Describe a failure and what you changed afterward.', 'behavioral', 'medium', ARRAY['software engineer', 'data scientist', 'devops engineer'], ARRAY['Meta']),
  ('How do you explain a complex technical decision to a non-technical audience?', 'behavioral', 'hard', ARRAY['software engineer', 'tech lead'], ARRAY['Atlassian'])
ON CONFLICT (text, category, difficulty) DO NOTHING;
