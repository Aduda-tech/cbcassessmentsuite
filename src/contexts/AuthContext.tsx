import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/config`).then(r => r.json()).then(setAppConfig).catch(() => {});
    const token = localStorage.getItem('cbc_token');
    if (token) {
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          if (data.user) { setUser(data.user); setSubscription(data.subscription); }
          else localStorage.removeItem('cbc_token');
        }).catch(() => localStorage.removeItem('cbc_token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('cbc_token', data.token);
    setUser(data.user);
    await refreshSubscription();
    return data;
  }, []);

  const register = useCallback(async (fields: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('cbc_token', data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cbc_token');
    setUser(null);
    setSubscription(null);
  }, []);

  const refreshSubscription = useCallback(async () => {
    const token = localStorage.getItem('cbc_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/subscription/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setSubscription(data); }
    } catch (err) {}
  }, []);

  // Submit M-Pesa code to activate
  const submitMpesaCode = useCallback(async (plan: string, mpesaCode: string) => {
    const token = localStorage.getItem('cbc_token');
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/subscribe`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, mpesaCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    await refreshSubscription();
    return data;
  }, []);

  const verifyAccess = useCallback(async () => {
    const token = localStorage.getItem('cbc_token');
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/subscription/verify`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) return true;
      if (res.status === 402) setShowPaywall(true);
      return false;
    } catch (err) { return false; }
  }, []);

  const closePaywall = useCallback(() => setShowPaywall(false), []);

  const value = {
    user, subscription, loading, showPaywall, appConfig,
    login, register, logout, refreshSubscription, submitMpesaCode, verifyAccess, closePaywall,
    isAuthenticated: !!user,
    hasActiveSubscription: subscription?.isActive,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
