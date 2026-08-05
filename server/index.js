import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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

// ── Notification System ──
const NOTIFICATION_FILE = process.env.NOTIFICATION_FILE || path.join(__dirname, '..', 'data', 'admin_notifications.json');

function readNotifications() {
  try { return fs.existsSync(NOTIFICATION_FILE) ? JSON.parse(fs.readFileSync(NOTIFICATION_FILE, 'utf8')) : []; }
  catch { return []; }
}

function saveNotifications(list) {
  const dir = path.dirname(NOTIFICATION_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function notifyAdmin(event, details) {
  const notifs = readNotifications();
  notifs.unshift({ id: 'N_' + Date.now(), event, details, read: false, createdAt: new Date().toISOString() });
  if (notifs.length > 200) notifs.length = 200;
  saveNotifications(notifs);
  console.log('[ADMIN NOTIFY] ' + event + ':', JSON.stringify(details));
}

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

// ── Plans ──
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
    db.prepare('INSERT INTO users (id, email, password_hash, name, school_name, phone) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, email.toLowerCase(), passwordHash, name || '', schoolName || '', phone || '');
    const subId = generateId();
    db.prepare('INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, \'monthly\', \'pending\')')
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
app.post('/api/subscribe', authMiddleware, (req, res) => {
  try {
    const { plan, mpesaCode } = req.body;
    if (!mpesaCode) return res.status(400).json({ error: 'M-Pesa confirmation code is required' });
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId);
    if (!sub) return res.status(404).json({ error: 'No subscription found' });
    db.prepare('UPDATE subscriptions SET plan = ?, mpesa_code = ?, status = \'pending\', updated_at = datetime(\'now\') WHERE id = ?')
      .run(plan || sub.plan, mpesaCode, sub.id);
    notifyAdmin('new_payment', { userId: req.user.userId, plan: plan || sub.plan, mpesaCode });
    res.json({ message: 'Payment submitted! You will be activated within a few minutes.', status: 'pending' });
  } catch (err) {
    console.error('Subscribe:', err);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

app.get('/api/subscription/status', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId);
    if (!sub) return res.json({ hasSubscription: false, isActive: false, plan: null, status: 'none' });
    const isActive = sub.status === 'active';
    const isExpired = isActive && sub.current_period_end && new Date(sub.current_period_end) < new Date();
    if (isActive && isExpired) {
      db.prepare('UPDATE subscriptions SET status = \'expired\', updated_at = datetime(\'now\') WHERE id = ?').run(sub.id);
      return res.json({ hasSubscription: true, isActive: false, plan: sub.plan, status: 'expired' });
    }
    res.json({ hasSubscription: sub.status !== 'none', isActive, plan: sub.plan, status: sub.status, currentPeriodEnd: sub.current_period_end });
  } catch (err) {
    console.error('Status:', err);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

app.get('/api/subscription/verify', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1').get(req.user.userId, 'active');
    if (!sub) return res.status(402).json({ error: 'Subscription required', code: 'SUBSCRIPTION_REQUIRED' });
    if (sub.current_period_end && new Date(sub.current_period_end) < new Date()) {
      db.prepare('UPDATE subscriptions SET status = \'expired\', updated_at = datetime(\'now\') WHERE id = ?').run(sub.id);
      return res.status(402).json({ error: 'Subscription expired', code: 'SUBSCRIPTION_EXPIRED' });
    }
    res.json({ valid: true, plan: sub.plan, currentPeriodEnd: sub.current_period_end });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify' });
  }
});

// ── Admin API ──
app.get('/api/admin/users', adminMiddleware, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT u.id, u.email, u.name, u.school_name, u.phone, u.role, u.created_at, s.id as sub_id, s.plan, s.status as sub_status, s.mpesa_code, s.current_period_start, s.current_period_end FROM users u LEFT JOIN subscriptions s ON u.id = s.user_id ORDER BY u.created_at DESC').all();
    res.json({ users });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
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
      db.prepare('UPDATE subscriptions SET plan = ?, status = \'active\', current_period_start = ?, current_period_end = ?, admin_notes = ?, activated_by = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(plan || sub.plan, start, end, notes || '', req.user.userId, sub.id);
    } else {
      const subId = generateId();
      db.prepare('INSERT INTO subscriptions (id, user_id, plan, status, current_period_start, current_period_end, admin_notes, activated_by) VALUES (?, ?, ?, \'active\', ?, ?, ?, ?)')
        .run(subId, userId, plan || 'monthly', start, end, notes || '', req.user.userId);
    }
    notifyAdmin('payment_approved', { userId, plan: plan || sub?.plan, expiresAt: end });
    res.json({ message: 'User activated!', expiresAt: end });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/admin/deactivate', adminMiddleware, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const db = getDb();
    db.prepare('UPDATE subscriptions SET status = \'canceled\', updated_at = datetime(\'now\') WHERE user_id = ? AND status = \'active\'').run(userId);
    res.json({ message: 'User deactivated' });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get pending count (public)
app.get('/api/subscription/pending-count', (req, res) => {
  try {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as cnt FROM subscriptions WHERE status = ?').get('pending')?.cnt || 0;
    res.json({ pendingCount: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: list pending payments
app.post('/api/admin/till-list', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const db = getDb();
    const pending = db.prepare('SELECT u.email, u.name, u.school_name, u.phone, s.id as sub_id, s.plan, s.status, s.mpesa_code, s.created_at FROM subscriptions s JOIN users u ON s.user_id = u.id WHERE s.status = ? AND s.mpesa_code IS NOT NULL ORDER BY s.created_at DESC').all('pending');
    res.json({ success: true, pending, count: pending.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: approve till payment
app.post('/api/admin/till-approve', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { subId, durationDays, notes } = req.body;
    if (!subId) return res.status(400).json({ error: 'subId required' });
    const db = getDb();
    const duration = durationDays || 30;
    const start = new Date().toISOString();
    const end = new Date(Date.now() + duration * 86400000).toISOString();
    db.prepare('UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ?, admin_notes = ?, activated_by = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run('active', start, end, notes || '', req.user.userId, subId);
    const sub = db.prepare('SELECT u.name, u.email, u.school_name FROM subscriptions s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(subId);
    notifyAdmin('payment_approved', { subId, schoolName: sub?.school_name, email: sub?.email });
    res.json({ success: true, message: 'Approved! License issued.', expiresAt: end });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin: notifications
app.get('/api/admin/notifications', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    res.json({ success: true, notifications: readNotifications() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/notifications-read', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const notifs = readNotifications().map(n => ({ ...n, read: true }));
    saveNotifications(notifs);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Serve React SPA ──
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log('✅ CBC Assessment Suite running on port ' + PORT + '\n   API: http://localhost:' + PORT + '/api');
});
