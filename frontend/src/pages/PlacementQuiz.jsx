import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { user as userApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function PlacementQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const state = location.state || {};
  const [placementQuizId, setPlacementQuizId] = useState(state.placementQuizId);
  const [questions, setQuestions] = useState(state.questions || []);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!placementQuizId && questions.length === 0) {
      navigate('/select-language', { replace: true });
    }
  }, [placementQuizId, questions, navigate]);

  const handleAnswer = (questionIndex, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedIndex }));
  };

  const handleSubmit = async () => {
    const submitted = questions.map((_, i) => ({ questionIndex: i, selectedIndex: answers[i] ?? -1 }));
    setSubmitting(true);
    setError('');
    try {
      const result = await userApi.submitPlacement(placementQuizId, submitted);
      await refreshUser();
      navigate('/', { state: { placementResult: result } });
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>Placement assessment not available</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            No questions are configured for this placement assessment. Please contact your administrator, then try again.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/', { replace: true })}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] >= 0);

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <div className="card">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Question {current + 1} of {questions.length}
        </p>
        <h2 style={{ marginBottom: 20, whiteSpace: 'pre-wrap' }}>{q.question}</h2>
        <div className="quiz-options">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className={`quiz-option ${answers[current] === idx ? 'selected' : ''}`}
              onClick={() => handleAnswer(current, idx)}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="quiz-nav">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Previous
          </button>
          {current < questions.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => setCurrent((c) => c + 1)}>
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
            >
              {submitting ? 'Submitting...' : 'Finish'}
            </button>
          )}
        </div>
        {error && <p className="error-msg" style={{ marginTop: 16 }}>{error}</p>}
      </div>
    </div>
  );
}
