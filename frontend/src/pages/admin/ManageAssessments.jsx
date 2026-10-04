import { useState, useEffect, useMemo } from 'react';
import { admin as adminApi } from '../../api';
import './ManageList.css';

const LANGUAGES = [
  { slug: 'cpp', name: 'C++' },
  { slug: 'java', name: 'Java' },
  { slug: 'javascript', name: 'JavaScript' },
  { slug: 'python', name: 'Python' },
];

const ASSESSMENT_CATEGORIES = [
  { slug: 'quiz', name: 'Quiz', types: ['placement', 'module'] },
  { slug: 'final', name: 'Final Assessment', types: ['final'] },
];

const QUIZ_TYPES = [
  { value: 'placement', label: 'Placement' },
  { value: 'module', label: 'Module' },
  { value: 'final', label: 'Final' },
];

function deriveQuizLanguage(quiz) {
  const courseName = quiz?.level?.course?.name;
  if (courseName) return courseName;
  const moduleTitle = quiz?.module?.title;
  if (moduleTitle) {
    const firstWord = moduleTitle.split(' ')[0];
    return firstWord || 'General';
  }
  return 'General';
}

function getLangSlug(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('c++') || n === 'cpp') return 'cpp';
  // check for javascript before java since 'javascript' contains 'java'
  if (n.includes('javascript') || n.includes('js')) return 'javascript';
  if (n.includes('java')) return 'java';
  if (n.includes('python')) return 'python';
  return null;
}

const EMPTY_FORM = {
  title: '',
  type: 'module',
  passingScore: 60,
};

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  marks: 1,
});

const emptyFinalContentForm = () => ({
  levelId: '',
  title: '',
  passingScore: 60,
  mcqQuestion: '',
  mcqOptions: ['', '', '', ''],
  mcqCorrectIndex: 0,
  mcqMarks: 1,
  description: '',
  difficulty: 'medium',
  constraints: '',
  starterCode: '',
  testCases: [{ input: '', expectedOutput: '', isSample: true }],
});

export default function ManageAssessments() {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion());
  const [langSearch, setLangSearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedLang, setExpandedLang] = useState(null);
  const [expandedLevelId, setExpandedLevelId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'module',
    languageSlug: 'python',
    passingScore: 60,
  });
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [addContentContext, setAddContentContext] = useState(null);
  const [addContentType, setAddContentType] = useState('mcq');
  const [addContentForm, setAddContentForm] = useState(emptyFinalContentForm());

  const load = () => {
    setLoading(true);
    Promise.all([
      adminApi.quizzes().catch(() => []),
      adminApi.courseList().catch(() => []),
      adminApi.problems().catch(() => []),
    ])
      .then(([q, c, p]) => {
        setQuizzes(Array.isArray(q) ? q : []);
        setCourses(Array.isArray(c) ? c : []);
        setProblems(Array.isArray(p) ? p : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filteredLanguages = useMemo(() => {
    const t = String(langSearch || '').trim().toLowerCase();
    if (!t) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(t) ||
        l.slug.toLowerCase().includes(t)
    );
  }, [langSearch]);

  const quizzesByCategoryAndLang = useMemo(() => {
    const m = { quiz: {}, final: {} };
    LANGUAGES.forEach((lang) => {
      m.quiz[lang.slug] = [];
      m.final[lang.slug] = [];
    });
    quizzes.forEach((q) => {
      const fromLevelOrModule = getLangSlug(deriveQuizLanguage(q));
      const fromTitle = getLangSlug(q?.title);
      const langSlug = fromLevelOrModule || fromTitle || 'python';
      const type = q.type || 'module';
      const cat = type === 'final' ? 'final' : 'quiz';
      if (m[cat][langSlug]) m[cat][langSlug].push(q);
    });
    return m;
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    const list =
      expandedCategory && expandedLang
        ? quizzesByCategoryAndLang[expandedCategory]?.[expandedLang] || []
        : [];
    const t = String(quizSearch || '').trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (q) =>
        (q.title || '').toLowerCase().includes(t) ||
        (q.type || '').toLowerCase().includes(t)
    );
  }, [quizzesByCategoryAndLang, expandedCategory, expandedLang, quizSearch]);

  const courseBySlug = useMemo(() => {
    const m = {};
    (courses || []).forEach((c) => { m[c.slug] = c; });
    return m;
  }, [courses]);

  const addContentLevelOptions = useMemo(() => {
    const langSlug = addContentContext?.langSlug;
    if (!langSlug) return [];
    const course = courseBySlug[langSlug];
    return [...(course?.levels || [])].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));
  }, [addContentContext, courseBySlug]);

  const finalItemsByLevel = useMemo(() => {
    const m = {};
    (quizzes || [])
      .filter((q) => q.type === 'final' && (q.level?._id || q.level))
      .forEach((q) => {
        const lid = (q.level?._id || q.level)?.toString();
        if (!lid) return;
        if (!m[lid]) m[lid] = { quizzes: [], problems: [] };
        m[lid].quizzes.push(q);
      });
    (problems || [])
      // Only treat explicitly-marked final practical problems as part of the final assessment
      .filter((p) => (p.level?._id || p.level) && (p.category === 'final_practical'))
      .forEach((p) => {
        const lid = (p.level?._id || p.level)?.toString();
        if (!m[lid]) m[lid] = { quizzes: [], problems: [] };
        m[lid].problems.push(p);
      });
    return m;
  }, [quizzes, problems]);

  const handleSelect = (quiz) => {
    setSelectedProblem(null);
    setSelected(quiz);
    setForm({
      title: String(quiz.title || ''),
      type: quiz.type || 'module',
      passingScore: Number(quiz.passingScore) ?? 60,
    });
    setEditingQuestionIndex(null);
    setQuestionForm(emptyQuestion());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === 'passingScore' ? Math.min(100, Math.max(0, Number(value) || 0)) : value,
    }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.updateQuiz(selected._id, {
        ...form,
        questions: selected.questions || [],
      });
      setSelected((prev) => (prev ? { ...prev, ...form, questions: prev.questions || [] } : null));
      load();
    } catch (e) {
      alert(e?.message || 'Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const saveQuestions = async (newQuestions) => {
    if (!selected) return;
    setSaving(true);
    try {
      await adminApi.updateQuiz(selected._id, { ...form, questions: newQuestions });
      setSelected((prev) => (prev ? { ...prev, questions: newQuestions } : null));
      setEditingQuestionIndex(null);
      setQuestionForm(emptyQuestion());
    } catch (e) {
      alert(e?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestionIndex(-1);
    setQuestionForm(emptyQuestion());
  };

  const openEditQuestion = (index) => {
    const q = (selected?.questions || [])[index];
    if (!q) return;
    setEditingQuestionIndex(index);
    setQuestionForm({
      question: String(q.question || ''),
      options: Array.isArray(q.options) && q.options.length ? [...q.options] : ['', '', '', ''],
      correctIndex: Number(q.correctIndex) ?? 0,
      marks: Number(q.marks) ?? 1,
    });
  };

  const handleSaveQuestion = () => {
    const options = (questionForm.options || []).filter((o) => String(o).trim());
    if (!String(questionForm.question || '').trim() || options.length < 2) {
      alert('Question text and at least 2 options are required.');
      return;
    }
    const correctIndex = Math.min(Math.max(0, questionForm.correctIndex), options.length - 1);
    const newQ = {
      question: questionForm.question.trim(),
      options,
      correctIndex,
      marks: Math.max(1, Number(questionForm.marks) || 1),
    };
    const current = selected?.questions || [];
    const newQuestions =
      editingQuestionIndex === -1
        ? [...current, newQ]
        : current.map((q, i) => (i === editingQuestionIndex ? newQ : q));
    saveQuestions(newQuestions);
  };

  const handleDeleteQuestion = async (index) => {
    if (!selected || !window.confirm('Remove this question?')) return;
    const newQuestions = (selected.questions || []).filter((_, i) => i !== index);
    await saveQuestions(newQuestions);
  };

  const openCreateModal = (languageSlug) => {
    setCreateForm({
      title: '',
      type: 'module',
      languageSlug: languageSlug || 'python',
      passingScore: 60,
    });
    setShowCreateModal(true);
  };

  const openAddContentModal = (langSlug, preferredLevelId = '') => {
    const levels = [...(courseBySlug[langSlug]?.levels || [])].sort(
      (a, b) => (a?.order ?? 0) - (b?.order ?? 0)
    );
    const defaultLevelId = preferredLevelId || levels[0]?._id || '';
    setAddContentContext({ langSlug });
    setAddContentType('mcq');
    setAddContentForm({
      ...emptyFinalContentForm(),
      levelId: defaultLevelId,
    });
    setShowAddContentModal(true);
  };

  const handleAddContent = async () => {
    if (!addContentContext) return;
    const levelId = String(addContentForm.levelId || '').trim();
    if (!levelId) {
      alert('Please select a level.');
      return;
    }
    setSaving(true);
    try {
      if (addContentType === 'mcq') {
        const title = String(addContentForm.title || '').trim();
        const question = String(addContentForm.mcqQuestion || '').trim();
        const options = (addContentForm.mcqOptions || [])
          .map((o) => String(o || '').trim())
          .filter(Boolean);
        if (!title) { alert('Title is required.'); setSaving(false); return; }
        if (!question || options.length < 2) {
          alert('MCQ requires question and at least 2 options.');
          setSaving(false);
          return;
        }
        const correctIndex = Math.min(
          Math.max(0, Number(addContentForm.mcqCorrectIndex) || 0),
          options.length - 1
        );
        await adminApi.createQuiz({
          title,
          type: 'final',
          levelId,
          passingScore: Math.min(100, Math.max(0, Number(addContentForm.passingScore) || 60)),
          questions: [{
            question,
            options,
            correctIndex,
            marks: Math.max(1, Number(addContentForm.mcqMarks) || 1),
          }],
        });
      } else {
        const title = String(addContentForm.title || '').trim();
        const description = String(addContentForm.description || '').trim();
        if (!title || !description) { alert('Title and question (description) are required.'); setSaving(false); return; }
        await adminApi.createProblem({
          title,
          description,
          levelId,
          difficulty: String(addContentForm.difficulty || 'medium'),
          constraints: String(addContentForm.constraints || ''),
          starterCode: String(addContentForm.starterCode || ''),
          testCases: ((addContentForm.testCases || []).length
            ? addContentForm.testCases
            : [{ input: '', expectedOutput: '', isSample: true }]
          ).map((tc) => ({
            input: String(tc?.input ?? ''),
            expectedOutput: String(tc?.expectedOutput ?? ''),
            isSample: !!tc?.isSample,
          })),
          // mark as final practical so it doesn't appear in regular practice lists
          category: 'final_practical',
        });
      }
      setShowAddContentModal(false);
      setAddContentContext(null);
      load();
    } catch (e) {
      alert(e?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectProblem = (problem) => {
    setSelected(null);
    setSelectedProblem(problem);
  };

  const handleDeleteProblem = async (id) => {
    if (!window.confirm('Delete this problem? This cannot be undone.')) return;
    setSaving(true);
    try {
      await adminApi.deleteProblem(id);
      if (selectedProblem?._id === id) setSelectedProblem(null);
      load();
    } catch (e) {
      alert(e?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    let title = String(createForm.title || '').trim();
    if (!title) {
      alert('Title is required.');
      return;
    }
    const languageSlug = createForm.languageSlug;
    const langOption = LANGUAGES.find((l) => l.slug === languageSlug);
    if (langOption && !getLangSlug(title)) {
      title = `${langOption.name} - ${title}`;
    }
    setSaving(true);
    try {
      await adminApi.createQuiz({
        title,
        type: createForm.type,
        passingScore: Math.min(100, Math.max(0, Number(createForm.passingScore) || 60)),
        questions: [],
      });
      setShowCreateModal(false);
      load();
    } catch (e) {
      alert(e?.message || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this quiz? This cannot be undone.')) return;
    setSaving(true);
    try {
      await adminApi.deleteQuiz(id);
      if (selected && selected._id === id) {
        setSelected(null);
        setForm(EMPTY_FORM);
        setEditingQuestionIndex(null);
      }
      load();
    } catch (e) {
      alert(e?.message || 'Failed to delete quiz');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (slug) => {
    setExpandedCategory((prev) => (prev === slug ? null : slug));
    setExpandedLang(null);
    setExpandedLevelId(null);
  };

  const toggleLang = (slug) => {
    setExpandedLang((prev) => (prev === slug ? null : slug));
    setExpandedLevelId(null);
  };

  const toggleLevel = (levelId) => {
    setExpandedLevelId((prev) => (prev === levelId ? null : levelId));
  };

  const questions = selected?.questions || [];
  const isEditingQuestion = editingQuestionIndex !== null;

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div className="manage-admin-page">
      <div className="page-header">
        <div>
          <h1>Manage Assessments</h1>
          <p className="text-muted" style={{ margin: '6px 0 0' }}>
            Create and edit quizzes and final assessments. Open a category → language to see items.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal} disabled={saving}>
          + Add Quiz
        </button>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="text-muted">
          Folder tree: Quiz or Final Assessment → Language → Quizzes. Use search to filter.
        </p>
      </div>
      <div className="two-col-layout">
        <div className="list-panel">
          <div className="search-and-list">
            <div className="list-panel-title">Categories</div>
            <div className="list-panel-scroll">
              <div className="drive-folder-tree">
                {ASSESSMENT_CATEGORIES.map((cat) => {
                  const isCatExpanded = expandedCategory === cat.slug;
                  return (
                    <div key={cat.slug}>
                      <div
                        className={`drive-folder-row ${isCatExpanded ? 'expanded selected' : ''}`}
                        onClick={() => toggleCategory(cat.slug)}
                      >
                        <span className="folder-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          </svg>
                        </span>
                        <span className="folder-name">{cat.name}</span>
                      </div>
                      {isCatExpanded && (
                        <div className="drive-folder-children">
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
                          {filteredLanguages.map((lang) => {
                            const list = quizzesByCategoryAndLang[cat.slug]?.[lang.slug] || [];
                            const isLangExpanded = expandedLang === lang.slug;
                            return (
                              <div key={lang.slug}>
                                <div
                                  className={`drive-folder-row ${isLangExpanded ? 'expanded selected' : ''}`}
                                  onClick={() => toggleLang(lang.slug)}
                                >
                                  <span className="folder-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </span>
                                  <span className="folder-name">{lang.name}</span>
                                  <span className={`drive-level-badge ${lang.slug}`}>
                                    {cat.slug === 'quiz' ? list.length : (() => {
                                      const course = courseBySlug[lang.slug];
                                      const levels = course?.levels || [];
                                      return levels.reduce((sum, lev) => {
                                        const lid = (lev._id?.toString?.()) || lev._id;
                                        const items = finalItemsByLevel[lid] || { quizzes: [], problems: [] };
                                        return sum + (items.quizzes?.length || 0) + (items.problems?.length || 0);
                                      }, 0);
                                    })()}
                                  </span>
                                </div>
                                {isLangExpanded && cat.slug === 'quiz' && (
                                  <div className="drive-folder-children">
                                    <div className="drive-search-level">
                                      <span className="search-label">Search quizzes</span>
                                      <input
                                        type="search"
                                        className="search-box"
                                        placeholder="Filter quizzes..."
                                        value={quizSearch}
                                        onChange={(e) => setQuizSearch(e.target.value)}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 12, color: '#64748b' }}>Quizzes</span>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ padding: '4px 10px', fontSize: 12 }}
                                        onClick={(e) => { e.stopPropagation(); openCreateModal(lang.slug); }}
                                      >
                                        + Add Quiz
                                      </button>
                                    </div>
                                    {filteredQuizzes.length === 0 ? (
                                      <p className="empty-list-msg">No quizzes in this language. Use &quot;+ Add Quiz&quot; to create one.</p>
                                    ) : (
                                      filteredQuizzes.map((q) => (
                                        <div
                                          key={q._id}
                                          className={`drive-item-row ${selected?._id === q._id ? 'selected' : ''}`}
                                          onClick={() => handleSelect(q)}
                                        >
                                          <span className="item-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <circle cx="12" cy="12" r="10" />
                                              <path d="M9 12l2 2 4-4" />
                                            </svg>
                                          </span>
                                          <span className="folder-name">{q.title}</span>
                                          <div className="drive-item-actions">
                                            <button type="button" className="btn btn-ghost btn-xs" title="Edit" onClick={(e) => { e.stopPropagation(); handleSelect(q); }}>✎</button>
                                            <button type="button" className="btn btn-ghost btn-remove" onClick={(e) => { e.stopPropagation(); handleDelete(q._id); }}>×</button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                                {isLangExpanded && cat.slug === 'final' && (() => {
                                  const course = courseBySlug[lang.slug];
                                  const levelList = course?.levels || [];
                                  return (
                                    <div className="drive-folder-children final-by-lang">
                                      <div className="final-lang-header">
                                        <span className="final-lang-title">{lang.name} – Final Assessment</span>
                                        <span className="final-lang-desc">Contents for this language only</span>
                                      </div>
                                      {levelList.length === 0 ? (
                                        <p className="empty-list-msg">No levels for this language. Add levels in Manage Courses.</p>
                                      ) : (
                                        levelList.map((lev) => {
                                          const levelId = lev._id?.toString?.() || lev._id;
                                          const items = finalItemsByLevel[levelId] || { quizzes: [], problems: [] };
                                          const theoryList = items.quizzes || [];
                                          const practicalList = items.problems || [];
                                          const total = theoryList.length + practicalList.length;
                                          const isLevelExpanded = expandedLevelId === levelId;
                                          return (
                                            <div key={levelId} className="final-level-block">
                                              <div
                                                className={`drive-folder-row ${isLevelExpanded ? 'expanded selected' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); toggleLevel(levelId); }}
                                              >
                                                <span className="folder-icon">
                                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                                  </svg>
                                                </span>
                                                <span className="folder-name">{lev.name || lev.slug}</span>
                                                <span className={`drive-level-badge ${(lev.slug || '').toLowerCase()}`}>{total}</span>
                                              </div>
                                              {isLevelExpanded && (
                                                <div className="drive-folder-children">
                                                  <div className="final-add-row">
                                                    <span className="final-add-label">{lang.name} · {lev.name || lev.slug}</span>
                                                    <button
                                                      type="button"
                                                      className="btn btn-primary btn-add-content"
                                                      onClick={(e) => { e.stopPropagation(); openAddContentModal(lang.slug, levelId); }}
                                                    >
                                                      + Add content
                                                    </button>
                                                  </div>
                                                  {theoryList.length > 0 && (
                                                    <div className="final-type-section">
                                                      <div className="final-type-heading">Theory (MCQ)</div>
                                                      {theoryList.map((q) => (
                                                        <div
                                                          key={q._id}
                                                          className={`drive-item-row ${selected?._id === q._id ? 'selected' : ''}`}
                                                          onClick={() => handleSelect(q)}
                                                        >
                                                          <span className="item-icon">📝</span>
                                                          <span className="folder-name">{q.title}</span>
                                                          <div className="drive-item-actions">
                                                            <button type="button" className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); handleSelect(q); }}>✎</button>
                                                            <button type="button" className="btn btn-ghost btn-remove" onClick={(e) => { e.stopPropagation(); handleDelete(q._id); }}>×</button>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {practicalList.length > 0 && (
                                                    <div className="final-type-section">
                                                      <div className="final-type-heading">Practical (Code)</div>
                                                      {practicalList.map((p) => (
                                                        <div
                                                          key={p._id}
                                                          className={`drive-item-row ${selectedProblem?._id === p._id ? 'selected' : ''}`}
                                                          onClick={() => handleSelectProblem(p)}
                                                        >
                                                          <span className="item-icon">💻</span>
                                                          <span className="folder-name">{p.title}</span>
                                                          <div className="drive-item-actions">
                                                            <button type="button" className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); handleSelectProblem(p); }}>✎</button>
                                                            <button type="button" className="btn btn-ghost btn-remove" onClick={(e) => { e.stopPropagation(); handleDeleteProblem(p._id); }}>×</button>
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {total === 0 && (
                                                    <p className="empty-list-msg">No items for this level. Use &quot;+ Add content&quot; to add Theory (MCQ) or Practical (code).</p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  );
                                })()}
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
          <h2 className="section-heading" style={{ marginBottom: 12 }}>Edit Quiz & Contents</h2>
          {!selected && !selectedProblem && (
            <div className="card">
              <p className="text-muted">Select a quiz or practical problem from the folder tree to edit.</p>
            </div>
          )}
          {selectedProblem && (
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 className="section-heading" style={{ margin: '0 0 12px' }}>Practical (Code) Assessment</h3>
              <p className="text-muted" style={{ marginBottom: 16 }}>
                Students see this problem, write code, run tests, and submit. Results are visible in Reports and to the student.
              </p>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={selectedProblem.title || ''}
                  onChange={(e) => setSelectedProblem((p) => (p ? { ...p, title: e.target.value } : null))}
                />
              </div>
              <div className="form-group">
                <label>Question / Description</label>
                <textarea
                  rows={6}
                  value={selectedProblem.description || ''}
                  onChange={(e) => setSelectedProblem((p) => (p ? { ...p, description: e.target.value } : null))}
                />
              </div>
              {(selectedProblem.testCases || [])[0] && (
                <>
                  <div className="form-group">
                    <label>Sample input</label>
                    <textarea
                      rows={3}
                      value={(selectedProblem.testCases || [])[0]?.input ?? ''}
                      onChange={(e) => {
                        const tc = [...(selectedProblem.testCases || [])];
                        if (!tc[0]) tc[0] = { input: '', expectedOutput: '', isSample: true };
                        tc[0].input = e.target.value;
                        setSelectedProblem((p) => (p ? { ...p, testCases: tc } : null));
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected output</label>
                    <textarea
                      rows={3}
                      value={(selectedProblem.testCases || [])[0]?.expectedOutput ?? ''}
                      onChange={(e) => {
                        const tc = [...(selectedProblem.testCases || [])];
                        if (!tc[0]) tc[0] = { input: '', expectedOutput: '', isSample: true };
                        tc[0].expectedOutput = e.target.value;
                        setSelectedProblem((p) => (p ? { ...p, testCases: tc } : null));
                      }}
                    />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={async () => {
                  if (!selectedProblem) return;
                  setSaving(true);
                  try {
                    await adminApi.updateProblem(selectedProblem._id, {
                      title: selectedProblem.title,
                      description: selectedProblem.description,
                      testCases: selectedProblem.testCases || [],
                    });
                    load();
                  } catch (e) { alert(e?.message || 'Failed to save'); }
                  finally { setSaving(false); }
                }}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedProblem(null)}>Cancel</button>
              </div>
              <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
                Submissions and test results: see <strong>Results &amp; Reports</strong> in the sidebar. Students see their run/submit results on the problem page.
              </p>
            </div>
          )}
          {selected && (
            <>
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    {QUIZ_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Passing Score (%)</label>
                  <input
                    type="number"
                    name="passingScore"
                    min={0}
                    max={100}
                    value={form.passingScore}
                    onChange={handleChange}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setSelected(null); setForm(EMPTY_FORM); }} disabled={saving}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save quiz details'}
                  </button>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-heading" style={{ margin: 0 }}>Questions ({questions.length})</h3>
                  <button type="button" className="btn btn-secondary" onClick={openAddQuestion} disabled={saving || isEditingQuestion}>
                    + Add question
                  </button>
                </div>

                {isEditingQuestion && (
                  <div className="card" style={{ marginBottom: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px' }}>{editingQuestionIndex === -1 ? 'New question' : 'Edit question'}</h4>
                    <div className="form-group">
                      <label>Question text</label>
                      <textarea
                        rows={12}
                        value={questionForm.question}
                        onChange={(e) => setQuestionForm((f) => ({ ...f, question: e.target.value }))}
                        placeholder="Enter question"
                        style={{ width: '100%', resize: 'vertical', minHeight: '12em' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Options (one per line)</label>
                      <textarea
                        rows={4}
                        value={(questionForm.options || []).join('\n')}
                        onChange={(e) => setQuestionForm((f) => ({ ...f, options: e.target.value.split('\n').map((s) => String(s).trim()) }))}
                        placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Correct option</label>
                        <select
                          value={questionForm.correctIndex}
                          onChange={(e) => setQuestionForm((f) => ({ ...f, correctIndex: Number(e.target.value) }))}
                        >
                          {(questionForm.options || []).filter(Boolean).map((_, i) => (
                            <option key={i} value={i}>Option {i + 1}</option>
                          ))}
                          {(!questionForm.options || questionForm.options.filter(Boolean).length === 0) && (
                            <option value={0}>Option 1</option>
                          )}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Marks</label>
                        <input
                          type="number"
                          min={1}
                          value={questionForm.marks}
                          onChange={(e) => setQuestionForm((f) => ({ ...f, marks: Math.max(1, Number(e.target.value) || 1) }))}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button type="button" className="btn btn-primary" onClick={handleSaveQuestion} disabled={saving}>
                        {saving ? 'Saving...' : 'Save question'}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setEditingQuestionIndex(null); setQuestionForm(emptyQuestion()); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {questions.length === 0 && !isEditingQuestion && (
                  <p className="text-muted">No questions yet. Click &quot;Add question&quot; to add one.</p>
                )}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {questions.map((q, index) => (
                    <li key={index} style={{ marginBottom: 12 }}>
                      <div className="card" style={{ padding: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>
                              <strong>Q{index + 1}:</strong> {q.question}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                              Options: {(q.options || []).join(' · ')} → correct: {(q.options || [])[q.correctIndex ?? 0]}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEditQuestion(index)} disabled={saving}>
                              Edit
                            </button>
                            <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--error)' }} onClick={() => handleDeleteQuestion(index)} disabled={saving}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Quiz</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Python Module 1 Quiz"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {QUIZ_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Language (for display grouping)</label>
                <select
                  value={createForm.languageSlug}
                  onChange={(e) => setCreateForm((f) => ({ ...f, languageSlug: e.target.value }))}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.slug} value={l.slug}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={createForm.passingScore}
                  onChange={(e) => setCreateForm((f) => ({ ...f, passingScore: Math.min(100, Math.max(0, Number(e.target.value) || 60)) }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving || !createForm.title.trim()}>
                {saving ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddContentModal && addContentContext && (
        <div className="modal-overlay" onClick={() => !saving && setShowAddContentModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h3 className="modal-title">Add Final Assessment Content</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Type</label>
                <select
                  value={addContentType}
                  onChange={(e) => setAddContentType(e.target.value)}
                >
                  <option value="mcq">MCQ</option>
                  <option value="problem">Problem</option>
                </select>
              </div>
              <div className="form-group">
                <label>Level</label>
                <select
                  value={addContentForm.levelId}
                  onChange={(e) => setAddContentForm((f) => ({ ...f, levelId: e.target.value }))}
                >
                  <option value="">Select level</option>
                  {addContentLevelOptions.map((lev) => (
                    <option key={lev._id} value={lev._id}>{lev.name || lev.slug}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={addContentForm.title}
                  onChange={(e) => setAddContentForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              {addContentType === 'mcq' && (
                <>
                  <div className="form-group">
                    <label>Question *</label>
                    <textarea
                      rows={4}
                      value={addContentForm.mcqQuestion}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, mcqQuestion: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Options (one per line) *</label>
                    <textarea
                      rows={4}
                      value={(addContentForm.mcqOptions || []).join('\n')}
                      onChange={(e) => setAddContentForm((f) => ({
                        ...f,
                        mcqOptions: e.target.value.split('\n').map((s) => String(s).trim()),
                      }))}
                      placeholder={'Option 1\nOption 2\nOption 3\nOption 4'}
                    />
                  </div>
                  <div className="form-group">
                    <label>Correct Option</label>
                    <select
                      value={addContentForm.mcqCorrectIndex}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, mcqCorrectIndex: Number(e.target.value) }))}
                    >
                      {(addContentForm.mcqOptions || []).filter(Boolean).map((_, i) => (
                        <option key={i} value={i}>Option {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={addContentForm.mcqMarks}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, mcqMarks: Math.max(1, Number(e.target.value) || 1) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Passing score (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={addContentForm.passingScore}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, passingScore: Math.min(100, Math.max(0, Number(e.target.value) || 60)) }))}
                    />
                  </div>
                </>
              )}
              {addContentType === 'problem' && (
                <>
                  <div className="form-group">
                    <label>Problem title *</label>
                    <input
                      type="text"
                      value={addContentForm.title}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Sum of two numbers"
                    />
                  </div>
                  <div className="form-group">
                    <label>Question / Description *</label>
                    <textarea
                      rows={4}
                      value={addContentForm.description}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what the code should do..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      value={addContentForm.difficulty}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, difficulty: e.target.value }))}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Constraints (optional)</label>
                    <textarea
                      rows={2}
                      value={addContentForm.constraints}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, constraints: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Starter Code (optional)</label>
                    <textarea
                      rows={4}
                      value={addContentForm.starterCode}
                      onChange={(e) => setAddContentForm((f) => ({ ...f, starterCode: e.target.value }))}
                      style={{ fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Test Cases</label>
                    {(addContentForm.testCases || []).map((tc, idx) => (
                      <div key={idx} style={{ marginBottom: 10, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <strong>Case {idx + 1}</strong>
                          {(addContentForm.testCases || []).length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => setAddContentForm((f) => ({
                                ...f,
                                testCases: f.testCases.filter((_, i) => i !== idx),
                              }))}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <label style={{ fontSize: 12 }}>Input</label>
                        <textarea
                          rows={2}
                          value={tc.input}
                          onChange={(e) => setAddContentForm((f) => ({
                            ...f,
                            testCases: f.testCases.map((x, i) => i === idx ? { ...x, input: e.target.value } : x),
                          }))}
                        />
                        <label style={{ fontSize: 12 }}>Expected Output</label>
                        <textarea
                          rows={2}
                          value={tc.expectedOutput}
                          onChange={(e) => setAddContentForm((f) => ({
                            ...f,
                            testCases: f.testCases.map((x, i) => i === idx ? { ...x, expectedOutput: e.target.value } : x),
                          }))}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={!!tc.isSample}
                            onChange={(e) => setAddContentForm((f) => ({
                              ...f,
                              testCases: f.testCases.map((x, i) => i === idx ? { ...x, isSample: e.target.checked } : x),
                            }))}
                          />
                          Sample
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setAddContentForm((f) => ({
                        ...f,
                        testCases: [...(f.testCases || []), { input: '', expectedOutput: '', isSample: false }],
                      }))}
                    >
                      + Add Test Case
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddContentModal(false)} disabled={saving}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  saving ||
                  !addContentForm.levelId ||
                  !addContentForm.title.trim() ||
                  (addContentType === 'mcq' ? !addContentForm.mcqQuestion.trim() : !addContentForm.description.trim())
                }
                onClick={handleAddContent}
              >
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
