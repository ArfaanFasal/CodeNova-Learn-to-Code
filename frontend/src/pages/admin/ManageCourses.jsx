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
  { slug: 'beginner', name: 'Beginner' },
  { slug: 'intermediate', name: 'Intermediate' },
  { slug: 'expert', name: 'Expert' },
];

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    order: 0,
    type: 'theory',
    content: '',
    videoUrl: '',
    quickStandaloneQuestion: '',
    quickStandaloneInput: '',
    quickStandaloneOutput: '',
  });
  const [saving, setSaving] = useState(false);
  const [langSearch, setLangSearch] = useState('');
  const [levelSearch, setLevelSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [expandedLang, setExpandedLang] = useState(null);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLevelId, setCreateLevelId] = useState(null);
  const [allocatingProblemId, setAllocatingProblemId] = useState(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    type: 'theory',
    content: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.courseList(), adminApi.problems()])
      .then(([courseList, problemList]) => {
        setCourses(courseList || []);
        setProblems((problemList || []).filter((p) => !p?.category || p.category === 'practice'));
      })
      .catch(() => {
        setCourses([]);
        setProblems([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const courseBySlug = useMemo(() => {
    const m = {};
    (courses || []).forEach((c) => {
      m[c.slug] = c;
    });
    return m;
  }, [courses]);

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

  const selectedCourse = expandedLang ? courseBySlug[expandedLang] : null;
  const selectedLevelDoc = useMemo(() => {
    if (!selectedCourse || !expandedLevel) return null;
    return (selectedCourse.levels || []).find((l) => l.slug === expandedLevel);
  }, [selectedCourse, expandedLevel]);

  const filteredModules = useMemo(() => {
    const mods = selectedLevelDoc?.modules || [];
    const t = moduleSearch.trim().toLowerCase();
    if (!t) return mods;
    return mods.filter(
      (m) =>
        (m.title || '').toLowerCase().includes(t) ||
        (m.slug || '').toLowerCase().includes(t)
    );
  }, [selectedLevelDoc, moduleSearch]);

  const levelPracticeProblems = useMemo(() => {
    if (!selectedLevelDoc?._id) return [];
    const levelId = selectedLevelDoc._id.toString();
    return (problems || []).filter((p) => {
      const pid = p?.level?._id?.toString?.() || p?.level?.toString?.();
      return pid === levelId;
    });
  }, [selectedLevelDoc, problems]);

  const handleSelectModule = (course, level, module) => {
    setSelectedModule({ courseId: course._id, levelId: level._id, ...module });
    setForm({
      title: module.title,
      slug: module.slug,
      order: module.order,
      type: module.type || 'theory',
      content: module.content || '',
      videoUrl: module.videoUrl || '',
      quickStandaloneQuestion: module.quickStandaloneQuestion || '',
      quickStandaloneInput: module.quickStandaloneInput || '',
      quickStandaloneOutput: module.quickStandaloneOutput || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'order' ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!selectedModule) return;
    const videoUrl = String(form.videoUrl ?? '').trim();
    const isValidUrl = !videoUrl || /^https?:\/\/[^\s]+$/i.test(videoUrl);
    const payload = { ...form, videoUrl: isValidUrl ? videoUrl : '' };
    setSaving(true);
    try {
      await adminApi.updateModule(selectedModule._id, payload);
      setSelectedModule(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = (levelDoc) => {
    setCreateLevelId(levelDoc._id);
    setCreateForm({
      title: '',
      slug: '',
      type: 'theory',
      content: '',
    });
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      alert('Title is required.');
      return;
    }
    const slug = createForm.slug.trim() || createForm.title.toLowerCase().replace(/\s+/g, '-');
    setSaving(true);
    try {
      await adminApi.createModule(createLevelId, {
        title: createForm.title.trim(),
        slug,
        order: 10,
        content: createForm.content || '',
        type: createForm.type || 'theory',
        quickStandaloneQuestion: '',
        quickStandaloneInput: '',
        quickStandaloneOutput: '',
      });
      setShowCreateModal(false);
      setCreateLevelId(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (moduleId) => {
    if (!window.confirm('Delete this module? This cannot be undone.')) return;
    setSaving(true);
    try {
      await adminApi.deleteModule(moduleId);
      if (selectedModule && selectedModule._id === moduleId) setSelectedModule(null);
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAllocateProblemToModule = async (problemId, moduleId) => {
    if (!selectedLevelDoc?._id) return;
    setAllocatingProblemId(problemId);
    try {
      await adminApi.updateProblem(problemId, {
        levelId: selectedLevelDoc._id,
        moduleId: moduleId || null,
      });
      load();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Failed to allocate problem to module');
    } finally {
      setAllocatingProblemId(null);
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
          <h1>Manage Courses & Modules</h1>
          <p className="text-muted" style={{ margin: '6px 0 0' }}>
            Update theory content, reorder modules, and keep the curriculum consistent across levels.
          </p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <strong>{courses.length}</strong>
          <div className="text-muted">Courses</div>
        </div>
        <div>
          <strong>{courses.reduce((sum, c) => sum + (c.levels?.length || 0), 0)}</strong>
          <div className="text-muted">Levels</div>
        </div>
        <div>
          <strong>
            {courses.reduce(
              (sum, c) => sum + (c.levels || []).reduce((s, l) => s + (l.modules?.length || 0), 0),
              0
            )}
          </strong>
          <div className="text-muted">Modules</div>
        </div>
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
                  const course = courseBySlug[lang.slug];
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
                      {isExpanded && course && (
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
                            const levelDoc = (course.levels || []).find((l) => l.slug === lev.slug);
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
                                  <span className={`drive-level-badge ${lev.slug}`}>{lev.name}</span>
                                </div>
                                {isLevelExpanded && levelDoc && (
                                  <div className="drive-folder-children">
                                    <div className="drive-search-level">
                                      <span className="search-label">Search modules</span>
                                      <input
                                        type="search"
                                        className="search-box"
                                        placeholder="Filter modules..."
                                        value={moduleSearch}
                                        onChange={(e) => setModuleSearch(e.target.value)}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 12, color: '#64748b' }}>Modules</span>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ padding: '4px 10px', fontSize: 12 }}
                                        onClick={() => openCreateModal(levelDoc)}
                                      >
                                        + Add Module
                                      </button>
                                    </div>
                                    {filteredModules.length === 0 ? (
                                      <div>
                                        <p className="empty-list-msg">No modules found.</p>
                                        <button
                                          type="button"
                                          className="btn btn-ghost"
                                          style={{ marginTop: 4, fontSize: 12 }}
                                          onClick={() => openCreateModal(levelDoc)}
                                        >
                                          + Add first module
                                        </button>
                                      </div>
                                    ) : (
                                      filteredModules.map((m) => (
                                        <div
                                          key={m._id}
                                          className={`drive-item-row ${selectedModule?._id === m._id ? 'selected' : ''}`}
                                          onClick={() => handleSelectModule(course, levelDoc, m)}
                                        >
                                          <span className="item-icon">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                              <polyline points="14 2 14 8 20 8" />
                                              <line x1="16" y1="13" x2="8" y2="13" />
                                              <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                          </span>
                                          <span className="folder-name">
                                            {m.order + 1}. {m.title}
                                          </span>
                                          <div className="drive-item-actions">
                                            <button
                                              type="button"
                                              className="btn btn-ghost btn-xs"
                                              title="Edit"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectModule(course, levelDoc, m);
                                              }}
                                            >
                                              ✎
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-ghost btn-remove"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(m._id);
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
              {filteredLanguages.length === 0 && (
                <p className="empty-list-msg">No languages match your search.</p>
              )}
            </div>
          </div>
        </div>

        <div className="content-panel">
          <h2 className="coursera-heading" style={{ marginBottom: 12 }}>Edit Module</h2>
          {!selectedModule && (
            <div className="card">
              <p className="coursera-body">Select a module from the folder tree to edit its content.</p>
            </div>
          )}
          {selectedModule && (
            <div className="card">
              <h3 className="coursera-subheading">Basic Information</h3>
              <div className="form-group">
                <label>Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input type="text" name="slug" value={form.slug} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Order (0-based)</label>
                <input type="number" name="order" value={form.order} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="type" value={form.type} onChange={handleChange}>
                  <option value="theory">Theory</option>
                  <option value="practice">Practice (Problem Type)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Video URL (optional)</label>
                <input type="text" name="videoUrl" value={form.videoUrl} onChange={handleChange} />
              </div>

              <h3 className="coursera-subheading">Content</h3>
              <p className="coursera-body">Main learning content (Markdown / HTML).</p>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  rows={14}
                  style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>

              {form.type === 'theory' && (
                <>
                  <h3 className="coursera-subheading">Quick Standalone Code Practice</h3>
                  <p className="coursera-body">
                    For theory modules only. Students see a question and type code to achieve the expected output.
                    Leave empty to use default sandbox.
                  </p>
                  <div className="form-group">
                    <label>Question / Task</label>
                    <textarea
                      name="quickStandaloneQuestion"
                      value={form.quickStandaloneQuestion}
                      onChange={handleChange}
                      rows={4}
                      placeholder="e.g. Write a program that prints the sum of two numbers."
                      style={{ width: '100%', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Sample Input</label>
                    <textarea
                      name="quickStandaloneInput"
                      value={form.quickStandaloneInput}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. 10\n20"
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Output</label>
                    <textarea
                      name="quickStandaloneOutput"
                      value={form.quickStandaloneOutput}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. 30"
                      style={{ width: '100%', fontFamily: 'monospace', fontSize: 13 }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedModule(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {selectedLevelDoc && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="coursera-subheading">Practice Problem Allocation</h3>
              <p className="coursera-body" style={{ marginBottom: 12 }}>
                Assign each practice problem in this level to a specific module.
              </p>
              {levelPracticeProblems.length === 0 ? (
                <p className="text-muted">No practice problems found for this level.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {levelPracticeProblems.map((p) => {
                    const currentModuleId =
                      p?.module?._id?.toString?.() || p?.module?.toString?.() || '';
                    return (
                      <div
                        key={p._id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr minmax(220px, 320px)',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title}
                        </div>
                        <select
                          value={currentModuleId}
                          disabled={allocatingProblemId === p._id}
                          onChange={(e) => handleAllocateProblemToModule(p._id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {(selectedLevelDoc.modules || [])
                            .slice()
                            .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
                            .map((m) => (
                              <option key={m._id} value={m._id}>
                                {`Module ${(m.order ?? 0) + 1} - ${m.title}`}
                              </option>
                            ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Add Module</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Module title"
                />
              </div>
              <div className="form-group">
                <label>Slug (optional, auto-generated from title)</label>
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. beginner-module-11"
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={createForm.type}
                  onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="theory">Theory</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content (optional, edit after creation)</label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                  rows={6}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
