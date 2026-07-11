import React from 'react';
import { Target, Cpu, Navigation, Leaf, Users, Globe, Eye } from 'lucide-react';

export const ChallengeAlignment: React.FC = () => {
  const alignments = [
    {
      category: "GenAI & Decision Support",
      icon: <Cpu style={{ color: 'var(--color-cyber-teal)' }} />,
      title: "Grounded Decision Compiler",
      desc: "Uses structured LLM outputs to synthesize incident summaries, ground options in stadium guidelines, and recommend actions with concrete sources and confidence metrics.",
      evidence: "Verified via server-side schema contracts and automated Vitest/Pytest mocks."
    },
    {
      category: "Wayfinding & Navigation",
      icon: <Navigation style={{ color: 'var(--color-pitch-green)' }} />,
      title: "Accessibility-Aware Rerouting",
      desc: "Calculates transit and walking routes dynamically. Fans are automatically rerouted if step-free paths are obstructed, with real-time ETA and CO₂ impact transparency.",
      evidence: "Interactive SVG venue map with keyboard triggers and screen-reader announcements."
    },
    {
      category: "Crowd Safety",
      icon: <Users style={{ color: 'var(--color-cyber-teal)' }} />,
      title: "Concourse Density Monitor",
      desc: "Predicts and visualizes zone pressure ratings. Warns operators in real-time if crowd levels exceed safe thresholds, enabling preemptive gates adjustment.",
      evidence: "Operational dashboard with interactive capacity gauges and safety status badges."
    },
    {
      category: "Multilingual Assistance",
      icon: <Globe style={{ color: 'var(--color-pitch-green)' }} />,
      title: "Unified Fan-Staff translation",
      desc: "Provides instant multilingual support in English, Spanish, and French, with an offline glossary translator supporting 6 global tournament languages.",
      evidence: "FanChat UI language toggle & bilingual Operations Translator Tab."
    },
    {
      category: "Sustainability",
      icon: <Leaf style={{ color: 'var(--color-cyber-teal)' }} />,
      title: "Carbon-Aware Tie-Breaker",
      desc: "Calculates the transport and energy emissions footprint of operational intervention alternatives. Safety and accessibility constraints are preserved as non-negotiable.",
      evidence: "Avoided kgCO₂e displayed clearly inside the Operations Recommendations panel."
    },
    {
      category: "Inclusion & Accessibility",
      icon: <Eye style={{ color: 'var(--color-pitch-green)' }} />,
      title: "WCAG 2.1 AA Compliance",
      desc: "Designed to meet high-contrast, text-to-speech, keyboard navigation, and motion reduction constraints to satisfy diverse visual and motor profiles.",
      evidence: "Skip link, aria-live message feed, speak-aloud speech engine, and accessibility commitment page."
    }
  ];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '40px auto',
      padding: '0 24px',
      zIndex: 10
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          marginBottom: '16px'
        }}>
          <Target style={{ width: '28px', height: '28px', color: 'var(--color-pitch-green)' }} />
        </div>
        <h1 style={{
          fontSize: '36px',
          textTransform: 'uppercase',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.5px'
        }}>
          Tournament Challenge Alignment
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px', maxWidth: '600px', margin: '8px auto 0' }}>
          GroundControl maps tournament goals directly to technical capabilities, delivering a robust, safe, and inclusive FIFA World Cup 2026 matchday concept.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {alignments.map((item, idx) => (
          <div key={idx} className="broadcast-card" style={{
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div>
              {/* Header category */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)'
                }}>
                  {item.icon}
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  letterSpacing: '1px'
                }}>
                  {item.category}
                </span>
              </div>

              {/* Title & Description */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: '10px',
                color: 'var(--color-text-primary)'
              }}>
                {item.title}
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                {item.desc}
              </p>
            </div>

            {/* Evidence Tag */}
            <div style={{
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'var(--color-pitch-green)',
                letterSpacing: '0.5px'
              }}>
                Visible Verification Evidence:
              </span>
              <span style={{
                fontSize: '12px',
                color: 'var(--color-text-muted)',
                fontStyle: 'italic'
              }}>
                {item.evidence}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengeAlignment;
