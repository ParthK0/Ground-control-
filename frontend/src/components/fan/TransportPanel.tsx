import React from 'react';

interface TransportOption {
  mode: string;
  estTime: string;
  estCO2: string;
}

interface TransportData {
  illustrative: boolean;
  options: TransportOption[];
  reasoning?: string | null;
}

interface TransportPanelProps {
  transportCompare: TransportData | null;
  transportTitle: string;
}

/**
 * TransportPanel — renders eco-transport mode comparison table.
 * Extracted from FanChat.tsx to keep the transit view self-contained.
 */
export const TransportPanel: React.FC<TransportPanelProps> = ({ transportCompare, transportTitle }) => {
  return (
    <div
      style={{
        maxWidth: '750px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div className="broadcast-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>
          {transportTitle}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Compare transport modes based on efficiency and CO₂ environmental savings.
        </p>

        {transportCompare?.reasoning && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: 'var(--color-state-warning)',
            }}
          >
            <strong>Matchday Notice:</strong> {transportCompare.reasoning}
          </div>
        )}

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          role="list"
          aria-label="Transport options"
        >
          {transportCompare?.options.map((opt, idx) => {
            const co2Val = parseFloat(opt.estCO2);
            const isLowCarbon = co2Val <= 1.5;
            return (
              <div
                key={idx}
                role="listitem"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  padding: '16px 20px',
                  borderRadius: '6px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#FFF' }}>{opt.mode}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '4px',
                    }}
                  >
                    Time: {opt.estTime}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      backgroundColor: isLowCarbon
                        ? 'rgba(0, 230, 118, 0.1)'
                        : 'rgba(255,255,255,0.05)',
                      color: isLowCarbon
                        ? 'var(--color-pitch-green)'
                        : 'var(--color-text-primary)',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                    aria-label={`${opt.estCO2} CO2 emissions`}
                  >
                    {opt.estCO2} CO₂
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
