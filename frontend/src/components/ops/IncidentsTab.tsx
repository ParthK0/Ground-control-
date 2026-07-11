import React from 'react';
import { FileText, Mic, Plus } from 'lucide-react';
import styles from '../../pages/OpsDashboard.module.css';

interface Incident {
  id: string;
  text: string;
  category: string;
  severity: string | null;
  draftResponse: string;
  draftComms: string;
  status: string;
  flagged: boolean;
  timestamp: string;
}

interface IncidentsTabProps {
  incidents: Incident[];
  incidentInput: string;
  setIncidentInput: (val: string) => void;
  isSubmittingIncident: boolean;
  isListeningIncident: boolean;
  dispatchedIds: Record<string, boolean>;
  handleIncidentSubmit: (e?: React.FormEvent, customText?: string) => void;
  handleIncidentUpdate: (id: string, updatedFields: Partial<Incident>) => void;
  handleDispatchIncident: (id: string) => void;
  getIncidentSeverityStyle: (sev: string | null) => {
    color: string;
    bg: string;
    border: string;
  };
  handleVoiceIncidentInput: () => void;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({
  incidents,
  incidentInput,
  setIncidentInput,
  isSubmittingIncident,
  isListeningIncident,
  dispatchedIds,
  handleIncidentSubmit,
  handleIncidentUpdate,
  handleDispatchIncident,
  getIncidentSeverityStyle,
  handleVoiceIncidentInput,
}) => {
  return (
    <div className={styles.incidentsPanel} role="region" aria-label="Incident Triage Log Panel">
      <h2 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', margin: 0 }}>
        <FileText style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} aria-hidden="true" />
        GenAI Incident Triage Log
      </h2>

      {/* Input Form */}
      <form onSubmit={(e) => handleIncidentSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="incident-log-input" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          LOG NEW STADIUM INCIDENT
        </label>
        <div className={styles.incInputWrapper}>
          <textarea 
            id="incident-log-input"
            placeholder="Log details in plain language..." 
            rows={2}
            value={incidentInput}
            onChange={(e) => setIncidentInput(e.target.value)}
            className={styles.textareaInput}
            disabled={isSubmittingIncident}
          />
          
          {/* Voice Incident dictation */}
          <button
            type="button"
            onClick={handleVoiceIncidentInput}
            disabled={isSubmittingIncident || isListeningIncident}
            className={styles.micBtn}
            style={{
              backgroundColor: isListeningIncident ? 'var(--color-state-critical)' : 'rgba(255, 255, 255, 0.05)',
              color: isListeningIncident ? '#FFF' : 'var(--color-text-primary)'
            }}
            title="Speak log"
            aria-label={isListeningIncident ? "Voice recognition active. Listening." : "Click to speak and dictate incident log"}
          >
            <Mic style={{ width: '18px', height: '18px' }} aria-hidden="true" />
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isSubmittingIncident || !incidentInput.trim()}
          style={{
            backgroundColor: isSubmittingIncident || !incidentInput.trim() ? 'var(--color-border)' : 'var(--color-pitch-green)',
            color: isSubmittingIncident || !incidentInput.trim() ? 'var(--color-text-secondary)' : '#000000',
            border: 'none',
            borderRadius: '6px',
            padding: '8px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isSubmittingIncident || !incidentInput.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            transition: 'background-color 0.2s'
          }}
        >
          <Plus style={{ width: '14px', height: '14px' }} aria-hidden="true" />
          {isSubmittingIncident ? 'Classifying...' : 'Log & Classify Incident'}
        </button>
      </form>

      {/* Incidents List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px', margin: 0 }}>
          RECENTLY LOGGED INCIDENTS ({incidents.length})
        </h3>

        {incidents.length === 0 ? (
          <div 
            style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px', padding: '16px 0', border: '1px dashed var(--color-border)', borderRadius: '6px' }}
            role="status"
          >
            No incidents logged yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} role="list" aria-label="Recently Logged Incidents List">
            {incidents.map((inc) => {
              const severityStyle = getIncidentSeverityStyle(inc.severity);
              const isDispatched = dispatchedIds[inc.id] || inc.status === 'dispatched';
              
              return (
                <div key={inc.id} className={styles.incCard} role="listitem">
                  {inc.flagged && (
                    <span className={styles.reviewBadge}>
                      ⚠️ Needs Review
                    </span>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                      Category: {inc.category}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', color: severityStyle.color, backgroundColor: severityStyle.bg, border: `1px solid ${severityStyle.border}` }}>
                      Severity: {inc.severity || 'UNKNOWN'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontStyle: 'italic', backgroundColor: 'var(--color-surface)', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid var(--color-cyber-teal)', margin: 0 }}>
                    "{inc.text}"
                  </div>

                  <div>
                    <label htmlFor={`draft-response-${inc.id}`} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      DRAFT RESPONSE SUGGESTION
                    </label>
                    <textarea
                      id={`draft-response-${inc.id}`}
                      value={inc.draftResponse}
                      onChange={(e) => handleIncidentUpdate(inc.id, { draftResponse: e.target.value })}
                      rows={2}
                      className={styles.incDraftTextarea}
                    />
                  </div>

                  <div>
                    <label htmlFor={`draft-comms-${inc.id}`} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      DRAFT COMMUNICATIONS COPY
                    </label>
                    <textarea
                      id={`draft-comms-${inc.id}`}
                      value={inc.draftComms}
                      onChange={(e) => handleIncidentUpdate(inc.id, { draftComms: e.target.value })}
                      rows={2}
                      className={styles.incDraftTextarea}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDispatchIncident(inc.id)}
                    disabled={isDispatched}
                    aria-label={isDispatched ? `Dispatched incident: ${inc.text}` : `Dispatch response for incident: ${inc.text}`}
                    style={{
                      backgroundColor: isDispatched ? 'var(--color-pitch-green)' : 'var(--color-cyber-teal)',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: isDispatched ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {isDispatched ? '✓ Dispatched & Logged' : 'Dispatch Response'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
