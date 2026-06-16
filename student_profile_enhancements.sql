-- Add clubs selection to students (as JSONB for flexibility)
ALTER TABLE students ADD COLUMN IF NOT EXISTS clubs JSONB DEFAULT '[]';

-- Add anti-spam cooldown to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_feedback_at TIMESTAMPTZ;

-- Add status tracking and internal notes to anonymous feedback
ALTER TABLE anonymous_feedback ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
ALTER TABLE anonymous_feedback ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_feedback_status ON anonymous_feedback(status);
