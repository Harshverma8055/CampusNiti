-- 1. Push subscriptions storage for Web Push Notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, endpoint)
);

-- 2. Add target_audience to polls ('STUDENT' or 'FACULTY')
ALTER TABLE polls ADD COLUMN IF NOT EXISTS target_audience TEXT NOT NULL DEFAULT 'STUDENT';

-- 3. Faculty votes table (for polls targeting faculty)
CREATE TABLE IF NOT EXISTS poll_faculty_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, faculty_id)
);
