import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  BarChart3, 
  Award, 
  Sliders, 
  FileText, 
  Code, 
  Plus, 
  Sparkles, 
  Download, 
  Printer, 
  Copy, 
  Check,
  Building2,
  ChevronDown,
  Crown,
  LogOut,
  User
} from 'lucide-react';
import { ClassConfig } from '../types/cbc';
import { downloadFullExcelWorkbook, downloadVbaModule } from '../utils/excelExport';
import { analyzeStudents } from '../utils/cbcCalculations';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  classes: ClassConfig[];
  currentClass: ClassConfig;
  onSelectClass: (id: string) => void;
  onDuplicateClass: (newName: string) => void;
  onOpenAiAdvisor: () => void;
  hasSubscription?: boolean;
  onNavigatePricing?: () => void;
  user?: { name?: string; email?: string } | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  classes,
  currentClass,
  onSelectClass,
  onDuplicateClass,
  onOpenAiAdvisor,
  hasSubscription = false,
  onNavigatePricing,
  user,
  onLogout
}) => {
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [copiedVba, setCopiedVba] = useState(false);

  const handleCreateDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onDuplicateClass(newClassName.trim());
    setNewClassName('');
    setShowDuplicateModal(false);
  };

  const analyzed = analyzeStudents(currentClass.students);

  const tabs = [
    { id: 'data-entry', label: 'Data Entry', icon: FileSpreadsheet, color: 'text-blue-600' },
    { id: 'analysis', label: 'Analysis Sheet', icon: BarChart3, color: 'text-emerald-600' },
    { id: 'best-performed', label: 'Best Performed', icon: Award, color: 'text-amber-600' },
    { id: 'grading-scale', label: 'Grading Scale', icon: Sliders, color: 'text-purple-600' },
    { id: 'report-cards', label: 'Report Cards (A4)', icon: FileText, color: 'text-rose-600' },
    { id: 'vba-hub', label: 'VBA Macro Hub & Excel', icon: Code, color: 'text-indigo-600' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800 sticky top-0 z-40 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                  Aduda-Tech CBC Assessment Suite
                </h1>
                {hasSubscription ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50 font-medium">
                    Free Preview
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Automated CBC Grading, Ranking by Total Points, Condensed Reports
              </p>
            </div>
          </div>

          {/* Class Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-semibold transition shadow-inner"
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{currentClass.className}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showClassDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50">
                    Select Class / Stream
                  </div>
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        onSelectClass(cls.id);
                        setShowClassDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition ${
                        cls.id === currentClass.id 
                          ? 'bg-emerald-600/20 text-emerald-300 font-bold border-l-2 border-emerald-500' 
                          : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{cls.className}</span>
                      <span className="text-xs bg-slate-900/60 px-2 py-0.5 rounded text-slate-400">
                        {cls.students.length} learners
                      </span>
                    </button>
                  ))}
                  <div className="p-1.5 border-t border-slate-700/50 bg-slate-900/40">
                    <button
                      onClick={() => {
                        setShowClassDropdown(false);
                        setNewClassName(`${currentClass.className} (Copy)`);
                        setShowDuplicateModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg text-xs font-bold text-white shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Next Class / Duplicate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Next Class Button */}
            <button
              onClick={() => {
                setNewClassName(`${currentClass.className} - New Stream`);
                setShowDuplicateModal(true);
              }}
              title="Duplicate current analysis & best performers sheet for a new class"
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Next Class</span>
            </button>

            {/* AI Advisor Button */}
            <button
              onClick={onOpenAiAdvisor}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-500/20 transition hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>AI School Advisor</span>
            </button>

            {/* Export / Subscribe button */}
            {!hasSubscription && onNavigatePricing ? (
              <button
                onClick={onNavigatePricing}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold shadow transition"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subscribe to Export</span>
                <span className="sm:hidden">Subscribe</span>
              </button>
            ) : (
              <button
                onClick={() => downloadFullExcelWorkbook(currentClass, analyzed)}
                title="Download multi-tab Excel Workbook (.xls)"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export Excel Workbook</span>
                <span className="sm:hidden">Excel</span>
              </button>
            )}

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-2 ml-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline font-medium">{user.name || user.email}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-3 pt-2 border-t border-slate-800 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Lock icons for gated tabs when no subscription
            const isGated = !hasSubscription && (tab.id === 'report-cards' || tab.id === 'vba-hub');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
                {isGated && <Crown className="w-3 h-3 text-amber-400 ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duplicate Class Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Next Class / Duplicate Sheets</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              This duplicates the Data Entry, automated Analysis, and Best Performed sheets for the new class name.
            </p>

            <form onSubmit={handleCreateDuplicate}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  New Class / Stream Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g. Grade 7 - West Stream or Grade 8 Analysis"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
                >
                  Create & Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
