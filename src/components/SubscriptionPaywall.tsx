import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Smartphone, Printer, Download, FileSpreadsheet, X } from 'lucide-react';

export function SubscriptionPaywall() {
  const { showPaywall, closePaywall, isAuthenticated } = useAuth();

  if (!showPaywall) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={closePaywall} className="absolute top-4 right-4 text-slate-500 hover:text-white transition"><X className="w-5 h-5" /></button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Subscribe to Unlock</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            A subscription is required to print, download, or share CBC reports.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ icon: <Printer className="w-5 h-5 text-rose-400" />, label: 'Print Reports' },
            { icon: <Download className="w-5 h-5 text-emerald-400" />, label: 'Download Excel/CSV' },
            { icon: <FileSpreadsheet className="w-5 h-5 text-blue-400" />, label: 'Full Analysis Suite' },
            { icon: <FileSpreadsheet className="w-5 h-5 text-yellow-400" />, label: 'VBA Macro Hub' },
          ].map((f, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
              <div className="mx-auto mb-1">{f.icon}</div>
              <span className="text-xs text-slate-300 font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-amber-200">Pay via M-Pesa Till • KES 500/month</span>
          </div>
          <p className="text-xs text-amber-300/80">No Stripe, no cards — just Lipa Na M-Pesa. You get activated within minutes.</p>
        </div>

        <a href="/pricing"
          className="block w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-sm text-center shadow-lg shadow-emerald-500/25 transition">
          {isAuthenticated ? 'Subscribe Now — KES 500/mo' : 'Create Account & Subscribe'}
        </a>
        <p className="text-center text-xs text-slate-600 mt-4">Free preview mode — you can still view analysis results and enter data.</p>
      </div>
    </div>
  );
}
