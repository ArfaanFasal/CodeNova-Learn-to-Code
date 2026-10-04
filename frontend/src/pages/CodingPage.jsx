import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coding as codingApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function CodingPage() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const language = user?.selectedLanguage || 'python';

  useEffect(() => {
    codingApi.problem(problemId)
      .then((p) => {
        setProblem(p);
        setCode(p.starterCode || '');
      })
      .catch(() => setProblem(null));
  }, [problemId]);

  const handleRun = async () => {
    setRunning(true);
    setOutput('');
    try {
      const res = await codingApi.run(code, language, stdin);
      setOutput(res.displayOutput || res.stdout || res.error || 'No output');
    } catch (err) {
      setOutput('Error: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await codingApi.submit(problemId, code, language);
      setSubmitResult(res);
    } catch (err) {
      setSubmitResult({ status: 'error', error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!problem) return <div className="container">Loading...</div>;

  return (
    <div className="coding-page">
      <header className="coding-header">
        <div className="container coding-header-inner">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="coding-title">{problem.title}</h1>
          <span className="difficulty-badge">{problem.difficulty}</span>
        </div>
      </header>
      <div className="coding-body">
        <div className="coding-sidebar card">
          <h2>Description</h2>
          <div className="problem-description">{problem.description}</div>
          {problem.constraints && (
            <>
              <h3>Constraints</h3>
              <pre className="constraints">{problem.constraints}</pre>
            </>
          )}
          {problem.sampleTestCases?.length > 0 && (
            <>
              <h3>Sample</h3>
              {problem.sampleTestCases.map((s, i) => (
                <div key={i} className="sample-io">
                  <div>Input: <pre>{s.input}</pre></div>
                  <div>Output: <pre>{s.expectedOutput}</pre></div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="coding-main">
          <div className="editor-wrap card">
            <textarea
              className="code-editor"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              placeholder="Write your code..."
            />
          </div>
          <div className="coding-actions">
            <button type="button" className="btn btn-secondary" onClick={handleRun} disabled={running}>
              {running ? 'Running...' : 'Run'}
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          <div className="output-section card">
            <h3>Stdin (for Run)</h3>
            <textarea
              className="stdin-input"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Optional input for run..."
              rows={2}
            />
            <h3>Output</h3>
            <pre className="output-panel">{output || 'Run your code to see output.'}</pre>
            {submitResult && (
              <div className="submit-result">
                <strong>Submit: </strong>
                {submitResult.status === 'accepted' ? (
                  <span className="success-msg">Accepted ({submitResult.passedTests}/{submitResult.totalTests} tests)</span>
                ) : submitResult.status === 'wrong_answer' ? (
                  <span className="error-msg">Wrong answer ({submitResult.passedTests}/{submitResult.totalTests} passed)</span>
                ) : (
                  <span className="error-msg">{submitResult.error || submitResult.status}</span>
                )}
                {submitResult.testResults?.length > 0 && (
                  <ul className="test-results">
                    {submitResult.testResults.map((t, i) => (
                      <li key={i}>{t.passed ? '✓' : '✗'} Test {i + 1}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
