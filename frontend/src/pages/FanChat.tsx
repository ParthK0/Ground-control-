import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { BACKEND_URL } from '../config';

type Language = 'en' | 'es' | 'fr';

const translations = {
  en: {
    welcome: "Welcome to Northgate Stadium! I'm your Matchday Assistant. Ask me about wayfinding, accessibility, or green transport options.",
    chatPlaceholder: "Ask about gates, food, accessibility, or transit...",
    send: "Send",
    mapTitle: "Interactive Venue Map",
    mapSelectZone: "Select a stand or area to query details",
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
    mapSelectZone: "Selecciona una zona para ver detalles",
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
    mapSelectZone: "Sélectionnez une zone pour voir les détails",
    transportTitle: "Comparaison des Transports Verts",
    mode: "Mode de Transport",
    time: "Temps de Trajet",
    emissions: "Impact CO₂",
    disclaimer: "Concept de démonstration fictif pour la Coupe du Monde 2026. Non affilié à la FIFA."
  }
};

const zones = [
  { id: 'z1', name: 'North Stand', capacity: 4000, accessible: true },
  { id: 'z2', name: 'South Stand', capacity: 4000, accessible: true },
  { id: 'z3', name: 'East Plaza', capacity: 2500, accessible: false },
  { id: 'z4', name: 'West Plaza', capacity: 2500, accessible: true },
  { id: 'z5', name: 'Metro Bridge', capacity: 6000, accessible: true },
  { id: 'z6', name: 'Fan Zone', capacity: 3000, accessible: false }
];

// Client-side fallback responses and topic classifier for offline safety
const localFallbackResponses = {
  en: {
    wayfinding: "To navigate Northgate Stadium, refer to the venue map. Gates A & B link to the North & South Stands (z1 & z2), Gate C links to the East Plaza (z3), and Gate D links to the West Plaza (z4). The Metro Transit Bridge is z5 and Retail Row is z6.",
    accessibility: "Northgate Stadium is committed to accessibility. Gates A, B, and D provide fully accessible step-free routes. Note that Gate C (East Plaza / z3) and Retail Row (z6) are steps-only and do not have ramp access.",
    transport: "For eco-friendly transit, we recommend the Metro/transit option (35 min, 1.2 kg CO₂). Walking or biking takes 25–40 min with ~0 kg CO₂. Rideshare options emit 4.5 kg CO₂ (shared) to 8.0 kg CO₂ (private) per round trip.",
    general: "Welcome to GroundControl! I can help you with wayfinding, accessibility info, or transport comparisons for Northgate Stadium. Please ask your question."
  },
  es: {
    wayfinding: "Para navegar por el Estadio Northgate, consulte el mapa. Las Puertas A y B conectan con las Explanadas Norte y Sur (z1 y z2), la Puerta C conecta con la Plaza de la Puerta Este (z3) y la Puerta D con la Plaza de la Puerta Oeste (z4). El Puente del Metro es z5 y la Fila de Tiendas es z6.",
    accessibility: "El Estadio Northgate cuenta con rutas accesibles. Las Puertas A, B y D ofrecen accesos sin escalones. Tenga en cuenta que la Puerta C (Plaza de la Puerta Este / z3) y la Fila de Tiendas (z6) solo tienen escalones y no disponen de rampa.",
    transport: "Para un viaje ecológico, recomendamos el Metro/transporte público (35 min, 1.2 kg de CO₂). Caminar o ir en bicicleta toma 25-40 min con ~0 kg de CO₂. Las opciones de viaje compartido emiten de 4.5 kg a 8.0 kg de CO₂ por viaje de ida y vuelta.",
    general: "¡Bienvenido a GroundControl! Puedo ayudarle con la navegación, accesibilidad o comparación de transporte para el Estadio Northgate. Por favor, haga su consulta."
  },
  fr: {
    wayfinding: "Pour vous déplacer dans le Stade Northgate, consultez le plan. Les Portes A et B relient les halls Nord et Sud (z1 et z2), la Porte C relie l'Esplanade de la Porte Est (z3) et la Porte D relie l'Esplanade de la Porte Ouest (z4). Le pont de transit du métro est z5 et la rangée des magasins est z6.",
    accessibility: "Le Stade Northgate est accessible. Les Portes A, B et D proposent des itinéraires sans marches. Attention: la Porte C (Esplanade Est / z3) et la rangée des magasins (z6) ne disposent pas de rampe d'accès.",
    transport: "Pour un trajet écologique, nous recommandons le Métro/transport (35 min, 1.2 kg CO₂). La marche ou le vélo prend 25–40 min avec ~0 kg CO₂. Les trajets partagés ou privés en voiture émettent de 4.5 kg à 8.0 kg CO₂.",
    general: "Bienvenue sur GroundControl ! Je peux vous aider pour le guidage, l'accessibilité ou la comparaison des transports au Stade Northgate. Posez-moi votre question."
  }
};

const classifyLocalTopic = (message: string): 'wayfinding' | 'accessibility' | 'transport' | 'general' => {
  const msg = message.toLowerCase();
  
  const accKeywords = [
    "access", "wheelchair", "step-free", "ramp", "disability", "disabl", "handicap", "elevator", "lift", 
    "accessible", "wheel", "chair", "stepless", "stairs", "silla de ruedas", "rampa", "ascensor", 
    "elevador", "escalones", "fauteuil roulant", "rampe", "ascenseur", "escalier", "step"
  ];
  if (accKeywords.some(k => msg.includes(k))) return "accessibility";
  
  const transKeywords = [
    "metro", "bus", "train", "transit", "ride", "taxi", "uber", "lyft", "drive", "car", "co2", "emission", 
    "green", "transport", "bike", "walk", "emissions", "eco", "autobús", "tránsito", "viaje", "coche", 
    "bici", "caminar", "métro", "voiture", "émissions", "vélo", "marcher", "eco-transport"
  ];
  if (transKeywords.some(k => msg.includes(k))) return "transport";
  
  const wayKeywords = [
    "gate", "zone", "concourse", "plaza", "bridge", "find", "where", "how to get", "route", "direction", 
    "map", "seating", "seat", "block", "located", "locate", "puerta", "mapa", "dirección", "dónde", 
    "asiento", "porte", "carte", "où", "siège"
  ];
  if (wayKeywords.some(k => msg.includes(k))) return "wayfinding";
  
  return "general";
};

// Generic Football Icons - scoreboard matchday theme
const SoccerBallIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={{ width: '18px', height: '18px', ...style }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

const WhistleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={{ width: '18px', height: '18px', ...style }}>
    <path d="M9 5h6v4h-6z" />
    <path d="M15 7h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4" />
    <path d="M3 13a4 4 0 0 0 6 3.46V9H3a4 4 0 0 0 0 4z" />
    <path d="M9 13h6" />
  </svg>
);

const FloodlightIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={{ width: '18px', height: '18px', ...style }}>
    <path d="M8 22l2-14M16 22l-2-14" />
    <path d="M10 8h4v4h-4z" />
    <circle cx="9" cy="5" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="15" cy="5" r="1" />
    <path d="M6 6h12v2H6z" />
  </svg>
);

const TurnstileIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={{ width: '18px', height: '18px', ...style }}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 12h18" />
    <path d="M12 3v18" />
    <circle cx="12" cy="12" r="3" fill="var(--color-base-bg)" />
  </svg>
);

export const FanChat: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; topic?: string }>>([
    { sender: 'assistant', text: translations['en'].welcome }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transportCompare, setTransportCompare] = useState<{
    illustrative: boolean;
    options: Array<{ mode: string; estTime: string; estCO2: string }>;
  } | null>(null);

  useEffect(() => {
    const fetchTransportOptions = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/transport-compare`);
        if (response.ok) {
          const data = await response.ok ? await response.json() : null;
          if (data) setTransportCompare(data);
        }
      } catch (err) {
        console.error("Failed to fetch transport comparison options:", err);
      }
    };
    fetchTransportOptions();
  }, []);

  useEffect(() => {
    const welcomeText = translations[lang].welcome;
    if (messages.length === 1 && messages[0].sender === 'assistant') {
      setMessages([{ sender: 'assistant', text: welcomeText }]);
    }
  }, [lang, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText;
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          language: lang,
          selectedZoneId: selectedZone || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'assistant', text: data.answer, topic: data.topic }]);
    } catch (err) {
      console.error("Chat request failed:", err);
      const matchedTopic = classifyLocalTopic(userMessage);
      const fallbackText = localFallbackResponses[lang][matchedTopic];
      setMessages(prev => [...prev, { sender: 'assistant', text: fallbackText, topic: matchedTopic }]);
    } finally {
      setIsLoading(false);
    }
  };

  const t = translations[lang];

  return (
    <div className="pitch-bg" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      fontFamily: 'var(--font-primary)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        gap: '12px',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WhistleIcon style={{ color: 'var(--color-pitch-green)' }} />
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
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }} className="desktop-only">
          Northgate Stadium Fan Copilot
        </span>
      </div>

      <div className="fan-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.5fr',
        gap: '24px',
        padding: '24px',
        flex: 1,
        overflow: 'hidden',
        zIndex: 2
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowY: 'auto'
        }} className="fan-side-panel">
          
          <div className="floodlight-card">
            <h2 style={{
              fontSize: '18px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '16px',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FloodlightIcon style={{ color: 'var(--color-pitch-green)' }} />
              {t.mapTitle}
            </h2>
            
            <div style={{
              backgroundColor: 'var(--color-base-bg)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <svg viewBox="0 0 400 300" style={{ width: '100%', maxHeight: '220px' }} aria-label="Northgate Stadium Venue Zones Map">
                {/* Stadium Center Green Pitch */}
                <rect x="130" y="105" width="140" height="90" rx="4" fill="#0f4625" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                <circle cx="200" cy="150" r="18" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                <line x1="200" y1="105" x2="200" y2="195" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                <rect x="130" y="130" width="16" height="40" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
                <rect x="254" y="130" width="16" height="40" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />

                {/* North Stand Stand/Zone (z1) */}
                <path 
                  d="M 100 45 L 300 45 L 260 90 L 140 90 Z" 
                  fill={selectedZone === 'z1' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.03)'} 
                  stroke={selectedZone === 'z1' ? 'var(--color-pitch-green)' : 'var(--color-border)'} 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedZone('z1')}
                />
                <text x="200" y="70" fill="var(--color-text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  North Stand
                </text>

                {/* South Stand Stand/Zone (z2) */}
                <path 
                  d="M 100 255 L 300 255 L 260 210 L 140 210 Z" 
                  fill={selectedZone === 'z2' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.03)'} 
                  stroke={selectedZone === 'z2' ? 'var(--color-pitch-green)' : 'var(--color-border)'} 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedZone('z2')}
                />
                <text x="200" y="238" fill="var(--color-text-primary)" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  South Stand
                </text>

                {/* East Plaza Zone (z3) */}
                <path 
                  d="M 280 95 L 350 70 L 350 230 L 280 205 Z" 
                  fill={selectedZone === 'z3' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.03)'} 
                  stroke={selectedZone === 'z3' ? 'var(--color-pitch-green)' : 'var(--color-border)'} 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedZone('z3')}
                />
                <text x="318" y="153" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  East Plaza
                </text>

                {/* West Plaza Zone (z4) */}
                <path 
                  d="M 120 95 L 50 70 L 50 230 L 120 205 Z" 
                  fill={selectedZone === 'z4' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.03)'} 
                  stroke={selectedZone === 'z4' ? 'var(--color-pitch-green)' : 'var(--color-border)'} 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedZone('z4')}
                />
                <text x="82" y="153" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  West Plaza
                </text>

                {/* Metro Transit Bridge (z5) */}
                <path 
                  d="M 15 20 L 95 20 L 105 45 L 25 45 Z" 
                  fill={selectedZone === 'z5' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.03)'} 
                  stroke={selectedZone === 'z5' ? 'var(--color-pitch-green)' : 'var(--color-border)'} 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedZone('z5')}
                />
                <text x="58" y="36" fill="var(--color-text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Metro Bridge
                </text>

                {/* Fan Zone / Retail Row (z6) */}
                <path 
                  d="M 305 255 L 385 255 L 375 280 L 295 280 Z" 
                  fill={selectedZone === 'z6' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(0, 230, 118, 0.03)'} 
                  stroke={selectedZone === 'z6' ? 'var(--color-pitch-green)' : 'var(--color-border)'} 
                  strokeWidth="2" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedZone('z6')}
                />
                <text x="340" y="271" fill="var(--color-text-primary)" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Fan Zone
                </text>
              </svg>
            </div>

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
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{z?.name}</span>
                        <span style={{ color: z?.accessible ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)', fontSize: '12px' }}>
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

          <div className="floodlight-card">
            <h2 style={{
              fontSize: '18px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '16px',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <SoccerBallIcon style={{ color: 'var(--color-pitch-green)' }} />
              {t.transportTitle}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(transportCompare?.options || []).map((opt, i) => {
                const co2Val = parseFloat(opt.estCO2.replace(/[^0-9.]/g, '')) || 0;
                const isEco = co2Val <= 1.5;
                const isWarning = co2Val > 1.5 && co2Val <= 5.0;
                
                const badgeColor = isEco 
                  ? 'var(--color-pitch-green)' 
                  : isWarning 
                  ? 'var(--color-state-warning)' 
                  : 'var(--color-state-critical)';
                const badgeBg = isEco 
                  ? 'rgba(0, 230, 118, 0.1)' 
                  : isWarning 
                  ? 'rgba(245, 158, 11, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)';
                const badgeBorder = isEco 
                  ? 'rgba(0, 230, 118, 0.2)' 
                  : isWarning 
                  ? 'rgba(245, 158, 11, 0.2)' 
                  : 'rgba(239, 68, 68, 0.2)';

                return (
                  <div key={i} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{opt.mode}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Travel Time: {opt.estTime}</span>
                    </div>
                    
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      color: badgeColor,
                      backgroundColor: badgeBg,
                      border: `1px solid ${badgeBorder}`
                    }}>
                      {opt.estCO2} CO₂
                    </span>
                  </div>
                );
              })}

              {transportCompare?.illustrative && (
                <div style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  color: 'var(--color-state-warning)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginTop: '4px',
                  lineHeight: '1.4'
                }}>
                  ⚠️ <strong>Transparency Notice:</strong> This card uses illustrative carbon footprint estimates for environmental awareness demonstration, not live route computation.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }} className="floodlight-card fan-chat-panel">
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <TurnstileIcon style={{ color: 'var(--color-pitch-green)' }} />
            <span style={{ fontWeight: 800, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Copilot Chat Assistant</span>
          </div>

          <div style={{
            flex: 1,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? 'var(--color-base-bg)' : 'var(--color-surface-elevated)',
                  border: msg.sender === 'user' ? '1px solid var(--color-pitch-green)' : '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                  padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  maxWidth: '85%',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {msg.text}
                {msg.topic && (
                  <span style={{
                    display: 'block',
                    fontSize: '9px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Topic: {msg.topic}
                  </span>
                )}
              </div>
            ))}
            {isLoading && (
              <div style={{
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
                animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <span className="dot-flashing"></span>
                <span>Thinking...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-elevated)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder={t.chatPlaceholder} 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
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
                disabled={isLoading}
              />
              <button 
                type="submit" 
                style={{
                  backgroundColor: inputText.trim() && !isLoading ? 'var(--color-pitch-green)' : 'var(--color-border)',
                  color: inputText.trim() && !isLoading ? '#040810' : 'var(--color-text-secondary)',
                  border: 'none',
                  borderRadius: '8px',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                disabled={!inputText.trim() || isLoading}
              >
                <Send style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--color-pitch-green);
          color: var(--color-pitch-green);
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: .5s;
          display: inline-block;
          margin: 0 10px;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--color-pitch-green);
          color: var(--color-pitch-green);
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--color-pitch-green);
          color: var(--color-pitch-green);
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: 1s;
        }
        @keyframes dotFlashing {
          0% {
            background-color: var(--color-pitch-green);
          }
          50%, 100% {
            background-color: rgba(0, 230, 118, 0.2);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 767px) {
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
