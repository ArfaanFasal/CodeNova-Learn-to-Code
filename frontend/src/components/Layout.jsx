import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-inner">
          <NavLink to="/" className="logo">Codenova</NavLink>
          <nav className="layout-nav">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </nav>
          <div className="layout-actions">
            <div className="user-chip">
              <span className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              <span>{user?.name || 'Student'}</span>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
