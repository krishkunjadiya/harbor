-- Deduplicate the skills_taxonomy table
-- Using ctid because MIN(uuid) is not supported in PostgreSQL
DELETE FROM skills_taxonomy
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM skills_taxonomy
    GROUP BY onet_soc_code
);

-- NOW we can safely force the constraint
ALTER TABLE skills_taxonomy ADD CONSTRAINT skills_taxonomy_onet_soc_code_key UNIQUE (onet_soc_code);

-- Drop the legacy tables and their constraints (Warning: Irreversible data deletion)
DROP TABLE IF EXISTS user_skills CASCADE;
DROP TABLE IF EXISTS skill_endorsements CASCADE;

-- Create the new, strict linking table
-- This enforces that a student can only claim a skill that explicitly exists in the O*NET Taxonomy
CREATE TABLE student_taxonomy_skills (
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    onet_soc_code VARCHAR(255) REFERENCES skills_taxonomy(onet_soc_code) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 50 CHECK (proficiency_level >= 0 AND proficiency_level <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (student_id, onet_soc_code)
);

-- Enable Row Level Security (RLS)
ALTER TABLE student_taxonomy_skills ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Public can view any student's skills"
    ON student_taxonomy_skills FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own skills"
    ON student_taxonomy_skills FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own skills"
    ON student_taxonomy_skills FOR UPDATE
    USING (auth.uid() = student_id);

CREATE POLICY "Users can delete their own skills"
    ON student_taxonomy_skills FOR DELETE
    USING (auth.uid() = student_id);
