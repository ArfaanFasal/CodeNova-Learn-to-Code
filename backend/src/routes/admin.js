import express from 'express';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Course from '../models/Course.js';
import Level from '../models/Level.js';
import Module from '../models/Module.js';
import Quiz from '../models/Quiz.js';
import CodingProblem from '../models/CodingProblem.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Submission from '../models/Submission.js';
import { authAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, usersByLevel, totalCourses] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $match: { assignedLevel: { $ne: null } } }, { $group: { _id: '$assignedLevel', count: { $sum: 1 } } }]),
      Course.countDocuments(),
    ]);
    res.json({ totalUsers, usersByLevel, totalCourses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Manage Users
router.get('/users', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const q = {};
    if (search) {
      q.$or = [
        { email: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(q).select('-password').sort({ createdAt: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean(),
      User.countDocuments(q),
    ]);
    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const [quizAttempts, submissions] = await Promise.all([
      QuizAttempt.find({ user: user._id }).populate('quiz', 'title type').lean(),
      Submission.find({ user: user._id }).populate('problem', 'title difficulty').sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    res.json({ user, quizAttempts, submissions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const ALLOWED_LEVELS = ['beginner', 'intermediate', 'expert'];
const ALLOWED_LANGUAGES = ['python', 'java', 'cpp', 'javascript'];

router.patch('/users/:id', async (req, res) => {
  try {
    const { name, email, assignedLevel, selectedLanguage } = req.body;
    const update = {};
    if (name !== undefined) update.name = String(name ?? '').trim().slice(0, 200);
    if (email !== undefined) {
      const e = String(email ?? '').trim().toLowerCase().slice(0, 320);
      if (!e) return res.status(400).json({ error: 'Email is required' });
      update.email = e;
    }
    if (assignedLevel !== undefined) {
      const l = String(assignedLevel ?? '').trim();
      update.assignedLevel = l && ALLOWED_LEVELS.includes(l) ? l : null;
    }
    if (selectedLanguage !== undefined) {
      const lang = String(selectedLanguage ?? '').trim().toLowerCase();
      update.selectedLanguage = lang && ALLOWED_LANGUAGES.includes(lang) ? lang : null;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/users/:id/unblock', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Results and Reports
router.get('/reports/users', async (req, res) => {
  try {
    const users = await User.find({ assignedLevel: { $ne: null } })
      .select('email name selectedLanguage assignedLevel assessmentScore levelProgress')
      .lean();
    const report = users.map((u) => ({
      id: u._id,
      email: u.email,
      name: u.name,
      language: u.selectedLanguage,
      level: u.assignedLevel,
      placementScore: u.assessmentScore,
      levelProgress: u.levelProgress,
    }));
    res.json({ report });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/reports/stats', async (req, res) => {
  try {
    const [totalUsers, byLevel, recentAttempts] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $match: { assignedLevel: { $ne: null } } }, { $group: { _id: '$assignedLevel', count: { $sum: 1 } } }]),
      QuizAttempt.find().populate('user', 'email name').populate('quiz', 'title type').sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    res.json({ totalUsers, byLevel, recentAttempts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
