import express from 'express';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Course from '../models/Course.js';
import Level from '../models/Level.js';
import Module from '../models/Module.js';
import CodingProblem from '../models/CodingProblem.js';
import { authUser } from '../middleware/auth.js';

const router = express.Router();

function getModuleAccessResult({ moduleDoc, levelDoc, progress }) {
  if (!levelDoc || !progress) return { allowed: false, reason: 'Progress not found for current level.' };
  const moduleIds = (levelDoc.modules || []).map((m) => m._id.toString());
  const currentModuleId = moduleDoc._id.toString();
  if (!moduleIds.includes(currentModuleId)) {
    return { allowed: false, reason: 'Module does not belong to the current level.' };
  }
  const completed = new Set((progress.modulesCompleted || []).map((id) => id.toString()));
  if (completed.has(currentModuleId)) {
    return { allowed: true };
  }
  const firstIncomplete = moduleIds.find((id) => !completed.has(id));
  if (firstIncomplete && firstIncomplete !== currentModuleId) {
    return { allowed: false, reason: 'Complete previous modules before starting this one.' };
  }
  return { allowed: true };
}

function extractModuleNumber(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const moduleMatch = s.match(/\bmodule\s*[-:]?\s*(\d+)\b/i);
  if (moduleMatch) return Number(moduleMatch[1]);
  const trailingNumber = s.match(/(\d+)\s*$/);
  if (trailingNumber) return Number(trailingNumber[1]);
  return null;
}

// Select language and trigger placement (assessment) flow
router.post('/select-language', authUser, async (req, res) => {
  try {
    const { language } = req.body;
    const allowed = ['python', 'java', 'cpp', 'javascript'];
    if (!allowed.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    req.user.selectedLanguage = language;
    req.user.assessmentCompleted = false;
    req.user.assignedLevel = null;
    req.user.assessmentScore = null;
    req.user.levelProgress = [];
    await req.user.save();
    const placementQuiz = await Quiz.findOne({ type: 'placement' }).populate('questions');
    if (!placementQuiz) {
      return res.status(404).json({ error: 'Placement assessment not configured' });
    }
    const questions = placementQuiz.questions.map((q, i) => ({
      index: i,
      question: q.question,
      options: q.options,
      marks: q.marks,
    }));
    res.json({ placementQuizId: placementQuiz._id, questions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit placement assessment and get assigned level
// < 4 correct -> Beginner, 4-7 -> Intermediate, > 7 -> Expert
router.post('/submit-placement', authUser, async (req, res) => {
  try {
    const { placementQuizId, answers } = req.body;
    if (!placementQuizId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'placementQuizId and answers array required' });
    }
    const quiz = await Quiz.findById(placementQuizId);
    if (!quiz || quiz.type !== 'placement') {
      return res.status(400).json({ error: 'Invalid placement quiz' });
    }
    let correct = 0;
    const totalMarks = quiz.questions.reduce((s, q) => s + q.marks, 0);
    let scored = 0;
    quiz.questions.forEach((q, i) => {
      const a = answers.find((x) => x.questionIndex === i);
      if (a && a.selectedIndex === q.correctIndex) {
        correct++;
        scored += q.marks;
      }
    });
    await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: answers.map((a) => ({ questionIndex: a.questionIndex, selectedIndex: a.selectedIndex })),
      score: scored,
      totalMarks,
      passed: true,
    });
    let assignedLevel = 'beginner';
    if (correct > 7) assignedLevel = 'expert';
    else if (correct >= 4) assignedLevel = 'intermediate';

    req.user.assessmentCompleted = true;
    req.user.assessmentScore = correct;
    req.user.assignedLevel = assignedLevel;
    const progress = { level: assignedLevel, modulesCompleted: [], quizzesPassed: [], finalTestPassed: false, finalTestScore: null, averageQuizScore: null };
    if (!req.user.levelProgress || req.user.levelProgress.length === 0) {
      req.user.levelProgress = [progress];
    } else {
      const idx = req.user.levelProgress.findIndex((p) => p.level === assignedLevel);
      if (idx >= 0) req.user.levelProgress[idx] = progress;
      else req.user.levelProgress.push(progress);
    }
    await req.user.save();
    res.json({ assignedLevel, correct, total: quiz.questions.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update profile
router.patch('/profile', authUser, async (req, res) => {
  try {
    const { name, collegeName, yearOfStudy } = req.body;
    if (name !== undefined) req.user.name = name;
    if (collegeName !== undefined) req.user.collegeName = collegeName;
    if (yearOfStudy !== undefined) req.user.yearOfStudy = yearOfStudy;
    await req.user.save();
    res.json({ user: req.user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dashboard: level progress, stats, continue learning
router.get('/dashboard', authUser, async (req, res) => {
  try {
    const user = req.user;
    if (!user.selectedLanguage || !user.assignedLevel) {
      return res.json({
        needsLanguage: !user.selectedLanguage,
        needsAssessment: user.selectedLanguage && !user.assignedLevel,
        levelProgress: null,
        stats: null,
        currentLevel: null,
        nextModule: null,
      });
    }
    const course = await Course.findOne({ slug: user.selectedLanguage }).populate({
      path: 'levels',
      populate: { path: 'modules', options: { sort: { order: 1 } } },
    });
    if (!course) {
      return res.json({ levelProgress: user.levelProgress, stats: null, currentLevel: null, nextModule: null });
    }
    const currentLevelDoc = course.levels.find((l) => l.slug === user.assignedLevel);
    const progress = user.levelProgress?.find((p) => p.level === user.assignedLevel) || {
      modulesCompleted: [],
      quizzesPassed: [],
      finalTestPassed: false,
      finalTestScore: null,
      averageQuizScore: null,
    };
    const totalModules = currentLevelDoc?.modules?.length || 0;
    const completedCount = progress.modulesCompleted?.length || 0;
    let nextModule = null;
    if (currentLevelDoc?.modules?.length) {
      for (const m of currentLevelDoc.modules) {
        if (!progress.modulesCompleted?.some((id) => id.toString() === m._id.toString())) {
          nextModule = m;
          break;
        }
      }
    }
    const stats = {
      totalModules,
      completedModules: completedCount,
      averageQuizScore: progress.averageQuizScore,
      finalTestPassed: progress.finalTestPassed,
      finalTestScore: progress.finalTestScore,
    };
    const allModules = currentLevelDoc?.modules?.map((m) => ({
      _id: m._id,
      title: m.title,
      slug: m.slug,
      order: m.order,
      type: m.type || 'theory',
    })) || [];

    res.json({
      needsLanguage: false,
      needsAssessment: false,
      levelProgress: user.levelProgress,
      stats,
      currentLevel: currentLevelDoc
        ? {
            _id: currentLevelDoc._id,
            name: currentLevelDoc.name,
            slug: currentLevelDoc.slug,
            finalAssessment: currentLevelDoc.finalAssessment || null,
          }
        : null,
      nextModule: nextModule ? { _id: nextModule._id, title: nextModule.title, slug: nextModule.slug } : null,
      modules: allModules,
      completedModuleIds: progress.modulesCompleted?.map((id) => id?.toString?.()) || [],
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get module content
router.get('/modules/:moduleId', authUser, async (req, res) => {
  try {
    const mod = await Module.findById(req.params.moduleId)
      .populate({ path: 'level', populate: { path: 'course' } })
      .populate('quiz')
      .populate('codingProblems');
    if (!mod) return res.status(404).json({ error: 'Module not found' });
    const progress = req.user.levelProgress?.find((p) => p.level === req.user.assignedLevel);
    const levelDoc = await Level.findById(mod.level?._id).populate({
      path: 'modules',
      options: { sort: { order: 1 } },
    });
    const access = getModuleAccessResult({ moduleDoc: mod, levelDoc, progress });
    if (!access.allowed) {
      return res
        .status(403)
        .json({ error: access.reason || 'Module locked. Complete previous modules first.' });
    }

    // Pick practice problems for THIS module only.
    // Priority:
    // 1) problems explicitly linked to this module
    // 2) level problems whose title/module/order indicates this module number
    // This avoids showing all level problems in every practice module.
    const isPracticeProblem = (p) =>
      p && (!p.category || p.category === 'practice');

    const basePracticeProblems = (mod.codingProblems || [])
      .map((p) => (p.toObject ? p.toObject() : p))
      .filter(isPracticeProblem);

    if (mod.level) {
      const levelId = mod.level?._id || mod.level;
      const moduleId = mod._id?.toString?.() || String(mod._id);
      const moduleNumber =
        extractModuleNumber(mod.title) ??
        extractModuleNumber(mod.slug);
      const levelModuleIds = (levelDoc?.modules || []).map((m) =>
        m?._id ? m._id : m
      );
      const existingProblemIds = new Set(
        basePracticeProblems.map((p) => p?._id?.toString?.()).filter(Boolean)
      );

      // Pull practice problems by level and also by modules in this level.
      // This covers legacy data where problems were linked to module but not level.
      const extraProblems = await CodingProblem.find({
        $and: [
          {
            $or: [
              { level: levelId },
              { module: { $in: levelModuleIds } },
            ],
          },
          {
            $or: [
              { category: 'practice' },
              { category: { $exists: false } },
            ],
          },
        ],
      })
        .sort({ order: 1, createdAt: -1 })
        .lean();

      const allCandidates = [
        ...basePracticeProblems,
        ...extraProblems.filter((p) => !existingProblemIds.has(p._id.toString())),
      ];

      const explicitModuleMatches = allCandidates.filter((p) => {
        const pid = p?.module?._id?.toString?.() || p?.module?.toString?.();
        return pid && pid === moduleId;
      });

      if (explicitModuleMatches.length > 0) {
        mod.codingProblems = explicitModuleMatches;
      } else if (moduleNumber != null) {
        const numberedMatches = allCandidates.filter((p) => {
          const inferred =
            extractModuleNumber(p?.title) ??
            extractModuleNumber(p?.module?.title) ??
            (typeof p?.order === 'number' ? p.order + 1 : null);
          return inferred === moduleNumber;
        });
        mod.codingProblems = numberedMatches.length > 0 ? [numberedMatches[0]] : [];
      } else {
        mod.codingProblems = [];
      }
    } else {
      mod.codingProblems = basePracticeProblems;
    }

    res.json(mod);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get quiz for a module (questions without correct answers)
router.get('/quizzes/:quizId', authUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.type === 'final') {
      await quiz.populate('level');
      const levelDoc = await Level.findById(quiz.level?._id).populate('modules');
      const progress = req.user.levelProgress?.find((p) => p.level === req.user.assignedLevel);
      const total = levelDoc?.modules?.length || 0;
      const completed = progress?.modulesCompleted?.length || 0;
      if (total > 0 && completed < total) {
        return res.status(403).json({ error: 'Complete all modules to unlock the final assessment.' });
      }
    }
    const safe = quiz.questions.map((q, i) => ({
      index: i,
      question: q.question,
      options: q.options,
      marks: q.marks,
    }));
    res.json({ _id: quiz._id, title: quiz.title, type: quiz.type, questions: safe, passingScore: quiz.passingScore });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit quiz attempt
router.post('/quizzes/:quizId/submit', authUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.type === 'final') {
      await quiz.populate('level');
      const levelDoc = await Level.findById(quiz.level?._id).populate('modules');
      const progress = req.user.levelProgress?.find((p) => p.level === req.user.assignedLevel);
      const total = levelDoc?.modules?.length || 0;
      const completed = progress?.modulesCompleted?.length || 0;
      if (total > 0 && completed < total) {
        return res.status(403).json({ error: 'Complete all modules to unlock the final assessment.' });
      }
    }
    const { answers } = req.body;
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers array required' });
    let score = 0;
    const totalMarks = quiz.questions.reduce((s, q) => s + q.marks, 0);
    quiz.questions.forEach((q, i) => {
      const a = answers.find((x) => x.questionIndex === i);
      if (a && a.selectedIndex === q.correctIndex) score += q.marks;
    });
    const passed = totalMarks > 0 && (score / totalMarks) * 100 >= quiz.passingScore;
    await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers: (answers || []).map((a) => ({ questionIndex: a.questionIndex, selectedIndex: a.selectedIndex })),
      score,
      totalMarks,
      passed,
    });
    if (passed && quiz.type === 'module' && quiz.module) {
      const progress = req.user.levelProgress?.find((p) => p.level === req.user.assignedLevel);
      if (progress) {
        if (!progress.quizzesPassed) progress.quizzesPassed = [];
        if (!progress.quizzesPassed.some((id) => id.toString() === quiz._id.toString())) {
          progress.quizzesPassed.push(quiz._id);
        }
        const attempts = await QuizAttempt.find({ user: req.user._id, quiz: { $in: progress.quizzesPassed } });
        const avg = attempts.length ? attempts.reduce((s, a) => s + (a.totalMarks ? (a.score / a.totalMarks) * 100 : 0), 0) / attempts.length : null;
        progress.averageQuizScore = avg;
        await req.user.save();
      }
    }
    if (passed && quiz.type === 'final') {
      const progress = req.user.levelProgress?.find((p) => p.level === req.user.assignedLevel);
      if (progress) {
        progress.finalTestPassed = true;
        progress.finalTestScore = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      }

      // Auto-advance to next level when final test is passed
      await quiz.populate('level');
      const course = await Course.findOne({ slug: req.user.selectedLanguage }).populate({
        path: 'levels',
        options: { sort: { order: 1 } },
      });
      if (course && quiz.level) {
        const levels = course.levels;
        const idx = levels.findIndex((l) => l._id.toString() === quiz.level._id.toString());
        if (idx >= 0 && idx + 1 < levels.length) {
          const nextLevel = levels[idx + 1];
          req.user.assignedLevel = nextLevel.slug;
          // Ensure progress entry for next level
          const nextProgressTemplate = {
            level: nextLevel.slug,
            modulesCompleted: [],
            quizzesPassed: [],
            finalTestPassed: false,
            finalTestScore: null,
            averageQuizScore: null,
          };
          if (!Array.isArray(req.user.levelProgress) || req.user.levelProgress.length === 0) {
            req.user.levelProgress = [nextProgressTemplate];
          } else {
            const nextIdx = req.user.levelProgress.findIndex((p) => p.level === nextLevel.slug);
            if (nextIdx >= 0) {
              req.user.levelProgress[nextIdx] = {
                ...nextProgressTemplate,
                modulesCompleted: req.user.levelProgress[nextIdx].modulesCompleted || [],
                quizzesPassed: req.user.levelProgress[nextIdx].quizzesPassed || [],
              };
            } else {
              req.user.levelProgress.push(nextProgressTemplate);
            }
          }
        }
      }
      await req.user.save();
    }
    res.json({ score, totalMarks, passed, percentage: totalMarks ? (score / totalMarks) * 100 : 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark module completed
router.post('/modules/:moduleId/complete', authUser, async (req, res) => {
  try {
    const mod = await Module.findById(req.params.moduleId);
    if (!mod) return res.status(404).json({ error: 'Module not found' });
    const progress = req.user.levelProgress?.find((p) => p.level === req.user.assignedLevel);
    if (!progress) return res.status(400).json({ error: 'No progress for current level' });
    const levelDoc = await Level.findById(mod.level).populate({ path: 'modules', options: { sort: { order: 1 } } });
    const access = getModuleAccessResult({ moduleDoc: mod, levelDoc, progress });
    if (!access.allowed) {
      return res.status(403).json({ error: access.reason || 'Module locked. Complete previous modules first.' });
    }
    if (!progress.modulesCompleted) progress.modulesCompleted = [];
    if (!progress.modulesCompleted.some((id) => id.toString() === mod._id.toString())) {
      progress.modulesCompleted.push(mod._id);
    }
    await req.user.save();
    res.json({ completed: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
