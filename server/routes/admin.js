import { Router } from 'express';
import db from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const totalReports   = db.prepare("SELECT COUNT(*) as c FROM reports").get().c;
  const pendingReports = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status='pending'").get().c;
  const totalUsers     = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_admin=0").get().c;
  const flaggedNumbers = db.prepare(`
    SELECT COUNT(DISTINCT target_phone) as c FROM reports
    WHERE status='published' AND target_phone IS NOT NULL
  `).get().c;
  const pendingVerifs  = db.prepare("SELECT COUNT(*) as c FROM verifications WHERE status IN ('pending','under_review','docs_received')").get().c;
  const totalLost      = db.prepare("SELECT SUM(amount_lost) as s FROM reports WHERE status='published'").get().s || 0;

  // New users today
  const newUsersToday  = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at)=date('now') AND is_admin=0").get().c;
  // New reports today
  const newReportsToday = db.prepare("SELECT COUNT(*) as c FROM reports WHERE date(created_at)=date('now')").get().c;

  return res.json({
    totalReports,
    pendingReports,
    totalUsers,
    flaggedNumbers,
    pendingVerifs,
    totalLost,
    newUsersToday,
    newReportsToday,
  });
});

// ── GET /api/admin/reports  — all reports with filters ────────────────────
router.get('/reports', (req, res) => {
  const { status, page = 1, limit = 20, q } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));

  let where = '1=1';
  const params = [];

  if (status) { where += ' AND r.status = ?'; params.push(status); }
  if (q) {
    where += ' AND (r.target_phone LIKE ? OR r.target_business LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  const { count } = db.prepare(`SELECT COUNT(*) as count FROM reports r WHERE ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT r.id, r.target_phone, r.target_business, r.scam_type,
           r.description, r.amount_lost, r.anonymous, r.status, r.created_at,
           CASE WHEN r.anonymous = 0 THEN u.name ELSE 'Anonymous' END AS reporter_name,
           CASE WHEN r.anonymous = 0 THEN u.phone ELSE NULL END AS reporter_phone
    FROM reports r
    LEFT JOIN users u ON u.id = r.reporter_id
    WHERE ${where}
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  return res.json({ reports: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
});

// ── PATCH /api/admin/reports/:id  — update report status ─────────────────
router.patch('/reports/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'published', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);

  // Notify reporter if not anonymous
  if (report.reporter_id && status !== 'pending') {
    const msg = status === 'published'
      ? '✅ Report Published'
      : '❌ Report Rejected';
    const body = status === 'published'
      ? 'Your report is now live and visible to the community. Thank you for keeping Nigeria safe!'
      : 'Your report did not meet our verification standards. Please resubmit with more evidence.';
    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, ?, ?, ?)
    `).run(report.reporter_id, msg, body, 'report');
  }

  return res.json({ success: true, status });
});

// ── GET /api/admin/verifications  — all verification applications ─────────
router.get('/verifications', (req, res) => {
  const { status } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND v.status = ?'; params.push(status); }

  const rows = db.prepare(`
    SELECT v.id, v.entity_name, v.entity_type, v.id_type, v.id_number,
           v.status, v.fee_paid, v.submitted_at, v.reviewed_at,
           u.name AS applicant_name, u.phone AS applicant_phone
    FROM verifications v
    JOIN users u ON u.id = v.user_id
    WHERE ${where}
    ORDER BY v.submitted_at DESC
  `).all(...params);

  return res.json({ verifications: rows });
});

// ── PATCH /api/admin/verifications/:id  — approve or reject ───────────────
router.patch('/verifications/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'under_review', 'docs_received', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const verif = db.prepare(`
    SELECT v.*, u.id as uid FROM verifications v JOIN users u ON u.id=v.user_id WHERE v.id=?
  `).get(req.params.id);
  if (!verif) return res.status(404).json({ error: 'Verification not found' });

  db.prepare(`
    UPDATE verifications SET status = ?, reviewed_at = datetime('now') WHERE id = ?
  `).run(status, req.params.id);

  // Notify applicant
  const notifMap = {
    approved:     ['🎉 Verification Approved!', `Congratulations! "${verif.entity_name}" is now a verified entity on TrustBase.`],
    rejected:     ['❌ Verification Rejected',  `Unfortunately your verification for "${verif.entity_name}" was not approved. Please contact support.`],
    under_review: ['🔍 Under Review',           `Your verification for "${verif.entity_name}" is being reviewed by our team.`],
    docs_received:['📄 Documents Received',      `We have received your documents for "${verif.entity_name}" and will review shortly.`],
  };

  if (notifMap[status]) {
    const [title, body] = notifMap[status];
    db.prepare(`
      INSERT INTO notifications (user_id, title, body, type)
      VALUES (?, ?, ?, ?)
    `).run(verif.user_id, title, body, 'verification');
  }

  return res.json({ success: true, status });
});

// ── GET /api/admin/users  — all registered users ──────────────────────────
router.get('/users', (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));

  let where = 'is_admin = 0';
  const params = [];
  if (q) {
    where += ' AND (name LIKE ? OR phone LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  const { count } = db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${where}`).get(...params);
  const rows = db.prepare(`
    SELECT u.id, u.name, u.phone, u.trust_points, u.created_at,
           (SELECT COUNT(*) FROM reports WHERE reporter_id=u.id) AS report_count,
           (SELECT status FROM verifications WHERE user_id=u.id ORDER BY submitted_at DESC LIMIT 1) AS verif_status
    FROM users u
    WHERE ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  return res.json({ users: rows, total: count, page: parseInt(page) });
});

// ── GET /api/admin/flagged  — numbers with 3+ reports ────────────────────
router.get('/flagged', (req, res) => {
  const rows = db.prepare(`
    SELECT target_phone as phone, target_business as business,
           COUNT(*) as report_count,
           SUM(amount_lost) as total_lost,
           MAX(created_at) as last_reported
    FROM reports
    WHERE status = 'published'
    GROUP BY target_phone, target_business
    HAVING report_count >= 2
    ORDER BY report_count DESC
    LIMIT 100
  `).all();

  return res.json({ flagged: rows });
});

export default router;
