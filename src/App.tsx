import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { PricingPage } from './pages/PricingPage';
import { SubscriptionPaywall } from './components/SubscriptionPaywall';
import { Header } from './components/Header';
import { DataEntrySheet } from './components/DataEntrySheet';
import { AnalysisSheet } from './components/AnalysisSheet';
import { BestPerformedSheet } from './components/BestPerformedSheet';
import { GradingScaleSheet } from './components/GradingScaleSheet';
import { ReportCardsView } from './components/ReportCardsView';
import { VbaMacroHub } from './components/VbaMacroHub';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { PrintStatusModal } from './components/PrintStatusModal';
import { registerPrintListener, setSubscriptionVerifier as setPrintVerifier } from './utils/printHelper';
import { setSubscriptionVerifier as setExportVerifier } from './utils/excelExport';
import { ClassConfig } from './types/cbc';
import { SAMPLE_STUDENTS } from './data/sampleNangoData';
import { validateAndCleanStudents } from './utils/dataCleaning';

const LOCAL_STORAGE_KEY = 'kenyan_cbc_assessment_classes_v1';

// ── App Shell with Routing ──
function AppShell() {
  const { user, loading, isAuthenticated, hasActiveSubscription, refreshSubscription } = useAuth();
  const [currentPage, setCurrentPage] = useState<'login' | 'register' | 'pricing' | 'app'>('app');

  // Simple client-side routing
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login') setCurrentPage('login');
    else if (path === '/register') setCurrentPage('register');
    else if (path === '/pricing') setCurrentPage('pricing');
    else setCurrentPage('app');

    // Listen for popstate
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p === '/login') setCurrentPage('login');
      else if (p === '/register') setCurrentPage('register');
      else if (p === '/pricing') setCurrentPage('pricing');
      else setCurrentPage('app');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check for subscription success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscribed') === 'true') {
      refreshSubscription();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('subscribed');
      window.history.replaceState({}, '', url.toString());
    }
  }, [refreshSubscription]);

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path);
    if (path === '/login') setCurrentPage('login');
    else if (path === '/register') setCurrentPage('register');
    else if (path === '/pricing') setCurrentPage('pricing');
    else setCurrentPage('app');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth pages — if not authenticated
  if (!isAuthenticated && (currentPage === 'login' || currentPage === 'register')) {
    if (currentPage === 'login') {
      return <LoginPage onSwitchToRegister={() => navigate('/register')} />;
    }
    return <RegisterPage onSwitchToLogin={() => navigate('/login')} />;
  }

  // Pricing page (always accessible)
  if (currentPage === 'pricing') {
    return <PricingPage />;
  }

  // If not authenticated and on app page, redirect to login
  if (!isAuthenticated && currentPage === 'app') {
    return <LoginPage onSwitchToRegister={() => navigate('/register')} />;
  }

  // Main app (authenticated)
  return (
    <>
      <SubscriptionPaywall />
      <MainApp 
        onNavigatePricing={() => navigate('/pricing')}
      />
    </>
  );
}

// ── Main CBC Assessment App ──
function MainApp({ onNavigatePricing }: { onNavigatePricing: () => void }) {
  const { user, hasActiveSubscription, verifyAccess, logout } = useAuth();

  const [classes, setClasses] = useState<ClassConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((cls: any) => ({
            ...cls,
            students: validateAndCleanStudents(cls.students || []).students
          }));
        }
      }
    } catch (e) {
      console.error("Error loading saved classes:", e);
    }
    return [
      {
        id: 'class-1',
        className: 'Grade 7 — Nango Zone Sample',
        schoolName: 'NANGO ZONE JUNIOR SCHOOLS',
        examName: 'NANGO ZONE JS ASSESSMENT',
        termDetails: 'COMPETENCY BASED ASSESSMENT — TERM TWO 2026',
        topPerformersCount: 3,
        motto: 'Excellence Through Competency & Character',
        students: SAMPLE_STUDENTS
      }
    ];
  });

  const [currentClassId, setCurrentClassId] = useState<string>(() => classes[0]?.id || 'class-1');
  const [activeTab, setActiveTab] = useState<string>('data-entry');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [printModal, setPrintModal] = useState<{ isOpen: boolean; title: string; errorMsg: string | null }>({
    isOpen: false,
    title: '',
    errorMsg: null
  });
  const [subscriptionVerified, setSubscriptionVerified] = useState(false);

  useEffect(() => {
    return registerPrintListener((title, errorMsg) => {
      setPrintModal({ isOpen: true, title, errorMsg });
    });
  }, []);

  // Wire up subscription verifiers for printHelper and excelExport
  useEffect(() => {
    setPrintVerifier(verifyAccess);
    setExportVerifier(verifyAccess);
    return () => {
      setPrintVerifier(null);
      setExportVerifier(null);
    };
  }, [verifyAccess]);

  // Save to localStorage whenever classes change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(classes));
    } catch (e) {
      console.error("Error saving classes:", e);
    }
  }, [classes]);

  const currentClass = classes.find(c => c.id === currentClassId) || classes[0];

  const handleUpdateCurrentClass = (updated: ClassConfig) => {
    setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleDuplicateClass = (newName: string) => {
    const newId = `class-${Date.now()}`;
    const duplicate: ClassConfig = {
      ...currentClass,
      id: newId,
      className: newName,
      students: currentClass.students.map(s => ({
        ...s,
        scores: { ...s.scores }
      }))
    };
    setClasses(prev => [...prev, duplicate]);
    setCurrentClassId(newId);
    setActiveTab('data-entry');
  };

  // ── Subscription-gated actions ──
  // Wrap print/export functions with subscription verification
  const handleProtectedAction = async (action: () => void, actionName: string) => {
    const hasAccess = await verifyAccess();
    if (hasAccess) {
      action();
    }
    // If no access, the paywall modal will be shown by verifyAccess()
  };

  // Hook into the print helper to intercept
  useEffect(() => {
    const originalPrint = window.print;
    // We intercept at the component level by wrapping the print trigger
    // The actual interception happens in the printHelper via the verifyAccess call
    return () => {
      // no-op
    };
  }, []);

  // Subscription status bar (shown when subscription is inactive)
  const SubscriptionBanner = () => {
    if (hasActiveSubscription) return null;
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center">
        <p className="text-sm text-amber-300 font-medium">
          ⚠️ <span className="font-bold">Free Preview Mode</span> — Subscribe to unlock printing, downloading, and sharing reports.{' '}
          <button 
            onClick={onNavigatePricing}
            className="text-amber-200 font-bold underline hover:text-white"
          >
            View Plans →
          </button>
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white print:block print:min-h-0 print:bg-white">
      <SubscriptionBanner />
      
      {/* Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        classes={classes}
        currentClass={currentClass}
        onSelectClass={setCurrentClassId}
        onDuplicateClass={handleDuplicateClass}
        onOpenAiAdvisor={() => setIsAiModalOpen(true)}
        hasSubscription={hasActiveSubscription}
        onNavigatePricing={onNavigatePricing}
        user={user}
        onLogout={logout}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-16 print:block print:pb-0 print:flex-none">
        {activeTab === 'data-entry' && (
          <DataEntrySheet
            currentClass={currentClass}
            onUpdateClass={handleUpdateCurrentClass}
            onGoToAnalysis={() => setActiveTab('analysis')}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisSheet
            currentClass={currentClass}
            onGoToReportCards={() => setActiveTab('report-cards')}
            onOpenAiAdvisor={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'best-performed' && (
          <BestPerformedSheet
            currentClass={currentClass}
            onUpdateClass={handleUpdateCurrentClass}
            onGoToReportCards={() => setActiveTab('report-cards')}
          />
        )}

        {activeTab === 'grading-scale' && (
          <GradingScaleSheet />
        )}

        {activeTab === 'report-cards' && (
          <ReportCardsView
            currentClass={currentClass}
          />
        )}

        {activeTab === 'vba-hub' && (
          <VbaMacroHub
            currentClass={currentClass}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-center text-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 font-bold text-slate-300">
            <span>Aduda-Tech CBC Assessment Suite</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">Ranked by Total Points (Max 72)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            {hasActiveSubscription ? (
              <span className="text-emerald-400 flex items-center gap-1">✓ Active Subscription</span>
            ) : (
              <button onClick={onNavigatePricing} className="text-amber-400 hover:text-amber-300 underline">Subscribe to Unlock All Features</button>
            )}
            <span>Powered by Aduda-Tech • 0725924995</span>
          </div>
        </div>
      </footer>

      {/* Gemini AI Pedagogical Advisor Modal */}
      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentClass={currentClass}
      />

      {/* Print Status & Troubleshooting Modal */}
      <PrintStatusModal
        isOpen={printModal.isOpen}
        onClose={() => setPrintModal(prev => ({ ...prev, isOpen: false }))}
        reportTitle={printModal.title}
        errorMessage={printModal.errorMsg}
      />
    </div>
  );
}

// ── Root App with AuthProvider ──
export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
