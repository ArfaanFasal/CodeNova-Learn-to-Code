import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin as adminApi } from '../../api';

export default function Reports() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    adminApi.reports().then((r) => setReport(r.report || [])).catch(() => setReport([])).finally(() => setLoading(false));
  }, []);

  const reportId = (u) => u.id ?? u._id ?? u.email;

  if (loading) return <p className="text-muted">Loading...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Results & Reports</h1>
          <p className="text-muted" style={{ margin: '6px 0 0' }}>Track learner placement and progress snapshots.</p>
        </div>
      </div>
      <div className="card">
        <p className="text-muted">User progress: language, level, placement score. Use &quot;Edit&quot; to view details or manage the user.</p>
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Language</th>
                <th>Level</th>
                <th>Placement score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {report.map((u) => (
                <tr key={reportId(u)}>
                  <td>{u.email}</td>
                  <td>{u.name || '–'}</td>
                  <td>{u.language || '–'}</td>
                  <td>{u.level || '–'}</td>
                  <td>{u.placementScore != null ? u.placementScore : '–'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '6px 12px', fontSize: 14 }}
                      onClick={() => setEditingRow(u)}
                    >
                      View / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.length === 0 && <p className="text-muted">No user reports yet.</p>}
      </div>

      {editingRow && (
        <div
          className="card"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Report details</h3>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingRow(null)}>×</button>
          </div>
          <dl style={{ margin: 0, padding: 0 }}>
            <dt style={{ fontWeight: 600, marginTop: 12 }}>Email</dt>
            <dd style={{ margin: '4px 0 0' }}>{editingRow.email}</dd>
            <dt style={{ fontWeight: 600, marginTop: 12 }}>Name</dt>
            <dd style={{ margin: '4px 0 0' }}>{editingRow.name || '–'}</dd>
            <dt style={{ fontWeight: 600, marginTop: 12 }}>Language</dt>
            <dd style={{ margin: '4px 0 0' }}>{editingRow.language || '–'}</dd>
            <dt style={{ fontWeight: 600, marginTop: 12 }}>Level</dt>
            <dd style={{ margin: '4px 0 0' }}>{editingRow.level || '–'}</dd>
            <dt style={{ fontWeight: 600, marginTop: 12 }}>Placement score</dt>
            <dd style={{ margin: '4px 0 0' }}>{editingRow.placementScore != null ? editingRow.placementScore : '–'}</dd>
          </dl>
          <p className="text-muted" style={{ marginTop: 16, fontSize: 14 }}>
            To change level, language, or user data, use Manage Users.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Link to="/admin/users" className="btn btn-primary" onClick={() => setEditingRow(null)}>
              Go to Manage Users
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => setEditingRow(null)}>
              Close
            </button>
          </div>
        </div>
      )}
      {editingRow && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 999,
          }}
          onClick={() => setEditingRow(null)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
