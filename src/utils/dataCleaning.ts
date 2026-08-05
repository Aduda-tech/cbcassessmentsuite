
import { StudentRaw, SubjectKey, SUBJECT_LIST } from '../types/cbc';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface ValidationIssue {
  studentSn: number;
  studentName: string;
  field: string;
  value: any;
  issue: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  students: StudentRaw[];
  issues: ValidationIssue[];
  summary: {
    totalInspected: number;
    errors: number;
    warnings: number;
    duplicatesRemoved: number;
    fixedAuto: number;
  };
}

// ──────────────────────────────────────────
// Deduplication (existing, enhanced)
// ──────────────────────────────────────────

/**
 * Normalize a student name for comparison: uppercase, collapse whitespace, strip punctuation.
 */
function normalizeName(name: string): string {
  return (name || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')      // collapse multiple spaces
    .replace(/[''"".,-]/g, '')  // strip punctuation
    .trim();
}

/**
 * Generate a fingerprint from scores for fuzzy comparison.
 * Rounds each score to nearest 5 to catch near-duplicates.
 */
function scoreFingerprint(scores: Record<string, number>): string {
  return Object.entries(scores)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => Math.round(Number(v || 0) / 5) * 5)
    .join(',');
}

export function removeDuplicateStudents(students: StudentRaw[]): { students: StudentRaw[], duplicatesRemoved: number } {
  const seenSNs = new Map<number, StudentRaw>();
  const seenNames = new Map<string, StudentRaw>(); // normalized name+school -> student
  const seenExact = new Map<string, StudentRaw>(); // exact identity match
  const kept: StudentRaw[] = [];
  let duplicatesRemoved = 0;

  for (const student of students) {
    const sn = Number(student.sn) || 0;
    const normName = normalizeName(student.name);
    const school = (student.school || '').toUpperCase().trim();
    const fingerprint = scoreFingerprint(student.scores);
    
    // Key 1: same SN (most common dupe cause)
    if (sn > 0 && seenSNs.has(sn)) {
      duplicatesRemoved++;
      continue;
    }

    // Key 2: same normalized name + same school (name-based dedup)
    const nameKey = `${normName}|${school}`;
    if (seenNames.has(nameKey)) {
      duplicatesRemoved++;
      continue;
    }

    // Key 3: exact identity (name + school + score fingerprint)
    const exactKey = `${normName}|${school}|${fingerprint}`;
    if (seenExact.has(exactKey)) {
      duplicatesRemoved++;
      continue;
    }

    if (sn > 0) seenSNs.set(sn, student);
    seenNames.set(nameKey, student);
    seenExact.set(exactKey, student);
    kept.push(student);
  }

  return { students: kept, duplicatesRemoved };
}

// ──────────────────────────────────────────
// Full validation pipeline
// ──────────────────────────────────────────

const VALID_GENDERS = new Set(['M', 'F', 'm', 'f']);
const VALID_SCHOOL_PATTERN = /^[A-Z][A-Z0-9' -]*$/;
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 60;
const SCORE_MAX = 100;
const SCORE_MIN = 0;
const SN_MIN = 1;
const SN_MAX = 99999;
const MAX_SCORE_ZERO_COUNT = 7; // More than 7 zeroes out of 9 subjects = suspect
const SUSPECT_SCORE_THRESHOLD = 95; // All scores > 95 = suspect
const MAX_DUPLICATE_SCORES = 5; // Same score across > 5 subjects = suspect

export function validateAndCleanStudents(students: StudentRaw[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const cleaned: StudentRaw[] = [];
  let fixedAuto = 0;

  // ── Phase 0: deduplicate first ──
  const { students: deduped, duplicatesRemoved } = removeDuplicateStudents(students);

  const subjectKeys = SUBJECT_LIST.map(s => s.key);

  // ── Phase 1: validate each row ──
  for (let i = 0; i < deduped.length; i++) {
    const s = { ...deduped[i], scores: { ...deduped[i].scores } };
    let skip = false;

    // SN validation
    if (s.sn == null || s.sn === undefined || isNaN(Number(s.sn))) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'sn', value: s.sn, issue: 'Missing or invalid SN', severity: 'error' });
      skip = true;
    } else if (s.sn < SN_MIN || s.sn > SN_MAX) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'sn', value: s.sn, issue: `SN ${s.sn} out of range (${SN_MIN}-${SN_MAX})`, severity: 'error' });
    }

    // Name validation
    if (!s.name || typeof s.name !== 'string' || s.name.trim().length < NAME_MIN_LENGTH) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'name', value: s.name, issue: `Name too short (< ${NAME_MIN_LENGTH} chars) or missing`, severity: 'error' });
      skip = true;
    } else if (s.name.trim().length > NAME_MAX_LENGTH) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'name', value: s.name, issue: `Name too long (> ${NAME_MAX_LENGTH} chars)`, severity: 'warning' });
    }
    // Trim and uppercase name
    s.name = s.name.trim().toUpperCase();

    // Check for generic/placeholder names
    const genericNames = ['NEW LEARNER', 'STUDENT', 'LEARNER', 'UNKNOWN', 'N/A', 'NA', '-', '--'];
    if (genericNames.includes(s.name)) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'name', value: s.name, issue: 'Placeholder/generic name detected', severity: 'warning' });
    }

    // Gender validation
    if (!s.gender || !VALID_GENDERS.has(s.gender.toUpperCase())) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'gender', value: s.gender, issue: `Invalid gender '${s.gender}' (must be M or F)`, severity: 'error' });
    }
    s.gender = (s.gender || 'M').toUpperCase() === 'F' ? 'F' : 'M';

    // School validation
    if (!s.school || typeof s.school !== 'string' || s.school.trim().length === 0) {
      s.school = 'UNKNOWN';
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'school', value: s.school, issue: 'Missing school — defaulted to UNKNOWN', severity: 'warning' });
      fixedAuto++;
    }
    s.school = s.school.trim().toUpperCase();

    // Scores validation
    let zeroCount = 0;
    let highCount = 0;
    const scoreValues: number[] = [];

    for (const key of subjectKeys) {
      const raw = s.scores[key];
      let mark: number | null = null;

      if (raw === undefined || raw === null || raw === '' || isNaN(Number(raw))) {
        issues.push({ studentSn: s.sn, studentName: s.name, field: key, value: raw, issue: `Missing score — defaulted to 50`, severity: 'warning' });
        mark = 50;
        fixedAuto++;
      } else {
        mark = Math.round(Number(raw));
      }

      if (mark < SCORE_MIN || mark > SCORE_MAX) {
        issues.push({ studentSn: s.sn, studentName: s.name, field: key, value: mark, issue: `Score ${mark} out of range (0-100) — clamped`, severity: 'error' });
        mark = Math.min(SCORE_MAX, Math.max(SCORE_MIN, mark));
        fixedAuto++;
      }

      s.scores[key] = mark;

      if (mark === 0) zeroCount++;
      if (mark > SUSPECT_SCORE_THRESHOLD) highCount++;
      scoreValues.push(mark);
    }

    // Suspect patterns
    if (zeroCount >= MAX_SCORE_ZERO_COUNT) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'scores', value: zeroCount, issue: `${zeroCount} subjects scored zero — data may be corrupted`, severity: 'warning' });
    }

    if (highCount === subjectKeys.length) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'scores', value: highCount, issue: `All 9 subjects > ${SUSPECT_SCORE_THRESHOLD} — data may be inflated`, severity: 'warning' });
    }

    // Check for suspiciously identical scores across subjects
    const uniqueScoreValues = new Set(scoreValues);
    if (scoreValues.length - uniqueScoreValues.size >= MAX_DUPLICATE_SCORES) {
      issues.push({ studentSn: s.sn, studentName: s.name, field: 'scores', value: uniqueScoreValues.size, issue: `Only ${uniqueScoreValues.size} unique scores across 9 subjects — suspect copy-paste`, severity: 'warning' });
    }

    if (!skip) {
      cleaned.push(s);
    }
  }

  // ── Phase 2: renumber sequential SNs ──
  const renumbered = cleaned.map((s, i) => ({
    ...s,
    sn: i + 1
  }));

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  return {
    valid: errors === 0,
    students: renumbered,
    issues,
    summary: {
      totalInspected: students.length,
      errors,
      warnings,
      duplicatesRemoved,
      fixedAuto
    }
  };
}

/**
 * Quick check: returns true if there are any validation errors that would
 * prevent meaningful analysis.
 */
export function hasCriticalErrors(students: StudentRaw[]): boolean {
  if (students.length === 0) return true;
  const result = validateAndCleanStudents(students);
  return result.summary.errors > 0 || result.students.length === 0;
}

/**
 * Returns a human-readable summary of validation issues, grouped by severity.
 */
export function formatValidationSummary(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push(`${result.summary.totalInspected} records inspected`);
  
  if (result.summary.duplicatesRemoved > 0) {
    lines.push(`${result.summary.duplicatesRemoved} duplicate(s) removed`);
  }
  if (result.summary.fixedAuto > 0) {
    lines.push(`${result.summary.fixedAuto} issue(s) auto-fixed (missing scores → 50, missing school → UNKNOWN)`);
  }
  if (result.summary.warnings > 0) {
    lines.push(`${result.summary.warnings} warning(s) — data may need review`);
  }
  if (result.summary.errors > 0) {
    lines.push(`${result.summary.errors} error(s) — some records skipped`);
  }

  const sampleIssue = result.issues.find(i => i.severity === 'error') || result.issues.find(i => i.severity === 'warning');
  if (sampleIssue) {
    lines.push(`Example: [${sampleIssue.severity}] ${sampleIssue.issue} (${sampleIssue.field})`);
  }

  return lines.join(' • ');
}
