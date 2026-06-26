import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `evidence-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

const router = Router();

// ── GET /api/reports  — public published reports (paginated) ───────────────
router.get('/', (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20')));
  const offset = (page - 1) * limit;

  const { count } = db.prepare(
    "SELECT COUNT(*) as count FROM reports WHERE status = 'published'"
  ).get();

  const rows = db.prepare(`
    SELECT r.id, r.target_phone, r.target_business, r.scam_type,
           r.description, r.amount_lost, r.anonymous, r.status, r.created_at,
           CASE WHEN r.anonymous = 0 THEN u.name ELSE NULL END AS reporter_name
    FROM reports r
    LEFT JOIN users u ON u.id = r.reporter_id
    WHERE r.status = 'published'
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  return res.json({ reports: rows, total: count, page, limit });
});

// ── GET /api/reports/my  — logged-in user's own reports ───────────────────
router.get('/my', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, target_phone, target_business, scam_type, description,
           amount_lost, anonymous, status, created_at
    FROM reports
    WHERE reporter_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  return res.json({ reports: rows });
});

// ── GET /api/reports/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const report = db.prepare(`
    SELECT r.id, r.target_phone, r.target_business, r.scam_type,
           r.description, r.amount_lost, r.anonymous, r.status, r.created_at,
           CASE WHEN r.anonymous = 0 THEN u.name ELSE NULL END AS reporter_name
    FROM reports r
    LEFT JOIN users u ON u.id = r.reporter_id
    WHERE r.id = ? AND r.status = 'published'
  `).get(req.params.id);

  if (!report) return res.status(404).json({ error: 'Report not found' });
  return res.json({ report });
});

// ── POST /api/reports  — submit a new report ───────────────────────────────
router.post('/', requireAuth, upload.single('evidence'), (req, res) => {
  const { target_phone, target_business, scam_type, description, amount_lost, anonymous } = req.body;

  if (!scam_type || !description) {
    return res.status(400).json({ error: 'scam_type and description are required' });
  }
  if (!target_phone && !target_business) {
    return res.status(400).json({ error: 'At least a phone number or business name is required' });
  }

  const evidencePath = req.file ? req.file.filename : null;
  const isAnon = anonymous === 'true' || anonymous === true ? 1 : 0;
  const amountLost = parseInt(amount_lost || '0') || 0;

  const result = db.prepare(`
    INSERT INTO reports (reporter_id, target_phone, target_business, scam_type, description, amount_lost, anonymous, evidence_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    isAnon ? null : req.user.id,
    target_phone || null,
    target_business || null,
    scam_type,
    description,
    amountLost,
    isAnon,
    evidencePath
  );

  // Award trust points
  if (!isAnon) {
    db.prepare('UPDATE users SET trust_points = trust_points + 20 WHERE id = ?').run(req.user.id);
    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, '📋 Report Submitted', 'Your report is queued for community review. You earned 20 trust points!', 'report');
  }

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ report });
});

export default router;
