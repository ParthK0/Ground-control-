import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from '../../pages/OpsDashboard.module.css';

interface Recommendation {
  id: string;
  zoneId: string;
  recommendationText: string;
  alertText: Record<string, string>;
  severity: string;
  status: string;
  timestamp: string;
}

interface RecommendationsTabProps {
  pendingRecommendations: Recommendation[];
  approvedIds: Record<string, boolean>;
  handleApprove: (id: string) => void;
  getSeverityStyle: (sev: string) => {
    color: string;
    bg: string;
    border: string;
  };
  getZoneName: (id: string) => string;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  pendingRecommendations,
  approvedIds,
  handleApprove,
  getSeverityStyle,
  getZoneName,
}) => {
  return (
    <div className={styles.recsPanel} role="region" aria-label="GenAI Rerouting Drafts Recommendations">
      <h2 style={{
        fontSize: '15px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '10px',
        margin: 0
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} aria-hidden="true" />
          GenAI Rerouting Drafts
        </span>
        {pendingRecommendations.length > 0 && (
          <span 
            style={{ fontSize: '11px', backgroundColor: 'var(--color-state-critical)', color: '#ffffff', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}
            aria-label={`${pendingRecommendations.length} recommendations pending`}
          >
            {pendingRecommendations.length}
          </span>
        )}
      </h2>

      {pendingRecommendations.length === 0 ? (
        <div 
          style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', padding: '24px 0', border: '1px dashed var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-surface-elevated)' }}
          role="status"
        >
          No pending recommendations.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} role="list" aria-label="Pending Rerouting Recommendations list">
          {pendingRecommendations.map((rec) => {
            const isApproved = approvedIds[rec.id];
            const sevStyle = getSeverityStyle(rec.severity);
            const zoneName = getZoneName(rec.zoneId);
            
            return (
              <div 
                key={rec.id} 
                className={styles.recCard}
                role="listitem"
                style={{
                  border: isApproved ? '0px solid transparent' : '1px solid var(--color-border)',
                  padding: isApproved ? '0px 14px' : '14px',
                  gap: isApproved ? '0px' : '10px',
                  opacity: isApproved ? 0 : 1,
                  transform: isApproved ? 'translateY(-10px) scale(0.95)' : 'translateY(0) scale(1)',
                  maxHeight: isApproved ? '0px' : '300px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>{zoneName}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', color: sevStyle.color, backgroundColor: sevStyle.bg, border: `1px solid ${sevStyle.border}` }}>
                    {rec.severity} severity
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>
                  {rec.recommendationText}
                </p>

                <button
                  onClick={() => handleApprove(rec.id)}
                  disabled={isApproved}
                  aria-label={isApproved ? `Approved and Published alerts for ${zoneName}` : `Approve and Publish Alerts for ${zoneName}`}
                  style={{
                    backgroundColor: isApproved ? 'var(--color-pitch-green)' : 'var(--color-cyber-teal)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isApproved ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isApproved ? <>✓ Approved & Published</> : <>Approve & Publish Alerts</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
