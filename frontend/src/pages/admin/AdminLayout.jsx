import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">◆</span>
          <span>Codenova Admin</span>
        </div>
        <nav className="admin-nav">
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/courses">Manage Courses</NavLink>
          <NavLink to="/admin/coding">Manage Coding</NavLink>
          <NavLink to="/admin/assessments">Manage Assessments</NavLink>
          <NavLink to="/admin/users">Manage Users</NavLink>
          <NavLink to="/admin/reports">Results & Reports</NavLink>
        </nav>
        <button type="button" className="btn btn-ghost admin-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            <h1>Admin Console</h1>
            <p>Manage courses, coding labs, assessments, and users in one place.</p>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
