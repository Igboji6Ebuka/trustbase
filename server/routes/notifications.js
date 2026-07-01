import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/notifications ─────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, title, body, type, read, created_at
      FROM notifications WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 50
    `, [req.user.id]);
    const notifications = result.rows;
    const unreadCount   = notifications.filter(n => !n.read).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET read = 1 WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Notification not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/notifications/read-all ─────────────────────────────────────
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    await query('UPDATE notifications SET read = 1 WHERE user_id = $1', [req.user.id]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
