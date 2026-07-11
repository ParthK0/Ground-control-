import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

interface Venue {
  name: string;
  city: string;
  capacity: string;
  active: boolean;
}

const VENUES: Venue[] = [
  { name: 'Northgate Stadium', city: 'Fictional Demo City', capacity: '65,000', active: true },
  { name: 'Estadio Azteca', city: 'Mexico City', capacity: '87,523', active: false },
  { name: 'MetLife Stadium', city: 'New York/New Jersey', capacity: '82,500', active: false },
  { name: 'AT&T Stadium', city: 'Dallas', capacity: '80,000', active: false },
  { name: 'Arrowhead Stadium', city: 'Kansas City', capacity: '76,416', active: false },
  { name: 'Mercedes-Benz Stadium', city: 'Atlanta', capacity: '71,000', active: false },
  { name: 'SoFi Stadium', city: 'Los Angeles', capacity: '70,240', active: false },
  { name: 'Lincoln Financial Field', city: 'Philadelphia', capacity: '69,796', active: false },
  { name: 'Lumen Field', city: 'Seattle', capacity: '69,000', active: false },
  { name: 'Levi\'s Stadium', city: 'San Francisco Bay Area', capacity: '68,500', active: false },
  { name: 'Gillette Stadium', city: 'Boston', capacity: '65,878', active: false },
  { name: 'Hard Rock Stadium', city: 'Miami', capacity: '64,767', active: false },
  { name: 'BC Place', city: 'Vancouver', capacity: '54,500', active: false },
  { name: 'Estadio BBVA', city: 'Monterrey', capacity: '53,500', active: false },
  { name: 'Estadio Akron', city: 'Guadalajara', capacity: '48,071', active: false },
  { name: 'BMO Field', city: 'Toronto', capacity: '30,000', active: false }
];

export const HostVenues: React.FC = () => {
  return (
    <div style={{
      maxWidth: '1000px',
      margin: '40px auto',
      padding: '0 24px',
      zIndex: 10
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '36px',
          textTransform: 'uppercase',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.5px'
        }}>
          FIFA 2026 Host Venues
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '15px' }}>
          Select a tournament stadium to open its active matchday copilot.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {VENUES.map((venue, idx) => (
          <div
            key={idx}
            className="broadcast-card"
            style={{
              padding: '20px',
              borderTopColor: venue.active ? 'var(--color-pitch-green)' : 'var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '180px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 800 }}>
                  {venue.city}
                </span>
                {venue.active ? (
                  <span style={{
                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                    color: 'var(--color-pitch-green)',
                    fontSize: '9px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }} className="breathing-pulse">
                    Live Active
                  </span>
                ) : (
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--color-text-muted)',
                    fontSize: '9px',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Coming Soon
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', color: '#FFF' }}>{venue.name}</h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Capacity: {venue.capacity}
              </p>
            </div>

            {venue.active ? (
              <Link
                to="/fan"
                className="btn-primary"
                style={{
                  textDecoration: 'none',
                  fontSize: '12px',
                  padding: '8px 16px',
                  width: '100%',
                  marginTop: '12px',
                  height: '36px',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '0.5px'
                }}
              >
                <span>Launch Companion</span>
                <Compass style={{ width: '14px', height: '14px' }} />
              </Link>
            ) : (
              <button
                disabled
                className="btn-secondary"
                style={{
                  fontSize: '12px',
                  padding: '8px 16px',
                  width: '100%',
                  marginTop: '12px',
                  height: '36px',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}
              >
                Locked
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
