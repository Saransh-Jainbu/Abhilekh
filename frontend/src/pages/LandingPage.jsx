import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { auth } from '../services/api';
import '../styles/landing.css';

export default function LandingPage() {
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
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo">Sarvam Digitizer</div>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log('Login Failed')}
            size="large"
          />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Digitize Legacy Government Documents</h1>
          <p className="hero-subtitle">
            Convert scanned documents with handwriting and regional text into structured digital records.
            Powered by Sarvam AI.
          </p>
          <div className="hero-cta">
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log('Login Failed')}
              size="large"
              text="signin"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-container">
          <h2 className="section-title">Capabilities</h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Extract Text</h3>
              <p>Upload PDF or image files. Sarvam Vision automatically extracts all text, even from handwritten documents with regional scripts.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Generate Insights</h3>
              <p>Sarvam 105B analyzes documents and generates key insights, summaries, and structured information extraction.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Translate</h3>
              <p>Automatically translate extracted text to 8 regional Indian languages: Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, and Marathi.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Smart Chat</h3>
              <p>Ask questions about document content. Sarvam 105B provides context-aware responses based on the document.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>Google authentication. Your documents are private and isolated per user. No data sharing.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast Processing</h3>
              <p>Asynchronous processing pipeline. Upload and go—processing happens in the background.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>

          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Upload</h3>
              <p>Drag & drop or click to upload PDF or image files of government documents</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Extract</h3>
              <p>Sarvam Vision API extracts text from scanned images and PDFs</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Analyze</h3>
              <p>Sarvam 105B generates insights and summaries automatically</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">4</div>
              <h3>Translate</h3>
              <p>Get translations in 8 regional languages instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases">
        <div className="section-container">
          <h2 className="section-title">Use Cases</h2>

          <div className="use-cases-grid">
            <div className="use-case">
              <h3>Government Archives</h3>
              <p>Digitize decades of government records and make them searchable</p>
            </div>

            <div className="use-case">
              <h3>Legal Documents</h3>
              <p>Convert scanned legal documents to structured digital format</p>
            </div>

            <div className="use-case">
              <h3>Regional Languages</h3>
              <p>Bridge language barriers by translating documents to local languages</p>
            </div>

            <div className="use-case">
              <h3>Accessibility</h3>
              <p>Make legacy documents accessible through chat interface and translations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-stack">
        <div className="section-container">
          <h2 className="section-title">Built With Sarvam</h2>

          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-name">Sarvam Vision</div>
              <p>Text extraction from documents and images</p>
            </div>

            <div className="tech-item">
              <div className="tech-name">Sarvam 105B</div>
              <p>Large language model for insights and chat</p>
            </div>

            <div className="tech-item">
              <div className="tech-name">Sarvam Translation</div>
              <p>Multilingual translation to 8 Indian languages</p>
            </div>

            <div className="tech-item">
              <div className="tech-name">React + Vite</div>
              <p>Fast, modern frontend framework</p>
            </div>

            <div className="tech-item">
              <div className="tech-name">Node.js + Express</div>
              <p>Scalable backend server</p>
            </div>

            <div className="tech-item">
              <div className="tech-name">PostgreSQL</div>
              <p>Reliable database for documents and metadata</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="section-container cta-content">
          <h2>Ready to digitize?</h2>
          <p>Login with Google to get started</p>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => console.log('Login Failed')}
            size="large"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>Sarvam Government Document Digitizer</p>
          <p className="footer-meta">
            Powered by <a href="https://sarvam.ai" target="_blank" rel="noopener noreferrer">Sarvam AI</a> •
            <a href="https://docs.sarvam.ai" target="_blank" rel="noopener noreferrer"> Docs</a> •
            <a href="https://dashboard.sarvam.ai" target="_blank" rel="noopener noreferrer"> Dashboard</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
