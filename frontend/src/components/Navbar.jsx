import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import '../styles/app.css';

export default function Navbar() {
  const navigate = useNavigate();

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    user = {};
  }

  const initial = (user.email || '?').charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <nav className="app-nav">
      <div className="app-brand" onClick={() => navigate('/documents')}>
        <span className="mark">अ</span>
        Abhilekh
      </div>

      <div className="app-nav-right">
        {user.email && (
          <div className="app-user">
            <div className="app-avatar">{initial}</div>
            <span className="app-user-email">{user.email}</span>
          </div>
        )}
        <button className="btn btn-ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
