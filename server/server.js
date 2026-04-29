import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool from './db/pool.js';

import authRoutes        from './routes/auth.js';
import adminRoutes       from './routes/admin.js';
import facultyRoutes     from './routes/faculty.js';
import parentRoutes      from './routes/parent.js';
import publicRoutes      from './routes/public.js';
import taskRoutes        from './routes/tasks.js';
import performanceRoutes from './routes/performance.js';
import enquiryRoutes     from './routes/enquiry.js';

const app = express();

// CWP runs behind a reverse proxy
app.set('trust proxy', 1);

// ──────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  // Add your CWP server domains below after deployment:
  // 'https://yourdomain.com',
  // 'https://admin.yourdomain.com',
  // 'https://faculty.yourdomain.com',
  // 'https://parent.yourdomain.com',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204
};

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/public',      publicRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/faculty',     facultyRoutes);
app.use('/api/parent',      parentRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/enquiry',     enquiryRoutes);

app.get('/', (req, res) => {
  res.send('SRV School Management API — MySQL backend running.');
});

// ──────────────────────────────────────────────
// CENTRALIZED ERROR HANDLER
// ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${err.message}`);
  if (err.message === 'Not allowed by CORS') {
    return res.status(418).json({ message: 'CORS policy: Origin not allowed.' });
  }
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'Internal Server Error'
  });
});

// ──────────────────────────────────────────────
// STARTUP — test MySQL pool then listen
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully.');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 CORS allowed origins: ${allowedOrigins.join(', ')}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();

export default app;
