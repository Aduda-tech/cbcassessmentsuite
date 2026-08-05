// Subscription verification callback — set by App component
let __verifySubscription: (() => Promise<boolean>) | null = null;

export function setSubscriptionVerifier(fn: () => Promise<boolean>) {
  __verifySubscription = fn;
}

import * as XLSX from 'xlsx';
import { ClassConfig, StudentAnalysis, SUBJECT_LIST } from '../types/cbc';
import { validateAndCleanStudents, formatValidationSummary } from './dataCleaning';
import { calculateOverallSummary, calculateSubjectSummaries, getTopPerformers } from './cbcCalculations';
import { STANDARD_GRADING_SCALE } from '../data/sampleNangoData';
import { VBA_MAIN_MODULE_CODE } from './vbaMacroCode';

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  // Use data URI via window.open for Android WebView compatibility.
  // Blob URLs are blocked in sandboxed Capacitor WebViews on Android.
  // Desktop browsers handle both methods fine.
  const isAndroidWebView = /Android.*(wv|Version\/[\d.]+).*Chrome/i.test(navigator.userAgent) ||
    (window as any).Capacitor !== undefined;

  if (isAndroidWebView) {
    // Android WebView: use data URI with window.open
    const encoded = btoa(unescape(encodeURIComponent(content)));
    const dataUri = `data:${mimeType};charset=utf-8;base64,${encoded}`;
    const w = window.open(dataUri, '_blank');
    if (!w) {
      // Fallback: try link.click with data URI
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return;
  }

  // Desktop / standard browsers: blob URL approach
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export function downloadVbaModule() {
  downloadFile('CBC_Exam_Automation.bas', VBA_MAIN_MODULE_CODE, 'text/plain');
}

export function exportAnalysisToCsv(classData: ClassConfig, analyzed: StudentAnalysis[]) {
  const headers = [
    'SN', 'NAME', 'GENDER', 'SCHOOL',
    ...SUBJECT_LIST.map(s => s.short),
    'TOTAL MARKS', 'TOTAL POINTS', 'T.PL', 'RANK'
  ];

  const rows = analyzed.map(st => [
    st.sn,
    `"${st.name}"`,
    st.gender,
    `"${st.school}"`,
    ...SUBJECT_LIST.map(s => {
      const evalScore = st.subjectEvaluations[s.key];
      return `"${evalScore.mark}   ${evalScore.grade}"`;
    }),
    st.totalMarks,
    st.totalPoints,
    st.tplGrade,
    st.rank,
  ]);

  const csvContent = [
    `"${classData.examName} - ${classData.className} ANALYSIS REPORT"`,
    `"${classData.termDetails}"`,
    '',
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadFile(`${classData.className.replace(/\s+/g, '_')}_Analysis_Report.csv`, csvContent, 'text/csv');
}

export function exportBestPerformedToCsv(classData: ClassConfig, analyzed: StudentAnalysis[]) {
  const result = validateAndCleanStudents(classData.students);
  if (!result.valid || result.summary.warnings > 0) {
    const summary = formatValidationSummary(result);
    const proceed = window.confirm(
      '⚠️ Data Issues Detected Before Export\n\n' + summary +
      '\n\nContinue with export anyway?'
    );
    if (!proceed) return;
  }
  const topCount = classData.topPerformersCount || 3;
  const { overall, boys, girls } = getTopPerformers(analyzed, topCount);
  const subSummaries = calculateSubjectSummaries(analyzed);
  const overallStats = calculateOverallSummary(analyzed);

  const lines: string[] = [
    `"${classData.examName} - BEST PERFORMED REPORT"`,
    `"Top Performers Count: ${topCount}"`,
    ''
  ];

  lines.push(`"TOP ${topCount} STUDENTS - OVERALL"`);
  lines.push('Rank,Name,Gender,School,Total Marks,Total Points,T.PL');
  overall.forEach(s => lines.push(`${s.rank},"${s.name}",${s.gender},"${s.school}",${s.totalMarks},${s.totalPoints},${s.tplGrade}`));
  lines.push('');
  lines.push('');

  lines.push(`"TOP ${topCount} BOYS"`);
  lines.push('Rank,Name,Gender,School,Total Marks,Total Points,T.PL');
  boys.forEach((s, idx) => lines.push(`${idx + 1},"${s.name}",M,"${s.school}",${s.totalMarks},${s.totalPoints},${s.tplGrade}`));
  lines.push('');
  lines.push('');

  lines.push(`"TOP ${topCount} GIRLS"`);
  lines.push('Rank,Name,Gender,School,Total Marks,Total Points,T.PL');
  girls.forEach((s, idx) => lines.push(`${idx + 1},"${s.name}",F,"${s.school}",${s.totalMarks},${s.totalPoints},${s.tplGrade}`));
  lines.push('');
  lines.push('');

  lines.push('"BEST PERFORMED LEARNING AREAS"');
  lines.push('Learning Area,Mean Score,Best Performer,Highest Score,CBC Grade');
  subSummaries.forEach(sub => lines.push(`"${sub.label}",${sub.meanScore},"${sub.bestPerformerName}",${sub.highestScore},${sub.cbcGrade}`));
  lines.push('');
  lines.push('');

  lines.push('"OVERALL SUMMARY"');
  lines.push('Metric,Overall,Boys,Girls');
  lines.push(`Total Students,${overallStats.totalStudents},${overallStats.boysCount},${overallStats.girlsCount}`);
  lines.push(`Mean Total Marks,${overallStats.meanTotalMarks},${overallStats.boysMeanTotalMarks},${overallStats.girlsMeanTotalMarks}`);
  lines.push(`Best Total Marks,${overallStats.bestTotalMarks},-,-`);
  lines.push(`Mean Total Points,${overallStats.meanTotalPoints},${overallStats.boysMeanTotalPoints},${overallStats.girlsMeanTotalPoints}`);

  downloadFile(`${classData.className.replace(/\s+/g, '_')}_Best_Performed.csv`, lines.join('\n'), 'text/csv');
}

export function generateExcelWorkbookXml(classData: ClassConfig, analyzed: StudentAnalysis[]): string {
  const topCount = classData.topPerformersCount || 3;
  const { overall, boys, girls } = getTopPerformers(analyzed, topCount);
  const subSummaries = calculateSubjectSummaries(analyzed);
  const overallStats = calculateOverallSummary(analyzed);

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#003366" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#003366" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Subheader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#E0EBF5" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <Worksheet ss:Name="Analysis">
  <Table>
${(() => {
    // Dynamic column widths: find longest name/school, scale by 1.6 per char (Calibri 11pt)
    const maxNameLen = Math.max(...analyzed.map(s => s.name.length || 1), 4);
    const maxSchoolLen = Math.max(...analyzed.map(s => (s.school || '').length || 1), 4);
    const nameWidth = Math.min(240, Math.max(30, Math.round(maxNameLen * 1.6 + 3)));
    const schoolWidth = Math.min(150, Math.max(30, Math.round(maxSchoolLen * 1.6 + 3)));
    return `
   <Column ss:Width="36"/>
   <Column ss:Width="${nameWidth}"/>
   <Column ss:Width="50"/>
   <Column ss:Width="${schoolWidth}"/>
   ${SUBJECT_LIST.map(() => '<Column ss:Width="76"/>').join('\n   ')}
   <Column ss:Width="76"/>
   <Column ss:Width="76"/>
   <Column ss:Width="48"/>
   <Column ss:Width="44"/>`;
  })()}
   <Row><Cell ss:StyleID="Title" ss:MergeAcross="17"><Data ss:Type="String">${classData.className} - ANALYSIS REPORT</Data></Cell></Row>
   <Row><Cell ss:StyleID="Subheader" ss:MergeAcross="17"><Data ss:Type="String">${classData.termDetails}</Data></Cell></Row>
   <Row/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">SN</Data></Cell>
    <Cell><Data ss:Type="String">NAME</Data></Cell>
    <Cell><Data ss:Type="String">GENDER</Data></Cell>
    <Cell><Data ss:Type="String">SCHOOL</Data></Cell>
    ${SUBJECT_LIST.map(s => `<Cell><Data ss:Type="String">${s.short}</Data></Cell>`).join('')}
    <Cell><Data ss:Type="String">TOTAL MARKS</Data></Cell>
    <Cell><Data ss:Type="String">TOTAL POINTS</Data></Cell>
    <Cell><Data ss:Type="String">T.PL</Data></Cell>
    <Cell><Data ss:Type="String">RANK</Data></Cell>
   </Row>
   ${analyzed.map(st => `
   <Row>
    <Cell><Data ss:Type="Number">${st.sn}</Data></Cell>
    <Cell><Data ss:Type="String">${st.name}</Data></Cell>
    <Cell><Data ss:Type="String">${st.gender}</Data></Cell>
    <Cell><Data ss:Type="String">${st.school}</Data></Cell>
    ${SUBJECT_LIST.map(s => {
      const e = st.subjectEvaluations[s.key];
      return `<Cell><Data ss:Type="String">${e.mark}   ${e.grade}</Data></Cell>`;
    }).join('')}
    <Cell><Data ss:Type="Number">${st.totalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${st.totalPoints}</Data></Cell>
    <Cell><Data ss:Type="String">${st.tplGrade}</Data></Cell>
    <Cell><Data ss:Type="Number">${st.rank}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Best Performed">
  <Table>
${(() => {
    const allTop = [...overall, ...boys, ...girls];
    const maxNameLen = Math.max(...allTop.map(s => s.name.length || 1), 4);
    const maxSchoolLen = Math.max(...allTop.map(s => (s.school || '').length || 1), 4);
    const nameWidth = Math.min(240, Math.max(30, Math.round(maxNameLen * 1.6 + 3)));
    const schoolWidth = Math.min(150, Math.max(30, Math.round(maxSchoolLen * 1.6 + 3)));
    return `
   <Column ss:Width="44"/>
   <Column ss:Width="${nameWidth}"/>
   <Column ss:Width="50"/>
   <Column ss:Width="${schoolWidth}"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>`;
  })()}
   <Row><Cell ss:StyleID="Title" ss:MergeAcross="6"><Data ss:Type="String">BEST PERFORMED REPORTS — TOP ${topCount}</Data></Cell></Row>
   <Row/>
   <Row><Cell ss:StyleID="Header" ss:MergeAcross="5"><Data ss:Type="String">TOP ${topCount} STUDENTS - OVERALL</Data></Cell></Row>
   <Row ss:StyleID="Subheader">
    <Cell><Data ss:Type="String">Rank</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Gender</Data></Cell>
    <Cell><Data ss:Type="String">School</Data></Cell>
    <Cell><Data ss:Type="String">Total Marks</Data></Cell>
    <Cell><Data ss:Type="String">Total Points</Data></Cell>
   </Row>
   ${overall.map(s => `
   <Row>
    <Cell><Data ss:Type="Number">${s.rank}</Data></Cell>
    <Cell><Data ss:Type="String">${s.name}</Data></Cell>
    <Cell><Data ss:Type="String">${s.gender}</Data></Cell>
    <Cell><Data ss:Type="String">${s.school}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.totalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.totalPoints}</Data></Cell>
   </Row>`).join('')}
   <Row/>
   <Row/>
   <Row><Cell ss:StyleID="Header" ss:MergeAcross="5"><Data ss:Type="String">TOP ${topCount} BOYS</Data></Cell></Row>
   <Row ss:StyleID="Subheader">
    <Cell><Data ss:Type="String">Rank</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Gender</Data></Cell>
    <Cell><Data ss:Type="String">School</Data></Cell>
    <Cell><Data ss:Type="String">Total Marks</Data></Cell>
    <Cell><Data ss:Type="String">Total Points</Data></Cell>
   </Row>
   ${boys.map((s, i) => `
   <Row>
    <Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${s.name}</Data></Cell>
    <Cell><Data ss:Type="String">M</Data></Cell>
    <Cell><Data ss:Type="String">${s.school}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.totalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.totalPoints}</Data></Cell>
   </Row>`).join('')}
   <Row/>
   <Row/>
   <Row><Cell ss:StyleID="Header" ss:MergeAcross="5"><Data ss:Type="String">TOP ${topCount} GIRLS</Data></Cell></Row>
   <Row ss:StyleID="Subheader">
    <Cell><Data ss:Type="String">Rank</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Gender</Data></Cell>
    <Cell><Data ss:Type="String">School</Data></Cell>
    <Cell><Data ss:Type="String">Total Marks</Data></Cell>
    <Cell><Data ss:Type="String">Total Points</Data></Cell>
   </Row>
   ${girls.map((s, i) => `
   <Row>
    <Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
    <Cell><Data ss:Type="String">${s.name}</Data></Cell>
    <Cell><Data ss:Type="String">F</Data></Cell>
    <Cell><Data ss:Type="String">${s.school}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.totalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${s.totalPoints}</Data></Cell>
   </Row>`).join('')}
   <Row/>
   <Row/>
   <Row><Cell ss:StyleID="Header" ss:MergeAcross="4"><Data ss:Type="String">BEST PERFORMED LEARNING AREAS</Data></Cell></Row>
   <Row ss:StyleID="Subheader">
    <Cell><Data ss:Type="String">Learning Area</Data></Cell>
    <Cell><Data ss:Type="String">Mean Score</Data></Cell>
    <Cell><Data ss:Type="String">Best Performer</Data></Cell>
    <Cell><Data ss:Type="String">Highest Score</Data></Cell>
    <Cell><Data ss:Type="String">CBC Grade</Data></Cell>
   </Row>
   ${subSummaries.map(sub => `
   <Row>
    <Cell><Data ss:Type="String">${sub.label}</Data></Cell>
    <Cell><Data ss:Type="Number">${sub.meanScore}</Data></Cell>
    <Cell><Data ss:Type="String">${sub.bestPerformerName}</Data></Cell>
    <Cell><Data ss:Type="Number">${sub.highestScore}</Data></Cell>
    <Cell><Data ss:Type="String">${sub.cbcGrade}</Data></Cell>
   </Row>`).join('')}
   <Row/>
   <Row/>
   <Row><Cell ss:StyleID="Header" ss:MergeAcross="3"><Data ss:Type="String">OVERALL SUMMARY</Data></Cell></Row>
   <Row ss:StyleID="Subheader">
    <Cell><Data ss:Type="String">Metric</Data></Cell>
    <Cell><Data ss:Type="String">Overall</Data></Cell>
    <Cell><Data ss:Type="String">Boys</Data></Cell>
    <Cell><Data ss:Type="String">Girls</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Students</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.totalStudents}</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.boysCount}</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.girlsCount}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Mean Total Marks</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.meanTotalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.boysMeanTotalMarks}</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.girlsMeanTotalMarks}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Best Total Marks</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.bestTotalMarks}</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
    <Cell><Data ss:Type="String">-</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Mean Total Points</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.meanTotalPoints}</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.boysMeanTotalPoints}</Data></Cell>
    <Cell><Data ss:Type="Number">${overallStats.girlsMeanTotalPoints}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <Worksheet ss:Name="Grading Scale">
  <Table>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="70"/>
   <Column ss:Width="180"/>
   <Row><Cell ss:StyleID="Title" ss:MergeAcross="4"><Data ss:Type="String">CBC GRADING SCALES</Data></Cell></Row>
   <Row/>
   <Row><Cell ss:StyleID="Header" ss:MergeAcross="3"><Data ss:Type="String">TABLE 1: Per-Subject Grading (out of 100)</Data></Cell></Row>
   <Row ss:StyleID="Subheader">
    <Cell><Data ss:Type="String">Grade</Data></Cell>
    <Cell><Data ss:Type="String">Score Range</Data></Cell>
    <Cell><Data ss:Type="String">Points</Data></Cell>
    <Cell><Data ss:Type="String">Remarks</Data></Cell>
   </Row>
   ${STANDARD_GRADING_SCALE.map(g => `
   <Row>
    <Cell><Data ss:Type="String">${g.grade}</Data></Cell>
    <Cell><Data ss:Type="String">${g.minMark} - ${g.maxMark}</Data></Cell>
    <Cell><Data ss:Type="Number">${g.points}</Data></Cell>
    <Cell><Data ss:Type="String">${g.remarks}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Apply formatting to a worksheet matching the school report theme:
 * - Navy blue (#003366) title, centered, bold 14pt
 * - Navy blue header row with white bold text
 * - White data rows with thin gray borders, alternating light gray (#F2F6FA) stripes
 */
function styleSheet(ws: XLSX.WorkSheet, options: {
  title?: string;
  titleRow?: number;
  headerRow: number;
  dataStartRow: number;
  dataEndRow: number;
}) {
  const { title, titleRow = 0, headerRow, dataStartRow, dataEndRow } = options;
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const lastCol = range.e.c;
  const lastRow = range.e.r;

  // ── Title row (merged, navy bold centered) ──
  if (title) {
    ws['!merges'] = ws['!merges'] || [];
    ws['!merges'].push({ s: { r: titleRow, c: 0 }, e: { r: titleRow, c: lastCol } });
    const tc = ws[XLSX.utils.encode_cell({ r: titleRow, c: 0 })];
    if (tc) tc.s = {
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '003366' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  // ── Header row (navy fill, white bold text, centered) ──
  for (let c = 0; c <= lastCol; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRow, c })];
    if (!cell) continue;
    cell.s = {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '003366' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
      border: {
        top: { style: 'thin', color: { rgb: '002244' } },
        bottom: { style: 'thin', color: { rgb: '002244' } },
        left: { style: 'thin', color: { rgb: '003366' } },
        right: { style: 'thin', color: { rgb: '003366' } }
      }
    };
  }

  // ── Data rows: white/light-gray stripes, thin gray borders ──
  for (let r = dataStartRow; r <= Math.min(dataEndRow, lastRow); r++) {
    const isStripe = (r - dataStartRow) % 2 === 1;
    for (let c = 0; c <= lastCol; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell) continue;
      cell.s = {
        ...(cell.s || {}),
        font: { name: 'Calibri', sz: 11, color: { rgb: '000000' } },
        fill: isStripe ? { fgColor: { rgb: 'F2F6FA' }, patternType: 'solid' } : undefined,
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        },
        alignment: { vertical: 'center' }
      };
    }
  }
}

/**
 * Style a section-title row (e.g. "TOP 10 STUDENTS - OVERALL"):
 * light blue fill, bold navy text, merged across all columns.
 */
function styleSectionTitle(ws: XLSX.WorkSheet, row: number, lastCol: number) {
  ws['!merges'] = ws['!merges'] || [];
  if (!(ws['!merges'] as any[]).some((m: any) => m.s.r === row)) {
    ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: lastCol } });
  }
  const cell = ws[XLSX.utils.encode_cell({ r: row, c: 0 })];
  if (cell) cell.s = {
    font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '002244' } },
    fill: { fgColor: { rgb: 'D6E4F0' }, patternType: 'solid' },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      bottom: { style: 'thin', color: { rgb: 'B0C4DE' } },
      top: { style: 'thin', color: { rgb: 'B0C4DE' } }
    }
  };
}

/**
 * Style a header row within the Best Performed sheet:
 * navy fill, white bold text, centered.
 */
function styleHeaderRow(ws: XLSX.WorkSheet, row: number, lastCol: number) {
  for (let c = 0; c <= lastCol; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: row, c })];
    if (!cell) continue;
    cell.s = {
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '003366' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '002244' } },
        bottom: { style: 'thin', color: { rgb: '002244' } },
        left: { style: 'thin', color: { rgb: '003366' } },
        right: { style: 'thin', color: { rgb: '003366' } }
      }
    };
  }
}

/**
 * Style data rows in Best Performed: white/light-gray stripes, thin borders.
 */
function styleDataRowsBP(ws: XLSX.WorkSheet, startRow: number, endRow: number, lastCol: number) {
  for (let r = startRow; r <= endRow; r++) {
    const isStripe = (r - startRow) % 2 === 1;
    for (let c = 0; c <= lastCol; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (!cell || !cell.v) continue;
      cell.s = {
        font: { name: 'Calibri', sz: 11, color: { rgb: '000000' } },
        fill: isStripe ? { fgColor: { rgb: 'F2F6FA' }, patternType: 'solid' } : undefined,
        border: {
          top: { style: 'thin', color: { rgb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
          left: { style: 'thin', color: { rgb: 'D1D5DB' } },
          right: { style: 'thin', color: { rgb: 'D1D5DB' } }
        },
        alignment: { vertical: 'center' }
      };
    }
  }
}

/**
 * Auto-fit column widths: scan ONLY the header row and data rows.
 * Section title rows are ignored. Each column gets the max of (header width, max data width).
 */
function autoFitSheet(ws: XLSX.WorkSheet, headers: string[], dataRows: any[][]) {
  const colCount = headers.length;
  const widths: number[] = headers.map(h => String(h).length);

  for (const row of dataRows) {
    if (row.length === 0) continue;
    const nonEmptyCount = row.filter(c => c != null && String(c).trim() !== '').length;
    if (nonEmptyCount <= 1 && row.length <= 2) continue; // skip section-title rows
    for (let i = 0; i < Math.min(colCount, row.length); i++) {
      const val = row[i] != null ? String(row[i]).trim() : '';
      if (val.length > 0) {
        widths[i] = Math.max(widths[i], val.length);
      }
    }
  }

  ws['!cols'] = widths.map(w => ({ wch: Math.min(60, Math.max(8, Math.round(w * 1.15 + 3))) }));
}

export function downloadFullExcelWorkbook(classData: ClassConfig, analyzed: StudentAnalysis[]) {
  const result = validateAndCleanStudents(classData.students);
  if (!result.valid || result.summary.warnings > 0) {
    const summary = formatValidationSummary(result);
    const proceed = window.confirm(
      '\u26a0\ufe0f Data Issues Detected Before Export\n\n' + summary +
      '\n\nContinue with export anyway?'
    );
    if (!proceed) return;
  }
  const topCount = classData.topPerformersCount || 3;
  const { overall, boys, girls } = getTopPerformers(analyzed, topCount);
  const subSummaries = calculateSubjectSummaries(analyzed);
  const overallStats = calculateOverallSummary(analyzed);
  const wb = XLSX.utils.book_new();

  //
  // ── SHEET 1: Analysis ──
  //
  {
    const titleRow = [classData.className + ' - ANALYSIS REPORT'];
    const subTitleRow = [classData.termDetails];
    const headers = ['SN', 'NAME', 'GENDER', 'SCHOOL', ...SUBJECT_LIST.map(s => s.short), 'TOTAL MARKS', 'TOTAL POINTS', 'T.PL', 'RANK'];
    const data = analyzed.map(st => [
      st.sn, st.name, st.gender, st.school,
      ...SUBJECT_LIST.map(s => {
        const e = st.subjectEvaluations[s.key];
        return e.mark + '   ' + e.grade;
      }),
      st.totalMarks, st.totalPoints, st.tplGrade, st.rank,
    ]);
    const rows = [titleRow, subTitleRow, [], headers, ...data];
    const wsA = XLSX.utils.aoa_to_sheet(rows);
    styleSheet(wsA, { title: titleRow[0], titleRow: 0, headerRow: 3, dataStartRow: 4, dataEndRow: 3 + data.length });
    autoFitSheet(wsA, headers, data);
    XLSX.utils.book_append_sheet(wb, wsA, 'Analysis');
  }

  //
  // ── SHEET 2: Best Performed ──
  //
  {
    const pageTitle = 'BEST PERFORMED REPORTS — TOP ' + topCount;
    const rows: any[][] = [[pageTitle], []];

    // We track section boundaries to apply styling
    const sections: { titleRow: number; headerRow: number; dataStart: number; dataEnd: number }[] = [];

    function pushSection(sectionBlock: any[][]) {
      const titleRow = rows.length;
      rows.push(sectionBlock[0]); // section title
      const headerRow = rows.length;
      rows.push(sectionBlock[1]); // header row
      const dataStart = rows.length;
      for (let i = 2; i < sectionBlock.length; i++) rows.push(sectionBlock[i]);
      const dataEnd = rows.length - 1;
      sections.push({ titleRow, headerRow, dataStart, dataEnd });
    }

    // -- Top Overall --
    pushSection([
      ['TOP ' + topCount + ' STUDENTS - OVERALL'],
      ['Rank', 'Name', 'Gender', 'School', 'Total Marks', 'Total Points', 'T.PL'],
      ...overall.map(s => [s.rank, s.name, s.gender, s.school, s.totalMarks, s.totalPoints, s.tplGrade] as any),
    ]);
    rows.push([]); // spacer

    // -- Top Boys --
    pushSection([
      ['TOP ' + topCount + ' BOYS'],
      ['Rank', 'Name', 'Gender', 'School', 'Total Marks', 'Total Points', 'T.PL'],
      ...boys.map((s, i) => [i + 1, s.name, 'M', s.school, s.totalMarks, s.totalPoints, s.tplGrade] as any),
    ]);
    rows.push([]); // spacer

    // -- Top Girls --
    pushSection([
      ['TOP ' + topCount + ' GIRLS'],
      ['Rank', 'Name', 'Gender', 'School', 'Total Marks', 'Total Points', 'T.PL'],
      ...girls.map((s, i) => [i + 1, s.name, 'F', s.school, s.totalMarks, s.totalPoints, s.tplGrade] as any),
    ]);
    rows.push([]); // spacer

    // -- Learning Areas --
    pushSection([
      ['BEST PERFORMED LEARNING AREAS'],
      ['Learning Area', 'Mean Score', 'Best Performer', 'Highest Score', 'CBC Grade'],
      ...subSummaries.map(sub => [sub.label, sub.meanScore, sub.bestPerformerName, sub.highestScore, sub.cbcGrade] as any),
    ]);
    rows.push([]); // spacer

    // -- Overall Summary --
    pushSection([
      ['OVERALL SUMMARY'],
      ['Metric', 'Overall', 'Boys', 'Girls'],
      ['Total Students', overallStats.totalStudents, overallStats.boysCount, overallStats.girlsCount],
      ['Mean Total Marks', overallStats.meanTotalMarks, overallStats.boysMeanTotalMarks, overallStats.girlsMeanTotalMarks],
      ['Best Total Marks', overallStats.bestTotalMarks, '-', '-'],
      ['Mean Total Points', overallStats.meanTotalPoints, overallStats.boysMeanTotalPoints, overallStats.girlsMeanTotalPoints],
    ]);

    const wsBP = XLSX.utils.aoa_to_sheet(rows);
    const rangeBP = XLSX.utils.decode_range(wsBP['!ref'] || 'A1');
    const lastColBP = rangeBP.e.c;

    // Page title
    wsBP['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastColBP } }];
    const ptc = wsBP[XLSX.utils.encode_cell({ r: 0, c: 0 })];
    if (ptc) ptc.s = {
      font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '003366' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // Style each section
    for (const sec of sections) {
      styleSectionTitle(wsBP, sec.titleRow, lastColBP);
      styleHeaderRow(wsBP, sec.headerRow, lastColBP);
      styleDataRowsBP(wsBP, sec.dataStart, sec.dataEnd, lastColBP);
    }

    // Collect data rows for auto-fit from all sections
    const bpHeaders = ['Rank', 'Name', 'Gender', 'School', 'Total Marks', 'Total Points', 'T.PL'];
    const bpDataRows: any[][] = [];
    for (const sec of sections) {
      for (let r = sec.dataStart; r <= sec.dataEnd; r++) {
        const row: any[] = [];
        for (let c = 0; c < 7; c++) {
          const cell = wsBP[XLSX.utils.encode_cell({ r, c })];
          row.push(cell ? cell.v : '');
        }
        const hasNumeric = row.some(v => typeof v === 'number');
        const nonEmpty = row.filter(v => v != null && String(v).trim() !== '').length;
        if (hasNumeric || nonEmpty >= 4) bpDataRows.push(row);
      }
    }
    autoFitSheet(wsBP, bpHeaders, bpDataRows);
    XLSX.utils.book_append_sheet(wb, wsBP, 'Best Performed');
  }

  //
  // ── SHEET 3: Grading Scale ──
  //
  {
    const titleRow = ['CBC GRADING SCALES'];
    const headers = ['Grade', 'Score Range', 'Points', 'Remarks'];
    const data = STANDARD_GRADING_SCALE.map(g => [g.grade, g.minMark + ' - ' + g.maxMark, g.points, g.remarks]);
    const rows = [titleRow, [], headers, ...data];
    const wsGS = XLSX.utils.aoa_to_sheet(rows);
    styleSheet(wsGS, { title: titleRow[0], titleRow: 0, headerRow: 2, dataStartRow: 3, dataEndRow: 2 + data.length });
    autoFitSheet(wsGS, headers, data);
    XLSX.utils.book_append_sheet(wb, wsGS, 'Grading Scale');
  }

  const filename = classData.className.replace(/\s+/g, '_') + '_Report.xlsx';
  XLSX.writeFile(wb, filename);
}