import React, { useState, useMemo } from 'react';
import { 
  AlertCircle,
  BarChart3, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ClassConfig, SUBJECT_LIST, StudentAnalysis } from '../types/cbc';
import { analyzeStudents } from '../utils/cbcCalculations';
import { hasCriticalErrors, validateAndCleanStudents, formatValidationSummary } from '../utils/dataCleaning';
import { exportAnalysisToCsv, downloadFullExcelWorkbook } from '../utils/excelExport';
import { triggerPrintWithReport } from '../utils/printHelper';

interface AnalysisSheetProps {
  currentClass: ClassConfig;
  onGoToReportCards: () => void;
  onOpenAiAdvisor: () => void;
}

export const AnalysisSheet: React.FC<AnalysisSheetProps> = ({
  currentClass,
  onGoToReportCards,
  onOpenAiAdvisor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState<'ALL' | 'M' | 'F'>('ALL');
  const [filterSchool, setFilterSchool] = useState<string>('ALL');
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(true);

  const analyzed = useMemo(() => {
    const result = validateAndCleanStudents(currentClass.students);
    if (!result.valid && result.students.length === 0) {
      // Return empty array if all records invalid
      return [];
    }
    return analyzeStudents(result.students);
  }, [currentClass.students]);

  const validationResult = useMemo(() => validateAndCleanStudents(currentClass.students), [currentClass.students]);
  const hasCritical = validationResult.summary.errors > 0 || validationResult.students.length === 0;

  // Extract unique schools/streams for filtering
  const uniqueSchools = useMemo(() => {
    const set = new Set(analyzed.map(s => s.school));
    return Array.from(set).sort();
  }, [analyzed]);

  // Filtered list
  const filtered = useMemo(() => {
    return analyzed.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.sn.toString() === searchTerm;
      const matchGender = filterGender === 'ALL' || s.gender === filterGender;
      const matchSchool = filterSchool === 'ALL' || s.school === filterSchool;
      return matchSearch && matchGender && matchSchool;
    });
  }, [analyzed, searchTerm, filterGender, filterSchool]);

  const handlePrintA4 = () => {
    triggerPrintWithReport("Step 2: Automated Analysis Matrix");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Banner - Collapsible Dashboard */}
      {isDashboardCollapsed ? (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-800/60 rounded-xl px-4 py-2.5 shadow-md text-white flex flex-wrap items-center justify-between gap-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Step 2: Automated Analysis Matrix</span>
            <span className="text-emerald-100/80 text-xs hidden sm:inline">— {currentClass.examName} ({currentClass.className})</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => downloadFullExcelWorkbook(currentClass, analyzed)}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xls)</span>
            </button>
            <button
              onClick={handlePrintA4}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-bold shadow transition hidden md:flex"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setIsDashboardCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-bold shadow transition"
            >
              <span>Expand Dashboard</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 shadow-xl text-white border border-emerald-800/60 print:hidden animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <BarChart3 className="w-4 h-4" />
                  <span>Step 2: Automated CBC Analysis Matrix</span>
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {currentClass.examName} — {currentClass.className}
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Automated student ranking by Total Points (out of 72) with detailed subject competencies formatted for school records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => exportAnalysisToCsv(currentClass, analyzed)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => downloadFullExcelWorkbook(currentClass, analyzed)}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Excel (.xls)</span>
              </button>
              <button
                onClick={handlePrintA4}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print A4 Landscape</span>
              </button>
              <button
                onClick={() => setIsDashboardCollapsed(true)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold transition ml-auto"
              >
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning Banner */}
      {(validationResult.summary.warnings > 0 || validationResult.summary.errors > 0) && (
        <div className={`rounded-xl p-3 flex items-start gap-3 border ${hasCritical ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'} print:hidden animate-in fade-in duration-200`}>
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${hasCritical ? 'text-rose-500' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${hasCritical ? 'text-rose-800' : 'text-amber-800'}`}>
              {hasCritical ? '⚠️ Data Issues Detected — Analysis May Be Inaccurate' : '⚡ Data Warnings'}
            </p>
            <p className={`text-xs mt-0.5 ${hasCritical ? 'text-rose-700' : 'text-amber-700'}`}>
              {formatValidationSummary(validationResult)} — Go to Step 1 (Data Entry) to fix issues.
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar (Compact Second Rectangle) */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name or SN..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Gender Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              onClick={() => setFilterGender('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${filterGender === 'ALL' ? 'bg-white shadow text-slate-900 font-black' : 'text-slate-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterGender('M')}
              className={`px-2.5 py-1 rounded-md transition ${filterGender === 'M' ? 'bg-blue-600 shadow text-white font-black' : 'text-slate-600'}`}
            >
              Boys ({analyzed.filter(s => s.gender === 'M').length})
            </button>
            <button
              onClick={() => setFilterGender('F')}
              className={`px-2.5 py-1 rounded-md transition ${filterGender === 'F' ? 'bg-rose-600 shadow text-white font-black' : 'text-slate-600'}`}
            >
              Girls ({analyzed.filter(s => s.gender === 'F').length})
            </button>
          </div>

          {/* School/Stream Filter */}
          {uniqueSchools.length > 1 && (
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Schools ({analyzed.length})</option>
                {uniqueSchools.map(sch => (
                  <option key={sch} value={sch}>
                    {sch} ({analyzed.filter(s => s.school === sch).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiAdvisor}
            className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-xs font-extrabold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Insights</span>
          </button>
          <button
            onClick={onGoToReportCards}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition border border-rose-200"
          >
            <span>Report Cards</span>
            <Award className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Printable Analysis Table Container */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 2mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
          }
          .print-analysis-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .print-analysis-table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            font-size: 7.5pt !important;
            border-collapse: collapse !important;
          }
          .print-analysis-table th,
          .print-analysis-table td {
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            padding-left: 3px !important;
            padding-right: 3px !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
          }
          .print-analysis-table td.print-wrap-name {
            white-space: normal !important;
            max-width: 140px !important;
          }
          .print-analysis-table tr {
            height: auto !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none print-analysis-container">
        {/* Official Header for Print & Display */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white text-center border-b border-slate-800 print:bg-white print:text-black print:p-1.5 print:border-b-2 print:border-black">
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-wide">
            {currentClass.schoolName || "NANGO ZONE JUNIOR SCHOOLS"}
          </h1>
          <h2 className="text-xs sm:text-sm font-extrabold text-emerald-400 uppercase tracking-tight mt-0.5 print:text-black">
            {currentClass.examName} — {currentClass.className} ANALYSIS REPORT
          </h2>
          <p className="text-[11px] text-slate-300 font-semibold mt-0.5 print:text-gray-700">
            {currentClass.termDetails} • RANKING CRITERIA: TOTAL POINTS (MAX 72 PTS = 9 SUBJECTS × 8)
          </p>
        </div>

        {/* Condensed Data Table (No unnecessary rows or columns) */}
        <div className="overflow-x-auto max-h-[750px] sm:max-h-[820px] scrollbar-thin print:overflow-visible print:max-h-none print:h-auto print:w-full">
          <table className="w-full text-left border-collapse min-w-[1250px] print:min-w-0 print:w-full print-analysis-table">
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider print:bg-gray-200 print:text-black print:border-y-2 print:border-black">
                <th className="py-2.5 px-2 border-r border-slate-700 print:border-gray-400 w-10 text-center">SN</th>
                <th className="py-2.5 px-3 border-r border-slate-700 print:border-gray-400 min-w-[160px]">NAME</th>
                <th className="py-2.5 px-1.5 border-r border-slate-700 print:border-gray-400 w-12 text-center">GEND</th>
                <th className="py-2.5 px-2 border-r border-slate-700 print:border-gray-400 w-24">SCHOOL</th>
                {SUBJECT_LIST.map((sub) => (
                  <th key={sub.key} className="py-2.5 px-1.5 border-r border-slate-700 print:border-gray-400 w-20 text-center bg-blue-950/70 print:bg-transparent">
                    {sub.short}
                    <div className="text-[9px] font-normal text-emerald-300 print:text-gray-600 font-mono">[sc lvl]</div>
                  </th>
                ))}
                <th className="py-2.5 px-2 border-r border-slate-700 print:border-gray-400 w-16 text-center bg-emerald-950/80 text-emerald-300 print:bg-transparent print:text-black">
                  MARKS
                  <div className="text-[8px] font-normal font-mono">/900</div>
                </th>
                <th className="py-2.5 px-2 border-r border-slate-700 print:border-gray-400 w-16 text-center bg-amber-950/80 text-amber-300 print:bg-transparent print:text-black">
                  POINTS
                  <div className="text-[8px] font-normal font-mono">/72</div>
                </th>
                <th className="py-2.5 px-2 border-r border-slate-700 print:border-gray-400 w-14 text-center bg-purple-950/80 text-purple-300 print:bg-transparent print:text-black">
                  T.PL
                </th>
                <th className="py-2.5 px-2 border-r border-slate-700 print:border-gray-400 w-14 text-center bg-rose-950/80 text-rose-300 print:bg-transparent print:text-black font-black">
                  RANK
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-800 print:divide-gray-300">
              {filtered.map((st) => (
                <tr 
                  key={st.sn} 
                  className={`hover:bg-blue-50/50 transition-colors ${
                    st.rank <= 3 ? 'bg-amber-50/40 print:bg-transparent font-bold' : ''
                  }`}
                >
                  <td className="py-1.5 px-2 border-r border-slate-200 print:border-gray-300 text-center font-mono text-slate-500">
                    {st.sn}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-200 print:border-gray-300 font-black text-slate-900 uppercase print-wrap-name">
                    <div className="flex items-center justify-between">
                      <span>{st.name}</span>
                      {st.rank <= 3 && (
                        <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded font-black print:hidden">
                          #{st.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-1.5 px-1.5 border-r border-slate-200 print:border-gray-300 text-center font-bold">
                    <span className={st.gender === 'F' ? 'text-rose-600' : 'text-blue-600'}>
                      {st.gender}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 print:border-gray-300 font-semibold text-slate-700 uppercase text-[11px]">
                    {st.school}
                  </td>

                  {/* EXACT CELL FORMAT REQUIRED: [score   level] in same cell, score left aligned, level right aligned */}
                  {SUBJECT_LIST.map((sub) => {
                    const evalScore = st.subjectEvaluations[sub.key];
                    return (
                      <td key={sub.key} className="py-1.5 px-1.5 border-r border-slate-200 print:border-gray-300 text-center font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-left font-bold text-slate-900 text-xs">
                            {evalScore.mark}
                          </span>
                          <span className={`text-right text-[10px] font-extrabold px-1 rounded ${
                            evalScore.grade.startsWith('EE') ? 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black' :
                            evalScore.grade.startsWith('ME') ? 'bg-blue-100 text-blue-800 print:bg-transparent print:text-black' :
                            evalScore.grade.startsWith('AE') ? 'bg-amber-100 text-amber-800 print:bg-transparent print:text-black' :
                            'bg-rose-100 text-rose-800 font-black print:bg-transparent print:text-black'
                          }`}>
                            {evalScore.grade}
                          </span>
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-1.5 px-2 border-r border-slate-200 print:border-gray-300 text-center font-mono font-extrabold text-blue-950 bg-slate-50/80 print:bg-transparent">
                    {st.totalMarks}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 print:border-gray-300 text-center font-mono font-black text-emerald-800 bg-emerald-50/50 print:bg-transparent text-sm">
                    {st.totalPoints}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 print:border-gray-300 text-center font-black">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      st.tplGrade.startsWith('EE') ? 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black' :
                      st.tplGrade.startsWith('ME') ? 'bg-blue-100 text-blue-800 print:bg-transparent print:text-black' :
                      st.tplGrade.startsWith('AE') ? 'bg-amber-100 text-amber-900 print:bg-transparent print:text-black' :
                      'bg-rose-100 text-rose-800 print:bg-transparent print:text-black'
                    }`}>
                      {st.tplGrade}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 print:border-gray-300 text-center font-black text-sm bg-rose-50/40 text-rose-950 print:bg-transparent">
                    {st.rank}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-500 bg-slate-50 font-bold">
                    No learners match the current search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Print Summary Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 print:border-t-2 print:border-black print:bg-white print:p-2 print:text-[8pt]">
          <div>
            Total Assessed: <span className="text-slate-900">{analyzed.length} Learners</span> • Boys: <span className="text-blue-600">{analyzed.filter(s => s.gender === 'M').length}</span> • Girls: <span className="text-rose-600">{analyzed.filter(s => s.gender === 'F').length}</span>
          </div>
          <div>
            Verified by Head of Institution: ___________________________ Date: _______________
          </div>
        </div>
      </div>
    </div>
  );
};
