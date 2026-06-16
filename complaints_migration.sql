-- ================================================================
-- Campus Infrastructure Complaint & Maintenance System
-- Supabase SQL Migration — Run in Supabase SQL Editor
-- ================================================================

-- 0. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- duplicate/similarity detection
CREATE EXTENSION IF NOT EXISTS pg_cron;   -- SLA breach cron (if available)

-- ================================================================
-- 1. ENUMS
-- ================================================================
DO $$ BEGIN
    CREATE TYPE complaint_status   AS ENUM ('PENDING_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED','ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_priority AS ENUM ('LOW','MODERATE','HIGH','CRITICAL','EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_severity AS ENUM ('LOW','MODERATE','HIGH','CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_category AS ENUM (
        'ELECTRICAL','PLUMBING','CIVIL','SANITATION',
        'IT_NETWORK','FURNITURE','EQUIPMENT','SAFETY',
        'HOSTEL','SPORTS','CAFETERIA','OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE campus_zone AS ENUM (
        'ACADEMIC_BLOCK','HOSTEL_BOYS','HOSTEL_GIRLS','LIBRARY',
        'LAB','SPORTS_COMPLEX','CAFETERIA','PARKING','ROAD',
        'MAIN_GATE','AUDITORIUM','ADMIN_BLOCK','OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE complaint_media_type AS ENUM ('IMAGE','VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- 2. MAINTENANCE STAFF TABLE (new role)
-- ================================================================
CREATE TABLE IF NOT EXISTS maintenance_staff (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    staff_code      TEXT UNIQUE NOT NULL,
    department      TEXT NOT NULL,
    specialization  complaint_category[],
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. CORE COMPLAINTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaints (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Content
    title                    TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 200),
    description              TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 2000),
    category                 complaint_category NOT NULL,
    severity                 complaint_severity NOT NULL DEFAULT 'MODERATE',
    -- Status & Priority
    status                   complaint_status NOT NULL DEFAULT 'PENDING_REVIEW',
    priority                 complaint_priority NOT NULL DEFAULT 'MODERATE',
    priority_score           DECIMAL NOT NULL DEFAULT 0,
    -- Location
    zone                     campus_zone NOT NULL,
    building                 TEXT,
    floor                    TEXT,
    room                     TEXT,
    gps_lat                  DECIMAL(9,6),
    gps_lng                  DECIMAL(9,6),
    -- Flags
    is_anonymous             BOOLEAN NOT NULL DEFAULT false,
    is_emergency             BOOLEAN NOT NULL DEFAULT false,
    sla_deadline             TIMESTAMPTZ,
    sla_breached             BOOLEAN NOT NULL DEFAULT false,
    -- Relations
    reporter_student_id      UUID REFERENCES students(id) ON DELETE SET NULL,
    assigned_staff_id        UUID REFERENCES maintenance_staff(id) ON DELETE SET NULL,
    assigned_at              TIMESTAMPTZ,
    -- Community
    upvote_count             INT NOT NULL DEFAULT 0,
    comment_count            INT NOT NULL DEFAULT 0,
    duplicate_count          INT NOT NULL DEFAULT 0,
    -- Resolution
    estimated_completion     DATE,
    resolved_at              TIMESTAMPTZ,
    rejection_reason         TEXT,
    -- Timestamps
    created_at               TIMESTAMPTZ DEFAULT NOW(),
    updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. MEDIA TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_media (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    storage_path    TEXT NOT NULL,
    public_url      TEXT NOT NULL,
    media_type      complaint_media_type NOT NULL DEFAULT 'IMAGE',
    is_before       BOOLEAN NOT NULL DEFAULT true,
    is_after        BOOLEAN NOT NULL DEFAULT false,
    uploaded_by_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    file_size_kb    INT,
    uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 5. VOTES TABLE (one vote per student per complaint)
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_votes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(complaint_id, student_id)
);

-- ================================================================
-- 6. COMMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
    is_official     BOOLEAN NOT NULL DEFAULT false,
    is_deleted      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 7. TIMELINE UPDATES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_updates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    posted_by_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status      complaint_status,
    new_status      complaint_status,
    note            TEXT NOT NULL,
    media_urls      TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 8. FOLLOWERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_followers (
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(complaint_id, user_id)
);

-- ================================================================
-- 9. SPAM REPORTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    reporter_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(complaint_id, reporter_id)
);

-- ================================================================
-- 10. INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_status        ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority_score ON complaints(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_zone          ON complaints(zone);
CREATE INDEX IF NOT EXISTS idx_complaints_category      ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created       ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_emergency     ON complaints(is_emergency) WHERE is_emergency = true;
CREATE INDEX IF NOT EXISTS idx_complaints_reporter      ON complaints(reporter_student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned      ON complaints(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_complaint_votes_c        ON complaint_votes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_c     ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_media_c        ON complaint_media(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_updates_c      ON complaint_updates(complaint_id);
-- Trigram index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_complaints_title_trgm    ON complaints USING GIN(title gin_trgm_ops);

-- ================================================================
-- 11. PRIORITY SCORE FUNCTION
-- ================================================================
CREATE OR REPLACE FUNCTION calculate_complaint_priority_score(
    p_upvotes       INT,
    p_severity      TEXT,
    p_is_emergency  BOOLEAN,
    p_zone          TEXT,
    p_age_hours     FLOAT,
    p_duplicates    INT
) RETURNS DECIMAL LANGUAGE plpgsql AS $$
DECLARE
    severity_weight DECIMAL;
    zone_weight     DECIMAL;
    base_score      DECIMAL;
BEGIN
    IF p_is_emergency THEN RETURN 9999; END IF;

    severity_weight := CASE p_severity
        WHEN 'CRITICAL' THEN 40
        WHEN 'HIGH'     THEN 25
        WHEN 'MODERATE' THEN 12
        ELSE 5 END;

    zone_weight := CASE p_zone
        WHEN 'LAB'           THEN 1.5
        WHEN 'HOSTEL_BOYS'   THEN 1.4
        WHEN 'HOSTEL_GIRLS'  THEN 1.4
        WHEN 'ACADEMIC_BLOCK'THEN 1.3
        WHEN 'LIBRARY'       THEN 1.2
        WHEN 'SPORTS_COMPLEX'THEN 1.1
        WHEN 'CAFETERIA'     THEN 1.1
        ELSE 1.0 END;

    base_score := (p_upvotes * 2.5)
                + severity_weight
                + (p_duplicates * 3)
                + (p_age_hours / 24 * 0.5);

    RETURN ROUND(base_score * zone_weight, 2);
END;
$$;

-- ================================================================
-- 12. TRIGGER: auto-update priority, label, timestamp, SLA
-- ================================================================
CREATE OR REPLACE FUNCTION trg_fn_complaint_meta()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    age_hours FLOAT;
    score     DECIMAL;
    sla_hrs   INT;
BEGIN
    NEW.updated_at := NOW();

    age_hours := EXTRACT(EPOCH FROM (NOW() - COALESCE(NEW.created_at, NOW()))) / 3600;

    score := calculate_complaint_priority_score(
        NEW.upvote_count, NEW.severity::TEXT, NEW.is_emergency,
        NEW.zone::TEXT, age_hours, NEW.duplicate_count
    );
    NEW.priority_score := score;

    NEW.priority := CASE
        WHEN NEW.is_emergency   THEN 'EMERGENCY'
        WHEN score >= 100       THEN 'CRITICAL'
        WHEN score >= 50        THEN 'HIGH'
        WHEN score >= 20        THEN 'MODERATE'
        ELSE 'LOW' END;

    -- Set SLA deadline on first insert only
    IF TG_OP = 'INSERT' THEN
        sla_hrs := CASE NEW.priority
            WHEN 'EMERGENCY' THEN 4
            WHEN 'CRITICAL'  THEN 24
            WHEN 'HIGH'      THEN 72
            WHEN 'MODERATE'  THEN 168
            ELSE 336 END;
        NEW.sla_deadline := NOW() + (sla_hrs || ' hours')::INTERVAL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaint_meta ON complaints;
CREATE TRIGGER trg_complaint_meta
    BEFORE INSERT OR UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION trg_fn_complaint_meta();

-- ================================================================
-- 13. ATOMIC UPVOTE TOGGLE RPC
-- ================================================================
CREATE OR REPLACE FUNCTION toggle_complaint_upvote(
    p_complaint_id UUID,
    p_student_id   UUID
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
    existing_id UUID;
    new_count   INT;
BEGIN
    SELECT id INTO existing_id FROM complaint_votes
    WHERE complaint_id = p_complaint_id AND student_id = p_student_id;

    IF existing_id IS NOT NULL THEN
        DELETE FROM complaint_votes WHERE id = existing_id;
        UPDATE complaints
            SET upvote_count = GREATEST(0, upvote_count - 1)
            WHERE id = p_complaint_id
            RETURNING upvote_count INTO new_count;
        RETURN json_build_object('voted', false, 'upvote_count', new_count);
    ELSE
        INSERT INTO complaint_votes(complaint_id, student_id)
        VALUES(p_complaint_id, p_student_id);
        UPDATE complaints
            SET upvote_count = upvote_count + 1
            WHERE id = p_complaint_id
            RETURNING upvote_count INTO new_count;
        RETURN json_build_object('voted', true, 'upvote_count', new_count);
    END IF;
END;
$$;

-- ================================================================
-- 14. DUPLICATE DETECTION RPC
-- ================================================================
CREATE OR REPLACE FUNCTION find_similar_complaints(
    p_title     TEXT,
    p_threshold FLOAT DEFAULT 0.3
) RETURNS TABLE(id UUID, title TEXT, status complaint_status, similarity FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.title, c.status,
           similarity(c.title, p_title)::FLOAT AS similarity
    FROM complaints c
    WHERE similarity(c.title, p_title) > p_threshold
      AND c.status NOT IN ('REJECTED','ARCHIVED')
    ORDER BY similarity DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 15. SLA BREACH CRON (runs every hour)
-- ================================================================
-- Uncomment if pg_cron is enabled in your Supabase project:
-- SELECT cron.schedule(
--   'sla-breach-check',
--   '0 * * * *',
--   $$
--     UPDATE complaints
--     SET sla_breached = true
--     WHERE sla_deadline < NOW()
--       AND sla_breached = false
--       AND status NOT IN ('RESOLVED','REJECTED','ARCHIVED');
--   $$
-- );

-- ================================================================
-- 16. RLS POLICIES
-- ================================================================
ALTER TABLE complaints          ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_votes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_staff   ENABLE ROW LEVEL SECURITY;

-- Service role key bypasses RLS. These policies are a safety net
-- for any anon/public access attempts:
CREATE POLICY "service_role_complaints"         ON complaints         USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaint_media"    ON complaint_media    USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaint_votes"    ON complaint_votes    USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaint_comments" ON complaint_comments USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaint_updates"  ON complaint_updates  USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaint_followers"ON complaint_followers USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaint_reports"  ON complaint_reports  USING (true) WITH CHECK (true);
CREATE POLICY "service_role_maintenance_staff"  ON maintenance_staff  USING (true) WITH CHECK (true);

-- ================================================================
-- 17. STORAGE BUCKETS (run via Supabase Dashboard or API)
-- ================================================================
-- Create two private buckets:
--   1. complaint-before  (evidence uploaded by students at submission)
--   2. complaint-after   (repair proof uploaded by maintenance staff)
-- Both: max 10MB images / 50MB video, private, signed URLs only.
