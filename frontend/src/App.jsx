import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import UploadPage from './pages/UploadPage';
import DocumentListPage from './pages/DocumentListPage';
import DocumentViewerPage from './pages/DocumentViewerPage';
import Navbar from './components/Navbar';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  const sessionId = localStorage.getItem('sessionId');
  return sessionId ? children : <Navigate to="/" />;
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <Navbar />
                  <div style={{ flex: 1 }}>
                    <Routes>
                      <Route path="/upload" element={<UploadPage />} />
                      <Route path="/documents" element={<DocumentListPage />} />
                      <Route path="/documents/:id" element={<DocumentViewerPage />} />
                      <Route path="*" element={<Navigate to="/documents" />} />
                    </Routes>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
