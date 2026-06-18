import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';
import '../styles/globals.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await auth.googleCallback({
        token: credentialResponse.credential,
      });
      localStorage.setItem('sessionId', response.data.sessionId);
      navigate('/documents');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Sarvam Document Digitizer</h1>
        <p className="text-muted">
          Convert legacy government documents to digital format
        </p>
      </div>
      <GoogleLogin
        onSuccess={handleLoginSuccess}
        onError={() => console.log('Login Failed')}
      />
    </div>
  );
}
