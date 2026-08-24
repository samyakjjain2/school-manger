import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';

import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import staffRoutes from './routes/staff.routes.js';
import feeRoutes from './routes/fee.routes.js';
import noticeRoutes from './routes/notice.routes.js';
import visitorRoutes from './routes/visitor.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportRoutes from './routes/report.routes.js';
import searchRoutes from './routes/search.routes.js';
import examRoutes from './routes/exam.routes.js';
import timetableRoutes from './routes/timetable.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import libraryRoutes from './routes/library.routes.js';
import transportRoutes from './routes/transport.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Fix 1: Trust Reverse Proxy on Render/Heroku for accurate IP Rate Limiting
app.set('trust proxy', 1);

// Security Fix 2: Strict Content Security Policy (No unsafe-inline or unsafe-eval in scripts)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Security Fix 3: Custom Permissions-Policy Header
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Security Fix 4: Rate Limiter for Authentication (prevents password brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 authentication requests per 15 minutes
  message: { success: false, message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Security Fix 5: Rate Limiter for General API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  message: { success: false, message: 'Too many requests from this IP. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Security Fix 6: Prevent HTTP Parameter Pollution
app.use(hpp());

// Security Fix 7: Strict CORS Whitelist Configuration (NO ORIGIN REFLECTION)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://school-manger.onrender.com',
  'http://localhost:5173',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser or local server-to-server requests with no origin header
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed));
    if (isAllowed) {
      callback(null, true);
    } else {
      // Reject unauthorized origins (like https://evil.com) — NEVER reflect arbitrary origins!
      callback(null, false);
    }
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve frontend static assets
const publicPath = path.join(__dirname, '../../public');
const devDistPath = path.join(__dirname, '../../frontend/dist');
const frontendDistPath = fs.existsSync(publicPath) ? publicPath : devDistPath;
console.log(`📂 Serving frontend from: ${frontendDistPath}`);
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Security: Apply rate limiters to sensitive endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/transport', transportRoutes);

// Fallback all non-API requests to React SPA frontend
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: 'Frontend not built. Run npm run build in frontend.' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
