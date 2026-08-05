export type SubjectKey = 
  | 'MATHS' 
  | 'ENG' 
  | 'KISWAHILI' 
  | 'SCIENCE' 
  | 'AGRIC' 
  | 'SST' 
  | 'CRE' 
  | 'CAS' 
  | 'PRETECH';

export const SUBJECT_LIST: { key: SubjectKey; label: string; short: string }[] = [
  { key: 'MATHS', label: 'Mathematics', short: 'MATHS' },
  { key: 'ENG', label: 'English Language', short: 'ENG' },
  { key: 'KISWAHILI', label: 'Kiswahili Language', short: 'KISWAHILI' },
  { key: 'SCIENCE', label: 'Integrated Science', short: 'SCIENCE' },
  { key: 'AGRIC', label: 'Agriculture & Nutrition', short: 'AGRIC' },
  { key: 'SST', label: 'Social Studies', short: 'SST' },
  { key: 'CRE', label: 'Religious Education (CRE)', short: 'CRE' },
  { key: 'CAS', label: 'Creative Arts & Sports', short: 'CAS' },
  { key: 'PRETECH', label: 'Pre-Technical Studies', short: 'PRETECH' }
];

export type CBCGradeCode = 'EE1' | 'EE2' | 'ME1' | 'ME2' | 'AE1' | 'AE2' | 'BE1' | 'BE2';

export interface SubjectScore {
  mark: number;
  grade: CBCGradeCode;
  points: number;
  remarks: string;
}

export interface StudentRaw {
  sn: number;
  name: string;
  gender: 'M' | 'F';
  school: string; // Or Stream / House e.g. CONSO, OLAGO, RABANGO, MI'YANDHE
  scores: Record<SubjectKey, number>;
}

export interface StudentAnalysis extends StudentRaw {
  subjectEvaluations: Record<SubjectKey, SubjectScore>;
  totalMarks: number;
  totalPoints: number;
  tplGrade: CBCGradeCode;
  rank: number;
  hoiRemarks: string;
  classTeacherRemarks: string;
}

export interface SubjectSummary {
  subject: SubjectKey;
  label: string;
  meanScore: number;
  meanPoints: number;
  bestPerformerName: string;
  bestPerformerScore: number;
  highestScore: number;
  cbcGrade: CBCGradeCode;
}

export interface OverallSummaryStats {
  totalStudents: number;
  meanTotalMarks: number;
  bestTotalMarks: number;
  meanTotalPoints: number;
  boysCount: number;
  boysMeanTotalMarks: number;
  boysMeanTotalPoints: number;
  girlsCount: number;
  girlsMeanTotalMarks: number;
  girlsMeanTotalPoints: number;
}

export interface ClassConfig {
  id: string;
  className: string; // e.g. "Grade 7", "Grade 8 - East Stream"
  examName: string; // e.g. "NANGO ZONE JS ASSESSMENT"
  termDetails: string; // e.g. "COMPETENCY BASED ASSESSMENT — TERM TWO 2026"
  schoolName: string; // e.g. "NANGO ZONE JUNIOR SCHOOLS"
  motto: string; // e.g. "Strive for Excellence & Competency"
  topPerformersCount: number; // e.g. 3, 5, 10, 20
  schoolLogo?: string; // base64 data URL of school logo (PNG/JPG/GIF/WEBP/SVG)
  students: StudentRaw[];
}

export interface GradingScaleItem {
  grade: CBCGradeCode;
  minMark: number;
  maxMark: number;
  points: number;
  remarks: string;
  minTplPoints: number;
  maxTplPoints: number;
  minTotalMarks: number;
  maxTotalMarks: number;
  equivalentPct: string;
}
