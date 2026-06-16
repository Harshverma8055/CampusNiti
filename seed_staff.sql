-- Run this in Supabase SQL Editor to insert the staff accounts
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MAINTENANCE';


DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'r.sharma.elec@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Rajesh Kumar Sharma', 'r.sharma.elec@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'EL001', 'ELECTRICAL_MAINT', 'ELECTRICAL_MAINT', ARRAY['ELECTRICAL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'p.nair.elec@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Priya Nair', 'p.nair.elec@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'EL002', 'ELECTRICAL_MAINT', 'ELECTRICAL_MAINT', ARRAY['ELECTRICAL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.rawat.civil@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Suresh Singh Rawat', 's.rawat.civil@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'CV001', 'CIVIL_WORKS', 'CIVIL_WORKS', ARRAY['CIVIL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'a.mehta.civil@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Anita Mehta', 'a.mehta.civil@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'CV002', 'CIVIL_WORKS', 'CIVIL_WORKS', ARRAY['CIVIL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.gupta.plumb@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Mohan Lal Gupta', 'm.gupta.plumb@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'PL001', 'PLUMBING_SANITATION', 'PLUMBING_SANITATION', ARRAY['PLUMBING','SANITATION']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'k.yadav.plumb@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Kavita Yadav', 'k.yadav.plumb@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'PL002', 'PLUMBING_SANITATION', 'PLUMBING_SANITATION', ARRAY['PLUMBING','SANITATION']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'v.bhatia.net@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Vikram Bhatia', 'v.bhatia.net@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'NT001', 'NETWORK_IT', 'NETWORK_IT', ARRAY['IT_NETWORK']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.kapoor.net@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Sunita Kapoor', 's.kapoor.net@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'NT002', 'NETWORK_IT', 'NETWORK_IT', ARRAY['IT_NETWORK']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'd.verma.it@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Deepak Verma', 'd.verma.it@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'IT001', 'IT_CELL', 'IT_CELL', ARRAY['IT_NETWORK','OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'p.agarwal.it@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Pooja Agarwal', 'p.agarwal.it@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'IT002', 'IT_CELL', 'IT_CELL', ARRAY['IT_NETWORK','OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'r.mishra.at@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Rajan Mishra', 'r.mishra.at@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'AT001', 'ACADEMIC_TECH', 'ACADEMIC_TECH', ARRAY['EQUIPMENT','FURNITURE']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'n.saxena.at@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Neha Saxena', 'n.saxena.at@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'AT002', 'ACADEMIC_TECH', 'ACADEMIC_TECH', ARRAY['EQUIPMENT','FURNITURE']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'a.joshi.av@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Amar Joshi', 'a.joshi.av@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'AV001', 'AV_SUPPORT', 'AV_SUPPORT', ARRAY['EQUIPMENT']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'r.pandey.av@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Rekha Pandey', 'r.pandey.av@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'AV002', 'AV_SUPPORT', 'AV_SUPPORT', ARRAY['EQUIPMENT']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'h.chaudhary.lab@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Hemant Chaudhary', 'h.chaudhary.lab@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'LB001', 'LAB_MAINT', 'LAB_MAINT', ARRAY['EQUIPMENT','SAFETY']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'u.trivedi.lab@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Usha Trivedi', 'u.trivedi.lab@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'LB002', 'LAB_MAINT', 'LAB_MAINT', ARRAY['EQUIPMENT','SAFETY']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'b.singh.hostel@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Balvinder Singh', 'b.singh.hostel@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'HM001', 'HOSTEL_MAINT', 'HOSTEL_MAINT', ARRAY['HOSTEL','ELECTRICAL','PLUMBING']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.devi.hostel@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Meena Devi', 'm.devi.hostel@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'HM002', 'HOSTEL_MAINT', 'HOSTEL_MAINT', ARRAY['HOSTEL','ELECTRICAL','PLUMBING']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'r.prasad.mess@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Ramesh Prasad', 'r.prasad.mess@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'MS001', 'MESS_MGMT', 'MESS_MGMT', ARRAY['CAFETERIA']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.kumari.mess@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Savita Kumari', 's.kumari.mess@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'MS002', 'MESS_MGMT', 'MESS_MGMT', ARRAY['CAFETERIA']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'g.dhaliwal.sec@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Gurpreet Singh Dhaliwal', 'g.dhaliwal.sec@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'SC001', 'CAMPUS_SECURITY', 'CAMPUS_SECURITY', ARRAY['SAFETY']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'j.kaur.sec@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Jaswinder Kaur', 'j.kaur.sec@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'SC002', 'CAMPUS_SECURITY', 'CAMPUS_SECURITY', ARRAY['SAFETY']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.tiwari.res@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Dr. Sanjay Tiwari', 's.tiwari.res@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'RI001', 'RESEARCH_INFRA', 'RESEARCH_INFRA', ARRAY['EQUIPMENT']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'n.roy.res@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Nandita Roy', 'n.roy.res@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'RI002', 'RESEARCH_INFRA', 'RESEARCH_INFRA', ARRAY['EQUIPMENT']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'a.sandhu.sports@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Amarjit Sandhu', 'a.sandhu.sports@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'SP001', 'SPORTS_FACILITY', 'SPORTS_FACILITY', ARRAY['SPORTS','CIVIL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'p.desai.sports@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Priyanka Desai', 'p.desai.sports@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'SP002', 'SPORTS_FACILITY', 'SPORTS_FACILITY', ARRAY['SPORTS','CIVIL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'j.verma.hort@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Jagdish Prasad Verma', 'j.verma.hort@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'HR001', 'HORTICULTURE', 'HORTICULTURE', ARRAY['OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'p.lata.hort@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Pushpa Lata', 'p.lata.hort@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'HR002', 'HORTICULTURE', 'HORTICULTURE', ARRAY['OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.pal.trans@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Sukhwinder Pal', 's.pal.trans@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'TP001', 'TRANSPORT_PARKING', 'TRANSPORT_PARKING', ARRAY['CIVIL','OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'h.grewal.trans@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Harpreet Grewal', 'h.grewal.trans@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'TP002', 'TRANSPORT_PARKING', 'TRANSPORT_PARKING', ARRAY['CIVIL','OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'r.dubey.estate@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Ramchandra Dubey', 'r.dubey.estate@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'EO001', 'ESTATE_OFFICE', 'ESTATE_OFFICE', ARRAY['FURNITURE','OTHER','CIVIL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.srivastava.estate@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Sarla Srivastava', 's.srivastava.estate@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'EO002', 'ESTATE_OFFICE', 'ESTATE_OFFICE', ARRAY['FURNITURE','OTHER','CIVIL']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'v.sharma.welfare@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Prof. Vijay Sharma', 'v.sharma.welfare@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'SW001', 'STUDENT_WELFARE', 'STUDENT_WELFARE', ARRAY['OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'g.bhatt.welfare@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Geeta Bhatt', 'g.bhatt.welfare@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'SW002', 'STUDENT_WELFARE', 'STUDENT_WELFARE', ARRAY['OTHER']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'a.bansal.health@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Dr. Alok Bansal', 'a.bansal.health@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'HC001', 'HEALTH_CENTRE', 'HEALTH_CENTRE', ARRAY['EQUIPMENT','SAFETY']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 's.arora.health@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Nurse Shivani Arora', 's.arora.health@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'HC002', 'HEALTH_CENTRE', 'HEALTH_CENTRE', ARRAY['EQUIPMENT','SAFETY']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'm.goyal.lib@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Mahesh Chand Goyal', 'm.goyal.lib@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'LT001', 'LIBRARY_TECH', 'LIBRARY_TECH', ARRAY['IT_NETWORK','EQUIPMENT']::complaint_category[], true);
    END IF;
END $$;

DO $$
DECLARE
    new_user_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'v.patel.lib@nitj.ac.in') THEN
        INSERT INTO users (name, email, password, role)
        VALUES ('Varsha Patel', 'v.patel.lib@nitj.ac.in', '$2b$10$j/hgfeRdNt.3C1pHfsuf9OwyEtxUZGUaZcCk/wBbaGsrmd1i.oE2u', 'MAINTENANCE')
        RETURNING id INTO new_user_id;

        INSERT INTO maintenance_staff (user_id, staff_code, department, department_code, specialization, is_active)
        VALUES (new_user_id, 'LT002', 'LIBRARY_TECH', 'LIBRARY_TECH', ARRAY['IT_NETWORK','EQUIPMENT']::complaint_category[], true);
    END IF;
END $$;
