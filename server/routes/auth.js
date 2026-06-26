import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/signup ───────────────────────────────────────────────────
router.post('/signup', (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'name, phone and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(409).json({ error: 'Phone number already registered' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, phone, password_hash) VALUES (?, ?, ?)'
  ).run(name, phone, hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  // Welcome notification
  db.prepare(`
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (?, ?, ?, ?)
  `).run(user.id, '👋 Welcome to TrustBase!', 'You\'re now part of a community fighting scams in Nigeria. Stay safe!', 'system');

  const token = signToken(user);
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, phone: user.phone, is_admin: user.is_admin, trust_points: user.trust_points },
  });
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: 'phone and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid phone number or password' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user.id, name: user.name, phone: user.phone, is_admin: user.is_admin, trust_points: user.trust_points },
  });
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, phone, is_admin, trust_points, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

export default router;
