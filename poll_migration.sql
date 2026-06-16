-- =============================================
-- Faculty Poll System - Supabase SQL Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_department TEXT NOT NULL DEFAULT 'ALL',
    target_year TEXT NOT NULL DEFAULT 'ALL',
    created_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    ends_at TIMESTAMPTZ,
    decision_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Poll options table
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

-- 3. Poll votes table (one vote per student per poll enforced by UNIQUE)
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, student_id)
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_student_id ON poll_votes(student_id);

-- 5. RLS Policies (if RLS is enabled on your project)
-- Allow anyone authenticated to read polls
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Using service role key (from your backend), RLS is bypassed automatically.
-- If you use anon key anywhere, add policies here. 
-- Since your app uses supabaseAdmin (service key), no additional policies needed.
-- But add these as a safety net:

CREATE POLICY "Allow service role full access to polls" ON polls
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to poll_options" ON poll_options
    USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to poll_votes" ON poll_votes
    USING (true) WITH CHECK (true);
