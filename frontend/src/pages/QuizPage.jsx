import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { user as userApi } from '../api';

export default function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.quiz(quizId)
      .then((data) => {
        setQuiz(data);
        if (Array.isArray(data.questions)) {
          // Shuffle questions and take up to 10; preserve original index for submission
          const shuffled = [...data.questions].sort(() => Math.random() - 0.5);
          setQuestions(shuffled.slice(0, Math.min(10, data.questions.length)));
        } else {
          setQuestions([]);
        }
      })
      .catch(() => {
        setQuiz(null);
        setQuestions([]);
      });
  }, [quizId]);

  const handleAnswer = (questionIndex, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedIndex }));
  };

  const handleSubmit = async () => {
    const submitted = questions.map((q, i) => ({
      questionIndex: q.index ?? i,
      selectedIndex: answers[i] ?? -1,
    }));
    setSubmitting(true);
    setError('');
    try {
      const res = await userApi.submitQuiz(quizId, submitted);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz || questions.length === 0) return <div className="container">Loading...</div>;

  if (result) {
    return (
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="card">
          <h1>{result.passed ? 'Passed' : 'Not passed'}</h1>
          <p className="text-muted">
            Score: {result.score}/{result.totalMarks} ({Math.round(result.percentage)}%)
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const totalQuestions = questions.length;
  const progress = ((current + 1) / totalQuestions) * 100;
  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] >= 0);

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <button type="button" className="btn btn-ghost" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="card">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }} />
        <h2 style={{ marginBottom: 8 }}>{quiz.title}</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Question {current + 1} of {totalQuestions}
          </p>
        <h3 style={{ marginBottom: 16, whiteSpace: 'pre-wrap' }}>{q.question}</h3>
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
          {current < totalQuestions - 1 ? (
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
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
        {error && <p className="error-msg" style={{ marginTop: 16 }}>{error}</p>}
      </div>
    </div>
  );
}
