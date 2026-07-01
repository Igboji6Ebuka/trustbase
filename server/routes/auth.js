import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/signup ───────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password)
    return res.status(400).json({ error: 'name, phone and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const existing = await query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Phone number already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (name, phone, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, phone, hash]
    );
    const user = result.rows[0];

    // Welcome notification
    await query(
      'INSERT INTO notifications (user_id, title, body, type) VALUES ($1, $2, $3, $4)',
      [user.id, '👋 Welcome to TrustBase!', "You're now part of a community fighting scams in Nigeria. Stay safe!", 'system']
    );

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, is_admin: user.is_admin, trust_points: user.trust_points },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Server error during signup' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ error: 'phone and password are required' });

  try {
    const result = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid phone number or password' });

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, is_admin: user.is_admin, trust_points: user.trust_points },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// ── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, phone, is_admin, trust_points, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
