import { Router } from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/notifications  — user's notifications ─────────────────────────
router.get('/', requireAuth, (req, res) => {
  const notifs = db.prepare(`
    SELECT id, title, body, type, read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.id);

  const unreadCount = notifs.filter(n => !n.read).length;
  return res.json({ notifications: notifs, unreadCount });
});

// ── PATCH /api/notifications/:id/read  — mark as read ─────────────────────
router.patch('/:id/read', requireAuth, (req, res) => {
  const result = db.prepare(`
    UPDATE notifications SET read = 1
    WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  return res.json({ success: true });
});

// ── PATCH /api/notifications/read-all  — mark all as read ─────────────────
router.patch('/read-all', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  return res.json({ success: true });
});

export default router;
