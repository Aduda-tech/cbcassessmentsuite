import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileSpreadsheet, Check, ArrowRight, Smartphone, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export function PricingPage() {
  const { user, submitMpesaCode, isAuthenticated, logout, appConfig } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [mpesaCode, setMpesaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const tillNumber = appConfig?.mpesaTillNumber || '123456';

  useEffect(() => {
    fetch('/api/subscription/pending-count')
      .then(r => r.json())
      .then(d => setPendingCount(d.pendingCount || 0))
      .catch(() => {});
  }, []);

  const adminPhone = appConfig?.adminPhone || '0725924995';

  const plans = [
    { id: 'monthly', name: 'Monthly Plan', price: 'KES 500', interval: 'month', saving: '' },
    { id: 'yearly', name: 'Yearly Plan', price: 'KES 5,000', interval: 'year', saving: 'Save 17%' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaCode.trim()) { setError('Please enter your M-Pesa confirmation code'); return; }
    setError(''); setMessage(''); setLoading(true);
    try {
      const result = await submitMpesaCode(selectedPlan, mpesaCode.trim());
      setMessage(result.message || 'Payment submitted! Your account will be activated shortly.');
      setMpesaCode('');
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-2 rounded-xl">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div><h1 className="text-lg font-bold text-white">Aduda-Tech</h1><p className="text-xs text-slate-400">CBC Assessment Suite</p></div>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                {pendingCount} pending
              </span>
            )}
            {isAuthenticated ? (
              <><a href="/app" className="text-sm text-slate-300 hover:text-white font-medium">Dashboard</a>
              <button onClick={logout} className="text-sm text-slate-400 hover:text-white">Sign Out</button></>
            ) : (
              <><a href="/login" className="text-sm text-slate-300 hover:text-white font-medium">Sign In</a>
              <a href="/register" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition">Get Started</a></>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">Subscribe via M-Pesa</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Pay easily with Lipa Na M-Pesa and unlock full access to professional CBC report cards, Excel exports, and more.
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-10">
          {plans.map(p => (
            <button key={p.id} onClick={() => setSelectedPlan(p.id)}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition ${selectedPlan === p.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
              {p.name} — {p.price}{p.saving && <span className="ml-1 text-emerald-400">({p.saving})</span>}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">How to Pay via M-Pesa</h2>
            </div>
            <ol className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <span>Go to <strong className="text-white">Lipa Na M-Pesa → Buy Goods & Services</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <span>Enter Till Number: <strong className="text-emerald-300 text-lg">{tillNumber}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <span>Enter Amount: <strong className="text-white">{selectedPlan === 'monthly' ? 'KES 500' : 'KES 5,000'}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                <span>Enter your M-Pesa PIN and complete payment</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">5</span>
                <span>Copy the <strong className="text-amber-300">M-Pesa confirmation code</strong> from the SMS and paste it below</span>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              After payment, your account is activated within a few minutes once verified. Need help? Call/WhatsApp: <strong className="text-white">{adminPhone}</strong>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Activate Your Account
            </h2>
            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Selected Plan</label>
                  <div className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white font-bold text-sm">
                    {selectedPlan === 'monthly' ? 'Monthly — KES 500' : 'Yearly — KES 5,000'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">M-Pesa Confirmation Code</label>
                  <input type="text" value={mpesaCode} onChange={e => setMpesaCode(e.target.value)}
                    placeholder="e.g. QK98HJ3WX" required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-mono" />
                  <p className="text-xs text-slate-500 mt-1">Enter the code from your M-Pesa SMS confirmation</p>
                </div>
                {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg px-4 py-3 text-sm">{error}</div>}
                {message && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg px-4 py-3 text-sm">{message}</div>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><ArrowRight className="w-4 h-4" /> Activate My Account</>}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-4">Create an account first, then activate with M-Pesa</p>
                <a href="/register" className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm">Create Account</a>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto mt-12">
          {[
            'Print report cards (A4)', 'Download Excel & CSV', 'AI Pedagogical Advisor',
            'Unlimited students', 'Multiple classes & streams', 'VBA Macro automation'
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300">{f}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-600 mt-10">
          🔒 Secure M-Pesa payments • Cancel anytime • Contact: <span className="text-slate-400">{adminPhone}</span>
        </p>
      </div>
    </div>
  );
}
