import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FanChat } from './pages/FanChat';
import { OpsDashboard } from './pages/OpsDashboard';
import { Layout } from './components/Layout';
import { Compass, Activity, ArrowRight, Shield } from 'lucide-react';
import './App.css';

const GatewayPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        {/* Header Branding */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '10px', 
            background: 'rgba(0, 242, 254, 0.08)', 
            border: '1px solid rgba(0, 242, 254, 0.2)', 
            padding: '8px 16px', 
            borderRadius: '24px',
            marginBottom: '16px'
          }}>
            <Shield className="text-teal" style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>GROUNDCONTROL CENTRAL</span>
          </div>
          <h1 style={{ fontSize: '42px', marginBottom: '12px', background: 'linear-gradient(135deg, #FFF 0%, var(--text-secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Stadium Operations & Fan Copilot
          </h1>
          <p className="text-secondary" style={{ fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
            World Cup 2026 matchday assistant and command center. Fictional concept demonstrating smart crowd management and AI assistant workflows.
          </p>
        </div>

        {/* Option Selection Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          
          {/* Fan Route Card */}
          <Link to="/fan" style={{ textDecoration: 'none', color: 'inherit' }} className="gateway-card-link">
            <div className="glass-panel gateway-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(0, 230, 118, 0.1)', 
                border: '1px solid rgba(0, 230, 118, 0.3)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Compass className="text-pitch-green" style={{ width: '28px', height: '28px' }} />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Fan Assistant</h2>
              <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5', flexGrow: 1, marginBottom: '20px' }}>
                Access wayfinding assistance, step-free access routing, multilingual translation support, and carbon-efficient travel options.
              </p>
              <div className="launch-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'var(--color-pitch-green)' }}>
                Launch PWA <ArrowRight style={{ width: '16px', height: '16px' }} />
              </div>
            </div>
          </Link>

          {/* Ops Route Card */}
          <Link to="/ops" style={{ textDecoration: 'none', color: 'inherit' }} className="gateway-card-link">
            <div className="glass-panel gateway-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                background: 'rgba(0, 242, 254, 0.1)', 
                border: '1px solid rgba(0, 242, 254, 0.3)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Activity className="text-teal" style={{ width: '28px', height: '28px' }} />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Ops Dashboard</h2>
              <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5', flexGrow: 1, marginBottom: '20px' }}>
                Monitor live zone density threshold alerts, review GenAI rerouting recommendations, log incidents, and generate shift briefs.
              </p>
              <div className="launch-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'var(--color-teal)' }}>
                Launch Command <ArrowRight style={{ width: '16px', height: '16px' }} />
              </div>
            </div>
          </Link>

        </div>

        {/* Disclaimer */}
        <p className="text-muted" style={{ fontSize: '11px' }}>
          GroundControl is a conceptual matchday system for Northgate Stadium. It is an unofficial demonstration and is not associated with FIFA or the World Cup.
        </p>
      </div>

      {/* Hover effects style */}
      <style>{`
        .gateway-card {
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s, box-shadow 0.3s !important;
        }
        .gateway-card-link:hover .gateway-card {
          transform: translateY(-6px);
          border-color: rgba(0, 242, 254, 0.3) !important;
          box-shadow: 0 10px 30px rgba(0, 242, 254, 0.15);
        }
        .gateway-card-link:hover .launch-label {
          text-decoration: underline;
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
