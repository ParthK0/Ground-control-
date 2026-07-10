import React, { useState, useEffect } from 'react';
import { Send, MapPin, Navigation, Globe, HelpCircle } from 'lucide-react';
import { BACKEND_URL } from '../config';

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

// Client-side fallback responses and topic classifier for offline safety
const localFallbackResponses = {
  en: {
    wayfinding: "To navigate Northgate Stadium, refer to the venue map. Gates A & B link to the North & South Concourses (z1 & z2), Gate C links to the East Gate Plaza (z3), and Gate D links to the West Gate Plaza (z4). The Metro Transit Bridge is z5 and Retail Row is z6.",
    accessibility: "Northgate Stadium is committed to accessibility. Gates A, B, and D provide fully accessible step-free routes. Note that Gate C (East Gate Plaza / z3) and Retail Row (z6) are steps-only and do not have ramp access.",
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

export const FanChat: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant', text: string, topic?: string }>>([
    { sender: 'assistant', text: translations['en'].welcome }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'assistant') {
      setMessages([{ sender: 'assistant', text: t.welcome }]);
    }
  }, [lang]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      backgroundColor: 'var(--color-base-bg)',
      fontFamily: 'var(--font-primary)'
    }}>
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

      <div className="fan-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.5fr',
        gap: '24px',
        padding: '24px',
        flex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowY: 'auto'
        }} className="fan-side-panel">
          
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
                <rect x="140" y="100" width="120" height="100" rx="8" fill="rgba(0, 230, 118, 0.05)" stroke="rgba(0, 230, 118, 0.2)" strokeWidth="2" strokeDasharray="3" />
                <circle cx="200" cy="150" r="24" fill="none" stroke="rgba(0, 230, 118, 0.15)" strokeWidth="2" />
                
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

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          overflow: 'hidden'
        }} className="fan-chat-panel">
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
                  lineHeight: 1.5
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
                gap: '8px'
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
