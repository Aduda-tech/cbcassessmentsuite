import { 
  CBCGradeCode, 
  StudentAnalysis, 
  StudentRaw, 
  SubjectKey, 
  SubjectScore, 
  SubjectSummary, 
  OverallSummaryStats,
  SUBJECT_LIST
} from '../types/cbc';
import { STANDARD_GRADING_SCALE } from '../data/sampleNangoData';

export function evaluateSubject(mark: number): SubjectScore {
  const m = Math.round(Number(mark) || 0);
  for (const item of STANDARD_GRADING_SCALE) {
    if (m >= item.minMark && m <= item.maxMark) {
      return {
        mark: m,
        grade: item.grade,
        points: item.points,
        remarks: item.remarks
      };
    }
  }
  // Fallback for extreme/invalid values
  return {
    mark: m,
    grade: 'BE2',
    points: 1,
    remarks: 'Below Expectations'
  };
}

export function evaluateTPL(totalPoints: number): CBCGradeCode {
  const pts = Math.round(Number(totalPoints) || 0);
  for (const item of STANDARD_GRADING_SCALE) {
    if (pts >= item.minTplPoints && pts <= item.maxTplPoints) {
      return item.grade;
    }
  }
  if (pts > 72) return 'EE1';
  return 'BE2';
}

export function generateHoiRemarks(tplGrade: CBCGradeCode, totalPoints: number): string {
  switch (tplGrade) {
    case 'EE1':
      return "Exceeding Expectations! Exceptional competency mastery across all learning areas. Keep shining!";
    case 'EE2':
      return "Exceeding Expectations! Very commendable effort and high competency scores. Aim for EE1 next exam.";
    case 'ME1':
      return "Meeting Expectations. Solid performance with consistent effort. Can reach Exceeding with extra focus.";
    case 'ME2':
      return "Meeting Expectations. Satisfactory work, but needs more practice in challenging learning areas.";
    case 'AE1':
      return "Approaching Expectations. Can do better. Put more effort into daily assignments and revision.";
    case 'AE2':
      return "Approaching Expectations. Can do better. Better luck in the next exam. Needs regular guided practice.";
    case 'BE1':
      return "Below Expectations. Needs immediate remedial support and closer supervision from teachers and parents.";
    case 'BE2':
      return "Below Expectations. Serious academic intervention required. Better luck in the next exam.";
    default:
      return "Can do better. Better luck in the next exam.";
  }
}

export function generateClassTeacherRemarks(tplGrade: CBCGradeCode): string {
  switch (tplGrade) {
    case 'EE1':
    case 'EE2':
      return "An outstanding learner who consistently demonstrates mastery of CBC competencies.";
    case 'ME1':
    case 'ME2':
      return "A diligent learner meeting required standards. Encourage participation in class discussions.";
    case 'AE1':
    case 'AE2':
      return "Making progress but needs consistent practice in analytical subjects like Maths and Science.";
    default:
      return "Requires dedicated remedial coaching and regular parental follow-up to improve core competencies.";
  }
}

export function analyzeStudents(students: StudentRaw[]): StudentAnalysis[] {
  const evaluated = students.map((s) => {
    const subjectEvaluations: Record<SubjectKey, SubjectScore> = {} as any;
    let totalMarks = 0;
    let totalPoints = 0;

    SUBJECT_LIST.forEach((sub) => {
      const rawMark = s.scores[sub.key] ?? 0;
      const evalScore = evaluateSubject(rawMark);
      subjectEvaluations[sub.key] = evalScore;
      totalMarks += evalScore.mark;
      totalPoints += evalScore.points;
    });

    const tplGrade = evaluateTPL(totalPoints);
    const hoiRemarks = generateHoiRemarks(tplGrade, totalPoints);
    const classTeacherRemarks = generateClassTeacherRemarks(tplGrade);

    return {
      ...s,
      subjectEvaluations,
      totalMarks,
      totalPoints,
      tplGrade,
      rank: 0, // Will be assigned after sorting
      hoiRemarks,
      classTeacherRemarks
    };
  });

  // Sort by Total Points DESCENDING (Per user instruction: "Ranking should be done by total points not total marks")
  // In case of tie in total points, break tie by Total Marks DESCENDING
  const sorted = [...evaluated].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return b.totalMarks - a.totalMarks;
  });

  // Assign Ranks with tie handling (Standard Kenyan ranking: tied scores share same rank, next rank skips)
  let currentRank = 1;
  const ranked = sorted.map((student, idx) => {
    if (idx > 0) {
      const prev = sorted[idx - 1];
      if (student.totalPoints < prev.totalPoints || 
         (student.totalPoints === prev.totalPoints && student.totalMarks < prev.totalMarks)) {
        currentRank = idx + 1;
      }
    }
    return {
      ...student,
      rank: currentRank
    };
  });

  return ranked;
}

export function calculateSubjectSummaries(analyzed: StudentAnalysis[]): SubjectSummary[] {
  if (!analyzed || analyzed.length === 0) return [];

  return SUBJECT_LIST.map((sub) => {
    let sumMarks = 0;
    let sumPoints = 0;
    let highestScore = 0;
    let bestPerformerName = "-";

    analyzed.forEach((st) => {
      const scoreObj = st.subjectEvaluations[sub.key];
      sumMarks += scoreObj.mark;
      sumPoints += scoreObj.points;
      if (scoreObj.mark > highestScore) {
        highestScore = scoreObj.mark;
        bestPerformerName = st.name;
      }
    });

    const count = analyzed.length;
    const meanScore = Number((sumMarks / count).toFixed(2));
    const meanPoints = Number((sumPoints / count).toFixed(2));
    const cbcGrade = evaluateSubject(meanScore).grade;

    return {
      subject: sub.key,
      label: sub.label,
      meanScore,
      meanPoints,
      bestPerformerName,
      bestPerformerScore: highestScore,
      highestScore,
      cbcGrade
    };
  }).sort((a, b) => (b.meanScore - a.meanScore) || (b.meanPoints - a.meanPoints) || a.label.localeCompare(b.label));
}

export function calculateOverallSummary(analyzed: StudentAnalysis[]): OverallSummaryStats {
  const totalStudents = analyzed.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      meanTotalMarks: 0,
      bestTotalMarks: 0,
      meanTotalPoints: 0,
      boysCount: 0,
      boysMeanTotalMarks: 0,
      boysMeanTotalPoints: 0,
      girlsCount: 0,
      girlsMeanTotalMarks: 0,
      girlsMeanTotalPoints: 0
    };
  }

  const boys = analyzed.filter(s => s.gender === 'M');
  const girls = analyzed.filter(s => s.gender === 'F');

  const calcMeanMarks = (list: StudentAnalysis[]) => list.length > 0 ? Number((list.reduce((acc, curr) => acc + curr.totalMarks, 0) / list.length).toFixed(2)) : 0;
  const calcMeanPoints = (list: StudentAnalysis[]) => list.length > 0 ? Number((list.reduce((acc, curr) => acc + curr.totalPoints, 0) / list.length).toFixed(2)) : 0;

  const bestTotalMarks = analyzed.reduce((max, curr) => Math.max(max, curr.totalMarks), 0);

  return {
    totalStudents,
    meanTotalMarks: calcMeanMarks(analyzed),
    bestTotalMarks,
    meanTotalPoints: calcMeanPoints(analyzed),
    boysCount: boys.length,
    boysMeanTotalMarks: calcMeanMarks(boys),
    boysMeanTotalPoints: calcMeanPoints(boys),
    girlsCount: girls.length,
    girlsMeanTotalMarks: calcMeanMarks(girls),
    girlsMeanTotalPoints: calcMeanPoints(girls)
  };
}

export function getTopPerformers(analyzed: StudentAnalysis[], topCount: number) {
  const overall = analyzed.slice(0, topCount);
  const boys = analyzed.filter(s => s.gender === 'M').slice(0, topCount);
  const girls = analyzed.filter(s => s.gender === 'F').slice(0, topCount);

  return { overall, boys, girls };
}
