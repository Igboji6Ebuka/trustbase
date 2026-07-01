import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';

// Routes
import authRouter          from './routes/auth.js';
import reportsRouter       from './routes/reports.js';
import searchRouter        from './routes/search.js';
import verificationsRouter from './routes/verifications.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter         from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: isProd
    ? true
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded evidence files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/reports',       reportsRouter);
app.use('/api/search',        searchRouter);
app.use('/api/verifications', verificationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin',         adminRouter);

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Serve React frontend in production ──────────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
} else {
  app.get('/', (_req, res) => {
    res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px">
      <h2>✅ TrustBase API is running</h2>
      <p>Open the frontend at: <a href="http://localhost:5173">http://localhost:5173</a></p>
    </body></html>`);
  });
}

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 TrustBase running at http://localhost:${PORT}`);
      if (!isProd) {
        console.log(`   Frontend: http://localhost:5173`);
        console.log(`   Admin login: phone=08000000000  password=admin123\n`);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
