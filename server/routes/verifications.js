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
    cb(null, `verif-doc-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// ── GET /api/verifications/status  — user's own verification status ────────
router.get('/status', requireAuth, (req, res) => {
  const verif = db.prepare(`
    SELECT id, entity_name, entity_type, id_type, status, fee_paid, submitted_at, reviewed_at
    FROM verifications
    WHERE user_id = ?
    ORDER BY submitted_at DESC
    LIMIT 1
  `).get(req.user.id);

  return res.json({ verification: verif || null });
});

// ── POST /api/verifications/apply  — submit a verification application ─────
router.post('/apply', requireAuth, upload.single('document'), (req, res) => {
  const { entity_name, entity_type, id_type, id_number } = req.body;

  if (!entity_name || !entity_type || !id_type || !id_number) {
    return res.status(400).json({ error: 'entity_name, entity_type, id_type and id_number are required' });
  }
  if (!['business', 'individual'].includes(entity_type)) {
    return res.status(400).json({ error: 'entity_type must be "business" or "individual"' });
  }

  // Check if already has a pending / approved application
  const existing = db.prepare(`
    SELECT id, status FROM verifications
    WHERE user_id = ? AND status NOT IN ('rejected')
    LIMIT 1
  `).get(req.user.id);

  if (existing) {
    return res.status(409).json({
      error: `You already have a ${existing.status} verification application`,
      existing,
    });
  }

  const docPath = req.file ? req.file.filename : null;
  const fee = entity_type === 'business' ? 5000 : 2000;

  const result = db.prepare(`
    INSERT INTO verifications (user_id, entity_name, entity_type, id_type, id_number, document_path, fee_paid)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(req.user.id, entity_name, entity_type, id_type, id_number, docPath);

  // Notification to user
  db.prepare(`
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, '✅ Verification Applied', `Your verification application for "${entity_name}" has been submitted. We'll review it within 24 hours.`, 'verification');

  const verif = db.prepare('SELECT * FROM verifications WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ verification: verif, fee_naira: fee });
});

export default router;
