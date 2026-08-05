import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  User, 
  Calendar, 
  Building2, 
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ClassConfig, StudentAnalysis, SUBJECT_LIST } from '../types/cbc';
import { analyzeStudents } from '../utils/cbcCalculations';
import { triggerPrintWithReport } from '../utils/printHelper';

interface ReportCardsViewProps {
  currentClass: ClassConfig;
}

export const ReportCardsView: React.FC<ReportCardsViewProps> = ({ currentClass }) => {
  const analyzed = useMemo(() => analyzeStudents(currentClass.students), [currentClass.students]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [printBatch, setPrintBatch] = useState<boolean>(false);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const currentStudent = analyzed[selectedIndex] || analyzed[0];

  const handlePrintSingle = () => {
    setPrintBatch(false);
    setTimeout(() => {
      triggerPrintWithReport(`Learner Report Card — ${currentStudent?.name || 'Student'}`);
    }, 100);
  };

  const handlePrintAll = () => {
    setPrintBatch(true);
    setTimeout(() => {
      triggerPrintWithReport(`Batch Report Cards (${analyzed.length} Learners)`);
    }, 100);
  };

  const nextStudent = () => {
    if (selectedIndex < analyzed.length - 1) setSelectedIndex(selectedIndex + 1);
  };

  const prevStudent = () => {
    if (selectedIndex > 0) setSelectedIndex(selectedIndex - 1);
  };

  if (!analyzed || analyzed.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 font-bold">No learners available to generate report cards. Add students in Data Entry first!</p>
      </div>
    );
  }

  // Component for rendering a single report card (used for single view or batch loop)
  const renderCard = (st: StudentAnalysis, isBatch: boolean = false) => (
    <div 
      key={st.sn} 
      className={`bg-white border-2 border-slate-800 p-8 shadow-2xl mx-auto max-w-[850px] text-slate-900 ${
        isBatch ? 'mb-12 break-after-page print:mb-0 print:border-2 print:border-black print:p-6 print:shadow-none' : 'print:border-2 print:border-black print:p-4 print:shadow-none'
      }`}
      style={{ minHeight: '1030px', position: 'relative' }}
    >
      {/* Official Kenyan School Crest & Header */}
      <div className="border-b-4 border-double border-slate-900 pb-3 mb-4 text-center">
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center bg-white print:bg-white p-0.5 overflow-hidden"><img src="data:image/png;base64,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" alt="Kenyan Coat of Arms" className="w-10 h-10 object-contain" /></div>
          <div className="flex-1 px-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide uppercase font-serif text-slate-900">
              {currentClass.schoolName || "NANGO ZONE JUNIOR SCHOOLS"}
            </h1>
            <p className="text-xs font-extrabold text-slate-700 italic tracking-wider mt-0.5">
              "{currentClass.motto || "Excellence Through Competency & Character"}"
            </p>
            <h2 className="text-base font-black uppercase tracking-tight text-blue-900 mt-1.5 bg-blue-50 py-1 px-3 inline-block rounded border border-blue-200 print:border-black print:bg-transparent">
              {currentClass.examName} — OFFICIAL REPORT CARD
            </h2>
          </div>
          <div className="w-14 h-14 rounded-full border-2 border-slate-800 flex items-center justify-center bg-slate-100 print:bg-transparent overflow-hidden">
            {currentClass.schoolLogo ? (
              <img src={currentClass.schoolLogo} alt="School Logo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-[14px] font-black uppercase text-center leading-tight text-slate-800">CBC</span>
            )}
          </div>
        </div>
        <div className="mt-2 text-xs font-bold text-slate-700 uppercase tracking-widest">
          {currentClass.termDetails} • {currentClass.className}
        </div>
      </div>

      {/* Learner Bio Details Grid */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs print:bg-transparent print:border-black">
        <div>
          <span className="block font-bold text-slate-500 uppercase text-[10px]">Learner Name</span>
          <span className="text-sm font-black uppercase text-slate-900">{st.name}</span>
        </div>
        <div>
          <span className="block font-bold text-slate-500 uppercase text-[10px]">Admission / SN</span>
          <span className="text-sm font-black font-mono text-slate-900">{st.sn}</span>
        </div>
        <div>
          <span className="block font-bold text-slate-500 uppercase text-[10px]">Gender & School</span>
          <span className="text-sm font-extrabold text-slate-900">{st.gender} — {st.school}</span>
        </div>
        <div className="bg-amber-100/70 p-2 rounded border border-amber-300 text-center print:bg-transparent print:border-black">
          <span className="block font-bold text-amber-900 uppercase text-[10px]">Overall Position / Rank</span>
          <span className="text-base font-black text-amber-950 font-mono">
            {st.rank} <span className="text-xs font-bold text-slate-600">of {analyzed.length}</span>
          </span>
        </div>
      </div>

      {/* 9 Learning Areas Breakdown Table */}
      <div className="mb-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 bg-slate-200 px-3 py-1.5 rounded-t border-t border-x border-slate-400 print:bg-gray-200 print:border-black">
          Competency Assessment Across 9 Learning Areas
        </h3>
        <table className="w-full text-left border-collapse border border-slate-400 print:border-black text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-black uppercase text-xs print:bg-gray-200 print:text-black">
              <th className="py-2 px-2 border-r border-slate-400 print:border-black">Learning Area / Subject</th>
              <th className="py-2 px-2 border-r border-slate-400 print:border-black w-20 text-center">Score /100</th>
              <th className="py-2 px-2 border-r border-slate-400 print:border-black w-20 text-center">Points /8</th>
              <th className="py-2 px-2 border-r border-slate-400 print:border-black w-20 text-center">CBC Grade</th>
              <th className="py-1.5 px-2">Competency Level & Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300 font-bold text-slate-900 print:divide-black">
            {SUBJECT_LIST.map((sub) => {
              const e = st.subjectEvaluations[sub.key];
              return (
                <tr key={sub.key} className="hover:bg-slate-50">
                  <td className="py-1 px-2 border-r border-slate-300 print:border-black uppercase font-black">{sub.label}</td>
                  <td className="py-1 px-2 border-r border-slate-300 print:border-black text-center font-mono text-xs">{e.mark}</td>
                  <td className="py-1 px-2 border-r border-slate-300 print:border-black text-center font-mono font-black text-emerald-800 text-xs">{e.points}</td>
                  <td className="py-1 px-2 border-r border-slate-300 print:border-black text-center font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      e.grade.startsWith('EE') ? 'bg-emerald-100 text-emerald-900 print:bg-transparent' :
                      e.grade.startsWith('ME') ? 'bg-blue-100 text-blue-900 print:bg-transparent' :
                      e.grade.startsWith('AE') ? 'bg-amber-100 text-amber-900 print:bg-transparent' :
                      'bg-rose-100 text-rose-900 print:bg-transparent'
                    }`}>
                      {e.grade}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-slate-700 font-medium">{e.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center border-2 border-slate-800 rounded-lg p-3 bg-slate-900 text-white print:bg-white print:text-black print:border-black">
        <div className="border-r border-slate-700 print:border-gray-400">
          <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Total Marks (out of 900)</span>
          <span className="text-xl font-black font-mono text-emerald-400 print:text-black">{st.totalMarks}</span>
        </div>
        <div className="border-r border-slate-700 print:border-gray-400">
          <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Total Points (out of 72)</span>
          <span className="text-xl font-black font-mono text-yellow-400 print:text-black">{st.totalPoints}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Overall T.PL Grade</span>
          <span className="text-xl font-black text-blue-300 print:text-black">{st.tplGrade}</span>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="space-y-3 border-t-2 border-slate-800 pt-3 print:border-black">
        <div className="bg-blue-50/50 p-3 rounded border border-blue-200 print:bg-transparent print:border-black">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase text-blue-950">Class Teacher's Remarks</span>
            <span className="text-[10px] font-bold text-slate-500">Sign: ___________________</span>
          </div>
          <p className="text-xs font-bold text-slate-800 italic">"{st.classTeacherRemarks}"</p>
        </div>

        <div className="bg-amber-50/50 p-3 rounded border border-amber-200 print:bg-transparent print:border-black">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase text-amber-950">Head of Institution (HOI) Performance Remarks</span>
            <span className="text-[10px] font-bold text-slate-500">Sign & Stamp: ___________________</span>
          </div>
          <p className="text-xs font-black text-slate-900 italic">"{st.hoiRemarks}"</p>
        </div>
      </div>

      {/* Footer & Closing Dates */}
      <div className="mt-5 pt-2 border-t border-slate-300 flex items-center justify-between text-[11px] font-bold text-slate-600 print:mt-3 print:border-black">
        <div>Next Term Opens On: _______________________</div>
        <div className="border-2 border-dashed border-slate-400 rounded px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide inline-block">Official School Stamp</div>
        <div>Page 1 of 1</div>
      </div>
      {/* Developer credit — non-intrusive overlay */}
      <div style={{position:'absolute',bottom:'2mm',left:'2mm',fontSize:'5pt',color:'#94a3b8',fontFamily:'monospace'}}>
        Developed by Aduda-Tech — 0725924995
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
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
        }
      `}</style>
      {/* Interactive Controls Bar - Collapsible Dashboard */}
      {isDashboardCollapsed ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 shadow-md text-white flex flex-wrap items-center justify-between gap-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-rose-300">Step 5: Report Cards</span>
            <span className="text-slate-300 text-xs font-mono hidden sm:inline">#{currentStudent?.rank} — {currentStudent?.name} ({selectedIndex + 1}/{analyzed.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Compact Learner Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={prevStudent}
                disabled={selectedIndex === 0}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-bold font-mono">
                #{currentStudent?.rank}
              </span>
              <button
                onClick={nextStudent}
                disabled={selectedIndex === analyzed.length - 1}
                className="p-1 hover:bg-slate-700 rounded disabled:opacity-40 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePrintSingle}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>

            <button
              onClick={handlePrintAll}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black shadow transition hidden md:flex"
            >
              <Printer className="w-3.5 h-3.5 text-yellow-300" />
              <span>Batch ({analyzed.length})</span>
            </button>

            <button
              onClick={() => setIsDashboardCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/50 rounded-lg text-xs font-bold shadow transition"
            >
              <span>Expand Dashboard</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/20 p-2.5 rounded-xl text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Kenyan CBC Report Cards
              </h2>
              <p className="text-xs text-slate-400">
                Viewing Learner {selectedIndex + 1} of {analyzed.length} • Switch between learners or print all in batch!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Learner Switcher Buttons */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={prevStudent}
                disabled={selectedIndex === 0}
                className="p-1.5 hover:bg-slate-700 rounded-lg disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-xs font-bold font-mono">
                #{currentStudent?.rank} — {currentStudent?.name}
              </span>
              <button
                onClick={nextStudent}
                disabled={selectedIndex === analyzed.length - 1}
                className="p-1.5 hover:bg-slate-700 rounded-lg disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handlePrintSingle}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              <span>Print Current (A4)</span>
            </button>

            <button
              onClick={handlePrintAll}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow transition hover:scale-105"
            >
              <Printer className="w-4 h-4 text-yellow-300" />
              <span>Batch Print All {analyzed.length}</span>
            </button>

            <button
              onClick={() => setIsDashboardCollapsed(true)}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold transition ml-auto"
            >
              <span>Collapse</span>
              <ChevronUp className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* Render either Single card or Batch stack */}
      <div className="py-4">
        {printBatch ? (
          <div>
            <div className="bg-amber-100 text-amber-900 p-3 rounded-xl mb-6 text-center text-xs font-bold print:hidden">
              ⚡ Batch Printing Mode Active! Generating {analyzed.length} report cards stacked with page breaks. Press Ctrl+P or Cmd+P to print.
            </div>
            {analyzed.map((st) => renderCard(st, true))}
          </div>
        ) : (
          renderCard(currentStudent)
        )}
      </div>
    </div>
  );
};
