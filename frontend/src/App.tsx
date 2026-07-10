import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FanChat } from './pages/FanChat';
import { OpsDashboard } from './pages/OpsDashboard';
import { Layout } from './components/Layout';
import { ArrowRight } from 'lucide-react';
import './App.css';

const GatewayPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }} className="pitch-bg">
      {/* Top Bar for Staff Sign-In */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
        padding: '12px 24px',
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 20
      }}>
        <Link to="/ops" style={{
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 14px',
          borderRadius: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#FFF';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        }}
        >
          Staff sign-in
        </Link>
      </div>

      {/* Main Hero Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '700px',
        margin: '0 auto',
        textAlign: 'center',
        zIndex: 10,
        marginTop: '60px'
      }}>
        {/* Branding & Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 230, 118, 0.08)',
            border: '1px solid rgba(0, 230, 118, 0.2)',
            padding: '8px 16px',
            borderRadius: '24px',
            marginBottom: '20px'
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px', color: 'var(--color-pitch-green)' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', color: 'var(--color-pitch-green)' }}>
              NORTHGATE MATCHDAY COMPANION
            </span>
          </div>

          <h1 style={{
            fontSize: '54px',
            lineHeight: '1.05',
            marginBottom: '16px',
            textTransform: 'uppercase',
            fontWeight: 800
          }}>
            Your Personal Stadium Copilot
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6',
            marginBottom: '32px'
          }}>
            Unlock smart wayfinding, step-free access, multilingual support, and sustainable transit directions for the ultimate matchday experience at Northgate Stadium.
          </p>
        </div>

        {/* Large Action Card / Button */}
        <div className="floodlight-card" style={{
          width: '100%',
          padding: '36px',
          textAlign: 'center',
          maxWidth: '520px',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Heading to the match?</h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
            Open the live interactive portal for instant seat navigation, eco-friendly transit options, and real-time public alerts.
          </p>
          <Link to="/fan" className="btn-primary" style={{
            textDecoration: 'none',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '16px 32px',
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <span>Launch Matchday Companion</span>
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </Link>
        </div>

        {/* Features Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          width: '100%',
          maxWidth: '600px',
          marginBottom: '40px'
        }} className="landing-features">
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🗣️</div>
            <div style={{ fontSize: '12px', fontWeight: 700 }}>Multilingual Q&A</div>
          </div>
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>♿</div>
            <div style={{ fontSize: '12px', fontWeight: 700 }}>Accessible Routing</div>
          </div>
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌿</div>
            <div style={{ fontSize: '12px', fontWeight: 700 }}>Green Transit</div>
          </div>
        </div>

        {/* Disclaimer / Footer */}
        <p style={{
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: '1.4'
        }}>
          GroundControl is an unofficial stadium experience concept. All trademarks, logos, and team names are the properties of their respective owners. Not affiliated with FIFA.
        </p>
      </div>
      <style>{`
        @media (max-width: 600px) {
          .landing-features {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          h1 {
            font-size: 38px !important;
          }
        }
      `}</style>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GatewayPage />} />
        <Route path="/fan" element={<Layout><FanChat /></Layout>} />
        <Route path="/ops" element={<Layout><OpsDashboard /></Layout>} />
      </Routes>
    </Router>
  );
};

export default App;
