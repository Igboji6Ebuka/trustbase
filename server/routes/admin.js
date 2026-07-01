import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalR, pendingR, totalU, flaggedN, pendingV, totalLostR, newU, newR] = await Promise.all([
      query("SELECT COUNT(*) as c FROM reports"),
      query("SELECT COUNT(*) as c FROM reports WHERE status='pending'"),
      query("SELECT COUNT(*) as c FROM users WHERE is_admin=0"),
      query("SELECT COUNT(DISTINCT target_phone) as c FROM reports WHERE status='published' AND target_phone IS NOT NULL"),
      query("SELECT COUNT(*) as c FROM verifications WHERE status IN ('pending','under_review','docs_received')"),
      query("SELECT SUM(amount_lost) as s FROM reports WHERE status='published'"),
      query("SELECT COUNT(*) as c FROM users WHERE created_at::date = CURRENT_DATE AND is_admin=0"),
      query("SELECT COUNT(*) as c FROM reports WHERE created_at::date = CURRENT_DATE"),
    ]);
    return res.json({
      totalReports:    parseInt(totalR.rows[0].c),
      pendingReports:  parseInt(pendingR.rows[0].c),
      totalUsers:      parseInt(totalU.rows[0].c),
      flaggedNumbers:  parseInt(flaggedN.rows[0].c),
      pendingVerifs:   parseInt(pendingV.rows[0].c),
      totalLost:       parseInt(totalLostR.rows[0].s) || 0,
      newUsersToday:   parseInt(newU.rows[0].c),
      newReportsToday: parseInt(newR.rows[0].c),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/reports ─────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  const { status, page = 1, limit = 20, q } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const params = [];
  let where = '1=1';

  if (status) { params.push(status); where += ` AND r.status = $${params.length}`; }
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (r.target_phone ILIKE $${params.length} OR r.target_business ILIKE $${params.length})`;
  }

  try {
    const countRes = await query(`SELECT COUNT(*) as count FROM reports r WHERE ${where}`, params);
    const count    = parseInt(countRes.rows[0].count);
    params.push(parseInt(limit), offset);
    const rows = await query(`
      SELECT r.id, r.target_phone, r.target_business, r.scam_type,
             r.description, r.amount_lost, r.anonymous, r.status, r.created_at,
             CASE WHEN r.anonymous = 0 THEN u.name ELSE 'Anonymous' END AS reporter_name,
             CASE WHEN r.anonymous = 0 THEN u.phone ELSE NULL END AS reporter_phone
      FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
      WHERE ${where}
      ORDER BY r.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    return res.json({ reports: rows.rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/admin/reports/:id ──────────────────────────────────────────
router.patch('/reports/:id', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'published', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const reportRes = await query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Report not found' });

    await query('UPDATE reports SET status = $1 WHERE id = $2', [status, req.params.id]);

    if (report.reporter_id && status !== 'pending') {
      const msg  = status === 'published' ? '✅ Report Published' : '❌ Report Rejected';
      const body = status === 'published'
        ? 'Your report is now live and visible to the community. Thank you for keeping Nigeria safe!'
        : 'Your report did not meet our verification standards. Please resubmit with more evidence.';
      await query(
        'INSERT INTO notifications (user_id, title, body, type) VALUES ($1,$2,$3,$4)',
        [report.reporter_id, msg, body, 'report']
      );
    }
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/verifications ──────────────────────────────────────────
router.get('/verifications', async (req, res) => {
  const { status } = req.query;
  const params = [];
  let where = '1=1';
  if (status) { params.push(status); where += ` AND v.status = $${params.length}`; }

  try {
    const rows = await query(`
      SELECT v.id, v.entity_name, v.entity_type, v.id_type, v.id_number,
             v.status, v.fee_paid, v.submitted_at, v.reviewed_at,
             u.name AS applicant_name, u.phone AS applicant_phone
      FROM verifications v JOIN users u ON u.id = v.user_id
      WHERE ${where} ORDER BY v.submitted_at DESC
    `, params);
    return res.json({ verifications: rows.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /api/admin/verifications/:id ────────────────────────────────────
router.patch('/verifications/:id', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'under_review', 'docs_received', 'approved', 'rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  try {
    const verifRes = await query(
      'SELECT v.*, u.id as uid FROM verifications v JOIN users u ON u.id=v.user_id WHERE v.id=$1',
      [req.params.id]
    );
    const verif = verifRes.rows[0];
    if (!verif) return res.status(404).json({ error: 'Verification not found' });

    await query('UPDATE verifications SET status = $1, reviewed_at = NOW() WHERE id = $2', [status, req.params.id]);

    const notifMap = {
      approved:     ['🎉 Verification Approved!', `Congratulations! "${verif.entity_name}" is now verified on TrustBase.`],
      rejected:     ['❌ Verification Rejected',  `Unfortunately your verification for "${verif.entity_name}" was not approved.`],
      under_review: ['🔍 Under Review',           `Your verification for "${verif.entity_name}" is being reviewed by our team.`],
      docs_received:['📄 Documents Received',      `We have received your documents for "${verif.entity_name}" and will review shortly.`],
    };
    if (notifMap[status]) {
      const [title, body] = notifMap[status];
      await query(
        'INSERT INTO notifications (user_id, title, body, type) VALUES ($1,$2,$3,$4)',
        [verif.user_id, title, body, 'verification']
      );
    }
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/users ───────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const params = [];
  let where = 'is_admin = 0';
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
  }

  try {
    const countRes = await query(`SELECT COUNT(*) as count FROM users WHERE ${where}`, params);
    params.push(parseInt(limit), offset);
    const rows = await query(`
      SELECT u.id, u.name, u.phone, u.trust_points, u.created_at,
             (SELECT COUNT(*) FROM reports WHERE reporter_id=u.id) AS report_count,
             (SELECT status FROM verifications WHERE user_id=u.id ORDER BY submitted_at DESC LIMIT 1) AS verif_status
      FROM users u WHERE ${where}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    return res.json({ users: rows.rows, total: parseInt(countRes.rows[0].count), page: parseInt(page) });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/admin/flagged ─────────────────────────────────────────────────
router.get('/flagged', async (req, res) => {
  try {
    const rows = await query(`
      SELECT target_phone as phone, target_business as business,
             COUNT(*) as report_count, SUM(amount_lost) as total_lost,
             MAX(created_at) as last_reported
      FROM reports WHERE status = 'published'
      GROUP BY target_phone, target_business
      HAVING COUNT(*) >= 2
      ORDER BY report_count DESC LIMIT 100
    `);
    return res.json({ flagged: rows.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
