import express from 'express';
import rateLimit from 'express-rate-limit';
import CodingProblem from '../models/CodingProblem.js';
import Submission from '../models/Submission.js';
import { authUser } from '../middleware/auth.js';
import { authAdmin } from '../middleware/auth.js';

const router = express.Router();

const LANGUAGE_FILES = {
  python: 'main.py',
  java: 'Main.java',
  cpp: 'main.cpp',
  javascript: 'main.js',
};

async function runOneCompiler(language, code, stdin) {
  const apiKey = process.env.ONECOMPILER_API_KEY;
  if (!apiKey) {
    throw new Error('OneCompiler API key not configured');
  }
  const fileName = LANGUAGE_FILES[language] || 'main.py';
  const res = await fetch(
    `https://api.onecompiler.com/v1/run?access_token=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        stdin: stdin || '',
        files: [{ name: fileName, content: code }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Code execution failed');
  }
  return data;
}

async function runOneCompilerBatch(language, code, stdinArray) {
  const apiKey = process.env.ONECOMPILER_API_KEY;
  if (!apiKey) {
    throw new Error('OneCompiler API key not configured');
  }
  const fileName = LANGUAGE_FILES[language] || 'main.py';
  const res = await fetch(
    `https://api.onecompiler.com/v1/run?access_token=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        stdin: stdinArray,
        files: [{ name: fileName, content: code }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Code execution failed');
  }
  return Array.isArray(data) ? data : [data];
}

const runLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Too many run requests. Try again in a minute.' },
});

router.post('/run', authUser, runLimiter, async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'code and language required' });
    }
    const allowed = ['python', 'java', 'cpp', 'javascript'];
    if (!allowed.includes(language)) {
      return res.status(400).json({ error: 'Unsupported language' });
    }
    const result = await runOneCompiler(language, code, stdin || '');
    const output = result.stdout || '';
    const error = result.stderr || result.exception || result.error || '';
    res.json({
      stdout: output,
      stderr: result.stderr || '',
      exception: result.exception || null,
      error: result.error || null,
      status: result.status,
      executionTime: result.executionTime,
      compilationTime: result.compilationTime,
      displayOutput: error ? `Error: ${error}` : output,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, displayOutput: `Error: ${e.message}` });
  }
});

router.get('/problems/:problemId', authUser, async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.problemId).lean();
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    const safe = {
      _id: problem._id,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      constraints: problem.constraints,
      starterCode: problem.starterCode,
      sampleTestCases: (problem.testCases || []).filter((t) => t.isSample).map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
    };
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/problems/:problemId/submit', authUser, runLimiter, async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    const { code, language } = req.body;
    if (!code || !language) {
      return res.status(400).json({ error: 'code and language required' });
    }
    const allowed = ['python', 'java', 'cpp', 'javascript'];
    if (!allowed.includes(language)) {
      return res.status(400).json({ error: 'Unsupported language' });
    }
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases configured for this problem' });
    }
    const stdinArray = testCases.map((t) => t.input);
    const expectedOutputs = testCases.map((t) => normalizeOutput(t.expectedOutput));
    const results = await runOneCompilerBatch(language, code, stdinArray);
    const testResults = results.map((r, i) => {
      const actual = normalizeOutput(r.stdout || '');
      const expected = expectedOutputs[i];
      const passed = actual === expected;
      return {
        passed,
        input: testCases[i].input,
        expected: testCases[i].expectedOutput,
        actual: r.stdout || (r.exception || r.error || ''),
      };
    });
    const passedCount = testResults.filter((r) => r.passed).length;
    const totalCount = testResults.length;
    const status = passedCount === totalCount ? 'accepted' : 'wrong_answer';
    const submission = await Submission.create({
      user: req.user._id,
      problem: problem._id,
      code,
      language,
      status,
      passedTests: passedCount,
      totalTests: totalCount,
      output: results[0]?.stdout || '',
      error: results[0]?.exception || results[0]?.error || '',
      testResults,
    });
    res.json({
      submissionId: submission._id,
      status,
      passedTests: passedCount,
      totalTests: totalCount,
      testResults,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function normalizeOutput(s) {
  if (s == null) return '';
  return String(s).trim().replace(/\r\n/g, '\n');
}

// Admin: manage coding problems
router.get('/admin/problems', authAdmin, async (req, res) => {
  try {
    const problems = await CodingProblem.find()
      .populate('module', 'title slug')
      .populate({
        path: 'level',
        select: 'name slug course',
        populate: { path: 'course', select: 'name slug' },
      })
      .sort({ createdAt: -1 })
      .lean();
    res.json(problems);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/problems', authAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      constraints,
      starterCode,
      testCases,
      moduleId,
      levelId,
      order,
      category,
    } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    const allowedCategories = ['practice', 'final_practical'];
    const safeCategory = allowedCategories.includes(category) ? category : 'practice';
    const problem = await CodingProblem.create({
      title,
      description,
      difficulty: difficulty || 'easy',
      constraints: constraints || '',
      starterCode: starterCode || '',
      testCases: ((testCases || []).length
        ? testCases
        : [{ input: '\n', expectedOutput: '\n', isSample: true }]
      ).map((t) => ({
        input: t.input != null ? String(t.input) : '',
        expectedOutput: t.expectedOutput != null ? String(t.expectedOutput) : '',
        isSample: t.isSample ?? false,
      })),
      category: safeCategory,
      module: moduleId || null,
      level: levelId || null,
      order: order ?? 0,
    });
    if (moduleId) {
      const Module = (await import('../models/Module.js')).default;
      await Module.findByIdAndUpdate(moduleId, { $push: { codingProblems: problem._id } });
    }
    res.status(201).json(problem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/admin/problems/:id', authAdmin, async (req, res) => {
  try {
    const { testCases, levelId, moduleId, ...rest } = req.body;
    const Module = (await import('../models/Module.js')).default;
    const existing = await CodingProblem.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Problem not found' });

    const update = { ...rest };
    if (levelId !== undefined) {
      update.level = levelId || null;
    }
    if (moduleId !== undefined) {
      update.module = moduleId || null;
    }
    if (Array.isArray(testCases)) {
      update.testCases = testCases.map((t) => ({
        input: t.input != null ? String(t.input) : '',
        expectedOutput: t.expectedOutput != null ? String(t.expectedOutput) : '',
        isSample: t.isSample ?? false,
      }));
    }

    const prevModuleId = existing.module ? existing.module.toString() : null;
    const nextModuleId =
      moduleId !== undefined
        ? (moduleId ? String(moduleId) : null)
        : prevModuleId;

    const problem = await CodingProblem.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });

    if (moduleId !== undefined && prevModuleId !== nextModuleId) {
      if (prevModuleId) {
        await Module.findByIdAndUpdate(prevModuleId, { $pull: { codingProblems: existing._id } });
      }
      if (nextModuleId) {
        await Module.findByIdAndUpdate(nextModuleId, { $addToSet: { codingProblems: existing._id } });
      }
    }

    res.json(problem);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/admin/problems/:id', authAdmin, async (req, res) => {
  try {
    const problem = await CodingProblem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    const Module = (await import('../models/Module.js')).default;
    await Module.updateMany({}, { $pull: { codingProblems: problem._id } });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
