import React from 'react';
import { Calendar } from 'lucide-react';
import styles from '../../pages/OpsDashboard.module.css';

interface BriefingSection {
  heading: string;
  body: string;
}

interface GeneratedBriefing {
  role: string;
  sections: BriefingSection[];
}

interface BriefingsTabProps {
  briefingRole: string;
  setBriefingRole: (val: string) => void;
  briefingContext: string;
  setBriefingContext: (val: string) => void;
  isGeneratingBriefing: boolean;
  generatedBriefing: GeneratedBriefing | null;
  handleGenerateBriefing: (e: React.FormEvent) => void;
}

export const BriefingsTab: React.FC<BriefingsTabProps> = ({
  briefingRole,
  setBriefingRole,
  briefingContext,
  setBriefingContext,
  isGeneratingBriefing,
  generatedBriefing,
  handleGenerateBriefing,
}) => {
  return (
    <div className={styles.briefingsPanel} role="region" aria-label="Volunteer Shift Briefings Panel">
      <h2 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', margin: 0 }}>
        <Calendar style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} aria-hidden="true" />
        GenAI Volunteer Briefings
      </h2>
      <form onSubmit={handleGenerateBriefing} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label htmlFor="briefing-role-select" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
            Volunteer Role
          </label>
          <select 
            id="briefing-role-select"
            value={briefingRole}
            onChange={(e) => setBriefingRole(e.target.value)}
            className={styles.selectInput}
            disabled={isGeneratingBriefing}
          >
            <option value="Gate Volunteer">Gate Volunteer</option>
            <option value="Crowd Control Coordinator">Crowd Control Coordinator</option>
            <option value="General Volunteer">General Volunteer</option>
          </select>
        </div>

        <div>
          <label htmlFor="briefing-context-input" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
            Shift Context / Notes (Optional)
          </label>
          <input
            id="briefing-context-input"
            type="text"
            placeholder="e.g. 'Rain expected at 4pm' or 'high gate traffic'..."
            value={briefingContext}
            onChange={(e) => setBriefingContext(e.target.value)}
            className={styles.textInput}
            disabled={isGeneratingBriefing}
          />
        </div>

        <button 
          type="submit" 
          disabled={isGeneratingBriefing}
          style={{
            backgroundColor: isGeneratingBriefing ? 'var(--color-border)' : 'var(--color-pitch-green)',
            color: isGeneratingBriefing ? 'var(--color-text-secondary)' : '#000000',
            border: 'none',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isGeneratingBriefing ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {isGeneratingBriefing ? 'Generating Briefing...' : 'Generate Briefing'}
        </button>
      </form>

      {generatedBriefing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }} role="region" aria-live="polite" aria-label="Generated Briefing Content">
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
            GENERATED BRIEFING FOR {generatedBriefing.role.toUpperCase()}
          </label>

          {generatedBriefing.sections.map((sect, index) => (
            <div key={index} style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-cyber-teal)' }}>{sect.heading}</div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: '1.4' }}>{sect.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
