import express from 'express';
import Course from '../models/Course.js';
import Level from '../models/Level.js';
import Module from '../models/Module.js';
import { authUser, authAdmin } from '../middleware/auth.js';

const router = express.Router();

// Student: list courses (languages) and levels for selected language
router.get('/languages', async (req, res) => {
  try {
    const courses = await Course.find().select('name slug description').lean();
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:courseSlug/levels', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.courseSlug })
      .populate({ path: 'levels', options: { sort: { order: 1 } } })
      .lean();
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course.levels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Student: get level with modules (for learning path)
router.get('/:courseSlug/levels/:levelSlug', authUser, async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.courseSlug }).populate({
      path: 'levels',
      match: { slug: req.params.levelSlug },
      populate: { path: 'modules', options: { sort: { order: 1 } } },
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const level = course.levels[0];
    if (!level) return res.status(404).json({ error: 'Level not found' });
    res.json(level);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin: Manage Courses / Levels / Modules ---
router.get('/admin/list', authAdmin, async (req, res) => {
  try {
    const courses = await Course.find()
      .populate({
        path: 'levels',
        options: { sort: { order: 1 } },
        populate: {
          path: 'modules',
          options: { sort: { order: 1 } },
          select: 'title slug order type content videoUrl quickStandaloneQuestion quickStandaloneInput quickStandaloneOutput',
        },
      })
      .lean();
    res.json(courses);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/courses', authAdmin, async (req, res) => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
    const course = await Course.create({ name, slug: slug.toLowerCase(), description: description || '' });
    res.status(201).json(course);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/admin/courses/:id', authAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/courses/:courseId/levels', authAdmin, async (req, res) => {
  try {
    const { name, slug, order } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
    const level = await Level.create({
      name,
      slug: slug.toLowerCase(),
      course: req.params.courseId,
      order: order ?? 0,
    });
    await Course.findByIdAndUpdate(req.params.courseId, { $push: { levels: level._id } });
    res.status(201).json(level);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/admin/levels/:id', authAdmin, async (req, res) => {
  try {
    const level = await Level.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!level) return res.status(404).json({ error: 'Level not found' });
    res.json(level);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/admin/levels/:levelId/modules', authAdmin, async (req, res) => {
  try {
    const { title, slug, order, content, videoUrl, type, quickStandaloneQuestion, quickStandaloneInput, quickStandaloneOutput } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'title and slug required' });
    const mod = await Module.create({
      title,
      slug: slug.toLowerCase(),
      level: req.params.levelId,
      order: order ?? 0,
      content: content || '',
      videoUrl: videoUrl || '',
      type: type === 'practice' ? 'practice' : 'theory',
      quickStandaloneQuestion: quickStandaloneQuestion || '',
      quickStandaloneInput: quickStandaloneInput || '',
      quickStandaloneOutput: quickStandaloneOutput || '',
    });
    await Level.findByIdAndUpdate(req.params.levelId, { $push: { modules: mod._id } });
    res.status(201).json(mod);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/admin/modules/:id', authAdmin, async (req, res) => {
  try {
    const mod = await Module.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!mod) return res.status(404).json({ error: 'Module not found' });
    res.json(mod);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/admin/modules/:id', authAdmin, async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id);
    if (!mod) return res.status(404).json({ error: 'Module not found' });
    await Level.findByIdAndUpdate(mod.level, { $pull: { modules: mod._id } });
    await Module.findByIdAndDelete(mod._id);
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
