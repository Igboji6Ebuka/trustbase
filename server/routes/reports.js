import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, `evidence-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// ── GET /api/reports ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page  || '1'));
  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
  const offset = (page - 1) * limit;
  try {
    const countRes = await query("SELECT COUNT(*) as count FROM reports WHERE status='published'");
    const count    = parseInt(countRes.rows[0].count);
    const rows     = await query(`
      SELECT r.id, r.target_phone, r.target_business, r.scam_type,
             r.description, r.amount_lost, r.anonymous, r.status, r.created_at,
             CASE WHEN r.anonymous = 0 THEN u.name ELSE NULL END AS reporter_name
      FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
      WHERE r.status = 'published'
      ORDER BY r.created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return res.json({ reports: rows.rows, total: count, page, limit });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reports/my ────────────────────────────────────────────────────
router.get('/my', requireAuth, async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, target_phone, target_business, scam_type, description,
             amount_lost, anonymous, status, created_at
      FROM reports WHERE reporter_id = $1 ORDER BY created_at DESC
    `, [req.user.id]);
    return res.json({ reports: rows.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/reports/:id ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.id, r.target_phone, r.target_business, r.scam_type,
             r.description, r.amount_lost, r.anonymous, r.status, r.created_at,
             CASE WHEN r.anonymous = 0 THEN u.name ELSE NULL END AS reporter_name
      FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
      WHERE r.id = $1 AND r.status = 'published'
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Report not found' });
    return res.json({ report: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/reports ──────────────────────────────────────────────────────
router.post('/', requireAuth, upload.single('evidence'), async (req, res) => {
  const { target_phone, target_business, scam_type, description, amount_lost, anonymous } = req.body;
  if (!scam_type || !description)
    return res.status(400).json({ error: 'scam_type and description are required' });
  if (!target_phone && !target_business)
    return res.status(400).json({ error: 'At least a phone number or business name is required' });

  const evidencePath = req.file ? req.file.filename : null;
  const isAnon       = anonymous === 'true' || anonymous === true ? 1 : 0;
  const amountLost   = parseInt(amount_lost || '0') || 0;

  try {
    const result = await query(`
      INSERT INTO reports (reporter_id, target_phone, target_business, scam_type, description, amount_lost, anonymous, evidence_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [isAnon ? null : req.user.id, target_phone || null, target_business || null,
        scam_type, description, amountLost, isAnon, evidencePath]);

    if (!isAnon) {
      await query('UPDATE users SET trust_points = trust_points + 20 WHERE id = $1', [req.user.id]);
      await query(
        'INSERT INTO notifications (user_id, title, body, type) VALUES ($1,$2,$3,$4)',
        [req.user.id, '📋 Report Submitted', 'Your report is queued for community review. You earned 20 trust points!', 'report']
      );
    }

    return res.status(201).json({ report: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
