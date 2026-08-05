import React, { useMemo, useState } from 'react';
import { 
  Award, 
  Trophy, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2,
  Medal,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ClassConfig, StudentAnalysis } from '../types/cbc';
import { analyzeStudents, calculateOverallSummary, calculateSubjectSummaries, getTopPerformers } from '../utils/cbcCalculations';
import { exportBestPerformedToCsv, downloadFullExcelWorkbook } from '../utils/excelExport';
import { triggerPrintWithReport } from '../utils/printHelper';

interface BestPerformedSheetProps {
  currentClass: ClassConfig;
  onGoToReportCards: () => void;
  onUpdateClass?: (updated: ClassConfig) => void;
}

export const BestPerformedSheet: React.FC<BestPerformedSheetProps> = ({
  currentClass,
  onGoToReportCards,
  onUpdateClass
}) => {
  const analyzed = useMemo(() => analyzeStudents(currentClass.students), [currentClass.students]);
  const [localTopCount, setLocalTopCount] = useState<number>(currentClass.topPerformersCount || 3);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(true);

  const topCount = onUpdateClass ? (currentClass.topPerformersCount || 3) : localTopCount;

  const { overall, boys, girls } = useMemo(() => getTopPerformers(analyzed, topCount), [analyzed, topCount]);
  const subSummaries = useMemo(() => calculateSubjectSummaries(analyzed), [analyzed]);
  const overallStats = useMemo(() => calculateOverallSummary(analyzed), [analyzed]);

  const handleTopCountChange = (newCount: number, triggerConfetti = true) => {
    const validCount = Math.max(1, Math.min(newCount, analyzed.length || 500));
    setLocalTopCount(validCount);
    if (onUpdateClass) {
      onUpdateClass({
        ...currentClass,
        topPerformersCount: validCount
      });
    }
    if (triggerConfetti) {
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#EAB308']
      });
    }
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6', '#EAB308', '#F43F5E']
    });
  };

  const handlePrintA4 = () => {
    triggerPrintWithReport("Step 3: Best Performed List");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Banner - Collapsible Dashboard */}
      {isDashboardCollapsed ? (
        <div className="bg-gradient-to-r from-amber-900 via-yellow-900 to-slate-900 border border-amber-700/50 rounded-xl px-4 py-2.5 shadow-md text-white flex flex-wrap items-center justify-between gap-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400 shrink-0 animate-bounce" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">Step 3: Best Performed Report Dashboard</span>
            <span className="text-amber-100/80 text-xs hidden sm:inline">— {currentClass.examName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={handleCelebrate}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-lg text-xs font-black shadow transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-950 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Celebrate</span>
            </button>
            <button
              onClick={handlePrintA4}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-bold shadow transition hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setIsDashboardCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-bold shadow transition"
            >
              <span>Expand Dashboard</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-900 via-yellow-900 to-slate-900 rounded-2xl p-5 shadow-xl text-white border border-amber-700/50 print:hidden animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Trophy className="w-4 h-4 text-yellow-400 animate-bounce" />
                <span>Step 3: Condensed Top Performers & Subject Insights</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {currentClass.examName} — BEST PERFORMED REPORT
              </h2>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                Condensed top performers ranking and learning area insights derived automatically from total points. Select the number of performers to highlight below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={handleCelebrate}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-black shadow transition hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-yellow-950 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Celebrate Top {topCount}</span>
              </button>
              <button
                onClick={() => exportBestPerformedToCsv({ ...currentClass, topPerformersCount: topCount }, analyzed)}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => downloadFullExcelWorkbook({ ...currentClass, topPerformersCount: topCount }, analyzed)}
                className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Excel</span>
              </button>
              <button
                onClick={handlePrintA4}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print A4 Portrait</span>
              </button>
              <button
                onClick={() => setIsDashboardCollapsed(true)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold transition ml-auto"
              >
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers Selector Bar (Compact Second Rectangle) */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-xl p-2.5 sm:p-3 border border-amber-300 shadow-sm print:hidden flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
            <Medal className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Interactive Filter</div>
            <div className="text-xs sm:text-sm font-black text-amber-950">Celebrate Top Performers:</div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[3, 5, 10, 15, 20, 30].map((num) => (
            <button
              key={num}
              onClick={() => handleTopCountChange(num, true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 shadow-sm ${
                topCount === num
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white scale-105 shadow-amber-500/30 ring-1 ring-amber-400'
                  : 'bg-white text-amber-950 border border-amber-300 hover:bg-amber-100'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${topCount === num ? 'text-yellow-200 animate-spin' : 'text-amber-500'}`} style={{ animationDuration: '3s' }} />
              <span>Top {num}</span>
            </button>
          ))}
          
          <button
            onClick={() => handleTopCountChange(analyzed.length || 50, true)}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1 shadow-sm ${
              topCount === analyzed.length
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-105 shadow-blue-500/30 ring-1 ring-blue-400'
                : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3 h-3 text-blue-500" />
            <span>All ({analyzed.length})</span>
          </button>

          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-sm ml-auto md:ml-1">
            <span className="text-[11px] font-black text-amber-900 uppercase">Custom:</span>
            <input
              type="number"
              min="1"
              max={analyzed.length || 500}
              value={topCount}
              onChange={(e) => handleTopCountChange(Math.max(1, Number(e.target.value)), false)}
              className="w-12 px-1 py-0.5 text-xs font-black text-amber-950 bg-amber-50 border border-amber-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
            />
          </div>
        </div>
      </div>

      {/* Portrait Print & 1-Page Shrink-to-Fit Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 2mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
          }
          .print-best-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-best-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 7.5pt !important;
          }
          .print-best-table th,
          .print-best-table td {
            padding-top: 1px !important;
            padding-bottom: 1px !important;
            padding-left: 3px !important;
            padding-right: 3px !important;
            line-height: 1.1 !important;
            height: auto !important;
          }
          .print-best-section {
            margin-bottom: 0 !important;
            page-break-inside: avoid !important;
          }
          .print-best-header {
            padding-top: 1px !important;
            padding-bottom: 1px !important;
            font-size: 7pt !important;
          }
          .print-school-header {
            padding-bottom: 2px !important;
            margin-bottom: 3px !important;
          }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 pb-2 sm:pb-2 print:shadow-none print:border-none print:p-0 print:text-[9pt] print-best-container">
        {/* Official School Header */}
        <div className="text-center pb-3 mb-4 border-b-2 border-slate-800 print:mb-1 print:pb-0.5 print-school-header">
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
            {currentClass.schoolName || "NANGO ZONE JUNIOR SCHOOLS"}
          </h1>
          <h2 className="text-base font-extrabold text-blue-900 uppercase tracking-tight mt-1">
            {currentClass.examName} — BEST PERFORMED REPORT
          </h2>
          <p className="text-xs font-bold text-slate-600 mt-0.5">
            {currentClass.termDetails} • RANKING CRITERIA: TOTAL POINTS (MAX 72 PTS) • FILTER: TOP {topCount}
          </p>
        </div>

        {/* --- TABLE 1: TOP N STUDENTS OVERALL --- */}
        <div className="mb-4 print:mb-0 print-best-section">
          <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white font-black text-sm px-4 py-2 rounded-t-xl flex items-center justify-between print:bg-gray-200 print:text-black print:border print:border-black print-best-header">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <Trophy className="w-4 h-4 text-yellow-400 print:text-black" />
              <span>TOP {topCount} STUDENTS — OVERALL</span>
            </span>
            <span className="text-xs font-normal text-slate-300 print:text-gray-700 font-mono">
              Ranked by Total Points
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 print:border-black print-best-table">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold text-xs uppercase border-b border-slate-300 print:bg-gray-100">
                  <th className="py-2 px-3 border-r border-slate-300 w-16 text-center">Rank</th>
                  <th className="py-2 px-4 border-r border-slate-300">Student Name</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-20 text-center">Gender</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-32">School</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Total Marks</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Total Points</th>
                  <th className="py-2 px-3 w-24 text-center">T.PL Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                {overall.map((s, idx) => (
                  <tr key={s.sn} className={idx === 0 ? 'bg-amber-50/70 print:bg-transparent font-black' : ''}>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        s.rank === 1 ? 'bg-amber-400 text-amber-950 font-black shadow-sm print:bg-transparent print:border print:border-black' :
                        s.rank === 2 ? 'bg-slate-300 text-slate-900 font-black' :
                        s.rank === 3 ? 'bg-amber-700 text-amber-100 font-black' : ''
                      }`}>
                        {s.rank}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-r border-slate-200 uppercase">{s.name}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center">
                      <span className={s.gender === 'F' ? 'text-rose-600 font-extrabold' : 'text-blue-600 font-extrabold'}>
                        {s.gender}
                      </span>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 uppercase">{s.school}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{s.totalMarks}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-black text-emerald-700 text-sm">{s.totalPoints}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black print:bg-transparent print:text-black">
                        {s.tplGrade}
                      </span>
                    </td>
                  </tr>
                ))}
                {overall.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center font-normal text-slate-500">No student data available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* At most 2 rows space between tables! Using exact margin mb-8 */}
        
        {/* --- TABLE 2: TOP N BOYS --- */}
        <div className="mb-4 print:mb-0 print-best-section">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white font-black text-sm px-4 py-2 rounded-t-xl flex items-center justify-between print:bg-gray-200 print:text-black print:border print:border-black print-best-header">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <Medal className="w-4 h-4 text-blue-300 print:text-black" />
              <span>TOP {topCount} BOYS</span>
            </span>
            <span className="text-xs font-normal text-blue-200 print:text-gray-700 font-mono">
              Boys Category Ranking
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 print:border-black print-best-table">
              <thead>
                <tr className="bg-blue-50/60 text-blue-950 font-extrabold text-xs uppercase border-b border-slate-300 print:bg-gray-100 print:text-black">
                  <th className="py-2 px-3 border-r border-slate-300 w-16 text-center">Rank</th>
                  <th className="py-2 px-4 border-r border-slate-300">Student Name</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-20 text-center">Gender</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-32">School</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Total Marks</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Total Points</th>
                  <th className="py-2 px-3 w-24 text-center">T.PL Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                {boys.map((s, idx) => (
                  <tr key={s.sn} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-black">{idx + 1}</td>
                    <td className="py-2 px-4 border-r border-slate-200 uppercase">{s.name}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-blue-600 font-extrabold">M</td>
                    <td className="py-2 px-3 border-r border-slate-200 uppercase">{s.school}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{s.totalMarks}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-black text-blue-800 text-sm">{s.totalPoints}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black print:bg-transparent print:text-black">
                        {s.tplGrade}
                      </span>
                    </td>
                  </tr>
                ))}
                {boys.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center font-normal text-slate-500">No boy learners found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- TABLE 3: TOP N GIRLS --- */}
        <div className="mb-4 print:mb-0 print-best-section">
          <div className="bg-gradient-to-r from-rose-900 to-purple-900 text-white font-black text-sm px-4 py-2 rounded-t-xl flex items-center justify-between print:bg-gray-200 print:text-black print:border print:border-black print-best-header">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <Medal className="w-4 h-4 text-rose-300 print:text-black" />
              <span>TOP {topCount} GIRLS</span>
            </span>
            <span className="text-xs font-normal text-rose-200 print:text-gray-700 font-mono">
              Girls Category Ranking
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 print:border-black print-best-table">
              <thead>
                <tr className="bg-rose-50/60 text-rose-950 font-extrabold text-xs uppercase border-b border-slate-300 print:bg-gray-100 print:text-black">
                  <th className="py-2 px-3 border-r border-slate-300 w-16 text-center">Rank</th>
                  <th className="py-2 px-4 border-r border-slate-300">Student Name</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-20 text-center">Gender</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-32">School</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Total Marks</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-28 text-center">Total Points</th>
                  <th className="py-2 px-3 w-24 text-center">T.PL Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                {girls.map((s, idx) => (
                  <tr key={s.sn} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-black">{idx + 1}</td>
                    <td className="py-2 px-4 border-r border-slate-200 uppercase">{s.name}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-rose-600 font-extrabold">F</td>
                    <td className="py-2 px-3 border-r border-slate-200 uppercase">{s.school}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono">{s.totalMarks}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-black text-rose-800 text-sm">{s.totalPoints}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black print:bg-transparent print:text-black">
                        {s.tplGrade}
                      </span>
                    </td>
                  </tr>
                ))}
                {girls.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center font-normal text-slate-500">No girl learners found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- TABLE 4: BEST PERFORMED LEARNING AREAS --- */}
        <div className="mb-4 print:mb-0 print-best-section">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white font-black text-sm px-4 py-2 rounded-t-xl flex items-center justify-between print:bg-gray-200 print:text-black print:border print:border-black print-best-header">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-emerald-300 print:text-black" />
              <span>BEST PERFORMED LEARNING AREAS</span>
            </span>
            <span className="text-xs font-normal text-emerald-200 print:text-gray-700 font-mono">
              Sorted by Mean Score (Desc)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 print:border-black print-best-table">
              <thead>
                <tr className="bg-emerald-50/60 text-emerald-950 font-extrabold text-xs uppercase border-b border-slate-300 print:bg-gray-100 print:text-black">
                  <th className="py-2 px-4 border-r border-slate-300">Learning Area / Subject</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-32 text-center">Mean Score</th>
                  <th className="py-2 px-4 border-r border-slate-300">Best Performer</th>
                  <th className="py-2 px-3 border-r border-slate-300 w-32 text-center">Highest Score</th>
                  <th className="py-2 px-3 w-28 text-center">CBC Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                {subSummaries.map((sub) => (
                  <tr key={sub.subject} className="hover:bg-slate-50">
                    <td className="py-2 px-4 border-r border-slate-200 font-black uppercase text-slate-800">{sub.label}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-emerald-800 text-sm">{sub.meanScore}</td>
                    <td className="py-2 px-4 border-r border-slate-200 uppercase font-semibold text-slate-700">{sub.bestPerformerName}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-extrabold text-slate-900">{sub.highestScore}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-black ${
                        sub.cbcGrade.startsWith('EE') ? 'bg-emerald-100 text-emerald-800 print:bg-transparent print:text-black' :
                        sub.cbcGrade.startsWith('ME') ? 'bg-blue-100 text-blue-800 print:bg-transparent print:text-black' :
                        sub.cbcGrade.startsWith('AE') ? 'bg-amber-100 text-amber-900 print:bg-transparent print:text-black' :
                        'bg-rose-100 text-rose-800 print:bg-transparent print:text-black'
                      }`}>
                        {sub.cbcGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- TABLE 5: OVERALL SUMMARY --- */}
        <div className="mb-4 print:mb-0 print-best-section">
          <div className="bg-slate-800 text-white font-black text-sm px-4 py-2 rounded-t-xl flex items-center justify-between print:bg-gray-200 print:text-black print:border print:border-black print-best-header">
            <span className="flex items-center gap-2 uppercase tracking-wide">
              <Users className="w-4 h-4 text-slate-300 print:text-black" />
              <span>OVERALL SUMMARY</span>
            </span>
            <span className="text-xs font-normal text-slate-400 print:text-gray-700 font-mono">
              Class Performance Statistics
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300 print:border-black print-best-table">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-extrabold text-xs uppercase border-b border-slate-300 print:bg-gray-100">
                  <th className="py-2.5 px-4 border-r border-slate-300">Metric</th>
                  <th className="py-2.5 px-4 border-r border-slate-300 w-36 text-center">Overall</th>
                  <th className="py-2.5 px-4 border-r border-slate-300 w-36 text-center text-blue-800 print:text-black">Boys</th>
                  <th className="py-2.5 px-4 w-36 text-center text-rose-800 print:text-black">Girls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-900">
                <tr>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-slate-700 font-black">Total Students</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono font-black text-slate-900 text-sm">{overallStats.totalStudents}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono text-blue-700 text-sm">{overallStats.boysCount}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-rose-700 text-sm">{overallStats.girlsCount}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-slate-700 font-black">Mean Total Marks (out of 900)</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono font-black text-emerald-800 text-sm">{overallStats.meanTotalMarks}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono text-blue-800">{overallStats.boysMeanTotalMarks}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-rose-800">{overallStats.girlsMeanTotalMarks}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-slate-700 font-black">Best Total Marks</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono font-black text-amber-600 text-sm">{overallStats.bestTotalMarks}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono text-slate-400">-</td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-slate-700 font-black">Mean Total Points (out of 72)</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono font-black text-purple-900 text-sm">{overallStats.meanTotalPoints}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono text-blue-900 font-extrabold">{overallStats.boysMeanTotalPoints}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-rose-900 font-extrabold">{overallStats.girlsMeanTotalPoints}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Signature Line */}
        <div className="mt-4 pt-2 border-t border-slate-300 print:mt-1 print:pt-0.5">
          <div className="flex justify-end text-xs font-bold text-slate-700 print:text-[8pt]">
            <div>HOI Signature & Stamp: _______________________________</div>
          </div>
          <div className="mt-1 print:mt-0.5 flex justify-start text-[6px] sm:text-[6px] print:text-[6pt] font-normal text-slate-500">
            <div>Report Generated by: Aduda-Tech CBC Assessment Suite (0725924995)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
