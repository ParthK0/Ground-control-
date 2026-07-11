import React from 'react';

interface Zone {
  id: string;
  name: string;
  capacity: number;
  accessible: boolean;
}

interface VenueMapProps {
  zones: Zone[];
  selectedZone: string | null;
  onSelectZone: (id: string) => void;
  mapTitle: string;
  mapSelectZone: string;
}

/**
 * VenueMap — interactive SVG stadium zone map.
 * Extracted from FanChat.tsx to isolate the SVG rendering concern.
 */
export const VenueMap: React.FC<VenueMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  mapTitle,
  mapSelectZone,
}) => {
  const svgZones: Array<{ id: string; d: string; label: string; labelX: number; labelY: number }> =
    [
      {
        id: 'z1',
        d: 'M 100 45 L 300 45 L 260 90 L 140 90 Z',
        label: 'North Stand',
        labelX: 200,
        labelY: 70,
      },
      {
        id: 'z2',
        d: 'M 100 255 L 300 255 L 260 210 L 140 210 Z',
        label: 'South Stand',
        labelX: 200,
        labelY: 238,
      },
      {
        id: 'z3',
        d: 'M 280 95 L 350 70 L 350 230 L 280 205 Z',
        label: 'East Plaza',
        labelX: 318,
        labelY: 153,
      },
      {
        id: 'z4',
        d: 'M 120 95 L 50 70 L 50 230 L 120 205 Z',
        label: 'West Plaza',
        labelX: 82,
        labelY: 153,
      },
      {
        id: 'z5',
        d: 'M 15 20 L 95 20 L 105 45 L 25 45 Z',
        label: 'Metro Bridge',
        labelX: 58,
        labelY: 36,
      },
      {
        id: 'z6',
        d: 'M 305 255 L 385 255 L 375 280 L 295 280 Z',
        label: 'Fan Zone',
        labelX: 340,
        labelY: 271,
      },
    ];

  const selectedZoneData = zones.find(z => z.id === selectedZone);

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="broadcast-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px' }}>
          {mapTitle}
        </h2>

        <div
          style={{
            backgroundColor: 'var(--color-base-bg)',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <svg
            viewBox="0 0 400 300"
            style={{ width: '100%', maxHeight: '250px' }}
          >
            {/* Pitch */}
            <rect x="130" y="105" width="140" height="90" rx="4" fill="#0f4625" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
            <circle cx="200" cy="150" r="18" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
            <line x1="200" y1="105" x2="200" y2="195" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />

            {svgZones.map(zone => (
              <g key={zone.id}>
                <path
                  d={zone.d}
                  fill={selectedZone === zone.id ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'}
                  stroke={selectedZone === zone.id ? 'var(--team-accent)' : 'var(--color-border)'}
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => onSelectZone(zone.id)}
                  className="breathing-pulse"
                  role="button"
                  aria-label={`Select ${zone.label}`}
                  aria-pressed={selectedZone === zone.id}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectZone(zone.id);
                    }
                  }}
                />
                <text
                  x={zone.labelX}
                  y={zone.labelY}
                  fill="#FFF"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  pointerEvents="none"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  {zone.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {selectedZoneData ? (
          <div
            style={{
              marginTop: '16px',
              backgroundColor: 'var(--color-surface-elevated)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 style={{ textTransform: 'uppercase', color: 'var(--team-accent)', fontSize: '15px' }}>
              {selectedZoneData.name}
            </h3>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', fontSize: '13px' }}
            >
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Capacity limit:</span>
                <strong style={{ display: 'block', color: '#FFF' }}>
                  {selectedZoneData.capacity} fans
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Access Type:</span>
                <strong
                  style={{
                    display: 'block',
                    color: selectedZoneData.accessible
                      ? 'var(--color-pitch-green)'
                      : 'var(--color-state-critical)',
                  }}
                >
                  {selectedZoneData.accessible ? '♿ Step-Free Accessible' : '⚠️ Steps-Only'}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              marginTop: '12px',
              textAlign: 'center',
            }}
          >
            {mapSelectZone}
          </p>
        )}
      </div>
    </div>
  );
};
