import React from 'react';
import { AlertTriangle, Printer, ExternalLink, CheckCircle2, X, FileSpreadsheet, Keyboard, ShieldAlert } from 'lucide-react';

interface PrintStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  errorMessage: string | null;
}

export const PrintStatusModal: React.FC<PrintStatusModalProps> = ({
  isOpen,
  onClose,
  reportTitle,
  errorMessage
}) => {
  if (!isOpen) return null;

  const handleRetry = () => {
    try {
      window.focus();
      window.print();
    } catch (err: any) {
      alert("Retry Error: " + (err?.message || String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-rose-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-400/30">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wide">Print Dialog Error Report</h3>
              <p className="text-xs text-amber-200/80 font-medium">Why printing was blocked & how to proceed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Target Report Title */}
          <div className="flex items-center justify-between text-xs bg-slate-100 px-3.5 py-2 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-600 uppercase">Target Document:</span>
            <span className="font-extrabold text-slate-900">{reportTitle || "CBC Assessment Report"}</span>
          </div>

          {/* Error Details Box */}
          <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-rose-950">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs w-full">
                <span className="font-extrabold uppercase tracking-wide text-rose-800 block">Reported Error / Browser Status:</span>
                <code className="block p-2.5 bg-rose-950 text-rose-200 rounded-lg font-mono text-[11px] leading-relaxed break-all border border-rose-800 shadow-inner">
                  {errorMessage || "DOMException: Ignored call to 'print()'. The document is inside a sandboxed embedded iframe without print permissions."}
                </code>
              </div>
            </div>
          </div>

          {/* Root Cause Explanation */}
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">🔍 Why did this happen?</span>
            You are currently running this suite inside an <strong>embedded preview window (AI Studio iFrame)</strong>. Modern browsers (Chrome, Edge, Safari, Firefox) automatically enforce strict sandboxing on cross-origin preview frames, which blocks JavaScript <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">window.print()</code> and popup modals for security.
          </div>

          {/* What to do section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>How To Print Your Report Right Now (3 Options):</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* Option 1 */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg mt-0.5 shrink-0">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 block">Option 1: Use Keyboard Shortcut (Fastest & Guaranteed)</span>
                  <p className="text-emerald-900/90 mt-0.5">
                    Press <kbd className="px-2 py-0.5 bg-emerald-900 text-emerald-200 font-mono font-bold rounded border border-emerald-700 shadow-sm mx-0.5">Ctrl + P</kbd> (Windows/Linux) or <kbd className="px-2 py-0.5 bg-emerald-900 text-emerald-200 font-mono font-bold rounded border border-emerald-700 shadow-sm mx-0.5">Cmd + P</kbd> (Mac) right now on your keyboard.
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-1 italic font-medium">
                    ✨ Since we built complete CSS print stylesheets into this app, pressing your keyboard shortcut bypasses the iframe block and formats the A4 report perfectly!
                  </p>
                </div>
              </div>

              {/* Option 2 */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg mt-0.5 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-blue-950 block">Option 2: Open in Standalone Tab</span>
                  <p className="text-blue-900/90 mt-0.5">
                    Click the <strong>"Open in new tab"</strong> icon in top-right header of your preview window (or open the shared app URL in a normal browser tab). In a standard top-level tab, Print buttons work without iframe restrictions!
                  </p>
                </div>
              </div>

              {/* Option 3 */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
                <div className="p-1.5 bg-amber-600 text-white rounded-lg mt-0.5 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-950 block">Option 3: Download Excel Workbook</span>
                  <p className="text-amber-900/90 mt-0.5">
                    Need physical records? Click any <strong>Download Excel (.xls)</strong> button to export the entire grading matrix and format it offline!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Retry window.print()</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition"
          >
            Got It, Close
          </button>
        </div>
      </div>
    </div>
  );
};
