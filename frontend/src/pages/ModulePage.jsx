import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { user as userApi, coding as codingApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { marked } from 'marked';
import './ModulePage.css';

export default function ModulePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sandboxCode, setSandboxCode] = useState('');
  const [sandboxInput, setSandboxInput] = useState('');
  const [sandboxOutput, setSandboxOutput] = useState('');
  const [sandboxRunning, setSandboxRunning] = useState(false);

  const language = user?.selectedLanguage || 'python';

  const defaultSandbox = useMemo(() => {
    if (language === 'javascript') {
      return 'console.log("Hello from JavaScript");';
    }
    if (language === 'cpp') {
      return '#include <iostream>\\nint main(){\\n  std::cout << "Hello from C++";\\n  return 0;\\n}';
    }
    if (language === 'java') {
      return 'class Main { public static void main(String[] args){ System.out.println("Hello from Java"); } }';
    }
    return 'print("Hello from Python")';
  }, [language]);

  useEffect(() => {
    userApi.module(moduleId)
      .then((res) => {
        setModuleData(res);
        setLoadError('');
      })
      .catch((e) => {
        setModuleData(null);
        setLoadError(e?.response?.data?.error || 'Module locked or not found.');
      })
      .finally(() => setLoading(false));
  }, [moduleId]);

  useEffect(() => {
    setSandboxCode('');
    setSandboxInput('');
    setSandboxOutput('');
  }, [moduleId, defaultSandbox]);

  useEffect(() => {
    if (moduleData?.quickStandaloneInput) {
      setSandboxInput(moduleData.quickStandaloneInput);
    }
  }, [moduleData?.quickStandaloneInput]);

  const handleComplete = async () => {
    try {
      await userApi.completeModule(moduleId);
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSandboxRun = async () => {
    setSandboxRunning(true);
    setSandboxOutput('');
    try {
      const res = await codingApi.run(sandboxCode || defaultSandbox, language, sandboxInput);
      setSandboxOutput(res.displayOutput || res.stdout || res.error || 'No output');
    } catch (err) {
      setSandboxOutput('Error: ' + err.message);
    } finally {
      setSandboxRunning(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!moduleData) return <div className="container">{loadError}</div>;

  const hasQuiz = !!moduleData.quiz?._id;
  const practiceProblems = (moduleData.codingProblems || [])
    .map((p) => {
      if (!p) return null;
      if (typeof p === 'string') {
        return { problemId: p, title: 'Practice problem' };
      }
      const rawId = p._id || p.id;
      if (!rawId) return null;
      return {
        problemId: rawId.toString(),
        title: p.title || 'Practice problem',
      };
    })
    .filter(Boolean);
  const hasProblems = practiceProblems.length > 0;
  const course = moduleData.level?.course;
  const stats = [
    course?.rating ? `${course.rating} ★` : null,
    course?.reviewsCount ? `${course.reviewsCount.toLocaleString()} reviews` : null,
    course?.estimatedHours ? `Approx. ${course.estimatedHours} hours` : null,
    course?.scheduleNote || null,
  ].filter(Boolean);

  return (
    <div className="course-page">
      <div className="course-hero">
        <div className="course-hero-inner">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
            ← Back to Dashboard
          </button>
          <div className="course-hero-content">
            <div className="course-hero-meta">
              <span className="course-provider">{course?.provider || 'Codenova'}</span>
              {course?.badge && <span className="course-badge">{course.badge}</span>}
            </div>
            <h1>{moduleData.title}</h1>
            <p className="course-subtitle">
              {moduleData.type === 'practice'
                ? 'Hands-on practice lab with a runnable environment.'
                : 'Learn step-by-step with guided theory and a quick practice sandbox.'}
            </p>
            {stats.length > 0 && (
              <div className="course-stats">
                {stats.map((s, i) => (
                  <span key={i} className="course-stat">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="course-body">
        <div className="course-main">
          {moduleData.videoUrl && (() => {
            const url = String(moduleData.videoUrl).trim();
            const isValidUrl = /^https?:\/\/[^\s]+$/i.test(url);
            if (!isValidUrl) return null;
            return (
              <div className="course-card">
                <h3>Module video</h3>
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  Watch video
                </a>
              </div>
            );
          })()}

          {moduleData.type === 'practice' ? (
            <div className="course-card">
              <h2>Practice Environment</h2>
              <p className="text-muted">
                Open the workspace below to solve the coding problem.
              </p>
              {hasProblems ? (
                <div className="practice-list">
                  {practiceProblems.map((p) => (
                    <button
                      key={p.problemId}
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => navigate(`/problem/${p.problemId}`)}
                    >
                      Open workspace: {p.title}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No problems linked to this module yet.</p>
              )}
            </div>
          ) : (
            <>
              <div
                className="course-card course-content"
                // treat content as markdown to preserve structure and spacing
                dangerouslySetInnerHTML={{ __html: marked.parse(moduleData.content || 'No content yet.') }}
              />
              <div className="course-card">
                <h2>Quick Practice</h2>
                {moduleData.quickStandaloneQuestion ? (
                  <>
                    <p className="course-lead" style={{ marginBottom: 12 }}>{moduleData.quickStandaloneQuestion}</p>
                    <p className="text-muted" style={{ fontSize: 14, marginBottom: 12 }}>
                      Type your code below to achieve the expected output.
                    </p>
                  </>
                ) : (
                  <p className="text-muted">Test what you learned with a small runnable example.</p>
                )}
                <div className="sandbox">
                  <textarea
                    className="sandbox-editor"
                    value={sandboxCode || defaultSandbox}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="sandbox-actions">
                    <button type="button" className="btn btn-primary" onClick={handleSandboxRun} disabled={sandboxRunning}>
                      {sandboxRunning ? 'Running...' : 'Run Code'}
                    </button>
                  </div>
                  <div className="sandbox-io">
                    <textarea
                      className="sandbox-input"
                      value={sandboxInput}
                      onChange={(e) => setSandboxInput(e.target.value)}
                      placeholder={moduleData.quickStandaloneInput ? 'Sample input (edit if needed)' : 'Optional input'}
                      rows={3}
                    />
                    {moduleData.quickStandaloneOutput && (
                      <div className="course-check" style={{ marginBottom: 10 }}>
                        <strong>Expected output:</strong>
                        <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 13 }}>{moduleData.quickStandaloneOutput}</pre>
                      </div>
                    )}
                    <pre className="sandbox-output">{sandboxOutput || 'Run your code to see output.'}</pre>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="course-sidebar">
          <div className="course-card">
            <h3>Module Actions</h3>
            <div className="sidebar-actions">
              {hasQuiz && (
                <button type="button" className="btn btn-primary" onClick={() => navigate(`/quiz/${moduleData.quiz._id}`)}>
                  Take quiz
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleComplete}>
                Mark complete & return
              </button>
            </div>
          </div>
          <div className="course-card">
            <h3>Module Info</h3>
            <p className="text-muted">
              Level: {moduleData.level?.name || '—'} · Track: {course?.name || user?.selectedLanguage}
            </p>
            <p className="text-muted">
              Type: {moduleData.type === 'practice' ? 'Practice' : 'Theory'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
