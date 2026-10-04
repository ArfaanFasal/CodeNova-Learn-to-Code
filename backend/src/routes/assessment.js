import express from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import Level from '../models/Level.js';
import Module from '../models/Module.js';
import { authAdmin } from '../middleware/auth.js';

const router = express.Router();

const QUIZ_TYPES = ['placement', 'module', 'final'];
const MAX_TITLE_LENGTH = 300;
const MAX_QUESTION_LENGTH = 2000;
const MAX_OPTIONS = 10;
const MAX_OPTION_LENGTH = 500;

function sanitizeString(s, maxLen) {
  if (s == null) return '';
  const str = String(s).trim();
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function validateQuestion(q) {
  const question = sanitizeString(q.question, MAX_QUESTION_LENGTH);
  if (!question) return null;
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const options = rawOptions
    .slice(0, MAX_OPTIONS)
    .map((o) => sanitizeString(o, MAX_OPTION_LENGTH))
    .filter(Boolean);
  if (options.length < 2) return null;
  const correctIndex = Math.min(Math.max(0, Number(q.correctIndex) || 0), options.length - 1);
  const marks = Math.min(10, Math.max(1, Number(q.marks) || 1));
  return { question, options, correctIndex, marks, difficulty: 'easy' };
}

// Student: get placement quiz (handled in user routes)

// Admin: list all quizzes/assessments
router.get('/admin/quizzes', authAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .populate({
        path: 'level',
        select: 'name slug course',
        populate: { path: 'course', select: 'name slug' },
      })
      .populate('module', 'title slug')
      .lean();
    res.json(quizzes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/quizzes', authAdmin, async (req, res) => {
  try {
    const { title, type, levelId, moduleId, questions, passingScore } = req.body;
    const safeTitle = sanitizeString(title, MAX_TITLE_LENGTH);
    if (!safeTitle) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!QUIZ_TYPES.includes(type)) {
      return res.status(400).json({ error: 'type must be placement, module, or final' });
    }
    const rawQuestions = Array.isArray(questions) ? questions : [];
    const safeQuestions = rawQuestions.map(validateQuestion).filter(Boolean);
    const levelObjId = levelId && mongoose.Types.ObjectId.isValid(levelId) ? levelId : null;
    const moduleObjId = moduleId && mongoose.Types.ObjectId.isValid(moduleId) ? moduleId : null;
    const passing = Math.min(100, Math.max(0, Number(passingScore) ?? 60));

    const quiz = await Quiz.create({
      title: safeTitle,
      type,
      level: levelObjId || undefined,
      module: moduleObjId || undefined,
      questions: safeQuestions,
      passingScore: passing,
    });
    if (type === 'final' && levelObjId) {
      await Level.findByIdAndUpdate(levelObjId, { finalAssessment: quiz._id });
    }
    if (moduleObjId) {
      await Module.findByIdAndUpdate(moduleObjId, { quiz: quiz._id });
    }
    res.status(201).json(quiz);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/admin/quizzes/:id', authAdmin, async (req, res) => {
  try {
    const { questions, title, type, passingScore } = req.body;
    const update = {};
    if (title !== undefined) {
      const safeTitle = sanitizeString(title, MAX_TITLE_LENGTH);
      if (!safeTitle) return res.status(400).json({ error: 'title cannot be empty' });
      update.title = safeTitle;
    }
    if (type !== undefined) {
      if (!QUIZ_TYPES.includes(type)) return res.status(400).json({ error: 'type must be placement, module, or final' });
      update.type = type;
    }
    if (passingScore !== undefined) {
      update.passingScore = Math.min(100, Math.max(0, Number(passingScore) ?? 60));
    }
    if (Array.isArray(questions)) {
      update.questions = questions.map(validateQuestion).filter(Boolean);
    }
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/admin/quizzes/:id', authAdmin, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    await Module.updateMany({ quiz: quiz._id }, { $unset: { quiz: 1 } });
    await Level.updateMany({ finalAssessment: quiz._id }, { $unset: { finalAssessment: 1 } });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
