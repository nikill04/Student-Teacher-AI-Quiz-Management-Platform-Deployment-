// Load variables from backend/.env FIRST (before any other file reads process.env)
import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB, { isDBConnected, databaseStatus } from './config/db.js';
import { cacheStatus } from './config/cache.js';
import authRoutes from './routes/authRoutes.js';
import studentRouter from './routes/studentRoutes.js';
import teacherRouter from './routes/teacherRoutes.js';
import aiRouter from './routes/aiRoutes.js';
import { swaggerUi, swaggerSpec } from './swagger/swagger.js';

// -------------------- CHECK REQUIRED SETTINGS --------------------
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing required settings: ${missing.join(', ')}`);
  console.error('Locally: copy backend/.env.example to backend/.env. On Render: add them under Environment.');
  process.exit(1);
}

const app = express();
// NOTE: port 5000 is used by "AirPlay Receiver" on macOS, so we use 5001.
// (Render sets PORT automatically.)
const PORT = process.env.PORT || 5001;

// Render (and most hosts) sit behind a proxy. This makes req.secure = true for https requests,
// which we use to choose the right login-cookie settings.
app.set('trust proxy', 1);

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    // Frontend URLs that are allowed to call this API (with cookies)
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3001', // docker-compose frontend
      'https://student-teacher-ai-quiz-management-qvdm.onrender.com', // deployed frontend
      process.env.FRONTEND_URL, // any other frontend URL (optional, set in .env / Render)
    ].filter(Boolean),
    credentials: true,
  })
);

// -------------------- SWAGGER (API docs) --------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// -------------------- ROUTES --------------------
app.get('/', (req, res) => res.send('QuizAI API is running. Docs: /api-docs'));
// Health check: shows if MongoDB and Redis are reachable.
// It is also called every few days by an Upstash QStash schedule ("keep-alive"),
// so the free Render server, Upstash Redis and MongoDB Atlas stay active.
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', database: await databaseStatus(), cache: await cacheStatus() });
});

// If MongoDB is not connected yet, answer with a clear message instead of waiting
app.use('/api', (req, res, next) => {
  if (isDBConnected()) return next();
  res.status(503).json({ error: 'The database is not connected yet. Please try again in a moment.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRouter);
app.use('/api/teacher', teacherRouter);
app.use('/api/ai', aiRouter);

// Unknown API route -> JSON 404 (instead of an HTML page)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Any error that was not handled (e.g. wrong file type in upload) -> JSON error
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || (err.name === 'MulterError' ? 400 : 500);
  res.status(status).json({ error: err.message || 'Something went wrong' });
});

// -------------------- START SERVER --------------------
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API Docs:          http://localhost:${PORT}/api-docs`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other app or set a different PORT in backend/.env`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

// Connect to MongoDB (keeps retrying in the background if it fails)
connectDB();
