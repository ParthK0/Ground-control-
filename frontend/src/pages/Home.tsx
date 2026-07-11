import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldAlert, Leaf, Accessibility, Clock } from 'lucide-react';

export const Home: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 4, hours: 12, minutes: 30, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }} className="pitch-bg">
      {/* Hero Header with Countdown */}
      <div style={{
        maxWidth: '850px',
        margin: '60px auto 40px',
        textAlign: 'center',
        zIndex: 10
      }}>
        {/* Unofficial Banner */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(0, 230, 118, 0.08)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          padding: '8px 16px',
          borderRadius: '24px',
          marginBottom: '28px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: 'var(--color-pitch-green)' }}>
            FIFA WORLD CUP 2026 CONCEPT
          </span>
        </div>

        {/* Live Fixture Score Bug */}
        <div style={{
          backgroundColor: 'rgba(11, 15, 25, 0.9)',
          border: '1px solid var(--color-border)',
          borderTop: '3px solid var(--color-cyber-teal)',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '12px 24px',
          borderRadius: '6px',
          gap: '16px',
          marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: '#FFF' }}>MEXICO</div>
          <div style={{
            backgroundColor: 'var(--color-cyber-teal)',
            color: '#030712',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 800,
            borderRadius: '4px',
            fontFamily: 'var(--font-display)'
          }}>VS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: '#FFF' }}>ARGENTINA</div>
          <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 600 }}>
            <Clock style={{ width: '14px', height: '14px', color: 'var(--color-cyber-teal)' }} />
            <span>JULY 15, 18:00 Local</span>
          </div>
        </div>

        <h1 style={{
          fontSize: '64px',
          lineHeight: '1.02',
          marginBottom: '20px',
          textTransform: 'uppercase',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-1.5px'
        }}>
          STADIUM EXPERIENCE, <br />
          <span style={{ color: 'var(--color-pitch-green)' }}>RE-ENGINEERED</span>
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
          maxWidth: '650px',
          margin: '0 auto 40px'
        }}>
          Avoid crowds, get real-time voice routing, and travel sustainably. The matchday assistant built to keep your matchday stress-free.
        </p>

        {/* Kickoff Countdown Board */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          maxWidth: '420px',
          margin: '0 auto 40px',
          backgroundColor: 'rgba(4, 8, 16, 0.85)',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid var(--color-border)'
        }}>
          {Object.entries(timeLeft).map(([unit, val]) => (
            <div key={unit} style={{ textAlign: 'center' }}>
              <div className="tabular-numbers" style={{
                fontFamily: 'var(--font-display)',
                fontSize: '32px',
                fontWeight: 800,
                color: 'var(--color-cyber-teal)',
                lineHeight: 1
              }}>
                {val.toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginTop: '4px' }}>
                {unit}
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/fan" className="btn-primary" style={{
            textDecoration: 'none',
            padding: '18px 40px',
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            <span>Enter Fan Companion</span>
            <ArrowRight style={{ width: '18px', height: '18px' }} />
          </Link>
        </div>
      </div>

      {/* The Four Pillars Sections */}
      <div style={{
        maxWidth: '900px',
        margin: '60px auto 40px',
        zIndex: 10
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '32px',
          textTransform: 'uppercase',
          marginBottom: '40px',
          fontFamily: 'var(--font-display)'
        }}>
          Engineered Features
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px'
        }} className="landing-features-grid">
          {/* Pillar 1: Navigation */}
          <div className="broadcast-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Compass style={{ color: 'var(--color-cyber-teal)', width: '28px', height: '28px' }} />
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase' }}>Smart Navigation</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Dynamic pathfinding tailored to your specific stadium stand, entrance gate, or nearest washroom. Avoid busy paths automatically.
            </p>
            {/* Tiny live preview element */}
            <div style={{
              height: '40px',
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '12px',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'var(--color-pitch-green)',
              fontWeight: 700
            }}>
              <span>🧭 Route Selected: Zone 3 East Concourse (Step-free)</span>
            </div>
          </div>

          {/* Pillar 2: Crowd Safety */}
          <div className="broadcast-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <ShieldAlert style={{ color: 'var(--color-state-critical)', width: '28px', height: '28px' }} />
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase' }}>Crowd Intelligence</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              We track real-time density spikes, queue levels, and restroom volumes to feed actionable, human-reviewed alerts instantly.
            </p>
            <div style={{
              height: '40px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--color-state-critical)',
              fontWeight: 700
            }} className="breathing-pulse">
              <span>⚠️ Crowd Warning: High density at Gate B. Use Gate C.</span>
            </div>
          </div>

          {/* Pillar 3: Sustainability */}
          <div className="broadcast-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Leaf style={{ color: 'var(--color-pitch-green)', width: '28px', height: '28px' }} />
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase' }}>Eco-Transit Comparison</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Calculate CO2 emission impact and transit time estimates between rideshare, metro, or micromobility options.
            </p>
            <div style={{
              height: '40px',
              backgroundColor: 'rgba(0, 230, 118, 0.1)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '12px',
              border: '1px solid rgba(0, 230, 118, 0.2)',
              color: 'var(--color-pitch-green)',
              fontWeight: 700
            }}>
              <span>🌿 Metro Option Selected: Saves 2.4kg of CO2 emissions</span>
            </div>
          </div>

          {/* Pillar 4: Accessibility */}
          <div className="broadcast-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Accessibility style={{ color: 'var(--color-cyber-teal)', width: '28px', height: '28px' }} />
              <h3 style={{ fontSize: '20px', textTransform: 'uppercase' }}>Accessibility First</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              A specialized "Simple Mode" interface designed for maximum legibility, screen voice synthesis, and multi-language translation.
            </p>
            <div style={{
              height: '40px',
              backgroundColor: 'rgba(4, 8, 16, 0.85)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: '12px',
              border: '1px solid var(--color-border)',
              color: '#FFF',
              fontWeight: 700,
              justifyContent: 'space-between'
            }}>
              <span>♿ Simple Mode Enabled</span>
              <span style={{ fontSize: '10px', color: 'var(--color-cyber-teal)', textTransform: 'uppercase' }}>Active</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .landing-features-grid {
            grid-template-columns: 1fr !important;
          }
          h1 {
            font-size: 40px !important;
          }
        }
      `}</style>
    </div>
  );
};
