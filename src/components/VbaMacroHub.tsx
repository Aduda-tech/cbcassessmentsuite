import React, { useState } from 'react';
import { 
  Code, 
  Download, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  Terminal, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { VBA_MAIN_MODULE_CODE, VBA_WORKBOOK_OPEN_CODE } from '../utils/vbaMacroCode';
import { downloadVbaModule, downloadFullExcelWorkbook } from '../utils/excelExport';
import { ClassConfig, StudentAnalysis } from '../types/cbc';
import { analyzeStudents } from '../utils/cbcCalculations';

interface VbaMacroHubProps {
  currentClass: ClassConfig;
}

export const VbaMacroHub: React.FC<VbaMacroHubProps> = ({ currentClass }) => {
  const [copiedModule, setCopiedModule] = useState(false);
  const [copiedOpen, setCopiedOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'module' | 'workbook'>('module');
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(true);

  const analyzed = analyzeStudents(currentClass.students);

  const handleCopyModule = () => {
    navigator.clipboard.writeText(VBA_MAIN_MODULE_CODE);
    setCopiedModule(true);
    setTimeout(() => setCopiedModule(false), 3000);
  };

  const handleCopyOpen = () => {
    navigator.clipboard.writeText(VBA_WORKBOOK_OPEN_CODE);
    setCopiedOpen(true);
    setTimeout(() => setCopiedOpen(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Top Banner - Collapsible Dashboard */}
      {isDashboardCollapsed ? (
        <div className="bg-gradient-to-r from-indigo-900 via-blue-950 to-slate-900 border border-indigo-800/60 rounded-xl px-4 py-2.5 shadow-md text-white flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-indigo-300">Step 6: Excel VBA & Macro Automation Hub Dashboard</span>
            <span className="text-indigo-100/80 text-xs hidden sm:inline">— Zero-Formula (.xlsm) Engine</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => downloadFullExcelWorkbook(currentClass, analyzed)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Workbook (.xls)</span>
            </button>
            <button
              onClick={downloadVbaModule}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition hidden sm:flex"
            >
              <Download className="w-3.5 h-3.5" />
              <span>VBA (.bas)</span>
            </button>
            <button
              onClick={() => setIsDashboardCollapsed(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/50 rounded-lg text-xs font-bold shadow transition"
            >
              <span>Expand Dashboard</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-900 via-blue-950 to-slate-900 rounded-2xl p-5 shadow-xl text-white border border-indigo-800/60 animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>Step 6: Full Excel VBA & Macro Automation Hub</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Zero-Formula Excel (.xlsm) Automation Engine
              </h2>
              <p className="text-xs text-indigo-100/90 leading-relaxed">
                Download your pre-formatted Excel template with a clean Data Entry sheet, blank Analysis sheet, Top Performers sheet, and Grading scale, fully automated through Excel VBA macros.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => downloadFullExcelWorkbook(currentClass, analyzed)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>1. Download Excel (.xls)</span>
              </button>
              <button
                onClick={downloadVbaModule}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>2. Download VBA (.bas)</span>
              </button>
              <button
                onClick={() => setIsDashboardCollapsed(true)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold transition ml-auto"
              >
                <span>Collapse</span>
                <ChevronUp className="w-4 h-4 text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Setup Instructions */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>How to Enable Macro Automation in Microsoft Excel (3 Simple Steps)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow">
              1
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Open the Workbook & VBA Editor</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Open the downloaded Excel Workbook in Microsoft Excel. Press <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-900 font-mono font-bold">Alt + F11</kbd> (or <kbd className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold">Fn + Alt + F11</kbd> on laptops) to launch the VBA Developer window.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow">
              2
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Insert the Macro Module</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In VBA window, click <span className="font-bold text-slate-800">Insert &gt; Module</span>. Copy the Main Module code below and paste it in. Then double-click <span className="font-bold text-slate-800">ThisWorkbook</span> on the left and paste the Workbook Open script.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-sm shadow">
              3
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Save as Macro-Enabled (.xlsm)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              In Excel, click <span className="font-bold text-slate-800">File &gt; Save As</span> and select <span className="font-bold text-amber-900 bg-amber-100 px-1 rounded">Excel Macro-Enabled Workbook (*.xlsm)</span>. Now your reports generate 100% automatically whenever data changes or workbook opens!
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Container */}
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden text-slate-200">
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('module')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeCodeTab === 'module' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Main VBA Module (CBC_Exam_Automation.bas)</span>
            </button>
            <button
              onClick={() => setActiveCodeTab('workbook')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeCodeTab === 'workbook' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>ThisWorkbook Script (Auto-run on Open/Change)</span>
            </button>
          </div>

          <div>
            {activeCodeTab === 'module' ? (
              <button
                onClick={handleCopyModule}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                {copiedModule ? <Check className="w-4 h-4 text-yellow-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedModule ? 'Copied VBA Module!' : 'Copy Module Code'}</span>
              </button>
            ) : (
              <button
                onClick={handleCopyOpen}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
              >
                {copiedOpen ? <Check className="w-4 h-4 text-yellow-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedOpen ? 'Copied ThisWorkbook Script!' : 'Copy ThisWorkbook Code'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-x-auto max-h-[600px] scrollbar-thin bg-slate-900">
          <pre className="font-mono text-xs leading-relaxed text-emerald-300">
            <code>{activeCodeTab === 'module' ? VBA_MAIN_MODULE_CODE : VBA_WORKBOOK_OPEN_CODE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
