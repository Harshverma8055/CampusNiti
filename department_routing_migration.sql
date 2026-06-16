-- ================================================================
-- CampusNiti — Department Routing System Migration
-- NIT Jalandhar Campus Infrastructure System
-- Run in Supabase SQL Editor AFTER complaints_migration.sql
-- ================================================================

-- ================================================================
-- 1. DEPARTMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    short_name  TEXT NOT NULL,
    description TEXT,
    email       TEXT,
    phone       TEXT,
    color       TEXT DEFAULT '#6366f1',
    sla_hours   INT NOT NULL DEFAULT 72,
    head_title  TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_departments" ON departments USING (true) WITH CHECK (true);

-- ================================================================
-- 2. ADD DEPARTMENT COLUMN TO COMPLAINTS & MAINTENANCE_STAFF
-- ================================================================
ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS assigned_department_code TEXT,
    ADD COLUMN IF NOT EXISTS routing_confidence        TEXT DEFAULT 'HIGH',
    ADD COLUMN IF NOT EXISTS routing_reason            TEXT;

ALTER TABLE maintenance_staff
    ADD COLUMN IF NOT EXISTS department_code TEXT;

-- ================================================================
-- 3. SEED DEPARTMENTS
-- ================================================================
INSERT INTO departments (code, name, short_name, description, email, phone, color, sla_hours, head_title)
VALUES
    ('ELECTRICAL_MAINT',   'Electrical Maintenance Department',    'Electrical',     'Manages all electrical systems, lighting, power supply across campus.',         'electrical.maint@nitj.ac.in', 'Ext. 101', '#f59e0b', 48,  'Chief Electrical Engineer'),
    ('CIVIL_WORKS',        'Civil Works & Maintenance Division',   'Civil Works',    'Structural repairs, road maintenance, construction, and building upkeep.',       'civil.works@nitj.ac.in',      'Ext. 102', '#92400e', 72,  'Executive Engineer (Civil)'),
    ('PLUMBING_SANITATION','Plumbing & Sanitation Department',     'Plumbing',       'Water supply, plumbing, drainage, and sanitation services.',                     'plumbing@nitj.ac.in',         'Ext. 103', '#0ea5e9', 24,  'Sanitation & Plumbing Supervisor'),
    ('NETWORK_IT',         'Network & IT Infrastructure',          'Network IT',     'Campus-wide network, internet, WiFi, and LAN infrastructure.',                   'network@nitj.ac.in',          'Ext. 104', '#6366f1', 12,  'Network Administrator'),
    ('IT_CELL',            'IT Cell & Software Development',       'IT Cell',        'Campus ERP, student portals, and all software-related issues.',                  'itcell@nitj.ac.in',           'Ext. 105', '#7c3aed', 24,  'System Administrator'),
    ('ACADEMIC_TECH',      'Academic Technology Department',       'Academic Tech',  'Smart classrooms, digital boards, audio-visual in lecture halls.',               'acadtech@nitj.ac.in',         'Ext. 106', '#2563eb', 24,  'Academic Technology Coordinator'),
    ('AV_SUPPORT',         'AV & Multimedia Support Team',        'AV Support',     'Projectors, sound systems, multimedia setups.',                                  'avsupport@nitj.ac.in',        'Ext. 107', '#db2777', 24,  'AV Technical Supervisor'),
    ('LAB_MAINT',          'Laboratory Maintenance Services',      'Lab Maint',      'Upkeep and repair of all laboratory equipment.',                                 'labmaint@nitj.ac.in',         'Ext. 108', '#059669', 48,  'Laboratory Superintendent'),
    ('HOSTEL_MAINT',       'Hostel Maintenance Department',        'Hostel',         'Infrastructure maintenance for all hostels.',                                    'hostel.maint@nitj.ac.in',     'Ext. 109', '#10b981', 24,  'Hostel Maintenance Supervisor'),
    ('MESS_MGMT',          'Mess Management & Cafeteria',          'Mess Mgmt',      'Infrastructure and operational issues in mess halls and cafeteria.',             'mess@nitj.ac.in',             'Ext. 110', '#f97316', 12,  'Mess Superintendent'),
    ('CAMPUS_SECURITY',    'Campus Security Department',           'Security',       'CCTV, access control, campus safety and emergency response.',                   'security@nitj.ac.in',         'Ext. 111', '#dc2626', 4,   'Chief Security Officer'),
    ('RESEARCH_INFRA',     'Research Infrastructure Cell',         'Research Infra', 'Specialized equipment for research labs and centres.',                           'research.infra@nitj.ac.in',   'Ext. 112', '#7c3aed', 48,  'Research Infrastructure Coordinator'),
    ('SPORTS_FACILITY',    'Sports Facilities Department',         'Sports',         'Grounds, courts, sports equipment, and facility maintenance.',                   'sports@nitj.ac.in',           'Ext. 113', '#22c55e', 72,  'Sports Officer'),
    ('HORTICULTURE',       'Horticulture & Landscaping',           'Horticulture',   'Campus garden, lawns, trees, landscaping, and outdoor environment.',             'horticulture@nitj.ac.in',     'Ext. 114', '#16a34a', 120, 'Horticulture Supervisor'),
    ('TRANSPORT_PARKING',  'Transport & Parking Management',       'Transport',      'Campus vehicles, parking infrastructure, and transport scheduling.',             'transport@nitj.ac.in',        'Ext. 115', '#64748b', 72,  'Transport Officer'),
    ('ESTATE_OFFICE',      'Estate & General Maintenance Office',  'Estate Office',  'General property upkeep, furniture, fixtures, and miscellaneous maintenance.',   'estate@nitj.ac.in',           'Ext. 116', '#78716c', 168, 'Estate Officer'),
    ('STUDENT_WELFARE',    'Student Welfare Division',             'Student Welfare','Non-infrastructure student concerns and welfare-related complaints.',             'welfare@nitj.ac.in',          'Ext. 117', '#ec4899', 48,  'Dean of Student Welfare'),
    ('HEALTH_CENTRE',      'Health Centre Support',                'Health Centre',  'Infrastructure and equipment issues in the campus health centre.',               'health@nitj.ac.in',           'Ext. 118', '#ef4444', 24,  'Medical Officer'),
    ('LIBRARY_TECH',       'Library Technical Support',            'Library Tech',   'IT systems, RFID, servers, and infrastructure in the central library.',          'library.tech@nitj.ac.in',     'Ext. 119', '#0891b2', 48,  'Library Systems Administrator')
ON CONFLICT (code) DO NOTHING;

-- ================================================================
-- 4. COMPLAINT FEEDBACK TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS complaint_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    submitted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT CHECK (char_length(comment) <= 500),
    response_time_ok BOOLEAN,
    quality_ok      BOOLEAN,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(complaint_id, submitted_by_id)
);

ALTER TABLE complaint_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_complaint_feedback" ON complaint_feedback USING (true) WITH CHECK (true);

-- ================================================================
-- 5. INDEXES FOR NEW COLUMNS
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(assigned_department_code);
CREATE INDEX IF NOT EXISTS idx_maintenance_staff_dept_code ON maintenance_staff(department_code);

-- ================================================================
-- 6. DUMMY MAINTENANCE STAFF DATA SETUP
-- (Run the seed-departments.ts script separately for full seeding)
-- This is just the structure comment:
-- Each department gets 2 staff members.
-- Total: 38 dummy staff accounts created via seed script.
-- ================================================================

-- ================================================================
-- 7. DEPARTMENT PERFORMANCE VIEW
-- ================================================================
CREATE OR REPLACE VIEW department_performance AS
SELECT
    d.code                                          AS department_code,
    d.name                                          AS department_name,
    d.color,
    d.sla_hours,
    COUNT(c.id)                                     AS total_complaints,
    COUNT(c.id) FILTER (WHERE c.status = 'RESOLVED') AS resolved_count,
    COUNT(c.id) FILTER (WHERE c.status IN ('PENDING_REVIEW','APPROVED','ASSIGNED','IN_PROGRESS')) AS active_count,
    COUNT(c.id) FILTER (WHERE c.sla_breached = true) AS sla_breached_count,
    ROUND(
        AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at)) / 3600) FILTER (WHERE c.resolved_at IS NOT NULL),
        1
    )                                               AS avg_resolution_hours,
    ROUND(
        COUNT(c.id) FILTER (WHERE c.status = 'RESOLVED') * 100.0
        / NULLIF(COUNT(c.id), 0),
        1
    )                                               AS resolution_rate_pct
FROM departments d
LEFT JOIN complaints c ON c.assigned_department_code = d.code
GROUP BY d.code, d.name, d.color, d.sla_hours
ORDER BY total_complaints DESC;
