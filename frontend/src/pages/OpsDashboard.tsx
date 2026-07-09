import React, { useState } from 'react';
import { Users, AlertTriangle, FileText, Calendar, Plus } from 'lucide-react';

const staticZones = [
  { id: 'z1', name: 'North Concourse', capacity: 4000, currentCount: 2400 }, // 60% - Green
  { id: 'z2', name: 'South Concourse', capacity: 4000, currentCount: 3000 }, // 75% - Yellow
  { id: 'z3', name: 'East Gate Plaza', capacity: 2500, currentCount: 2200 }, // 88% - Red
  { id: 'z4', name: 'West Gate Plaza', capacity: 2500, currentCount: 1000 }, // 40% - Green
  { id: 'z5', name: 'Metro Transit Bridge', capacity: 6000, currentCount: 5200 }, // 86% - Red
  { id: 'z6', name: 'Fan Zone / Retail Row', capacity: 3000, currentCount: 2300 } // 76% - Yellow
];

export const OpsDashboard: React.FC = () => {
  // Mobile active tab selection: 'zones' | 'recs' | 'incidents' | 'briefings'
  const [activeTab, setActiveTab] = useState<'zones' | 'recs' | 'incidents' | 'briefings'>('zones');

  // Calculates density color based on capacity percentage per DESIGN.md thresholds
  const getDensityStatus = (current: number, capacity: number) => {
    const pct = (current / capacity) * 100;
    if (pct < 70) {
      return { label: 'Normal', color: 'var(--color-pitch-green)', bg: 'rgba(0, 230, 118, 0.1)', border: 'rgba(0, 230, 118, 0.2)' };
    } else if (pct <= 85) {
      return { label: 'Warning', color: 'var(--color-state-warning)', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
    } else {
      return { label: 'Critical', color: 'var(--color-state-critical)', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: 'var(--color-base-bg)',
      fontFamily: 'var(--font-primary)'
    }}>
      {/* Mobile Top Navigation Subheader Tabs (Hidden on Desktop) */}
      <div className="ops-mobile-tabs" style={{
        display: 'none',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '8px',
        gap: '8px'
      }}>
        <button
          onClick={() => setActiveTab('zones')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'zones' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'zones' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'zones' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          📊 Zones
        </button>
        <button
          onClick={() => setActiveTab('recs')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'recs' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'recs' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'recs' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          💡 Recs
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'incidents' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'incidents' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'incidents' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ⚠️ Incidents
        </button>
        <button
          onClick={() => setActiveTab('briefings')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'briefings' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'briefings' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'briefings' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          📋 Briefs
        </button>
      </div>

      {/* Main Grid View */}
      <div className="ops-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1.2fr',
        gap: '24px',
        padding: '24px',
        flex: 1,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Live Density Cards */}
        <div className={`ops-panel-zones ${activeTab === 'zones' ? 'mobile-active' : 'mobile-hidden'}`} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users style={{ width: '18px', height: '18px', color: 'var(--color-pitch-green)' }} />
              Northgate Stadium Live Density
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              STATIC SEED DATA
            </span>
          </div>

          {/* Cards Grid */}
          <div className="zones-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            {staticZones.map((zone) => {
              const pct = (zone.currentCount / zone.capacity) * 100;
              const status = getDensityStatus(zone.currentCount, zone.capacity);
              
              return (
                <div key={zone.id} style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{zone.name}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: status.bg,
                      color: status.color,
                      border: `1px solid ${status.border}`
                    }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Percentage Progress indicator */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        Count: <strong>{zone.currentCount}</strong> / {zone.capacity}
                      </span>
                      <span style={{ fontWeight: 700, color: status.color }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: status.color
                      }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Column containing stacked sections (or toggled tabs on mobile) */}
        <div className="ops-side-columns" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowY: 'auto'
        }}>
          
          {/* Section 1: Recommendations panel */}
          <div className={`ops-panel-recs ${activeTab === 'recs' ? 'mobile-active' : 'mobile-hidden'}`} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '10px',
              margin: 0
            }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
              GenAI Rerouting Drafts
            </h2>
            <div style={{
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              padding: '24px 0',
              border: '1px dashed var(--color-border)',
              borderRadius: '8px',
              backgroundColor: 'var(--color-surface-elevated)'
            }}>
              No pending recommendations.
            </div>
          </div>

          {/* Section 2: Incident Triage log */}
          <div className={`ops-panel-incidents ${activeTab === 'incidents' ? 'mobile-active' : 'mobile-hidden'}`} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '10px',
              margin: 0
            }}>
              <FileText style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
              GenAI Incident Triage
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                LOG STADIUM INCIDENT
              </label>
              <textarea 
                placeholder="Log details in plain language (disabled in scaffold mode)..." 
                rows={2}
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text-primary)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none'
                }}
                disabled
              />
              <button 
                type="button" 
                style={{
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
                disabled
              >
                <Plus style={{ width: '14px', height: '14px' }} />
                Log Incident
              </button>
            </div>
          </div>

          {/* Section 3: Shift Briefings tab */}
          <div className={`ops-panel-briefings ${activeTab === 'briefings' ? 'mobile-active' : 'mobile-hidden'}`} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '10px',
              margin: 0
            }}>
              <Calendar style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
              GenAI Volunteer Briefings
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Volunteer Role
                </label>
                <select 
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    padding: '8px',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none'
                  }}
                  disabled
                >
                  <option>Gate Volunteer</option>
                  <option>Crowd Control Coordinator</option>
                </select>
              </div>
              <button 
                type="button" 
                style={{
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'not-allowed'
                }}
                disabled
              >
                Generate Briefing
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Responsive media overrides embedded directly */}
      <style>{`
        @media (max-width: 992px) {
          .ops-mobile-tabs {
            display: flex !important;
          }
          .ops-grid {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
            gap: 16px !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .mobile-active {
            display: flex !important;
          }
          .ops-side-columns {
            display: contents !important;
          }
          .zones-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
