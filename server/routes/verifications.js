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
    cb(null, `verif-doc-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

// ── GET /api/verifications/status ─────────────────────────────────────────
router.get('/status', requireAuth, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, entity_name, entity_type, id_type, status, fee_paid, submitted_at, reviewed_at
      FROM verifications WHERE user_id = $1
      ORDER BY submitted_at DESC LIMIT 1
    `, [req.user.id]);
    return res.json({ verification: result.rows[0] || null });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/verifications/apply ─────────────────────────────────────────
router.post('/apply', requireAuth, upload.single('document'), async (req, res) => {
  const { entity_name, entity_type, id_type, id_number } = req.body;
  if (!entity_name || !entity_type || !id_type || !id_number)
    return res.status(400).json({ error: 'entity_name, entity_type, id_type and id_number are required' });
  if (!['business', 'individual'].includes(entity_type))
    return res.status(400).json({ error: 'entity_type must be "business" or "individual"' });

  try {
    const existing = await query(`
      SELECT id, status FROM verifications
      WHERE user_id = $1 AND status NOT IN ('rejected') LIMIT 1
    `, [req.user.id]);

    if (existing.rows.length > 0)
      return res.status(409).json({
        error: `You already have a ${existing.rows[0].status} verification application`,
        existing: existing.rows[0],
      });

    const docPath = req.file ? req.file.filename : null;
    const result = await query(`
      INSERT INTO verifications (user_id, entity_name, entity_type, id_type, id_number, document_path, fee_paid)
      VALUES ($1, $2, $3, $4, $5, $6, 1) RETURNING *
    `, [req.user.id, entity_name, entity_type, id_type, id_number, docPath]);

    await query(
      'INSERT INTO notifications (user_id, title, body, type) VALUES ($1,$2,$3,$4)',
      [req.user.id, '✅ Verification Applied',
       `Your verification application for "${entity_name}" has been submitted. We'll review it within 24 hours.`,
       'verification']
    );

    const fee = entity_type === 'business' ? 5000 : 2000;
    return res.status(201).json({ verification: result.rows[0], fee_naira: fee });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
