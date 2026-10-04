import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as adminApi } from '../../api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-dash admin-dash--loading">
        <div className="admin-dash-skeleton">
          <div className="admin-dash-skeleton-hero" />
          <div className="admin-dash-skeleton-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="admin-dash-skeleton-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const levelCounts = (data?.usersByLevel || []).reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});
  const totalUsers = Number(data?.totalUsers) ?? 0;
  const totalCourses = Number(data?.totalCourses) ?? 0;
  const beginner = Number(levelCounts.beginner) ?? 0;
  const intermediate = Number(levelCounts.intermediate) ?? 0;
  const expert = Number(levelCounts.expert) ?? 0;
  const maxLevel = Math.max(beginner, intermediate, expert, 1);
  const withLevel = beginner + intermediate + expert;

  return (
    <div className="admin-dash">
      <div className="admin-dash-hero">
        <div className="admin-dash-hero-content">
          <h1 className="admin-dash-hero-title">Welcome back</h1>
          <p className="admin-dash-hero-subtitle">
            Monitor progress, manage courses, and keep learners on track.
          </p>
        </div>
        <div className="admin-dash-hero-stats">
          <div className="admin-dash-hero-pill">
            <span className="admin-dash-hero-pill-value">{totalUsers}</span>
            <span className="admin-dash-hero-pill-label">Total learners</span>
          </div>
        </div>
      </div>

      <div className="admin-dash-metrics">
        <Link to="/admin/users" className="admin-dash-card admin-dash-card--link">
          <div className="admin-dash-card-icon admin-dash-card-icon--users" />
          <div className="admin-dash-card-body">
            <h3>{beginner}</h3>
            <p>Beginner</p>
            <div className="admin-dash-bar-wrap">
              <div className="admin-dash-bar" style={{ width: `${(beginner / maxLevel) * 100}%` }} />
            </div>
          </div>
        </Link>
        <Link to="/admin/users" className="admin-dash-card admin-dash-card--link">
          <div className="admin-dash-card-icon admin-dash-card-icon--intermediate" />
          <div className="admin-dash-card-body">
            <h3>{intermediate}</h3>
            <p>Intermediate</p>
            <div className="admin-dash-bar-wrap">
              <div className="admin-dash-bar admin-dash-bar--intermediate" style={{ width: `${(intermediate / maxLevel) * 100}%` }} />
            </div>
          </div>
        </Link>
        <Link to="/admin/users" className="admin-dash-card admin-dash-card--link">
          <div className="admin-dash-card-icon admin-dash-card-icon--expert" />
          <div className="admin-dash-card-body">
            <h3>{expert}</h3>
            <p>Expert</p>
            <div className="admin-dash-bar-wrap">
              <div className="admin-dash-bar admin-dash-bar--expert" style={{ width: `${(expert / maxLevel) * 100}%` }} />
            </div>
          </div>
        </Link>
        <div className="admin-dash-card">
          <div className="admin-dash-card-icon admin-dash-card-icon--courses" />
          <div className="admin-dash-card-body">
            <h3>{totalCourses}</h3>
            <p>Courses</p>
          </div>
        </div>
      </div>

      <div className="admin-dash-chart-section">
        <h2 className="admin-dash-section-title">Learners by level</h2>
        <div className="admin-dash-chart">
          <div className="admin-dash-chart-bar-row">
            <span className="admin-dash-chart-label">Beginner</span>
            <div className="admin-dash-chart-track">
              <div
                className="admin-dash-chart-fill admin-dash-chart-fill--beginner"
                style={{ width: `${(beginner / maxLevel) * 100}%` }}
              />
            </div>
            <span className="admin-dash-chart-value">{beginner}</span>
          </div>
          <div className="admin-dash-chart-bar-row">
            <span className="admin-dash-chart-label">Intermediate</span>
            <div className="admin-dash-chart-track">
              <div
                className="admin-dash-chart-fill admin-dash-chart-fill--intermediate"
                style={{ width: `${(intermediate / maxLevel) * 100}%` }}
              />
            </div>
            <span className="admin-dash-chart-value">{intermediate}</span>
          </div>
          <div className="admin-dash-chart-bar-row">
            <span className="admin-dash-chart-label">Expert</span>
            <div className="admin-dash-chart-track">
              <div
                className="admin-dash-chart-fill admin-dash-chart-fill--expert"
                style={{ width: `${(expert / maxLevel) * 100}%` }}
              />
            </div>
            <span className="admin-dash-chart-value">{expert}</span>
          </div>
        </div>
        {totalUsers > 0 && (
          <p className="admin-dash-chart-note">
            {withLevel} learners with an assigned level · {totalUsers - withLevel} without level
          </p>
        )}
      </div>

      <div className="admin-dash-quick-links">
        <h2 className="admin-dash-section-title">Quick actions</h2>
        <div className="admin-dash-quick-grid">
          <Link to="/admin/users" className="admin-dash-quick-card">
            <span className="admin-dash-quick-icon">👥</span>
            <span>Manage Users</span>
          </Link>
          <Link to="/admin/courses" className="admin-dash-quick-card">
            <span className="admin-dash-quick-icon">📚</span>
            <span>Manage Courses</span>
          </Link>
          <Link to="/admin/assessments" className="admin-dash-quick-card">
            <span className="admin-dash-quick-icon">📝</span>
            <span>Manage Assessments</span>
          </Link>
          <Link to="/admin/coding" className="admin-dash-quick-card">
            <span className="admin-dash-quick-icon">💻</span>
            <span>Manage Coding</span>
          </Link>
          <Link to="/admin/reports" className="admin-dash-quick-card">
            <span className="admin-dash-quick-icon">📊</span>
            <span>Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
