import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { user as userApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    if (!user?.selectedLanguage) {
      navigate('/select-language', { replace: true });
      return;
    }
    if (user.selectedLanguage && !user.assessmentCompleted) {
      navigate('/select-language', { replace: true });
      return;
    }
    userApi.dashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const placementResult = location.state?.placementResult;
  const stats = data?.stats;
  const nextModule = data?.nextModule;
  const currentLevel = data?.currentLevel;
  const modules = data?.modules || [];
  const completedModuleIds = new Set(data?.completedModuleIds || []);
  const orderedModules = useMemo(
    () => [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [modules],
  );

  if (loading) {
    return (
      <div className="container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (placementResult) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <h1>You're all set</h1>
          <p className="text-muted">
            You got <strong>{placementResult.correct}</strong> out of <strong>{placementResult.total}</strong> correct.
          </p>
          <p>Your starting level: <strong className="primary-text">{placementResult.assignedLevel}</strong></p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/', { replace: true })}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const total = orderedModules.length;
  const completed = orderedModules.filter((m) => completedModuleIds.has(m._id)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const firstIncompleteId = orderedModules.find((m) => !completedModuleIds.has(m._id))?._id || null;
  const allModulesCompleted = total > 0 && completed >= total;

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <h1>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!</h1>
          <p>Fast-send your learning journey with curated modules and practice labs.</p>
          <div className="hero-meta">
            <span>{currentLevel?.name || user?.assignedLevel}</span>
            <span>{user?.selectedLanguage}</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-row">
            <span>Progress</span>
            <strong>{pct}%</strong>
          </div>
          <div className="hero-progress">
            <div style={{ width: `${pct}%` }} />
          </div>
          <p>{completed} of {total} modules completed</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-tile">
          <h3>{completed}/{total}</h3>
          <p>Modules completed</p>
        </div>
        <div className="stat-tile">
          <h3>{stats?.averageQuizScore != null ? Math.round(stats.averageQuizScore) + '%' : '–'}</h3>
          <p>Average quiz score</p>
        </div>
        <div className="stat-tile">
          <h3>{stats?.finalTestPassed ? 'Passed' : 'Not yet'}</h3>
          <p>Final assessment</p>
        </div>
      </div>

      {orderedModules.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Learning Modules</h2>
            <p>Theory modules unlock sequentially. Finish a module to unlock the next.</p>
          </div>
          <div className="module-list">
            {orderedModules.map((mod) => {
              const isDone = completedModuleIds.has(mod._id);
              const isNext = mod._id === firstIncompleteId;
              const isLocked = !isDone && !isNext;
              return (
                <div key={mod._id} className={`module-row ${isLocked ? 'locked' : ''}`}>
                  <div>
                    <strong>{mod.title}</strong>
                    <span className={`module-tag ${mod.type}`}>{mod.type === 'theory' ? 'Theory' : 'Practice'}</span>
                    {isDone && <span className="module-status">✓ Done</span>}
                    {isLocked && <span className="module-status locked">Locked</span>}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isLocked}
                    onClick={() => navigate(`/module/${mod._id}`)}
                  >
                    {isDone ? 'Review' : isLocked ? 'Locked' : 'Attend'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentLevel?.finalAssessment && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Final Assessment</h2>
            <p>Complete all modules to unlock the final assessment.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allModulesCompleted}
            onClick={() => navigate(`/quiz/${currentLevel.finalAssessment}`)}
          >
            {allModulesCompleted ? 'Start final assessment' : 'Locked until modules completed'}
          </button>
        </div>
      )}

      {nextModule && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Continue learning</h2>
            <p>{nextModule.title}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(`/module/${nextModule._id}`)}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
