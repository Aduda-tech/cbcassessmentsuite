import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ClipboardPaste, 
  RotateCcw, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Sliders, 
  FileSpreadsheet, 
  HelpCircle,
  Sparkles,
  ChevronDown,
  Upload,
  ChevronUp
} from 'lucide-react';
import { ClassConfig, StudentRaw, SUBJECT_LIST, SubjectKey } from '../types/cbc';
import { validateAndCleanStudents, formatValidationSummary } from '../utils/dataCleaning';
import { SAMPLE_STUDENTS } from '../data/sampleNangoData';

interface DataEntrySheetProps {
  currentClass: ClassConfig;
  onUpdateClass: (updated: ClassConfig) => void;
  onGoToAnalysis: () => void;
}

export const DataEntrySheet: React.FC<DataEntrySheetProps> = ({
  currentClass,
  onUpdateClass,
  onGoToAnalysis
}) => {
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMode, setPasteMode] = useState<'append' | 'replace'>('append');
  const [notification, setNotification] = useState<string | null>(null);
  const [isDashboardCollapsed, setIsDashboardCollapsed] = useState(true);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConfigChange = (field: keyof ClassConfig, val: any) => {
    onUpdateClass({
      ...currentClass,
      [field]: val
    });
  };

  const handleStudentChange = (idx: number, field: string, val: any) => {
    const updatedStudents = [...currentClass.students];
    if (field === 'sn') {
      updatedStudents[idx].sn = Number(val) || 0;
    } else if (field === 'name') {
      updatedStudents[idx].name = val.toUpperCase();
    } else if (field === 'gender') {
      updatedStudents[idx].gender = val === 'F' ? 'F' : 'M';
    } else if (field === 'school') {
      updatedStudents[idx].school = val.toUpperCase();
    } else {
      // Score change
      const mark = Math.min(100, Math.max(0, Number(val) || 0));
      updatedStudents[idx].scores = {
        ...updatedStudents[idx].scores,
        [field as SubjectKey]: mark
      };
    }
    onUpdateClass({ ...currentClass, students: updatedStudents });
  };

  const handleAddStudent = () => {
    const nextSn = currentClass.students.length > 0 
      ? Math.max(...currentClass.students.map(s => s.sn)) + 1 
      : 1;
    
    const newStudent: StudentRaw = {
      sn: nextSn,
      name: "NEW LEARNER",
      gender: "M",
      school: "CONSO",
      scores: {
        MATHS: 50,
        ENG: 60,
        KISWAHILI: 55,
        SCIENCE: 50,
        AGRIC: 60,
        SST: 50,
        CRE: 65,
        CAS: 60,
        PRETECH: 55
      }
    };
    onUpdateClass({
      ...currentClass,
      students: [...currentClass.students, newStudent]
    });
    showToast("Added new student row!");
  };

  const handleDeleteStudent = (idx: number) => {
    if (window.confirm(`Delete student ${currentClass.students[idx].name}?`)) {
      const updated = currentClass.students.filter((_, i) => i !== idx);
      onUpdateClass({ ...currentClass, students: updated });
      showToast("Student deleted.");
    }
  };

  const handleResetSample = () => {
    if (window.confirm("Reset data to original Nango Zone 70+ student sample?")) {
      onUpdateClass({
        ...currentClass,
        students: SAMPLE_STUDENTS
      });
      showToast("Reset to Nango Zone sample data!");
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all student records for this class?")) {
      onUpdateClass({
        ...currentClass,
        students: []
      });
      showToast("All student records cleared.");
    }
  };

  const handleExcelPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;

    // Normalize line endings (CRLF/CR -> LF), trim each line, drop blanks
    const lines = pasteText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedStudents: StudentRaw[] = [];
    let startSn = currentClass.students.length > 0 && pasteMode === 'append'
      ? Math.max(...currentClass.students.map(s => s.sn)) + 1
      : 1;

    for (const line of lines) {
      if (!line.trim()) continue;
      // Parse the line properly handling quoted fields (Excel CSV format).
      // A field may contain commas inside double-quotes, e.g.: "DOE, JOHN"
      const parts: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if ((ch === '	' || ch === ',') && !inQuotes) {
          parts.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      parts.push(current.trim());
      
      // Check if it's a header line
      // Detect header row: first cell is "SN" (case-insensitive, with or without quotes)
      const firstCell = parts[0].replace(/^"|"$/g, '').toLowerCase();
      const secondCell = (parts[1] || '').replace(/^"|"$/g, '').toLowerCase();
      if (firstCell === 'sn' || firstCell === 's/n' || secondCell === 'name') continue;

      // Also skip summary/footer rows that Excel sometimes includes
      if (firstCell === 'total' || firstCell === 'mean' || firstCell === 'average' || firstCell === '') continue;

      // Expecting order: [SN, NAME, GENDER, SCHOOL, MATHS, ENG, KISWAHILI, SCIENCE, AGRIC, SST, CRE, CAS, PRETECH]
      // Or just [NAME, GENDER, SCHOOL, MATHS...] if SN is omitted
      let snVal = startSn;
      let nameVal = '';
      let genderVal: 'M' | 'F' = 'M';
      let schoolVal = 'CONSO';
      let scoresArr: number[] = [];

      if (!isNaN(Number(parts[0])) && parts.length >= 13) {
        snVal = Number(parts[0]);
        nameVal = (parts[1] || `LEARNER ${snVal}`).replace(/^"|"$/g, '');
        genderVal = ((parts[2] || '').replace(/^"|"$/g, '').toUpperCase() === 'F' ? 'F' : 'M');
        schoolVal = parts[3]?.toUpperCase() || 'CONSO';
        scoresArr = parts.slice(4, 13).map(n => Math.min(100, Math.max(0, Number(n) || 0)));
      } else {
        nameVal = parts[0] || `LEARNER ${startSn}`;
        genderVal = (parts[1]?.toUpperCase() === 'F' ? 'F' : 'M');
        schoolVal = parts[2]?.toUpperCase() || 'CONSO';
        scoresArr = parts.slice(3, 12).map(n => Math.min(100, Math.max(0, Number(n) || 0)));
      }

      while (scoresArr.length < 9) scoresArr.push(50);

      parsedStudents.push({
        sn: snVal,
        name: nameVal.toUpperCase(),
        gender: genderVal,
        school: schoolVal,
        scores: {
          MATHS: scoresArr[0],
          ENG: scoresArr[1],
          KISWAHILI: scoresArr[2],
          SCIENCE: scoresArr[3],
          AGRIC: scoresArr[4],
          SST: scoresArr[5],
          CRE: scoresArr[6],
          CAS: scoresArr[7],
          PRETECH: scoresArr[8]
        }
      });
      startSn++;
    }

if (parsedStudents.length === 0) {
      alert("No valid student rows could be parsed. Make sure you copy rows from Excel with name, gender, school, and 9 marks.");
      return;
    }

    if (parsedStudents.length === 0) {
      alert("No valid student rows could be parsed. Make sure you copy rows from Excel with name, gender, school, and 9 marks.");
      return;
    }

    // ── Diagnostic: show what was parsed before merging/dedup ──
    console.log('[CBC Paste] Raw lines:', lines.length, '→ Parsed students:', parsedStudents.length);
    console.log('[CBC Paste] First:', parsedStudents[0]?.name, 'Last:', parsedStudents[parsedStudents.length-1]?.name);
    // Count unique SNs in parsed data
    const parsedSNs = parsedStudents.map(s => s.sn);
    const uniqueParsedSNs = new Set(parsedSNs);
    if (parsedSNs.length !== uniqueParsedSNs.size) {
      console.warn('[CBC Paste] DUPLICATE SNs IN PARSED DATA!', parsedSNs.length, 'total,', uniqueParsedSNs.size, 'unique');
      // Find which SNs are duplicated
      const snCounts: Record<number, number> = {};
      parsedSNs.forEach(sn => { snCounts[sn] = (snCounts[sn] || 0) + 1; });
      const dupes = Object.entries(snCounts).filter(([sn, cnt]) => cnt > 1);
      console.warn('[CBC Paste] Duplicate SNs:', dupes.map(([sn, cnt]) => `SN ${sn} ×${cnt}`));
    }
    const newStudentList = pasteMode === 'replace' 
      ? parsedStudents 
      : [...currentClass.students, ...parsedStudents];

    // Full validation & deduplication
    const result = validateAndCleanStudents(newStudentList);

    onUpdateClass({
      ...currentClass,
      students: result.students
    });

    setPasteText('');
    setShowPasteModal(false);

    const summary = formatValidationSummary(result);
    let msg = `Loaded ${parsedStudents.length} learners!`;
    if (!result.valid || result.summary.warnings > 0) {
      msg = summary;
      alert('⚠️ Data Validation Report\n\n' + summary + '\n\nCheck the issues above and correct any errors before running analysis.');
    } else if (result.summary.duplicatesRemoved > 0) {
      msg = `Loaded ${parsedStudents.length} learners (${result.summary.duplicatesRemoved} dupes removed, ${result.summary.fixedAuto} fixed)`;
    }
    showToast(msg);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-emerald-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-emerald-600 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-bold">{notification}</span>
        </div>
      )}

      {/* Top Banner & Instructions - Collapsible Dashboard */}
      {isDashboardCollapsed ? (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shadow-md text-white flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Step 1: Master Data Entry Dashboard</span>
            <span className="text-slate-400 text-xs hidden md:inline">— Single-Source Assessment Config & Data Paster</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Excel</span>
            </button>
            <button
              onClick={onGoToAnalysis}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition hidden sm:flex"
            >
              <span>View Analysis</span>
              <Sparkles className="w-3.5 h-3.5" />
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
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-white animate-in fade-in duration-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Step 1: Master Data Entry Dashboard</span>
                </div>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Single-Source Assessment Config & Data Paster
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Configure the exam title, term, class name, and desired Top Performers count below. All downstream sheets and report cards automatically update in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowPasteModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>Paste from Excel</span>
              </button>
              <button
                onClick={handleResetSample}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition border border-slate-700"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Reset Sample</span>
              </button>
              <button
                onClick={onGoToAnalysis}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition hover:scale-105"
              >
                <span>View Automated Analysis</span>
                <Sparkles className="w-4 h-4" />
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

      {/* 2. Global Configuration Controls (Compact Second Rectangle) */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Exam & Report Configuration <span className="text-[11px] font-normal text-slate-500 hidden md:inline">(Controls Analysis & Best Performed Tabs)</span>
            </h3>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">Active Config</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Exam / Assessment Name
            </label>
            <input
              type="text"
              value={currentClass.examName}
              onChange={(e) => handleConfigChange('examName', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="e.g. NANGO ZONE JS ASSESSMENT"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Term & Academic Year
            </label>
            <input
              type="text"
              value={currentClass.termDetails}
              onChange={(e) => handleConfigChange('termDetails', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="e.g. TERM TWO 2026"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Class / Grade Name
            </label>
            <input
              type="text"
              value={currentClass.className}
              onChange={(e) => handleConfigChange('className', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="e.g. Grade 7"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              School Name
            </label>
            <input
              type="text"
              value={currentClass.schoolName || ''}
              onChange={(e) => handleConfigChange('schoolName', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="e.g. NANGO ZONE JUNIOR SCHOOLS"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              School Motto
            </label>
            <input
              type="text"
              value={currentClass.motto || ''}
              onChange={(e) => handleConfigChange('motto', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
              placeholder="e.g. Excellence Through Competency & Character"
            />
          </div>

          <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200 flex flex-col justify-center">
            <label className="block text-[10px] font-extrabold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Desired Top Performers (N)</span>
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-mono font-bold">Auto-adjusts</span>
            </label>
            <div className="flex flex-wrap items-center gap-1">
              {[3, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleConfigChange('topPerformersCount', num)}
                  className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition ${
                    (currentClass.topPerformersCount || 3) === num
                      ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400'
                      : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  Top {num}
                </button>
              ))}
              <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300 shadow-sm ml-auto">
                <span className="text-[10px] font-bold text-amber-900">Custom:</span>
                <input
                  type="number"
                  min="1"
                  max={currentClass.students.length || 500}
                  value={currentClass.topPerformersCount || 3}
                  onChange={(e) => handleConfigChange('topPerformersCount', Math.max(1, Number(e.target.value)))}
                  className="w-11 px-1 py-0.2 text-[11px] font-black text-amber-950 rounded focus:outline-none text-center bg-amber-50"
                />
              </div>
            </div>
          </div>

          {/* School Logo Upload */}
          <div className="lg:col-span-3 border-t border-slate-100 pt-3 mt-1">
            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Upload School Logo <span className="font-normal lowercase text-slate-400">(appears on report cards — PNG, JPG, GIF, WEBP, SVG)</span>
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                Choose Image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      handleConfigChange('schoolLogo', reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
              {currentClass.schoolLogo ? (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={currentClass.schoolLogo} alt="School Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">Logo uploaded ✓</span>
                  <button
                    type="button"
                    onClick={() => handleConfigChange('schoolLogo', undefined)}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">No logo — "CBC" text will show on report cards</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Student Scores Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black">
              Student Marks Table ({currentClass.students.length} Learners Registered)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddStudent}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Learner Row</span>
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold transition border border-rose-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="overflow-x-auto max-h-[750px] sm:max-h-[820px] scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="py-3 px-2 border-b border-r border-slate-300 w-12 text-center">SN</th>
                <th className="py-3 px-3 border-b border-r border-slate-300 min-w-[180px]">LEARNER NAME</th>
                <th className="py-3 px-2 border-b border-r border-slate-300 w-16 text-center">GENDER</th>
                <th className="py-3 px-3 border-b border-r border-slate-300 w-28">SCHOOL</th>
                {SUBJECT_LIST.map((sub) => (
                  <th key={sub.key} className="py-3 px-2 border-b border-r border-slate-300 w-20 text-center bg-blue-50/50 text-blue-900">
                    {sub.short}
                    <div className="text-[9px] font-normal text-slate-500 lowercase font-mono">/100</div>
                  </th>
                ))}
                <th className="py-3 px-2 border-b border-slate-300 w-12 text-center">DEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
              {currentClass.students.map((st, idx) => (
                <tr key={`${st.sn}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-1.5 border-r border-slate-200 text-center">
                    <input
                      type="number"
                      value={st.sn}
                      onChange={(e) => handleStudentChange(idx, 'sn', e.target.value)}
                      className="w-10 text-center py-1 bg-transparent font-mono font-bold focus:bg-white focus:ring-1 focus:ring-blue-500 rounded"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded uppercase"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center">
                    <select
                      value={st.gender}
                      onChange={(e) => handleStudentChange(idx, 'gender', e.target.value)}
                      className={`py-1 px-1 rounded font-bold cursor-pointer ${
                        st.gender === 'F' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <input
                      type="text"
                      value={st.school}
                      onChange={(e) => handleStudentChange(idx, 'school', e.target.value)}
                      className="w-full px-2 py-1 bg-transparent text-slate-700 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded uppercase font-semibold"
                    />
                  </td>
                  {SUBJECT_LIST.map((sub) => {
                    const mark = st.scores[sub.key] ?? 0;
                    return (
                      <td key={sub.key} className="p-1.5 border-r border-slate-200 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={mark}
                          onChange={(e) => handleStudentChange(idx, sub.key, e.target.value)}
                          className={`w-14 text-center py-1 rounded font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                            mark >= 85 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                            mark >= 61 ? 'bg-blue-50/60 text-blue-800' :
                            mark >= 37 ? 'bg-amber-50 text-amber-900' :
                            'bg-rose-50 text-rose-800 border border-rose-200 font-extrabold'
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="p-1.5 text-center">
                    <button
                      onClick={() => handleDeleteStudent(idx)}
                      title="Delete learner"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
              {currentClass.students.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500 bg-slate-50">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-bold">No students registered yet in this class.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Learner Row" or "Paste from Excel" above to start analyzing!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                  <ClipboardPaste className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Paste Direct from Microsoft Excel
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select columns in Excel (SN, Name, Gender, School, 9 Marks), press Ctrl+C, and paste below with Ctrl+V.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">Import Mode:</span>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="pmode"
                  checked={pasteMode === 'append'}
                  onChange={() => setPasteMode('append')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Append to existing learners</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="pmode"
                  checked={pasteMode === 'replace'}
                  onChange={() => setPasteMode('replace')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-rose-600 font-bold">Replace all existing learners</span>
              </label>
            </div>

            <form onSubmit={handleExcelPaste} className="flex-1 flex flex-col min-h-0">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Example format (Tab separated as copied directly from Excel):
1\tADLAM ODHIAMBO\tM\tCONSO\t24\t89\t60\t33\t57\t47\t67\t56\t66
2\tALICE AUMA\tF\tCONSO\t11\t65\t45\t22\t54\t20\t36\t66\t41`}
                rows={10}
                required
                className="w-full p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1 min-h-[220px] resize-none"
              />

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>Supports 9 subjects: MATHS, ENG, KISWAHILI, SCIENCE, AGRIC, SST, CRE, CAS, PRETECH</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasteModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
                  >
                    Parse & Load Data
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
