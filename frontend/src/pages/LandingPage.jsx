import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { auth } from '../services/api';
import '../styles/landing.css';

const LANGUAGES = [
  ['हिन्दी', 'Hindi'],
  ['தமிழ்', 'Tamil'],
  ['తెలుగు', 'Telugu'],
  ['ಕನ್ನಡ', 'Kannada'],
  ['മലയാളം', 'Malayalam'],
  ['বাংলা', 'Bengali'],
  ['ਪੰਜਾਬੀ', 'Punjabi'],
  ['मराठी', 'Marathi'],
];

const FEATURES = [
  {
    icon: '📄',
    title: 'Extract anything',
    body: 'Upload a PDF or photo. Sarvam Vision reads printed text, messy handwriting, and regional scripts — even faded decades-old paper.',
    cls: 'feature-hero',
    stat: '99%',
    statLabel: 'character accuracy on clean scans',
  },
  {
    icon: '💡',
    title: 'Instant insights',
    body: 'Sarvam 105B summarizes each document and pulls out the structured fields that matter.',
    cls: 'span-3',
  },
  {
    icon: '🌍',
    title: '8 Indian languages',
    body: 'One click translates extracted text into Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi & Marathi.',
    cls: 'span-3',
  },
  {
    icon: '💬',
    title: 'Chat with your docs',
    body: 'Ask questions in plain language and get context-aware answers grounded in the document.',
    cls: 'span-2',
  },
  {
    icon: '🔒',
    title: 'Private by default',
    body: 'Google sign-in, per-user isolation, no data sharing — ever.',
    cls: 'span-2',
  },
  {
    icon: '⚡',
    title: 'Upload & go',
    body: 'Async pipeline processes in the background while you move on.',
    cls: 'span-2',
  },
];

const STEPS = [
  ['Upload', 'Drag & drop a PDF or image of any government record.'],
  ['Extract', 'Sarvam Vision lifts every line of text off the page.'],
  ['Analyze', 'Sarvam 105B writes summaries and surfaces key fields.'],
  ['Translate', 'Read it in any of 8 regional languages instantly.'],
];

const USE_CASES = [
  ['🏛️', 'Government archives', 'Turn decades of dusty records into a searchable digital library.'],
  ['⚖️', 'Legal documents', 'Convert scanned filings into clean, structured digital format.'],
  ['🗣️', 'Regional access', 'Break language barriers by translating records into local tongues.'],
  ['♿', 'Accessibility', 'Make legacy paperwork usable through chat and translation.'],
];

const STATS = [
  ['8', 'Indian languages'],
  ['105B', 'Parameter model'],
  ['3', 'Sarvam APIs'],
  ['∞', 'Documents'],
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      const response = await auth.googleCallback({
        token: credentialResponse.credential,
      });
      localStorage.setItem('sessionId', response.data.sessionId);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      navigate('/documents');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const login = (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onError={() => console.log('Login Failed')}
      size="large"
      shape="pill"
    />
  );

  return (
    <div className="landing">
      <div className="l-shell">
        {/* ---------------- Nav ---------------- */}
        <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="nav-inner">
            <div className="brand">
              <span className="brand-mark">स</span>
              Sarvam Digitizer
            </div>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#cases">Use cases</a>
            </div>
            <div className="nav-cta">{login}</div>
          </div>
        </nav>

        {/* ---------------- Hero ---------------- */}
        <header className="hero">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          <div className="hero-inner">
            <span className="badge">
              <span className="dot" />
              Powered by Sarvam AI · built for Bharat
            </span>
            <h1>
              Bring legacy records
              <br />
              <span className="accent">back to life.</span>
            </h1>
            <p className="lede">
              Digitize scanned government documents — handwriting, regional scripts and all —
              into clean, searchable, translatable digital records in seconds.
            </p>
            <div className="hero-actions">
              {login}
              <a href="#how" className="btn btn-ghost">
                See how it works ↓
              </a>
            </div>
            <p className="hero-note">No setup · Sign in with Google · Your data stays yours</p>
          </div>

          {/* Product mock */}
          <div className="hero-mock">
            <div className="mock-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="mock-body">
              <div className="mock-pane left">
                <div className="mock-tag">Scanned input</div>
                <div className="scan-line w90" />
                <div className="scan-line w70" />
                <div className="scan-line w80" />
                <div className="scan-line w50" />
                <div className="scan-line w70" />
                <div className="scan-line w90" />
              </div>
              <div className="mock-pane right">
                <div className="mock-tag">Digitized & translated</div>
                <div className="scan-line w90" />
                <div className="scan-line w80" />
                <div className="scan-line w90" />
                <div className="scan-line w50" />
                <div className="scan-line w70" />
                <div className="scan-line w80" />
              </div>
            </div>
          </div>
        </header>

        {/* ---------------- Language marquee ---------------- */}
        <div className="marquee-wrap">
          <div className="marquee-label">Translates into 8 regional languages</div>
          <div className="marquee">
            {[...LANGUAGES, ...LANGUAGES].map(([native, en], i) => (
              <div className="chip" key={i}>
                {native}
                <small>{en}</small>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- Features ---------------- */}
        <section className="section" id="features">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="eyebrow">Capabilities</div>
              <h2>Everything a paper trail needs</h2>
              <p>
                One pipeline takes a document from a blurry scan to structured, multilingual,
                conversational data.
              </p>
            </div>
            <div className="bento">
              {FEATURES.map((f, i) => (
                <div className={`card ${f.cls} reveal`} key={i} style={{ transitionDelay: `${i * 0.05}s` }}>
                  <div className="card-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  {f.stat && (
                    <div className="big-stat">
                      {f.stat}
                      <small>{f.statLabel}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section className="section alt" id="how">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="eyebrow">Workflow</div>
              <h2>From scan to insight in four steps</h2>
              <p>No training, no templates. Upload and let Sarvam do the rest.</p>
            </div>
            <div className="steps">
              {STEPS.map(([title, body], i) => (
                <div className="step reveal" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                  <div className="step-num">{i + 1}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Stats ---------------- */}
        <section className="section">
          <div className="wrap">
            <div className="stats">
              {STATS.map(([num, lbl], i) => (
                <div className="stat reveal" key={i} style={{ transitionDelay: `${i * 0.06}s` }}>
                  <div className="num">{num}</div>
                  <div className="lbl">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Use cases ---------------- */}
        <section className="section alt" id="cases">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="eyebrow">Where it shines</div>
              <h2>Built for the real world of records</h2>
              <p>Wherever paper piles up and languages diverge, the digitizer earns its keep.</p>
            </div>
            <div className="uc-grid">
              {USE_CASES.map(([emoji, title, body], i) => (
                <div className="uc reveal" key={i} style={{ transitionDelay: `${i * 0.06}s` }}>
                  <div className="uc-emoji">{emoji}</div>
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="cta">
          <div className="cta-card reveal">
            <div className="glow" />
            <h2>
              Ready to digitize <span className="accent">Bharat's archives?</span>
            </h2>
            <p>Sign in with Google and turn your first stack of paper into living data.</p>
            <div className="cta-actions">{login}</div>
          </div>
        </section>

        {/* ---------------- Footer ---------------- */}
        <footer className="footer">
          <div className="footer-inner">
            <div>
              <div className="brand">
                <span className="brand-mark">स</span>
                Sarvam Digitizer
              </div>
              <p className="footer-tag">
                Government document digitization for India, powered by Sarvam AI.
              </p>
            </div>
            <div className="footer-cols">
              <div className="footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how">How it works</a>
                <a href="#cases">Use cases</a>
              </div>
              <div className="footer-col">
                <h4>Sarvam</h4>
                <a href="https://sarvam.ai" target="_blank" rel="noopener noreferrer">
                  sarvam.ai
                </a>
                <a href="https://docs.sarvam.ai" target="_blank" rel="noopener noreferrer">
                  Docs
                </a>
                <a href="https://dashboard.sarvam.ai" target="_blank" rel="noopener noreferrer">
                  Dashboard
                </a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Sarvam Digitizer</span>
            <span>Made with care for Bharat 🇮🇳</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
