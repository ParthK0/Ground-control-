import React from 'react';
import { Languages, Volume2 } from 'lucide-react';
import styles from '../../pages/OpsDashboard.module.css';

interface TranslatorTabProps {
  translateText: string;
  setTranslateText: (val: string) => void;
  fromLang: string;
  setFromLang: (val: string) => void;
  toLang: string;
  setToLang: (val: string) => void;
  translatedText: string;
  isTranslating: boolean;
  handleTranslate: (e: React.FormEvent) => void;
  speakTranslation: () => void;
}

export const TranslatorTab: React.FC<TranslatorTabProps> = ({
  translateText,
  setTranslateText,
  fromLang,
  setFromLang,
  toLang,
  setToLang,
  translatedText,
  isTranslating,
  handleTranslate,
  speakTranslation,
}) => {
  return (
    <div className={styles.translatorPanel} role="region" aria-label="Volunteer Translator Panel">
      <h2 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', margin: 0 }}>
        <Languages style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} aria-hidden="true" />
        Volunteer 2-Way Translator
      </h2>

      <form onSubmit={handleTranslate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className={styles.translatorGrid}>
          <div className={styles.translatorField}>
            <label htmlFor="translator-from-lang" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>FROM</label>
            <select 
              id="translator-from-lang"
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              className={styles.selectInput}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Hindi">Hindi</option>
              <option value="Arabic">Arabic</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
          
          <div className={styles.translatorField}>
            <label htmlFor="translator-to-lang" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>TO</label>
            <select 
              id="translator-to-lang"
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className={styles.selectInput}
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Portuguese">Portuguese</option>
              <option value="Hindi">Hindi</option>
              <option value="Arabic">Arabic</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="translator-speech-input" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>SPEECH TO TRANSLATE</label>
          <textarea 
            id="translator-speech-input"
            placeholder="Type or dictate what to translate..." 
            rows={2}
            value={translateText}
            onChange={(e) => setTranslateText(e.target.value)}
            className={styles.textInput}
            style={{ resize: 'none', height: 'auto' }}
            disabled={isTranslating}
          />
        </div>

        <button 
          type="submit" 
          disabled={isTranslating || !translateText.trim()}
          style={{
            backgroundColor: isTranslating || !translateText.trim() ? 'var(--color-border)' : 'var(--color-pitch-green)',
            color: isTranslating || !translateText.trim() ? 'var(--color-text-secondary)' : '#000000',
            border: 'none',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: isTranslating || !translateText.trim() ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {isTranslating ? 'Translating...' : 'Translate'}
        </button>
      </form>

      {translatedText && (
        <div style={{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }} role="region" aria-live="polite" aria-label="Translation output">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-cyber-teal)', textTransform: 'uppercase' }}>TRANSLATION ({toLang})</span>
            <button 
              onClick={speakTranslation}
              aria-label="Speak translated text out loud"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-pitch-green)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}
            >
              <Volume2 style={{ width: '14px', height: '14px' }} aria-hidden="true" /> Speak
            </button>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', margin: 0, lineHeight: '1.4', fontWeight: 500 }}>
            {translatedText}
          </p>
        </div>
      )}
    </div>
  );
};
