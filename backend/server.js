require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/error');

// Connect Database
connectDB();

const app = express();
app.disable('x-powered-by');

// Security & Middleware
app.use(helmet());
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([
  ...envOrigins,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Basic CSRF protection via Origin/Referer checks for state-changing requests
app.use((req, res, next) => {
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  let requestOrigin = origin || null;

  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch (error) {
      requestOrigin = null;
    }
  }

  if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
    res.status(403);
    return next(new Error('Invalid request origin'));
  }

  return next();
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Raised from 500 — admin sessions make many requests
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
// Strict limiter ONLY for actual login/register endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ShreeJewels API is running 💍', env: process.env.NODE_ENV });
});

// Cache middleware: adds Cache-Control headers for public GET routes
const cachePublic = (seconds) => (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
  }
  next();
};

// Routes
// IMPORTANT: loginLimiter must be mounted BEFORE authRouter so it runs first
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/login/customer', loginLimiter);
app.use('/api/auth/register', loginLimiter);
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// No server-side cache headers — frontend 5s in-memory cache handles perf,
// and cache.clear() on mutations ensures admin changes reflect immediately
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/banners', cachePublic(60), require('./routes/banners'));  // banners are rarely mutated
app.use('/api/admin/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/missing-orders', require('./routes/missingOrders'));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ShreeJewels API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
