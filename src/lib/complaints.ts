/**
 * Campus Infrastructure Complaint & Maintenance System
 * Shared helpers, types, and the priority algorithm.
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type ComplaintStatus =
    | 'PENDING_REVIEW' | 'APPROVED' | 'ASSIGNED'
    | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'ARCHIVED';

export type ComplaintPriority = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
export type ComplaintSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type ComplaintCategory =
    | 'ELECTRICAL' | 'PLUMBING' | 'CIVIL' | 'SANITATION'
    | 'IT_NETWORK' | 'FURNITURE' | 'EQUIPMENT' | 'SAFETY'
    | 'HOSTEL' | 'SPORTS' | 'CAFETERIA' | 'OTHER';

export type CampusZone =
    | 'ACADEMIC_BLOCK' | 'HOSTEL_BOYS' | 'HOSTEL_GIRLS' | 'LIBRARY'
    | 'LAB' | 'SPORTS_COMPLEX' | 'CAFETERIA' | 'PARKING' | 'ROAD'
    | 'MAIN_GATE' | 'AUDITORIUM' | 'ADMIN_BLOCK' | 'OTHER';

// ─── HUMAN-READABLE LABELS ────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
    ELECTRICAL:  'Electrical / Lighting',
    PLUMBING:    'Plumbing / Water',
    CIVIL:       'Civil / Construction',
    SANITATION:  'Sanitation / Cleanliness',
    IT_NETWORK:  'IT / Network / WiFi',
    FURNITURE:   'Furniture / Fixtures',
    EQUIPMENT:   'Lab / Sports Equipment',
    SAFETY:      'Safety Hazard',
    HOSTEL:      'Hostel Facility',
    SPORTS:      'Sports Facility',
    CAFETERIA:   'Cafeteria / Mess',
    OTHER:       'Other',
};

export const ZONE_LABELS: Record<CampusZone, string> = {
    ACADEMIC_BLOCK: 'Academic Block',
    HOSTEL_BOYS:    "Boys' Hostel",
    HOSTEL_GIRLS:   "Girls' Hostel",
    LIBRARY:        'Central Library',
    LAB:            'Laboratories',
    SPORTS_COMPLEX: 'Sports Complex',
    CAFETERIA:      'Cafeteria / Mess',
    PARKING:        'Parking Area',
    ROAD:           'Campus Roads',
    MAIN_GATE:      'Main Gate / Entry',
    AUDITORIUM:     'Auditorium',
    ADMIN_BLOCK:    'Admin Block',
    OTHER:          'Other Area',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
    PENDING_REVIEW: 'Pending Review',
    APPROVED:       'Approved',
    ASSIGNED:       'Assigned to Staff',
    IN_PROGRESS:    'Work In Progress',
    RESOLVED:       'Resolved',
    REJECTED:       'Rejected',
    ARCHIVED:       'Archived',
};

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
    LOW:       'Low Priority',
    MODERATE:  'Moderate',
    HIGH:      'High Priority',
    CRITICAL:  'Critical',
    EMERGENCY: '🚨 EMERGENCY',
};

// ─── PRIORITY ALGORITHM ───────────────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<ComplaintSeverity, number> = {
    CRITICAL: 40,
    HIGH:     25,
    MODERATE: 12,
    LOW:       5,
};

const ZONE_WEIGHT: Record<CampusZone, number> = {
    LAB:            1.5,
    HOSTEL_BOYS:    1.4,
    HOSTEL_GIRLS:   1.4,
    ACADEMIC_BLOCK: 1.3,
    LIBRARY:        1.2,
    SPORTS_COMPLEX: 1.1,
    CAFETERIA:      1.1,
    AUDITORIUM:     1.0,
    ADMIN_BLOCK:    1.0,
    ROAD:           1.0,
    MAIN_GATE:      0.9,
    PARKING:        0.8,
    OTHER:          1.0,
};

/** SLA hours by priority level */
export const SLA_HOURS: Record<ComplaintPriority, number> = {
    EMERGENCY: 4,
    CRITICAL:  24,
    HIGH:      72,
    MODERATE:  168,
    LOW:       336,
};

export interface PriorityInput {
    upvotes:     number;
    severity:    ComplaintSeverity;
    isEmergency: boolean;
    zone:        CampusZone;
    ageHours:    number;
    duplicates:  number;
}

export function calculatePriorityScore(params: PriorityInput): {
    score: number;
    priority: ComplaintPriority;
} {
    if (params.isEmergency) return { score: 9999, priority: 'EMERGENCY' };

    const base =
        params.upvotes * 2.5 +
        (SEVERITY_WEIGHT[params.severity] ?? 12) +
        params.duplicates * 3 +
        (params.ageHours / 24) * 0.5;

    const score = Math.round(base * (ZONE_WEIGHT[params.zone] ?? 1.0) * 100) / 100;

    const priority: ComplaintPriority =
        score >= 100 ? 'CRITICAL' :
        score >= 50  ? 'HIGH'     :
        score >= 20  ? 'MODERATE' : 'LOW';

    return { score, priority };
}

export function getSLADeadline(priority: ComplaintPriority, createdAt: Date): Date {
    const hours = SLA_HOURS[priority] ?? 168;
    return new Date(createdAt.getTime() + hours * 3_600_000);
}

export function isSLABreached(slaDeadline: Date | string, status: ComplaintStatus): boolean {
    if (['RESOLVED', 'REJECTED', 'ARCHIVED'].includes(status)) return false;
    return new Date(slaDeadline) < new Date();
}

export function getSLATimeLeft(slaDeadline: Date | string): string {
    const ms = new Date(slaDeadline).getTime() - Date.now();
    if (ms <= 0) return 'BREACHED';
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${h}h ${m}m`;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────

export function getPriorityColor(priority: ComplaintPriority): string {
    return {
        LOW:       '#22c55e',
        MODERATE:  '#f59e0b',
        HIGH:      '#f97316',
        CRITICAL:  '#ef4444',
        EMERGENCY: '#dc2626',
    }[priority] ?? '#6b7280';
}

export function getStatusColor(status: ComplaintStatus): string {
    return {
        PENDING_REVIEW: '#f59e0b',
        APPROVED:       '#3b82f6',
        ASSIGNED:       '#8b5cf6',
        IN_PROGRESS:    '#06b6d4',
        RESOLVED:       '#22c55e',
        REJECTED:       '#ef4444',
        ARCHIVED:       '#6b7280',
    }[status] ?? '#6b7280';
}

export function getCategoryIcon(category: ComplaintCategory): string {
    return {
        ELECTRICAL:  '⚡',
        PLUMBING:    '🚿',
        CIVIL:       '🏗️',
        SANITATION:  '🧹',
        IT_NETWORK:  '📡',
        FURNITURE:   '🪑',
        EQUIPMENT:   '🔧',
        SAFETY:      '⚠️',
        HOSTEL:      '🏠',
        SPORTS:      '⚽',
        CAFETERIA:   '🍽️',
        OTHER:       '📋',
    }[category] ?? '📋';
}

// ─── SHARED INTERFACES ────────────────────────────────────────────────────────

export interface ComplaintListItem {
    id:            string;
    title:         string;
    category:      ComplaintCategory;
    zone:          CampusZone;
    building?:     string | null;
    severity:      ComplaintSeverity;
    priority:      ComplaintPriority;
    priority_score:number;
    status:        ComplaintStatus;
    is_anonymous:  boolean;
    is_emergency:  boolean;
    upvote_count:  number;
    comment_count: number;
    sla_deadline?: string | null;
    sla_breached:  boolean;
    created_at:    string;
    reporter?: { name: string; rollNumber?: string } | null;
    thumbnail?: string | null;  // first before media url
    after_thumbnail?: string | null; // first after media url
    has_voted?: boolean;
    assigned_staff_id?: string | null;
}

export interface ComplaintDetail extends ComplaintListItem {
    description:   string;
    floor?:        string | null;
    room?:         string | null;
    gps_lat?:      number | null;
    gps_lng?:      number | null;
    assigned_staff?: { name: string; department: string } | null;
    assigned_at?:  string | null;
    estimated_completion?: string | null;
    resolved_at?:  string | null;
    rejection_reason?: string | null;
    duplicate_count: number;
    media:         ComplaintMedia[];
    comments:      ComplaintComment[];
    updates:       ComplaintUpdate[];
    is_followed?:  boolean;
}

export interface ComplaintMedia {
    id:         string;
    public_url: string;
    media_type: 'IMAGE' | 'VIDEO';
    is_before:  boolean;
    is_after:   boolean;
    uploaded_at:string;
}

export interface ComplaintComment {
    id:         string;
    content:    string;
    is_official:boolean;
    is_deleted: boolean;
    created_at: string;
    author: { name: string; role: string };
}

export interface ComplaintUpdate {
    id:         string;
    note:       string;
    old_status: ComplaintStatus | null;
    new_status: ComplaintStatus | null;
    media_urls: string[];
    created_at: string;
    posted_by:  { name: string; role: string };
}
