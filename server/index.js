import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, hashPassword, verifyPassword, generateId } from './db.js';
import { signToken, authMiddleware, adminMiddleware } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── App Config ──
const APP_CONFIG = {
  mpesaTillNumber: process.env.MPESA_TILL_NUMBER || '123456',
  mpesaPaybill: process.env.MPESA_PAYBILL || '',
  mpesaAccountNumber: process.env.MPESA_ACCOUNT_NUMBER || '',
  adminPhone: process.env.ADMIN_PHONE || '0725924995',
  monthlyPrice: process.env.MONTHLY_PRICE || 'KES 500',
  yearlyPrice: process.env.YEARLY_PRICE || 'KES 5,000',
};

// ── Middleware ──
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// ── Health ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── App Config (public) ──
app.get('/api/config', (req, res) => {
  res.json({
    mpesaTillNumber: APP_CONFIG.mpesaTillNumber,
    mpesaPaybill: APP_CONFIG.mpesaPaybill,
    mpesaAccountNumber: APP_CONFIG.mpesaAccountNumber,
    adminPhone: APP_CONFIG.adminPhone,
    monthlyPrice: APP_CONFIG.monthlyPrice,
    yearlyPrice: APP_CONFIG.yearlyPrice,
  });
});

// ── Plans (static — no Stripe) ──
app.get('/api/plans', (req, res) => {
  res.json({
    plans: [
      { id: 'monthly', name: 'Monthly Plan', amount: 500, currency: 'KES', interval: 'month', description: 'Full access — Print, Download & Share all CBC reports' },
      { id: 'yearly', name: 'Yearly Plan', amount: 5000, currency: 'KES', interval: 'year', description: '12 months access — Save 17% vs monthly' },
    ]
  });
});

// ── Auth Routes ──
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, schoolName, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Account already exists' });

    const id = generateId();
    const passwordHash = hashPassword(password);
    db.prepare(`INSERT INTO users (id, email, password_hash, name, school_name, phone) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(id, email.toLowerCase(), passwordHash, name || '', schoolName || '', phone || '');

    // Create pending subscription
    const subId = generateId();
    db.prepare(`INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, 'monthly', 'pending')`)
      .run(subId, id);

    const token = signToken({ userId: id, email: email.toLowerCase(), role: 'user' });
    res.status(201).json({ token, user: { id, email: email.toLowerCase(), name: name || '', schoolName: schoolName || '' } });
  } catch (err) {
    console.error('Register:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, schoolName: user.school_name, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error('Login:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, email, name, school_name, phone, role, created_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId);
    res.json({ user: { id: user.id, email: user.email, name: user.name, schoolName: user.school_name, phone: user.phone, role: user.role, createdAt: user.created_at }, subscription: sub || null });
  } catch (err) {
    console.error('Me:', err);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ── Subscription / Activation ──

// Submit M-Pesa payment confirmation
app.post('/api/subscribe', authMiddleware, (req, res) => {
  try {
    const { plan, mpesaCode } = req.body;
    if (!mpesaCode) return res.status(400).json({ error: 'M-Pesa confirmation code is required' });
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId);
    if (!sub) return res.status(404).json({ error: 'No subscription found' });

    db.prepare(`UPDATE subscriptions SET plan = ?, mpesa_code = ?, status = 'pending', updated_at = datetime('now') WHERE id = ?`)
      .run(plan || sub.plan, mpesaCode, sub.id);

    res.json({ message: 'Payment submitted! Your account will be activated within a few minutes after verification.', status: 'pending' });
  } catch (err) {
    console.error('Subscribe:', err);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Check subscription status
app.get('/api/subscription/status', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId);
    if (!sub) {
      return res.json({ hasSubscription: false, isActive: false, plan: null, status: 'none' });
    }
    const isActive = sub.status === 'active';
    const isExpired = isActive && sub.current_period_end && new Date(sub.current_period_end) < new Date();
    if (isActive && isExpired) {
      db.prepare("UPDATE subscriptions SET status = 'expired', updated_at = datetime('now') WHERE id = ?").run(sub.id);
      return res.json({ hasSubscription: true, isActive: false, plan: sub.plan, status: 'expired' });
    }
    res.json({ hasSubscription: sub.status !== 'none', isActive, plan: sub.plan, status: sub.status, currentPeriodEnd: sub.current_period_end, mpesaCode: sub.mpesa_code });
  } catch (err) {
    console.error('Status:', err);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// Verify access (for paywall)
app.get('/api/subscription/verify', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId, 'active');
    if (!sub) {
      return res.status(402).json({ error: 'Subscription required', message: 'You need an active subscription to print, download, or share documents.', code: 'SUBSCRIPTION_REQUIRED' });
    }
    if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
      db.prepare("UPDATE subscriptions SET status = 'expired', updated_at = datetime('now') WHERE id = ?").run(sub.id);
      return res.status(402).json({ error: 'Subscription expired', message: 'Your subscription has expired. Please renew.', code: 'SUBSCRIPTION_EXPIRED' });
    }
    res.json({ valid: true, plan: sub.plan, currentPeriodEnd: sub.current_period_end });
  } catch (err) {
    console.error('Verify:', err);
    res.status(500).json({ error: 'Failed to verify' });
  }
});

// ── Admin API ──
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT u.id, u.email, u.name, u.school_name, u.phone, u.role, u.created_at,
             s.id as sub_id, s.plan, s.status as sub_status, s.mpesa_code, s.current_period_start, s.current_period_end
      FROM users u LEFT JOIN subscriptions s ON u.id = s.user_id
      ORDER BY u.created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    console.error('Admin users:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/admin/activate', adminMiddleware, (req, res) => {
  try {
    const { userId, plan, durationDays, notes } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const db = getDb();
    const duration = durationDays || 30;
    const start = new Date().toISOString();
    const end = new Date(Date.now() + duration * 86400000).toISOString();

    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId);
    if (sub) {
      db.prepare(`UPDATE subscriptions SET plan = ?, status = 'active', current_period_start = ?, current_period_end = ?, admin_notes = ?, activated_by = ?, updated_at = datetime('now') WHERE id = ?`)
        .run(plan || sub.plan, start, end, notes || '', req.user.userId, sub.id);
    } else {
      const subId = generateId();
      db.prepare(`INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end, admin_notes, activated_by) VALUES (?, ?, ?, 'active', ?, ?, ?, ?)`)
        .run(subId, userId, plan || 'monthly', start, end, notes || '', req.user.userId);
    }
    res.json({ message: 'User activated successfully!', expiresAt: end });
  } catch (err) {
    console.error('Activate:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/admin/deactivate', adminMiddleware, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const db = getDb();
    db.prepare("UPDATE subscriptions SET status = 'canceled', updated_at = datetime('now') WHERE user_id = ? AND status = 'active'").run(userId);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// ── Serve React SPA ──
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ CBC Assessment Suite running on port ${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
});
