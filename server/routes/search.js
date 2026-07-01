import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// ── GET /api/search?q= ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  const pattern = `%${q}%`;
  try {
    const result = await query(`
      SELECT r.id, r.target_phone, r.target_business, r.scam_type,
             r.description, r.amount_lost, r.anonymous, r.created_at,
             CASE WHEN r.anonymous = 0 THEN u.name ELSE NULL END AS reporter_name
      FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
      WHERE r.status = 'published'
        AND (r.target_phone ILIKE $1 OR r.target_business ILIKE $1)
      ORDER BY r.created_at DESC LIMIT 50
    `, [pattern]);

    const reports     = result.rows;
    const totalReports = reports.length;
    const totalLost    = reports.reduce((s, r) => s + (r.amount_lost || 0), 0);

    let riskLevel = 'safe', riskScore = 0;
    if (totalReports >= 5)      { riskLevel = 'high';    riskScore = 90; }
    else if (totalReports >= 2) { riskLevel = 'medium';  riskScore = 55; }
    else if (totalReports === 1){ riskLevel = 'caution'; riskScore = 35; }

    const verifRes = await query(`
      SELECT entity_name, entity_type FROM verifications
      WHERE status = 'approved' AND entity_name ILIKE $1 LIMIT 1
    `, [pattern]);

    return res.json({ query: q, riskLevel, riskScore, totalReports, totalLost,
      verified: verifRes.rows[0] || null, reports });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
