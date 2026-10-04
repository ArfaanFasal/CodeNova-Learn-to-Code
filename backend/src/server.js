import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import courseRoutes from './routes/course.js';
import assessmentRoutes from './routes/assessment.js';
import codingRoutes from './routes/coding.js';

await connectDB();

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Try again later.' },
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Try again later.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/coding', codingRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
