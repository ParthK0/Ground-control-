import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Server, AlertTriangle } from 'lucide-react';
import { BACKEND_URL } from '../config';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--color-base-bg)',
      color: 'var(--color-text-primary)'
    }}>
      {/* Global Navigation Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 50,
        position: 'sticky',
        top: 0
      }} className="app-header">
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity style={{ width: '20px', height: '20px', color: 'var(--color-pitch-green)' }} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>GROUNDCONTROL</span>
            <span style={{ fontSize: '10px', display: 'block', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              UNOFFICIAL CONCEPT BUILD
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        {currentPath === '/ops' && (
          <Link
            to="/fan"
            style={{
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s, border-color 0.2s',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-surface-elevated)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-pitch-green)';
              e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            ← Exit to Fan App
          </Link>
        )}

        {/* Deploy Ready Environment Indicator */}
        {window.location.search.includes('debug=true') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="env-indicator">
            <Server style={{ width: '14px', height: '14px', color: 'var(--color-cyber-teal)' }} />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
              {BACKEND_URL ? `API: ${BACKEND_URL}` : 'API: (LOCAL MOCK)'}
            </span>
          </div>
        )}
      </header>

      {/* Main Screen Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      {/* Shared Footer with Disclaimer */}
      <footer style={{
        padding: '16px 24px',
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          <AlertTriangle style={{ width: '12px', height: '12px', color: 'var(--color-text-muted)' }} />
          <span>Fictional Demonstration Concept</span>
        </div>
        <p style={{ margin: 0 }}>
          GroundControl is an unofficial matchday assistant for Northgate Stadium. It is not affiliated with, endorsed by, or associated with FIFA or the World Cup.
        </p>
      </footer>

      {/* Responsive media overrides embedded directly */}
      <style>{`
        @media (max-width: 767px) {
          .app-header {
            flex-direction: column;
            gap: 12px;
            padding: 12px !important;
            text-align: center;
          }
          .env-indicator {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
