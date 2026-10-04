import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

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

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = String(email ?? '').trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(trimmedEmail, password, String(name ?? '').trim());
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <section className="auth-form-section">
          <div className="auth-logo">
            <span className="auth-logo-icon">C</span>
            <span>Codenova</span>
          </div>
          <div className="auth-card card">
            <h1>Create account</h1>
            <p className="auth-subtitle">Please enter your details to join</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Name (optional)</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <span className="icon-wrap"><UserIcon /></span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-toggle">
                  <div className="input-with-icon">
                    <span className="icon-wrap"><LockIcon /></span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <button type="button" className="btn toggle-pw" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
              <div className="auth-actions">
                <span className="auth-divider">or</span>
                <Link to="/login" className="btn-login" style={{ textAlign: 'center', textDecoration: 'none' }}>
                  Sign in
                </Link>
              </div>
            </form>
            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </section>
        <section className="auth-landing-section">
          <h2>What our learners said.</h2>
          <div className="auth-testimonial">
            <span className="auth-quote">&ldquo;</span>
            <p className="auth-testimonial-text">
              Learning to code is now easier than ever. Just pick a language, follow the modules, and practice with real problems.
            </p>
            <div className="auth-testimonial-author">Codenova Learner</div>
            <div className="auth-testimonial-role">Student</div>
          </div>
        </section>
      </div>
      <p className="auth-footer-text">Welcome to Codenova</p>
    </div>
  );
}
