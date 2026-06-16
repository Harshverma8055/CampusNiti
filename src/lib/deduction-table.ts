/**
 * Automatic Point Deduction Table
 * ================================
 * Maps (incidentType, severity) combinations to point deductions.
 * Based on real-world college disciplinary standards.
 * 
 * All deductions are negative. Minimum deduction on ANY inquiry: 20 points.
 */

export interface DeductionRule {
    category: string;         // Incident type/category
    severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    points: number;           // Points to deduct (positive number — will be negated)
    rationale: string;        // Why this deduction level
    ratingCategory: 'DISCIPLINE' | 'BEHAVIOR' | 'OTHER';
}

/** Minimum points deducted for ANY inquiry regardless of category */
export const MIN_INQUIRY_DEDUCTION = 20;

/**
 * Master deduction table ordered from most severe to least.
 * Points represent the DEDUCTION amount (positive integer).
 * The system will apply -points to the student rating.
 */
export const DEDUCTION_TABLE: DeductionRule[] = [
    // ─── CRITICAL (45–50 points) ─────────────────────────────────────
    {
        category: 'RAGGING',
        severity: 'CRITICAL',
        points: 50,
        rationale: 'Ragging is a criminal offense, zero tolerance policy',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'SEXUAL_HARASSMENT',
        severity: 'CRITICAL',
        points: 50,
        rationale: 'Sexual misconduct: zero tolerance, potential expulsion',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'VIOLENCE',
        severity: 'CRITICAL',
        points: 45,
        rationale: 'Physical violence endangers campus safety',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'SUBSTANCE_ABUSE',
        severity: 'CRITICAL',
        points: 40,
        rationale: 'Drugs/alcohol on campus violates AICTE norms',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'EXAM_MALPRACTICE',
        severity: 'CRITICAL',
        points: 35,
        rationale: 'Serious academic integrity violation',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'THEFT',
        severity: 'CRITICAL',
        points: 35,
        rationale: 'Theft undermines campus trust and safety',
        ratingCategory: 'BEHAVIOR',
    },

    // ─── HIGH (25–30 points) ──────────────────────────────────────────
    {
        category: 'UNAUTHORIZED_ABSENCE',
        severity: 'HIGH',
        points: 30,
        rationale: 'Prolonged unauthorized absence (10+ days) is a serious breach',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'INSUBORDINATION',
        severity: 'HIGH',
        points: 28,
        rationale: 'Open defiance/disrespect towards faculty or staff',
        ratingCategory: 'BEHAVIOR',
    },
    {
        category: 'PLAGIARISM',
        severity: 'HIGH',
        points: 25,
        rationale: 'Academic dishonesty undermines academic integrity',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'HOSTEL_VIOLATION',
        severity: 'HIGH',
        points: 25,
        rationale: 'Unauthorised overnight absence from hostel',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'UNAUTHORIZED_SYSTEM_ACCESS',
        severity: 'HIGH',
        points: 25,
        rationale: 'Unauthorized use of college servers/labs',
        ratingCategory: 'DISCIPLINE',
    },

    // ─── MODERATE (20–22 points) ──────────────────────────────────────
    {
        category: 'MISCONDUCT',
        severity: 'MODERATE',
        points: 22,
        rationale: 'Causing public nuisance / disturbing academic environment',
        ratingCategory: 'BEHAVIOR',
    },
    {
        category: 'DRESS_CODE_VIOLATION',
        severity: 'MODERATE',
        points: 20,
        rationale: 'Repeated uniform violation after formal warning',
        ratingCategory: 'BEHAVIOR',
    },
    {
        category: 'CURFEW_VIOLATION',
        severity: 'MODERATE',
        points: 20,
        rationale: 'Outside hostel after prescribed curfew hours',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'UNAUTHORIZED_GATHERING',
        severity: 'MODERATE',
        points: 20,
        rationale: 'Organizing or participating in unauthorized assemblies',
        ratingCategory: 'DISCIPLINE',
    },
    {
        category: 'ATTENDANCE_DEFICIT',
        severity: 'MODERATE',
        points: 20,
        rationale: 'Below 75% attendance threshold — mandatory deduction',
        ratingCategory: 'DISCIPLINE',
    },

    // ─── LOW (10–15 points — but min 20 enforced) ─────────────────────
    {
        category: 'PARKING_VIOLATION',
        severity: 'LOW',
        points: 15,
        rationale: 'Vehicles in restricted campus zones',
        ratingCategory: 'BEHAVIOR',
    },
    {
        category: 'VANDALISM',
        severity: 'LOW',
        points: 15,
        rationale: 'Minor vandalism or littering on campus',
        ratingCategory: 'BEHAVIOR',
    },
    {
        category: 'MOBILE_PHONE_MISUSE',
        severity: 'LOW',
        points: 15,
        rationale: 'Mobile use during exams or restricted class time',
        ratingCategory: 'BEHAVIOR',
    },
    {
        category: 'FIRST_ABSENCE_WARNING',
        severity: 'LOW',
        points: 10,
        rationale: 'First formal notice of attendance issue',
        ratingCategory: 'DISCIPLINE',
    },
];

/**
 * Look up points to deduct for a given incident category and severity.
 * Always returns at least MIN_INQUIRY_DEDUCTION (20).
 */
export function getDeductionPoints(
    typeOrCategory: string,
    severity: string
): { points: number; rule: DeductionRule | null } {
    // Normalize lookup
    const normCategory = typeOrCategory.toUpperCase().replace(/[\s-]/g, '_');
    const normSeverity = severity.toUpperCase() as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

    // Exact match first
    const exactMatch = DEDUCTION_TABLE.find(
        r => r.category === normCategory && r.severity === normSeverity
    );
    if (exactMatch) {
        return { points: Math.max(exactMatch.points, MIN_INQUIRY_DEDUCTION), rule: exactMatch };
    }

    // Match by severity only (use midpoint of that severity band)
    const severityDefaults: Record<string, number> = {
        CRITICAL: 40,
        HIGH: 26,
        MODERATE: 21,
        LOW: 20,
    };

    const defaultPoints = severityDefaults[normSeverity] ?? MIN_INQUIRY_DEDUCTION;
    return { points: Math.max(defaultPoints, MIN_INQUIRY_DEDUCTION), rule: null };
}

/**
 * Human-readable label for a deduction category code.
 */
export const CATEGORY_LABELS: Record<string, string> = {
    RAGGING: 'Ragging / Bullying',
    SEXUAL_HARASSMENT: 'Sexual Harassment',
    VIOLENCE: 'Violence / Fighting',
    SUBSTANCE_ABUSE: 'Substance Abuse (Drugs/Alcohol)',
    EXAM_MALPRACTICE: 'Exam Malpractice / Cheating',
    THEFT: 'Theft / Property Damage',
    UNAUTHORIZED_ABSENCE: 'Unauthorized Absence (10+ days)',
    INSUBORDINATION: 'Insubordination to Authority',
    PLAGIARISM: 'Academic Dishonesty (Plagiarism)',
    HOSTEL_VIOLATION: 'Hostel Rule Violation (Major)',
    UNAUTHORIZED_SYSTEM_ACCESS: 'Unauthorized Lab/Server Access',
    MISCONDUCT: 'Misconduct / Public Nuisance',
    DRESS_CODE_VIOLATION: 'Dress Code Violation (Repeated)',
    CURFEW_VIOLATION: 'Late Night / Curfew Violation',
    UNAUTHORIZED_GATHERING: 'Unauthorized Gathering / Assembly',
    ATTENDANCE_DEFICIT: 'Attendance Below 75% Threshold',
    PARKING_VIOLATION: 'Parking / Vehicle Violation',
    VANDALISM: 'Littering / Minor Vandalism',
    MOBILE_PHONE_MISUSE: 'Mobile Phone Misuse',
    FIRST_ABSENCE_WARNING: 'First Absence Warning',
    INQUIRY: 'General Inquiry / Misconduct',
    FINE: 'Monetary Fine Imposed',
};
