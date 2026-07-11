import React from 'react';
import { Volume2 } from 'lucide-react';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  topic?: string;
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  accessibilityNeeded: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  teamAccent: string;
  inputText: string;
  setInputText: (v: string) => void;
  isListening: boolean;
  onSend: (text: string) => void;
  onVoiceInput: () => void;
  onSpeak: (text: string) => void;
  placeholder: string;
}

/**
 * ChatWindow — renders the scrollable message list and the input bar.
 * Extracted from FanChat.tsx to keep each file focused on a single UI concern.
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  accessibilityNeeded,
  chatContainerRef,
  teamAccent,
  inputText,
  setInputText,
  isListening,
  onSend,
  onVoiceInput,
  onSpeak,
  placeholder,
}) => {
  return (
    <div
      style={{
        maxWidth: '750px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--color-surface-elevated)',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
          Copilot Conversation
        </span>
        {accessibilityNeeded && (
          <span style={{ fontSize: '10px', color: 'var(--color-cyber-teal)', fontWeight: 700 }}>
            ♿ Step-free routes enabled
          </span>
        )}
      </div>

      {/* Message list */}
      <div
        ref={chatContainerRef}
        role="log"
        aria-live="polite"
        aria-label="Copilot conversation"
        style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          minHeight: '350px',
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor:
                msg.sender === 'user' ? 'var(--team-accent-bg)' : 'var(--color-surface-elevated)',
              border: '1px solid',
              borderColor: msg.sender === 'user' ? teamAccent : 'var(--color-border)',
              padding: '12px 16px',
              borderRadius: msg.sender === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              maxWidth: '85%',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <div>{msg.text}</div>
            {msg.sender === 'assistant' && (
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => onSpeak(msg.text)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: teamAccent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: 0,
                  }}
                  title="Read aloud"
                  aria-label="Read this message aloud"
                >
                  <Volume2 style={{ width: '12px', height: '12px' }} />
                  Speak
                </button>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              padding: '12px 16px',
              borderRadius: '12px 12px 12px 4px',
              maxWidth: '85%',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            aria-live="polite"
            aria-label="Copilot is thinking"
          >
            <span className="dot-flashing" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (inputText.trim()) {
            onSend(inputText);
            setInputText('');
          }
        }}
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-elevated)',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder={placeholder}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            aria-label="Chat with copilot"
            style={{
              flex: 1,
              backgroundColor: 'var(--color-base-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: '#FFF',
              padding: '12px 16px',
              fontSize: '14px',
              outline: 'none',
            }}
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={onVoiceInput}
            aria-label={isListening ? 'Listening...' : 'Push to talk'}
            style={{
              backgroundColor: isListening
                ? 'var(--color-state-critical)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isListening ? '#FFF' : 'var(--color-text-primary)',
            }}
          >
            🎙️
          </button>

          <button
            type="submit"
            aria-label="Send message"
            style={{
              backgroundColor:
                inputText.trim() && !isLoading ? teamAccent : 'var(--color-border)',
              color:
                inputText.trim() && !isLoading ? '#040810' : 'var(--color-text-secondary)',
              border: 'none',
              borderRadius: '8px',
              width: '46px',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
            disabled={!inputText.trim() || isLoading}
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};
