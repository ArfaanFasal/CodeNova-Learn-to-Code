import { useState, useEffect } from 'react';
import { user as userApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCollegeName(user.collegeName || '');
      setYearOfStudy(user.yearOfStudy || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await userApi.profile({ name, collegeName, yearOfStudy });
      setMessage('Profile updated.');
    } catch (err) {
      setMessage(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: 8 }}>Profile</h1>
      <p className="text-muted" style={{ marginBottom: 32 }}>
        Update your details. Language: <strong>{user?.selectedLanguage || 'Not selected'}</strong> · Level: <strong>{user?.assignedLevel || '–'}</strong>
      </p>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label>College name</label>
            <input value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="College or institution" />
          </div>
          <div className="form-group">
            <label>Year of study</label>
            <input value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)} placeholder="e.g. 2nd year" />
          </div>
          {message && <p className={message.startsWith('Profile') ? 'success-msg' : 'error-msg'}>{message}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
