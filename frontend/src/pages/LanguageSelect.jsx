import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { user as userApi, courses as coursesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { slug: 'python', name: 'Python', desc: 'Great for beginners and data science' },
  { slug: 'java', name: 'Java', desc: 'Object-oriented, widely used in industry' },
  { slug: 'cpp', name: 'C++', desc: 'Performance and systems programming' },
  { slug: 'javascript', name: 'JavaScript', desc: 'Web development and beyond' },
];

export default function LanguageSelect() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSelect = async (slug) => {
    setError('');
    setLoading(true);
    try {
      const { placementQuizId, questions } = await userApi.selectLanguage(slug);
      await refreshUser();
      navigate('/placement', { state: { placementQuizId, questions } });
    } catch (err) {
      setError(err.message || 'Failed to select language');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: 8 }}>Choose your language</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>
        You'll take a short assessment to place you at the right level.
      </p>
      {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}
      <div className="language-grid">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.slug}
            type="button"
            className="card language-card"
            onClick={() => handleSelect(lang.slug)}
            disabled={loading}
          >
            <span className="language-name">{lang.name}</span>
            <span className="language-desc">{lang.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
