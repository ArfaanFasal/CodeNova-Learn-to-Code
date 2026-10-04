import { useState, useEffect } from 'react';
import { admin as adminApi } from '../../api';

const LEVEL_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: '— Not set —' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' },
];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', assignedLevel: '', selectedLanguage: '' });
  const [saving, setSaving] = useState(false);
  const [resetPwValue, setResetPwValue] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.users({ search, page, limit: 20 })
      .then(({ users: u, total: t }) => {
        setUsers(u);
        setTotal(t);
      })
      .catch(() => { setUsers([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [search, page]);

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      name: String(u.name ?? ''),
      email: String(u.email ?? ''),
      assignedLevel: String(u.assignedLevel ?? ''),
      selectedLanguage: String(u.selectedLanguage ?? ''),
    });
    setResetPwValue('');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const name = String(editForm.name ?? '').trim();
    const email = String(editForm.email ?? '').trim();
    if (!email) {
      alert('Email is required.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateUser(editingUser._id, {
        name: name || undefined,
        email: email || undefined,
        assignedLevel: editForm.assignedLevel ? String(editForm.assignedLevel).trim() : undefined,
        selectedLanguage: editForm.selectedLanguage ? String(editForm.selectedLanguage).trim() : undefined,
      });
      setUsers((prev) => prev.map((u) => (u._id === editingUser._id ? { ...u, ...editForm } : u)));
      setEditingUser(null);
    } catch (e) {
      alert(e?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || !resetPwValue.trim()) {
      alert('Enter a new password.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.resetPassword(editingUser._id, resetPwValue);
      setResetPwValue('');
      alert('Password reset successfully.');
    } catch (e) {
      alert(e?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = async (id, isBlocked) => {
    try {
      if (isBlocked) await adminApi.unblockUser(id);
      else await adminApi.blockUser(id);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isBlocked: !isBlocked } : u)));
    } catch (e) {
      alert(e?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTotal((t) => t - 1);
      if (editingUser?._id === id) setEditingUser(null);
    } catch (e) {
      alert(e?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Manage Users</h1>
          <p className="text-muted" style={{ margin: '6px 0 0' }}>Search, edit, and manage learner access.</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <input
          type="search"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-group input"
          style={{ maxWidth: 320 }}
        />
      </div>
      <div className="card">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Language</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.email}</td>
                    <td>{u.name || '–'}</td>
                    <td>{u.selectedLanguage || '–'}</td>
                    <td>{u.assignedLevel || '–'}</td>
                    <td>{u.isBlocked ? <span className="error-msg">Blocked</span> : 'Active'}</td>
                    <td>
                      <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => openEdit(u)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => handleBlock(u._id, u.isBlocked)}>
                        {u.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button type="button" className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => handleDelete(u._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 20 && (
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button type="button" className="btn btn-secondary" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {editingUser && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 999,
            }}
            onClick={() => setEditingUser(null)}
            aria-hidden="true"
          />
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
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Edit user</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>×</button>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input name="name" value={editForm.name} onChange={handleEditChange} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={editForm.email} onChange={handleEditChange} placeholder="user@example.com" />
            </div>
            <div className="form-group">
              <label>Assigned level</label>
              <select name="assignedLevel" value={editForm.assignedLevel} onChange={handleEditChange}>
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Selected language</label>
              <select name="selectedLanguage" value={editForm.selectedLanguage} onChange={handleEditChange}>
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reset password (optional)</label>
              <input
                type="password"
                value={resetPwValue}
                onChange={(e) => setResetPwValue(e.target.value)}
                placeholder="New password (leave blank to keep current)"
              />
              {resetPwValue && (
                <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={handleResetPassword} disabled={saving}>
                  Reset password
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
