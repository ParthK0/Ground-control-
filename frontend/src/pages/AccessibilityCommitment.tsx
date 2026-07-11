import React from 'react';
import { Accessibility, Eye, Volume2, Globe, Sparkles } from 'lucide-react';

export const AccessibilityCommitment: React.FC = () => {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '0 24px',
      zIndex: 10
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 242, 254, 0.1)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          marginBottom: '16px'
        }}>
          <Accessibility style={{ width: '28px', height: '28px', color: 'var(--color-cyber-teal)' }} />
        </div>
        <h1 style={{
          fontSize: '36px',
          textTransform: 'uppercase',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.5px'
        }}>
          Accessibility Commitment
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px' }}>
          GroundControl is engineered to ensure a dignified, frictionless matchday experience for everyone.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Digital contrast */}
        <div className="broadcast-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Eye style={{ color: 'var(--color-cyber-teal)', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase' }}>Visual & High-Contrast Design</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Our interface is built using high-contrast colors (meeting WCAG 2.1 AA benchmarks) to remain readable in direct stadium sunlight or dim concourse lighting. All visual icons are paired with text labels, and custom focus indicators are implemented for screen and keyboard navigability.
          </p>
        </div>

        {/* Speech reading */}
        <div className="broadcast-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Volume2 style={{ color: 'var(--color-pitch-green)', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase' }}>Voice Synthesis & Speech Input</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            To assist users with reading or visual impairments, every copilot message features a built-in "Speak" read-aloud button. In loud stadium concourses where typing is difficult, both fans and staff have access to a push-to-talk microphone icon for voice inputs.
          </p>
        </div>

        {/* Translation */}
        <div className="broadcast-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Globe style={{ color: 'var(--color-cyber-teal)', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase' }}>Multilingual Support</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            GroundControl supports English, Spanish, and French for the three host nations, with our volunteer translator bridging communication in 6 international matchday languages (Hindi, Arabic, Japanese, Portuguese, Spanish, and French).
          </p>
        </div>

        {/* Simple Mode */}
        <div className="broadcast-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Sparkles style={{ color: 'var(--color-pitch-green)', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '18px', textTransform: 'uppercase' }}>Cognitive & Simple Layouts</h2>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Stadium environments can be overwhelming. The "Simple Mode" toggle instantly strips complex widgets down to high-contrast, double-sized touch targets detailing only your gate number, seat section, and path to the closest restroom.
          </p>
        </div>
      </div>
    </div>
  );
};
