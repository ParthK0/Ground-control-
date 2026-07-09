import React, { useState } from 'react';
import { Send, MapPin, Navigation, Globe, HelpCircle } from 'lucide-react';

type Language = 'en' | 'es' | 'fr';

const translations = {
  en: {
    welcome: "Welcome to Northgate Stadium! I'm your Matchday Assistant. Ask me about wayfinding, accessibility, or green transport options.",
    chatPlaceholder: "Ask about gates, food, accessibility, or transit...",
    send: "Send",
    mapTitle: "Interactive Venue Map",
    mapSelectZone: "Select a zone to query details (Scaffold mode)",
    transportTitle: "Eco-Transport Comparison",
    mode: "Transport Mode",
    time: "Travel Time",
    emissions: "CO₂ Impact",
    disclaimer: "Fictional concept for 2026 World Cup matchday demonstration. Not affiliated with FIFA."
  },
  es: {
    welcome: "¡Bienvenido al Estadio Northgate! Soy tu asistente. Pregúntame sobre rutas, accesibilidad o transporte ecológico.",
    chatPlaceholder: "Pregunta sobre accesos, comida, accesibilidad o transporte...",
    send: "Enviar",
    mapTitle: "Mapa Interactivo del Estadio",
    mapSelectZone: "Selecciona una zona (Modo de andamiaje)",
    transportTitle: "Comparación de Transporte Ecológico",
    mode: "Modo de Transporte",
    time: "Tiempo de Viaje",
    emissions: "Impacto CO₂",
    disclaimer: "Concepto de demostración ficticio para la Copa del Mundo 2026. No afiliado a FIFA."
  },
  fr: {
    welcome: "Bienvenue au Stade Northgate! Je suis votre assistant de match. Posez-moi des questions sur les itinéraires, l'accessibilité ou le transport vert.",
    chatPlaceholder: "Posez des questions sur les portes, la nourriture, l'accessibilité...",
    send: "Envoyer",
    mapTitle: "Carte Interactive du Stade",
    mapSelectZone: "Sélectionnez une zone (Mode d'échafaudage)",
    transportTitle: "Comparaison des Transports Verts",
    mode: "Mode de Transport",
    time: "Temps de Trajet",
    emissions: "Impact CO₂",
    disclaimer: "Concept de démonstration fictif pour la Coupe du Monde 2026. Non affilié à la FIFA."
  }
};

const zones = [
  { id: 'z1', name: 'North Concourse', capacity: 4000, accessible: true },
  { id: 'z2', name: 'South Concourse', capacity: 4000, accessible: true },
  { id: 'z3', name: 'East Gate Plaza', capacity: 2500, accessible: false },
  { id: 'z4', name: 'West Gate Plaza', capacity: 2500, accessible: true },
  { id: 'z5', name: 'Metro Transit Bridge', capacity: 6000, accessible: true },
  { id: 'z6', name: 'Fan Zone / Retail Row', capacity: 3000, accessible: false }
];

const transportOptions = [
  { mode: 'Metro / Transit', time: '35 min', co2: '1.2 kg', isGreen: true },
  { mode: 'Rideshare (Shared)', time: '20 min', co2: '4.5 kg', isGreen: false },
  { mode: 'Rideshare (Private)', time: '18 min', co2: '8.0 kg', isGreen: false },
  { mode: 'Walking / Biking', time: '25–40 min', co2: '0.0 kg', isGreen: true }
];

export const FanChat: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const t = translations[lang];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: 'var(--color-base-bg)',
      fontFamily: 'var(--font-primary)'
    }}>
      {/* Subheader Language Control */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select Language:</span>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Language)}
            style={{
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              color: 'var(--color-text-primary)',
              padding: '4px 8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            aria-label="Language Selector"
          >
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="fr">Français (FR)</option>
          </select>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }} className="desktop-only">
          Northgate Stadium Fan Copilot
        </span>
      </div>

      {/* Main Split Grid (Responsive Layout) */}
      <div className="fan-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.5fr',
        gap: '24px',
        padding: '24px',
        flex: 1,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Map & Transport info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowY: 'auto'
        }} className="fan-side-panel">
          
          {/* Static SVG Venue Map */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '16px',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin style={{ width: '18px', height: '18px', color: 'var(--color-pitch-green)' }} />
              {t.mapTitle}
            </h2>
            
            {/* SVG Visual Representation */}
            <div style={{
              backgroundColor: 'var(--color-surface-elevated)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <svg viewBox="0 0 400 300" style={{ width: '100%', maxHeight: '220px' }} aria-label="Northgate Stadium Venue Zones Map">
                {/* Stadium Center Pitch Representation */}
                <rect x="140" y="100" width="120" height="100" rx="8" fill="rgba(0, 230, 118, 0.05)" stroke="rgba(0, 230, 118, 0.2)" strokeWidth="2" strokeDasharray="3" />
                <circle cx="200" cy="150" r="24" fill="none" stroke="rgba(0, 230, 118, 0.15)" strokeWidth="2" />
                
                {/* Zone 1: North Concourse */}
                <path 
                  d="M 100 60 L 300 60 L 270 90 L 130 90 Z" 
                  fill={selectedZone === 'z1' ? 'rgba(0, 230, 118, 0.15)' : 'transparent'} 
                  stroke="var(--color-border)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone('z1')}
                />
                <text x="200" y="78" fill="var(--color-text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                  North Concourse (z1)
                </text>

                {/* Zone 2: South Concourse */}
                <path 
                  d="M 100 240 L 300 240 L 270 210 L 130 210 Z" 
                  fill={selectedZone === 'z2' ? 'rgba(0, 230, 118, 0.15)' : 'transparent'} 
                  stroke="var(--color-border)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone('z2')}
                />
                <text x="200" y="228" fill="var(--color-text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                  South Concourse (z2)
                </text>

                {/* Zone 3: East Gate Plaza */}
                <path 
                  d="M 280 100 L 340 70 L 340 230 L 280 200 Z" 
                  fill={selectedZone === 'z3' ? 'rgba(0, 230, 118, 0.15)' : 'transparent'} 
                  stroke="var(--color-border)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone('z3')}
                />
                <text x="310" y="150" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(90 310 150)" pointerEvents="none">
                  East Gate (z3)
                </text>

                {/* Zone 4: West Gate Plaza */}
                <path 
                  d="M 120 100 L 60 70 L 60 230 L 120 200 Z" 
                  fill={selectedZone === 'z4' ? 'rgba(0, 230, 118, 0.15)' : 'transparent'} 
                  stroke="var(--color-border)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone('z4')}
                />
                <text x="90" y="150" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(-90 90 150)" pointerEvents="none">
                  West Gate (z4)
                </text>

                {/* Zone 5: Metro Transit Bridge */}
                <rect 
                  x="20" y="20" width="100" height="28" rx="4" 
                  fill={selectedZone === 'z5' ? 'rgba(0, 230, 118, 0.15)' : 'transparent'} 
                  stroke="var(--color-border)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone('z5')}
                />
                <text x="70" y="37" fill="var(--color-text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                  Metro Bridge (z5)
                </text>

                {/* Zone 6: Fan Zone / Retail Row */}
                <rect 
                  x="280" y="255" width="100" height="28" rx="4" 
                  fill={selectedZone === 'z6' ? 'rgba(0, 230, 118, 0.15)' : 'transparent'} 
                  stroke="var(--color-border)" 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedZone('z6')}
                />
                <text x="330" y="272" fill="var(--color-text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none">
                  Fan Zone (z6)
                </text>
              </svg>
            </div>

            {/* Selected Zone Spec */}
            <div style={{ marginTop: '12px', fontSize: '13px' }}>
              {selectedZone ? (
                (() => {
                  const z = zones.find(item => item.id === selectedZone);
                  return (
                    <div style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      padding: '12px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>{z?.name}</span>
                        <span style={{ color: z?.accessible ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)' }}>
                          {z?.accessible ? '♿ Accessible Route' : 'Steps Only'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Capacity Limit: {z?.capacity} occupants
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '12px', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                  {t.mapSelectZone}
                </div>
              )}
            </div>
          </div>

          {/* Transport Comparison */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '16px',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Navigation style={{ width: '18px', height: '18px', color: 'var(--color-pitch-green)' }} />
              {t.transportTitle}
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)' }}>{t.mode}</th>
                    <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)' }}>{t.time}</th>
                    <th style={{ padding: '8px 4px', color: 'var(--color-text-secondary)' }}>{t.emissions}</th>
                  </tr>
                </thead>
                <tbody>
                  {transportOptions.map((opt, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{opt.mode}</span>
                        {opt.isGreen && (
                          <span style={{
                            fontSize: '9px',
                            backgroundColor: 'rgba(0, 230, 118, 0.1)',
                            color: 'var(--color-pitch-green)',
                            border: '1px solid rgba(0, 230, 118, 0.2)',
                            padding: '2px 4px',
                            borderRadius: '4px'
                          }}>ECO</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 4px' }}>{opt.time}</td>
                      <td style={{ padding: '8px 4px', color: opt.isGreen ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)', fontWeight: 600 }}>{opt.co2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Empty Chat Shell */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden'
        }} className="fan-chat-panel">
          {/* Chat Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <HelpCircle style={{ width: '18px', height: '18px', color: 'var(--color-pitch-green)' }} />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Copilot Chat Assistant</span>
          </div>

          {/* Static Message Area */}
          <div style={{
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}>
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              padding: '12px 16px',
              borderRadius: '12px 12px 12px 4px',
              maxWidth: '85%',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {t.welcome}
            </div>
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '1px solid var(--color-border)',
              padding: '8px 12px',
              borderRadius: '8px',
              maxWidth: '85%',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic'
            }}>
              Notice: Backend integrations are not configured. The input below is static.
            </div>
          </div>

          {/* Chat Input Shell */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder={t.chatPlaceholder} 
                style={{
                  flex: 1,
                  backgroundColor: 'var(--color-base-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-text-primary)',
                  padding: '12px 16px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                disabled
              />
              <button 
                type="button" 
                style={{
                  backgroundColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed'
                }}
                disabled
              >
                <Send style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Media query stylesheet specifically for fan layout responsiveness */}
      <style>{`
        @media (max-width: 868px) {
          .fan-grid {
            grid-template-columns: 1fr !important;
            overflow-y: auto !important;
            padding: 16px !important;
            gap: 16px !important;
          }
          .fan-side-panel {
            overflow-y: visible !important;
          }
          .fan-chat-panel {
            height: 380px !important;
          }
        }
      `}</style>
    </div>
  );
};
