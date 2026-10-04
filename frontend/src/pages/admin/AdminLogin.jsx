import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../api';
import './AdminAuth.css';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export default function AdminLogin() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!emailOrUsername.trim() || !password) {
      setError('Email/username and password are required.');
      return;
    }
    setLoading(true);
    try {
      const { token } = await auth.adminLogin(emailOrUsername.trim(), password);
      localStorage.setItem('adminToken', token);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="auth-wrapper">
        <section className="auth-form-section">
          <div className="auth-avatar">
            <UserIcon />
          </div>
          <div className="card admin-auth-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h1>Admin login</h1>
            <p className="auth-subtitle">Codenova administration</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <div className="input-with-icon">
                  <span className="icon-wrap"><UserIcon /></span>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Email or username"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="input-with-toggle">
                  <div className="input-with-icon">
                    <span className="icon-wrap"><LockIcon /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <button type="button" className="btn toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="auth-actions">
                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Signing in...' : 'LOG IN'}
                </button>
              </div>
            </form>
          </div>
        </section>
        <section className="auth-landing-section">
          <h2>Admin Panel</h2>
          <p>Manage courses, assessments, users, and view reports from one place.</p>
        </section>
      </div>
      <p className="auth-footer-text">Welcome to Codenova Admin</p>
    </div>
  );
}
