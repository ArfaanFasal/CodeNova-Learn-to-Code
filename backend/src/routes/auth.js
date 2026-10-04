import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { authUser } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

function signUserToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
}

function signAdminToken(admin) {
  return jwt.sign({ adminId: admin._id }, JWT_ADMIN_SECRET, { expiresIn: '24h' });
}

// Student register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const user = await User.create({ email, password, name: name || '' });
    const token = signUserToken(user);
    res.status(201).json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Student login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ error: 'Account is blocked' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signUserToken(user);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        selectedLanguage: user.selectedLanguage,
        assignedLevel: user.assignedLevel,
        assessmentCompleted: user.assessmentCompleted,
      },
      token,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginId = email || username;
    if (!loginId || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }
    const admin = await Admin.findOne({
      $or: [{ email: loginId }, { username: loginId }],
    }).select('+password');
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signAdminToken(admin);
    res.json({
      admin: { id: admin._id, email: admin.email, username: admin.username, name: admin.name },
      token,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get current user (student)
router.get('/me', authUser, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      collegeName: req.user.collegeName,
      yearOfStudy: req.user.yearOfStudy,
      selectedLanguage: req.user.selectedLanguage,
      assignedLevel: req.user.assignedLevel,
      assessmentCompleted: req.user.assessmentCompleted,
      assessmentScore: req.user.assessmentScore,
      levelProgress: req.user.levelProgress,
    },
  });
});

export default router;
