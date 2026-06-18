import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.logout();
      localStorage.removeItem('sessionId');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav style={{
      borderBottom: '1px solid #e0e0e0',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <h1 style={{ fontSize: '20px', margin: 0, cursor: 'pointer' }} onClick={() => navigate('/documents')}>
        Sarvam Digitizer
      </h1>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}
