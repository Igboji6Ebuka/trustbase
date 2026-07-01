import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Use DATABASE_URL from Railway (auto-set when you add Postgres)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ─── Helper: run a query ────────────────────────────────────────────────────
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

// ─── Schema ─────────────────────────────────────────────────────────────────
async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT    NOT NULL,
      phone         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      trust_points  INTEGER NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reports (
      id              SERIAL PRIMARY KEY,
      reporter_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      target_phone    TEXT,
      target_business TEXT,
      scam_type       TEXT    NOT NULL,
      description     TEXT    NOT NULL,
      amount_lost     INTEGER DEFAULT 0,
      anonymous       INTEGER NOT NULL DEFAULT 0,
      evidence_path   TEXT,
      status          TEXT    NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('pending','published','rejected')),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_name   TEXT    NOT NULL,
      entity_type   TEXT    NOT NULL CHECK(entity_type IN ('business','individual')),
      id_type       TEXT    NOT NULL,
      id_number     TEXT    NOT NULL,
      document_path TEXT,
      status        TEXT    NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','under_review','docs_received','approved','rejected')),
      fee_paid      INTEGER NOT NULL DEFAULT 0,
      submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at   TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL,
      body       TEXT    NOT NULL,
      type       TEXT    NOT NULL DEFAULT 'system'
                 CHECK(type IN ('report','verification','system','warning')),
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_reports_phone    ON reports(target_phone);
    CREATE INDEX IF NOT EXISTS idx_reports_business ON reports(target_business);
    CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_created  ON reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifs_user      ON notifications(user_id, read);
  `);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
async function seedData() {
  const { rows } = await query('SELECT COUNT(*) as c FROM users');
  if (parseInt(rows[0].c) > 0) return;

  console.log('🌱 Seeding database...');

  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash  = bcrypt.hashSync('password123', 10);

  const u = await query(`
    INSERT INTO users (name, phone, password_hash, is_admin, trust_points) VALUES
    ('Admin TrustBase', '08000000000', $1, 1, 500),
    ('Chioma Okonkwo',  '08012345678', $2, 0, 120),
    ('Emeka Adeyemi',   '08023456789', $2, 0, 85),
    ('Fatima Bello',    '08034567890', $2, 0, 200),
    ('Tunde Fashola',   '08045678901', $2, 0, 45)
    RETURNING id
  `, [adminHash, userHash]);

  const [, user1, user2, user3, user4] = u.rows.map(r => r.id);

  await query(`
    INSERT INTO reports (reporter_id, target_phone, target_business, scam_type, description, amount_lost, anonymous, status, created_at) VALUES
    ($1,'08099887766','Lagos iPhone Hub','Fake Product / Non-delivery','I ordered an iPhone 15 Pro for ₦220,000. Paid via transfer, got a tracking number that never worked. The business WhatsApp went silent after 3 days.',220000,0,'published','2026-06-24 08:30:00'),
    ($2,'07034455667',NULL,'Investment / Ponzi','A man called himself "Forex Agent Chuka" and promised 30% monthly returns. I invested ₦500,000. Paid for 2 months then disappeared.',500000,0,'published','2026-06-23 14:22:00'),
    ($3,NULL,'Ada Fashion Lagos','Online Marketplace Scam','Bought clothes worth ₦45,000 from Ada Fashion Lagos on Instagram. They delivered wrong sizes and refused to refund.',45000,0,'published','2026-06-22 10:15:00'),
    ($4,'08011223344',NULL,'Loan / Finance Fraud','Received a call from someone claiming to be from a microfinance bank. He asked for my BVN and ATM pin to "activate" a loan. They cleaned my account.',80000,0,'published','2026-06-21 16:45:00'),
    ($1,'09087654321','Prime Gadgets Abuja','Fake Product / Non-delivery','Ordered a laptop on their Instagram page. Paid ₦180,000 upfront. Got a brick wrapped in bubble wrap.',180000,1,'published','2026-06-20 09:00:00'),
    ($2,'08077665544',NULL,'Romantic Scam','Met someone on Facebook who claimed to be a US soldier. After 3 weeks asked for money. Lost ₦150,000.',150000,1,'published','2026-06-19 20:30:00'),
    ($3,'07011223344','Global Traders Ltd','Investment / Ponzi','Promised 50% returns in 2 weeks. Took ₦500,000 from me and 20 others in my church.',500000,0,'published','2026-06-18 11:00:00'),
    ($4,'08056789012',NULL,'Job / Recruitment Scam','Applied for a job, was asked to pay ₦15,000 for training materials. After payment they stopped picking calls.',15000,0,'published','2026-06-17 13:20:00'),
    ($1,'09012345678','EazyMart Online','POS Fraud','The POS operator made a duplicate charge. I paid ₦12,000 for goods but ₦24,000 was debited.',12000,0,'published','2026-06-16 15:00:00'),
    ($2,'07023456789',NULL,'Online Marketplace Scam','Facebook marketplace seller. Agreed on price for a generator. After payment blocked me.',95000,0,'published','2026-06-15 08:45:00'),
    ($3,'08090123456','FastCash Loans','Loan / Finance Fraud','They offered instant loans but collected my details then started threatening me for repayment I never took.',0,0,'pending','2026-06-25 06:00:00'),
    ($4,'08034512390',NULL,'Fake Product / Non-delivery','Ordered phone accessories, got empty box.',8500,0,'pending','2026-06-25 07:30:00'),
    ($1,'09087123456','Bright Future Investments','Investment / Ponzi','Classic pyramid scheme. Took ₦200,000 from me.',200000,0,'pending','2026-06-25 09:00:00')
  `, [user1, user2, user3, user4]);

  await query(`
    INSERT INTO verifications (user_id, entity_name, entity_type, id_type, id_number, status, fee_paid, submitted_at) VALUES
    ($1,'Elite Fashion Store','business','CAC','RC-1234567','under_review',1,'2026-06-23 10:00:00'),
    ($2,'Emeka Adeyemi','individual','NIN','NIN-987654','docs_received',1,'2026-06-24 14:00:00'),
    ($3,'Lagos Supplies Co.','business','CAC','RC-9876543','pending',1,'2026-06-25 08:00:00'),
    ($4,'Tunde Consulting Ltd','business','CAC','RC-1122334','approved',1,'2026-06-10 09:00:00')
  `, [user1, user2, user3, user4]);

  await query(`
    INSERT INTO notifications (user_id, title, body, type, read, created_at) VALUES
    ($1,'🎉 Report Published','Your report on Lagos iPhone Hub is now live.','report',0,'2026-06-24 09:00:00'),
    ($1,'⭐ Trust Points Earned','You earned 20 trust points for your scam report.','system',0,'2026-06-24 09:01:00'),
    ($1,'🔍 Verification Update','Your verification for Elite Fashion Store is under review.','verification',1,'2026-06-23 11:00:00'),
    ($2,'✅ Verification Submitted','Your documents have been received and are being reviewed.','verification',0,'2026-06-24 15:00:00'),
    ($2,'⚠️ New Scam Alert','A new Investment scam was reported in your area. Stay safe!','warning',0,'2026-06-24 12:00:00'),
    ($3,'📋 Report Pending','Your latest report is queued for admin review.','report',0,'2026-06-25 08:30:00')
  `, [user1, user2, user3]);

  console.log('✅ Database seeded successfully');
}

// ─── Init on startup ─────────────────────────────────────────────────────────
export async function initDB() {
  await initSchema();
  await seedData();
}

export default pool;
