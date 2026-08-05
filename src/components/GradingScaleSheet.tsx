import React, { useState } from 'react';
import { Sliders, HelpCircle, CheckCircle2, ShieldCheck, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { STANDARD_GRADING_SCALE } from '../data/sampleNangoData';

export const GradingScaleSheet: React.FC = () => {
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Banner - Collapsible Dashboard */}
      {isDashboardCollapsed ? (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-800/60 rounded-xl px-4 py-2.5 shadow-md text-white flex flex-wrap items-center justify-between gap-3 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-300 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">Step 4: Official CBC Grading Standards Dashboard</span>
            <span className="text-purple-100/80 text-xs hidden sm:inline">— Max 72 Points (9 Subjects × 8)</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="flex items-center gap-2 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-700 text-xs font-bold">
              <span className="text-purple-300">Max Pts:</span>
              <span className="text-yellow-300 font-black">72</span>
            </div>
            <button
              onClick={() => setIsDashboardCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/50 rounded-lg text-xs font-bold shadow transition"
            >
              <span>Expand Dashboard</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-5 shadow-xl text-white border border-purple-800/60 print:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Step 4: Official CBC Grading Standards</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                CBC GRADING SCALES & POINTS REFERENCE
              </h2>
              <p className="text-xs text-purple-100/90 leading-relaxed">
                These reference tables govern automated grading and point calculations across all learning areas. Student ranking is evaluated by Total Points (Table 3), where 9 subjects evaluated out of 8 points yield a maximum possible score of 72 points.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden md:flex items-center gap-3">
                <div className="bg-purple-950/80 p-2.5 rounded-xl border border-purple-700 text-center">
                  <span className="block text-[10px] text-purple-300 font-bold uppercase">Max Subjects</span>
                  <span className="text-xl font-black text-white">9</span>
                </div>
                <div className="bg-purple-950/80 p-2.5 rounded-xl border border-purple-700 text-center">
                  <span className="block text-[10px] text-purple-300 font-bold uppercase">Max Points</span>
                  <span className="text-xl font-black text-yellow-300">72</span>
                </div>
              </div>
              <button
                onClick={() => setIsDashboardCollapsed(true)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold transition self-start"
              >
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABLE 1: PER-SUBJECT GRADING */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>TABLE 1: Per-Subject Grading (out of 100)</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono">
              Max 8 Pts/Subject
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold text-xs uppercase border-b border-slate-200">
                <th className="py-2.5 px-4 w-20">Grade</th>
                <th className="py-2.5 px-4 w-32">Score Range</th>
                <th className="py-2.5 px-4 w-20 text-center">Points</th>
                <th className="py-2.5 px-4">Remarks / Competency Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-800">
              {STANDARD_GRADING_SCALE.map((g) => (
                <tr key={g.grade} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      g.grade.startsWith('EE') ? 'bg-emerald-100 text-emerald-900' :
                      g.grade.startsWith('ME') ? 'bg-blue-100 text-blue-900' :
                      g.grade.startsWith('AE') ? 'bg-amber-100 text-amber-900' :
                      'bg-rose-100 text-rose-900 font-extrabold'
                    }`}>
                      {g.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono">{g.minMark} - {g.maxMark}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-black text-emerald-700 text-sm">{g.points}</td>
                  <td className="py-2.5 px-4 text-slate-600">{g.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE 3: T.PL FROM TOTAL POINTS */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span>TABLE 3: T.PL from TOTAL POINTS</span>
            </div>
            <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-yellow-300 font-mono">
              Max 72 pts = 9 × 8
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold text-xs uppercase border-b border-slate-200">
                <th className="py-2.5 px-4 w-28">T.PL Grade</th>
                <th className="py-2.5 px-4 w-36">Points Range</th>
                <th className="py-2.5 px-4">Equivalent %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-800">
              {STANDARD_GRADING_SCALE.map((g) => (
                <tr key={`tpl-${g.grade}`} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      g.grade.startsWith('EE') ? 'bg-emerald-100 text-emerald-900' :
                      g.grade.startsWith('ME') ? 'bg-blue-100 text-blue-900' :
                      g.grade.startsWith('AE') ? 'bg-amber-100 text-amber-900' :
                      'bg-rose-100 text-rose-900 font-extrabold'
                    }`}>
                      {g.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-emerald-800 font-black text-sm">{g.minTplPoints} - {g.maxTplPoints}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{g.equivalentPct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: OVERALL TOTAL MARKS GRADING */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>TABLE 2: Overall TOTAL MARKS Grading (out of 900)</span>
          </div>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-blue-300 font-mono">
            9 Subjects × 100 Marks
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold text-xs uppercase border-b border-slate-200">
                <th className="py-2.5 px-4 w-28">Grade</th>
                <th className="py-2.5 px-4 w-40">Score Range (out of 900)</th>
                <th className="py-2.5 px-4 w-36">Equivalent %</th>
                <th className="py-2.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-800">
              {STANDARD_GRADING_SCALE.map((g) => (
                <tr key={`tot-${g.grade}`} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-black">
                    <span className={`px-2 py-0.5 rounded ${
                      g.grade.startsWith('EE') ? 'bg-emerald-100 text-emerald-900' :
                      g.grade.startsWith('ME') ? 'bg-blue-100 text-blue-900' :
                      g.grade.startsWith('AE') ? 'bg-amber-100 text-amber-900' :
                      'bg-rose-100 text-rose-900 font-extrabold'
                    }`}>
                      {g.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-extrabold text-blue-900 text-sm">{g.minTotalMarks} - {g.maxTotalMarks}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{g.equivalentPct}</td>
                  <td className="py-2.5 px-4 text-slate-700">{g.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
