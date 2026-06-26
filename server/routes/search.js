import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── GET /api/search?q=  ────────────────────────────────────────────────────
// Searches published reports by phone number or business name.
// Returns a risk summary + matching reports.
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  const pattern = `%${q}%`;

  const reports = db.prepare(`
    SELECT r.id, r.target_phone, r.target_business, r.scam_type,
           r.description, r.amount_lost, r.anonymous, r.created_at,
           CASE WHEN r.anonymous = 0 THEN u.name ELSE NULL END AS reporter_name
    FROM reports r
    LEFT JOIN users u ON u.id = r.reporter_id
    WHERE r.status = 'published'
      AND (r.target_phone LIKE ? OR r.target_business LIKE ?)
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all(pattern, pattern);

  const totalReports = reports.length;
  const totalLost    = reports.reduce((s, r) => s + (r.amount_lost || 0), 0);

  // Compute risk level
  let riskLevel = 'safe';
  let riskScore = 0;
  if (totalReports >= 5) { riskLevel = 'high';   riskScore = 90; }
  else if (totalReports >= 2) { riskLevel = 'medium'; riskScore = 55; }
  else if (totalReports === 1) { riskLevel = 'caution'; riskScore = 35; }

  // Check if there's a verified entity matching the query
  const verified = db.prepare(`
    SELECT entity_name, entity_type FROM verifications
    WHERE status = 'approved' AND entity_name LIKE ?
    LIMIT 1
  `).get(pattern);

  return res.json({
    query: q,
    riskLevel,
    riskScore,
    totalReports,
    totalLost,
    verified: verified || null,
    reports,
  });
});

export default router;
