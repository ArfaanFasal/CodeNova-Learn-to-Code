import { useState, useEffect, useMemo } from 'react';
import { admin as adminApi } from '../../api';
import './ManageList.css';

const LANGUAGES = [
  { slug: 'cpp', name: 'C++' },
  { slug: 'java', name: 'Java' },
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'python', name: 'Python' },
];

const LEVELS = [
  { slug: 'beginner', name: 'Beginner', difficulty: 'easy' },
  { slug: 'intermediate', name: 'Intermediate', difficulty: 'medium' },
  { slug: 'expert', name: 'Expert', difficulty: 'hard' },
];

const DIFFICULTY_TO_LEVEL = { easy: 'beginner', medium: 'intermediate', hard: 'expert' };

function deriveLanguage(problem) {
  const courseName = problem?.level?.course?.name;
  if (courseName) return courseName;
  const moduleTitle = problem?.module?.title;
  if (moduleTitle) {
    const firstWord = moduleTitle.split(' ')[0];
    return firstWord || 'General';
  }
  return 'General';
}

function getLangSlug(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('c++') || n === 'cpp') return 'cpp';
  // javascript contains "java" so check for it first
  if (n.includes('javascript') || n.includes('js')) return 'javascript';
  if (n.includes('java')) return 'java';
  if (n.includes('python')) return 'python';
  return null;
}

function normalizeDifficulty(difficulty) {
  const d = String(difficulty || '').trim().toLowerCase();
  if (!d) return 'easy';
  if (d === 'beginner') return 'easy';
  if (d === 'intermediate') return 'medium';
  if (d === 'expert') return 'hard';
  return d;
}

function normalizeLevelSlug(levelValue) {
  const s = String(levelValue || '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'easy' || s === 'beginner') return 'beginner';
  if (s === 'medium' || s === 'intermediate') return 'intermediate';
  if (s === 'hard' || s === 'expert') return 'expert';
  return null;
}

const EMPTY_PROBLEM_FORM = {
  title: '',
  description: '',
  difficulty: 'easy',
  moduleId: '',
  constraints: '',
  starterCode: '',
  testCases: [{ input: '\n', expectedOutput: '\n', isSample: true }],
};

export default function ManageCoding() {
  const [problems, setProblems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedProblemContext, setSelectedProblemContext] = useState(null);
  const [form, setForm] = useState(EMPTY_PROBLEM_FORM);
  const [saving, setSaving] = useState(false);
  const [repairingLinks, setRepairingLinks] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [levelSearch, setLevelSearch] = useState('');
  const [problemSearch, setProblemSearch] = useState('');
  const [expandedLang, setExpandedLang] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createContext, setCreateContext] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.problems(), adminApi.courseList()])
      .then(([probs, crs]) => {
        // Only show regular practice problems in this screen.
        // Final-assessment practical problems are managed from Manage Assessments.
        const practiceProblems = (probs || []).filter(
          (p) => !p.category || p.category === 'practice'
        );
        setProblems(practiceProblems);
        setCourses(crs || []);
      })
      .catch(() => {
        setProblems([]);
        setCourses([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resolveLevelContext = useMemo(() => {
    const courseIndex = (courses || []).reduce((acc, c) => {
      const key = (c?.slug || '').toLowerCase();
      if (key) acc[key] = c;
      return acc;
    }, {});

    const findCourseForLang = (langSlug) => {
      const direct = courseIndex[String(langSlug || '').toLowerCase()];
      if (direct) return direct;
      // Fallback: try matching by name/slug heuristics (supports custom slugs like "c++")
      return (courses || []).find((c) => {
        const guessFromSlug = getLangSlug(c?.slug);
        const guessFromName = getLangSlug(c?.name);
        return guessFromSlug === langSlug || guessFromName === langSlug;
      }) || null;
    };

    const findLevelForCourse = (course, levelSlug) => {
      const ls = String(levelSlug || '').toLowerCase();
      return (course?.levels || []).find((l) => String(l?.slug || '').toLowerCase() === ls) || null;
    };

    const resolve = (langSlug, levelSlug) => {
      const course = findCourseForLang(langSlug);
      const level = course ? findLevelForCourse(course, levelSlug) : null;
      return {
        course,
        level,
        courseId: course?._id || null,
        levelId: level?._id || null,
      };
    };

    return resolve;
  }, [courses]);

  const unlinkedProblems = useMemo(
    () => (problems || []).filter((p) => !p?.level),
    [problems]
  );

  const levelModulesMap = useMemo(() => {
    const map = {};
    (courses || []).forEach((course) => {
      (course?.levels || []).forEach((level) => {
        const key = level?._id?.toString?.();
        if (!key) return;
        map[key] = [...(level?.modules || [])].sort(
          (a, b) => (a?.order ?? 0) - (b?.order ?? 0)
        );
      });
    });
    return map;
  }, [courses]);

  const selectedLevelIdForForm = showCreateModal
    ? (createContext?.levelId || null)
    : (
      selectedProblemContext?.levelId ||
      selectedProblem?.level?._id?.toString?.() ||
      selectedProblem?.level?.toString?.() ||
      null
    );

  const moduleOptionsForForm = selectedLevelIdForForm
    ? (levelModulesMap[selectedLevelIdForForm] || [])
    : [];

  const repairMissingLevelLinks = async () => {
    if (repairingLinks) return;
    const candidates = (problems || []).filter((p) => p && p._id && !p.level);
    if (candidates.length === 0) {
      alert('All problems are already linked to a level.');
      return;
    }
    setRepairingLinks(true);
    let fixed = 0;
    try {
      for (const p of candidates) {
        const langSlug = getLangSlug(deriveLanguage(p));
        const levelSlug = DIFFICULTY_TO_LEVEL[normalizeDifficulty(p.difficulty)] || 'beginner';
        if (!langSlug) continue;
        const ctx = resolveLevelContext(langSlug, levelSlug);
        if (!ctx?.levelId) continue;
        // Update uses `level` (not levelId) so student modules can pick it up by level.
        await adminApi.updateProblem(p._id, { level: ctx.levelId });
        fixed += 1;
      }
      if (fixed === 0) {
        alert(
          'No links could be repaired automatically. Ensure each course has Beginner/Intermediate/Expert levels set up in Manage Courses.'
        );
      }
      load();
    } catch (e) {
      alert('Repair failed: ' + (e.message || 'Unknown error'));
      console.error(e);
    } finally {
      setRepairingLinks(false);
    }
  };

  const filteredLanguages = useMemo(() => {
    const t = langSearch.trim().toLowerCase();
    if (!t) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(t) ||
        l.slug.toLowerCase().includes(t)
    );
  }, [langSearch]);

  const filteredLevels = useMemo(() => {
    const t = levelSearch.trim().toLowerCase();
    if (!t) return LEVELS;
    return LEVELS.filter(
      (l) =>
        l.name.toLowerCase().includes(t) ||
        l.slug.toLowerCase().includes(t)
    );
  }, [levelSearch]);

  const problemsByLangAndLevel = useMemo(() => {
    const m = {};
    LANGUAGES.forEach((lang) => {
      m[lang.slug] = { beginner: [], intermediate: [], expert: [] };
    });
    problems.forEach((p) => {
      const langSlug =
        (p?.level?.course?.slug && getLangSlug(p.level.course.slug)) ||
        getLangSlug(p?.level?.course?.name) ||
        getLangSlug(deriveLanguage(p));

      const levelSlug =
        normalizeLevelSlug(p?.level?.slug) ||
        normalizeLevelSlug(p?.level?.name) ||
        DIFFICULTY_TO_LEVEL[normalizeDifficulty(p.difficulty)] ||
        'beginner';

      if (langSlug && m[langSlug]) {
        if (!m[langSlug][levelSlug]) m[langSlug][levelSlug] = [];
        m[langSlug][levelSlug].push(p);
      }
    });
    return m;
  }, [problems]);

  const filteredProblems = useMemo(() => {
    const list = expandedLang && expandedLevel
      ? problemsByLangAndLevel[expandedLang]?.[expandedLevel] || []
      : [];
    const t = problemSearch.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(t) ||
        (p.description || '').toLowerCase().includes(t) ||
        (p.module?.title || '').toLowerCase().includes(t)
    );
  }, [problemsByLangAndLevel, expandedLang, expandedLevel, problemSearch]);

  const handleSelectProblem = (problem) => {
    setSelectedProblem(problem);
    // Capture the folder context the admin selected this problem from.
    // We'll use this to re-link problems that were created/loaded without a level,
    // which is the primary reason they don't show up in student practice modules.
    const ctx =
      expandedLang && expandedLevel
        ? {
            langSlug: expandedLang,
            levelSlug: expandedLevel,
            levelId: resolveLevelContext(expandedLang, expandedLevel)?.levelId || null,
          }
        : null;
    setSelectedProblemContext(ctx);
    setForm({
      title: problem.title || '',
      description: problem.description || '',
      difficulty: normalizeDifficulty(problem.difficulty) || 'easy',
      moduleId: problem?.module?._id?.toString?.() || problem?.module?.toString?.() || '',
      constraints: problem.constraints || '',
      starterCode: problem.starterCode || '',
      testCases: (problem.testCases || []).length
        ? (problem.testCases || []).map((tc) => ({
            input: tc.input ?? '',
            expectedOutput: tc.expectedOutput ?? '',
            isSample: tc.isSample ?? false,
          }))
        : [{ input: '\n', expectedOutput: '\n', isSample: true }],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleTestCaseChange = (index, field, value) => {
    setForm((f) => {
      const newTestCases = [...f.testCases];
      newTestCases[index] = { ...newTestCases[index], [field]: value };
      return { ...f, testCases: newTestCases };
    });
  };

  const handleAddTestCase = () => {
    setForm((f) => ({
      ...f,
      testCases: [...f.testCases, { input: '\n', expectedOutput: '\n', isSample: false }],
    }));
  };

  const handleRemoveTestCase = (index) => {
    setForm((f) => ({
      ...f,
      testCases: f.testCases.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!selectedProblem) return;
    const payload = {
      ...form,
      difficulty: normalizeDifficulty(form.difficulty) || 'easy',
      moduleId: form.moduleId || null,
      testCases: form.testCases.map((tc) => ({
        input: tc.input ?? '',
        expectedOutput: tc.expectedOutput ?? '',
        isSample: tc.isSample ?? false,
      })),
    };

    // If the admin selected the problem inside a folder, ensure its `level`
    // is actually linked to that level so students can see it.
    const targetLevelId = selectedProblemContext?.levelId;
    const currentLevelId =
      selectedProblem?.level?._id?.toString?.() || selectedProblem?.level?.toString?.() || null;
    if (targetLevelId && targetLevelId.toString?.() !== currentLevelId) {
      payload.levelId = targetLevelId;
    }

    setSaving(true);
    try {
      await adminApi.updateProblem(selectedProblem._id, payload);
      setSelectedProblem(null);
      setSelectedProblemContext(null);
      load();
    } catch (e) {
      alert('Error saving: ' + (e.message || 'Unknown error'));
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = (lang, lev) => {
    const ctx = resolveLevelContext(lang.slug, lev.slug);
    setSelectedProblem(null);
    setSelectedProblemContext(null);
    setCreateContext({
      lang: lang.name,
      lev: lev.name,
      levelId: ctx?.levelId || null,
      difficulty: lev.difficulty,
    });
    setForm(EMPTY_PROBLEM_FORM);
    setForm((f) => ({
      ...f,
      difficulty: lev.difficulty,
      moduleId: '',
    }));
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      alert('Title is required.');
      return;
    }
    if (!form.description.trim()) {
      alert('Description is required.');
      return;
    }
    if (!createContext?.levelId) {
      alert(
        'This problem cannot be created because the selected course/level mapping is missing. Please ensure the course levels exist (Beginner/Intermediate/Expert) for this language in Manage Courses.'
      );
      return;
    }
    const testCases = form.testCases.map((tc) => ({
      input: tc.input ?? '',
      expectedOutput: tc.expectedOutput ?? '',
      isSample: tc.isSample ?? false,
    }));
    if (testCases.length === 0) {
      testCases.push({ input: '\n', expectedOutput: '\n', isSample: true });
    }
    setSaving(true);
    try {
      await adminApi.createProblem({
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: normalizeDifficulty(form.difficulty) || 'easy',
        constraints: form.constraints || '',
        starterCode: form.starterCode || '',
        testCases,
        levelId: createContext.levelId,
        moduleId: form.moduleId || null,
        category: 'practice',
      });
      setShowCreateModal(false);
      setCreateContext(null);
      load();
    } catch (e) {
      alert('Error creating: ' + (e.message || 'Unknown error'));
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (problemId) => {
    if (!window.confirm('Delete this problem? This cannot be undone.')) return;
    setSaving(true);
    try {
      await adminApi.deleteProblem(problemId);
      if (selectedProblem && selectedProblem._id === problemId) setSelectedProblem(null);
      load();
    } catch (e) {
      alert('Error deleting: ' + (e.message || 'Unknown error'));
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleLang = (slug) => {
    setExpandedLang((prev) => (prev === slug ? null : slug));
    setExpandedLevel(null);
  };

  const toggleLevel = (slug) => {
    setExpandedLevel((prev) => (prev === slug ? null : slug));
  };

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="manage-admin-page">
      <div className="page-header">
        <div>
          <h1>Manage Coding Labs</h1>
          <p className="text-muted" style={{ margin: '6px 0 0' }}>
            Curate practice problems by language and difficulty. Use the folder tree to navigate.
          </p>
        </div>
        {unlinkedProblems.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {unlinkedProblems.length} problem(s) missing level link
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving || repairingLinks}
              onClick={repairMissingLevelLinks}
              title="Fix problems that won't appear in student practice modules"
            >
              {repairingLinks ? 'Repairing...' : 'Repair missing links'}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <p className="text-muted">
          Navigate: Languages → Beginner/Intermediate/Expert → Problems. Click &quot;+ Add Problem&quot; at each level to create a problem in that category.
        </p>
      </div>

      <div className="two-col-layout">
        <div className="list-panel">
          <div className="search-and-list">
            <div className="drive-search-level">
              <span className="search-label">Search languages</span>
              <input
                type="search"
                className="search-box"
                placeholder="C++, Java, JavaScript, Python..."
                value={langSearch}
                onChange={(e) => setLangSearch(e.target.value)}
              />
            </div>
            <div className="list-panel-title">Languages</div>
            <div className="list-panel-scroll">
              <div className="drive-folder-tree">
                {filteredLanguages.map((lang) => {
                  const isExpanded = expandedLang === lang.slug;
                  return (
                    <div key={lang.slug}>
                      <div
                        className={`drive-folder-row ${isExpanded ? 'expanded selected' : ''}`}
                        onClick={() => toggleLang(lang.slug)}
                      >
                        <span className="folder-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                        <span className="folder-name">{lang.name}</span>
                      </div>
                      {isExpanded && (
                        <div className="drive-folder-children">
                          <div className="drive-search-level">
                            <span className="search-label">Search levels</span>
                            <input
                              type="search"
                              className="search-box"
                              placeholder="Beginner, Intermediate, Expert..."
                              value={levelSearch}
                              onChange={(e) => setLevelSearch(e.target.value)}
                            />
                          </div>
                          {filteredLevels.map((lev) => {
                            const list = problemsByLangAndLevel[lang.slug]?.[lev.slug] || [];
                            const isLevelExpanded = expandedLevel === lev.slug;
                            return (
                              <div key={lev.slug}>
                                <div
                                  className={`drive-folder-row ${isLevelExpanded ? 'expanded selected' : ''}`}
                                  onClick={() => toggleLevel(lev.slug)}
                                >
                                  <span className="folder-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </span>
                                  <span className="folder-name">{lev.name}</span>
                                  <span className={`drive-level-badge ${lev.slug}`}>{list.length}</span>
                                </div>
                                {isLevelExpanded && (
                                  <div className="drive-folder-children">
                                    <div className="drive-search-level">
                                      <span className="search-label">Search problems</span>
                                      <input
                                        type="search"
                                        className="search-box"
                                        placeholder="Filter problems..."
                                        value={problemSearch}
                                        onChange={(e) => setProblemSearch(e.target.value)}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 12, color: '#64748b' }}>Problems</span>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ padding: '4px 10px', fontSize: 12 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openCreateModal(lang, lev);
                                        }}
                                      >
                                        + Add Problem
                                      </button>
                                    </div>
                                    {filteredProblems.length === 0 ? (
                                      <div>
                                        <p className="empty-list-msg">No problems in this level.</p>
                                        <button
                                          type="button"
                                          className="btn btn-ghost"
                                          style={{ marginTop: 4, fontSize: 12 }}
                                          onClick={() => openCreateModal(lang, lev)}
                                        >
                                          + Add first problem
                                        </button>
                                      </div>
                                    ) : (
                                      filteredProblems.map((p) => (
                                        <div
                                          key={p._id}
                                          className={`drive-item-row ${selectedProblem?._id === p._id ? 'selected' : ''}`}
                                          onClick={() => handleSelectProblem(p)}
                                        >
                                          <span className="item-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M16 18l6-6-6-6" />
                                              <path d="M8 6v12" />
                                            </svg>
                                          </span>
                                          <span className="folder-name">{p.title}</span>
                                          <div className="drive-item-actions">
                                            <button
                                              type="button"
                                              className="btn btn-ghost btn-xs"
                                              title="Edit"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectProblem(p);
                                              }}
                                            >
                                              ✎
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-ghost btn-remove"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(p._id);
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="content-panel">
          <h2 className="section-heading" style={{ marginBottom: 12 }}>Edit Problem</h2>
          {!selectedProblem && (
            <div className="card">
              <p className="text-muted">Select a problem from the folder tree to edit, or use &quot;+ Add Problem&quot; at a level to create one.</p>
            </div>
          )}
          {selectedProblem && (
            <div className="card">
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Description (shown to students)</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                  style={{ width: '100%', fontFamily: 'inherit' }}
                  placeholder="Write the problem statement here."
                />
              </div>

              <div className="form-group">
                <label>Difficulty</label>
                <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                  <option value="easy">Easy (Beginner)</option>
                  <option value="medium">Medium (Intermediate)</option>
                  <option value="hard">Hard (Expert)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Allocate to Module</label>
                <select name="moduleId" value={form.moduleId || ''} onChange={handleChange}>
                  <option value="">Unassigned</option>
                  {moduleOptionsForForm.map((m) => (
                    <option key={m._id} value={m._id}>
                      {`Module ${(m.order ?? 0) + 1} - ${m.title}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Constraints (optional)</label>
                <textarea
                  name="constraints"
                  value={form.constraints}
                  onChange={handleChange}
                  rows={3}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="e.g., 1 ≤ n ≤ 10^5"
                />
              </div>

              <div className="form-group">
                <label>Starter Code (optional)</label>
                <textarea
                  name="starterCode"
                  value={form.starterCode}
                  onChange={handleChange}
                  rows={8}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="Code that appears in the editor initially"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>Test Cases</label>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={handleAddTestCase}>
                    + Add Test Case
                  </button>
                </div>
                {form.testCases.length === 0 && (
                  <p style={{ color: '#64748b', fontSize: 14 }}>No test cases. Add at least one.</p>
                )}
                {form.testCases.map((tc, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                      backgroundColor: tc.isSample ? '#fffbeb' : '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong>Test Case {idx + 1}</strong>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={tc.isSample}
                            onChange={(e) => handleTestCaseChange(idx, 'isSample', e.target.checked)}
                          />
                          Sample (shown to students)
                        </label>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleRemoveTestCase(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 13 }}>Input:</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                        rows={3}
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
                        placeholder="Test input (use newline for no input)"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 13 }}>Expected Output:</label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                        rows={3}
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
                        placeholder="Expected output"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedProblem(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || form.testCases.length === 0}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Problem Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              Add Problem {createContext ? `(${createContext.lang} · ${createContext.lev})` : ''}
            </h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Problem title"
                />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Problem statement for students"
                  style={{ width: '100%', fontFamily: 'inherit' }}
                />
              </div>
              <div className="form-group">
                <label>Difficulty</label>
                <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                  <option value="easy">Easy (Beginner)</option>
                  <option value="medium">Medium (Intermediate)</option>
                  <option value="hard">Hard (Expert)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Allocate to Module</label>
                <select name="moduleId" value={form.moduleId || ''} onChange={handleChange}>
                  <option value="">Unassigned</option>
                  {moduleOptionsForForm.map((m) => (
                    <option key={m._id} value={m._id}>
                      {`Module ${(m.order ?? 0) + 1} - ${m.title}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Constraints (optional)</label>
                <textarea
                  name="constraints"
                  value={form.constraints}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g., 1 ≤ n ≤ 10^5"
                />
              </div>
              <div className="form-group">
                <label>Starter Code (optional)</label>
                <textarea
                  name="starterCode"
                  value={form.starterCode}
                  onChange={handleChange}
                  rows={4}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="Initial code in editor"
                />
              </div>
              <div className="form-group">
                <label>Test Cases (at least one required)</label>
                {form.testCases.map((tc, idx) => (
                  <div key={idx} style={{ marginBottom: 12, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong>Case {idx + 1}</strong>
                      {form.testCases.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleRemoveTestCase(idx)}>Remove</button>
                      )}
                    </div>
                    <label style={{ fontSize: 12 }}>Input:</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                      rows={2}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, marginBottom: 6 }}
                    />
                    <label style={{ fontSize: 12 }}>Expected Output:</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                      rows={2}
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={tc.isSample}
                        onChange={(e) => handleTestCaseChange(idx, 'isSample', e.target.checked)}
                      />
                      Sample (shown to students)
                    </label>
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-xs" onClick={handleAddTestCase}>
                  + Add Test Case
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Problem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
