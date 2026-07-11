import React, { useState, useEffect, useRef } from 'react';
import { Send, Volume2, Mic, Compass } from 'lucide-react';
import { BACKEND_URL } from '../config';

type Language = 'en' | 'es' | 'fr';
type ViewType = 'home' | 'chat' | 'map' | 'transit' | 'trip';

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
  const accKeywords = ["access", "wheelchair", "step-free", "ramp", "disability", "elevator", "lift", "accessible", "silla de ruedas", "rampe", "ascenseur", "step"];
  if (accKeywords.some(k => msg.includes(k))) return "accessibility";
  const transKeywords = ["metro", "bus", "train", "transit", "taxi", "uber", "co2", "emission", "green", "transport", "bike", "walk", "bici", "coche", "marcher", "eco-transport"];
  if (transKeywords.some(k => msg.includes(k))) return "transport";
  const wayKeywords = ["gate", "zone", "concourse", "plaza", "bridge", "find", "where", "how to get", "route", "direction", "map", "seating", "seat", "block", "puerta", "porte", "siège"];
  if (wayKeywords.some(k => msg.includes(k))) return "wayfinding";
  return "general";
};

export const FanChat: React.FC = () => {
  const [hasOnboarded, setHasOnboarded] = useState(() => localStorage.getItem('gc-onboarded') === 'true');
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('gc-lang') as Language) || 'en');
  const [accessibilityNeeded, setAccessibilityNeeded] = useState(() => localStorage.getItem('gc-acc') === 'true');
  const [teamColor, setTeamColor] = useState(() => localStorage.getItem('gc-team-color') || '#00E676');
  
  const [view, setView] = useState<ViewType>('home');
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; topic?: string }>>([
    { sender: 'assistant', text: translations[lang].welcome }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const [transportCompare, setTransportCompare] = useState<{
    illustrative: boolean;
    options: Array<{ mode: string; estTime: string; estCO2: string }>;
    reasoning?: string | null;
  } | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize CSS variables when team color updates
  useEffect(() => {
    document.documentElement.style.setProperty('--team-accent', teamColor);
    document.documentElement.style.setProperty('--team-accent-bg', teamColor + '15');
    localStorage.setItem('gc-team-color', teamColor);
  }, [teamColor]);

  useEffect(() => {
    localStorage.setItem('gc-lang', lang);
    localStorage.setItem('gc-acc', accessibilityNeeded ? 'true' : 'false');
  }, [lang, accessibilityNeeded]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const fetchTransportOptions = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/transport-compare`);
        if (response.ok) {
          const data = await response.json();
          if (data) setTransportCompare(data);
        }
      } catch (err) {
        console.error("Failed to fetch transport comparison options:", err);
      }
    };
    fetchTransportOptions();
  }, []);

  // Update initial welcome message if language changes
  useEffect(() => {
    const welcomeText = translations[lang].welcome;
    if (messages.length === 1 && messages[0].sender === 'assistant' && messages[0].text !== welcomeText) {
      setMessages([{ sender: 'assistant', text: welcomeText }]);
    }
  }, [lang]);

  const speakMessage = (text: string) => {
    if (!text) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SynthesisUtterance(text);
      const langMap: Record<Language, string> = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR'
      };
      utterance.lang = langMap[lang] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper for voice speak
  const SynthesisUtterance = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setIsLoading(true);

    if (isOffline) {
      // Offline fallback
      setTimeout(() => {
        const matchedTopic = classifyLocalTopic(textToSend);
        const fallbackText = localFallbackResponses[lang][matchedTopic];
        setMessages(prev => [...prev, { sender: 'assistant', text: fallbackText, topic: matchedTopic }]);
        setIsLoading(false);
      }, 700);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: lang,
          selectedZoneId: selectedZone || undefined
        })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'assistant', text: data.answer, topic: data.topic }]);
    } catch (err) {
      console.error("Chat request failed:", err);
      const matchedTopic = classifyLocalTopic(textToSend);
      const fallbackText = localFallbackResponses[lang][matchedTopic];
      setMessages(prev => [...prev, { sender: 'assistant', text: fallbackText, topic: matchedTopic }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = lang === 'es' ? 'es-MX' : lang === 'fr' ? 'fr-FR' : 'en-US';
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };
      rec.onerror = () => {
        setIsListening(false);
        simulateVoiceInput();
      };
      rec.start();
    } else {
      simulateVoiceInput();
    }
  };

  const simulateVoiceInput = () => {
    setIsListening(true);
    const mockQueries = [
      "Where is the nearest wheelchair step-free restroom?",
      "Which gate connects to the North Stand?",
      "What is the fastest sustainable transit option?",
      "Is Gate C ramp accessible?"
    ];
    const query = mockQueries[Math.floor(Math.random() * mockQueries.length)];
    let idx = 0;
    const interval = setInterval(() => {
      setInputText(query.substring(0, idx + 1));
      idx++;
      if (idx >= query.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          setInputText('');
          handleSend(query);
        }, 600);
      }
    }, 45);
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gc-onboarded', 'true');
    setHasOnboarded(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('gc-onboarded');
    setHasOnboarded(false);
    setView('home');
  };

  const t = translations[lang];

  // 1. Onboarding Screen
  if (!hasOnboarded) {
    return (
      <div className="pitch-bg" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        minHeight: '80vh'
      }}>
        <form onSubmit={handleOnboardSubmit} className="broadcast-card" style={{
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--team-accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Setup Copilot Profile
            </span>
            <h1 style={{ fontSize: '28px', textTransform: 'uppercase', marginTop: '8px' }}>Welcome Fan</h1>
          </div>

          {/* Lang */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Preferred Language
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: '#FFF',
                padding: '12px',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
              <option value="fr">Français (FR)</option>
            </select>
          </div>

          {/* Color theme */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Personalize Team Colors
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {[
                { name: 'Neutral', value: '#00E676' },
                { name: 'Red', value: '#EF4444' },
                { name: 'Blue', value: '#2563EB' },
                { name: 'Gold', value: '#F59E0B' }
              ].map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setTeamColor(c.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: teamColor === c.value ? `2px solid ${c.value}` : '1px solid var(--color-border)',
                    padding: '8px',
                    borderRadius: '6px',
                    color: teamColor === c.value ? c.value : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c.value }} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Acc */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={accessibilityNeeded}
              onChange={(e) => setAccessibilityNeeded(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: 700 }}>Require Step-Free Access</span>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)' }}>Filters routes for wheelchair/stroller compatibility</span>
            </div>
          </label>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            <span>Launch Copilot</span>
            <Compass style={{ width: '18px', height: '18px' }} />
          </button>
        </form>
      </div>
    );
  }

  // 2. Simple Mode layout
  if (isSimpleMode) {
    return (
      <div className="pitch-bg" style={{ padding: '24px', minHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toggle back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--team-accent)' }}>♿ ACCESSIBILITY SIMPLE MODE</span>
          <button
            onClick={() => setIsSimpleMode(false)}
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              backgroundColor: 'var(--color-surface-elevated)',
              border: '2px solid var(--color-border)',
              borderRadius: '8px',
              color: '#FFF',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Exit Simple Mode
          </button>
        </div>

        {/* Big Touch Targets */}
        <div className="broadcast-card" style={{ padding: '32px', textAlign: 'center', borderTopColor: 'var(--team-accent)' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Your Gate</h1>
          <div style={{ fontSize: '72px', fontWeight: 800, color: '#FFF', fontFamily: 'var(--font-display)', margin: '12px 0' }}>
            GATE A
          </div>
          <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>
            Fully step-free accessible entrance. Located on the North side of the stadium.
          </p>
        </div>

        <div className="broadcast-card" style={{ padding: '32px', textAlign: 'center', borderTopColor: 'var(--team-accent)' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Your Seating Block</h1>
          <div style={{ fontSize: '72px', fontWeight: 800, color: '#FFF', fontFamily: 'var(--font-display)', margin: '12px 0' }}>
            BLOCK 102
          </div>
          <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>
            North Stand lower level. Elevator access available next to Gate A entrance.
          </p>
        </div>

        <div className="broadcast-card" style={{ padding: '32px', textAlign: 'center', borderTopColor: 'var(--team-accent)' }}>
          <h1 style={{ fontSize: '32px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Nearest Accessible Restroom</h1>
          <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--color-cyber-teal)', fontFamily: 'var(--font-display)', margin: '12px 0' }}>
            45 METERS AWAY
          </div>
          <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>
            Follow the main corridor right. Fully step-free, equipped with wide doors and assistance alarms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pitch-bg" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      fontFamily: 'var(--font-primary)'
    }}>
      {/* Top App Bar */}
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
        {/* Left Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsSimpleMode(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '6px',
              color: 'var(--color-cyber-teal)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ♿ Simple Mode
          </button>

          {/* Caching Mode Toggle */}
          <button
            onClick={() => setIsOffline(!isOffline)}
            style={{
              padding: '6px 12px',
              backgroundColor: isOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 230, 118, 0.1)',
              border: isOffline ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(0, 230, 118, 0.2)',
              borderRadius: '6px',
              color: isOffline ? 'var(--color-state-critical)' : 'var(--color-pitch-green)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{isOffline ? '📴 Offline Cached' : '📶 Online PWA'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {([
            { id: 'home', label: '🏠 Home' },
            { id: 'chat', label: '💬 Copilot' },
            { id: 'map', label: '🏟️ Stadium Map' },
            { id: 'transit', label: '🌿 Transit' },
            { id: 'trip', label: '💼 My Trip' }
          ] as const).map(tView => (
            <button
              key={tView.id}
              onClick={() => setView(tView.id)}
              style={{
                backgroundColor: view === tView.id ? 'var(--team-accent-bg)' : 'transparent',
                border: '1px solid',
                borderColor: view === tView.id ? 'var(--team-accent)' : 'transparent',
                borderRadius: '6px',
                color: view === tView.id ? 'var(--team-accent)' : 'var(--color-text-secondary)',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {tView.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Screen Content */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        
        {/* A. HOME VIEW */}
        {view === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Live Broadcast-style Banner */}
            <div className="broadcast-alert" style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <span style={{
                  backgroundColor: 'var(--color-state-critical)',
                  color: '#FFF',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginRight: '8px',
                  textTransform: 'uppercase'
                }}>LIVE ALERT</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>
                  High crowd congestion detected on East Transit Bridge. Reroute via West Plaza.
                </span>
              </div>
            </div>

            {/* Match Fixture details */}
            <div className="broadcast-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 800 }}>
                  Northgate Stadium • Today's Match
                </span>
                <span className="breathing-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--team-accent)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>MEX</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>MEXICO</div>
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  padding: '4px 16px',
                  borderRadius: '4px',
                  color: 'var(--color-cyber-teal)'
                }}>
                  18:00
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>ARG</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>ARGENTINA</div>
                </div>
              </div>
            </div>

            {/* Quick Action Pillars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <button
                onClick={() => setView('chat')}
                className="broadcast-card"
                style={{
                  padding: '24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderTopColor: 'var(--team-accent)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>💬</div>
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: '#FFF' }}>Matchday Copilot</h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Ask questions about gates, food, and accessible routes.
                </p>
              </button>

              <button
                onClick={() => setView('map')}
                className="broadcast-card"
                style={{
                  padding: '24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderTopColor: 'var(--team-accent)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🏟️</div>
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: '#FFF' }}>Interactive Map</h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  View stadium stands and monitor real-time congestion.
                </p>
              </button>

              <button
                onClick={() => setView('transit')}
                className="broadcast-card"
                style={{
                  padding: '24px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderTopColor: 'var(--team-accent)'
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>🌿</div>
                <h3 style={{ fontSize: '16px', textTransform: 'uppercase', color: '#FFF' }}>Eco-Transit</h3>
                <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Calculate travel time and CO₂ environmental savings.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* B. COPILOT CHAT VIEW */}
        {view === 'chat' && (
          <div style={{
            maxWidth: '750px',
            margin: '0 auto',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {/* Header info */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--color-surface-elevated)'
            }}>
              <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                Copilot Conversation
              </span>
              {accessibilityNeeded && (
                <span style={{ fontSize: '10px', color: 'var(--color-cyber-teal)', fontWeight: 700 }}>
                  ♿ Step-free routes enabled
                </span>
              )}
            </div>

            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflowY: 'auto',
                minHeight: '350px'
              }}
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? 'var(--team-accent-bg)' : 'var(--color-surface-elevated)',
                    border: '1px solid',
                    borderColor: msg.sender === 'user' ? 'var(--team-accent)' : 'var(--color-border)',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    maxWidth: '85%',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    position: 'relative'
                  }}
                >
                  <div>{msg.text}</div>
                  
                  {msg.sender === 'assistant' && (
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => speakMessage(msg.text)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--team-accent)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: 0
                        }}
                        title="Read aloud"
                      >
                        <Volume2 style={{ width: '12px', height: '12px' }} /> Speak
                      </button>
                    </div>
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

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) {
                  handleSend(inputText);
                  setInputText('');
                }
              }}
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)'
              }}
            >
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
                    color: '#FFF',
                    padding: '12px 16px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  disabled={isLoading}
                />
                
                {/* Voice button */}
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  style={{
                    backgroundColor: isListening ? 'var(--color-state-critical)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isListening ? '#FFF' : 'var(--color-text-primary)'
                  }}
                  title="Push to talk"
                >
                  <Mic style={{ width: '18px', height: '18px' }} className={isListening ? 'breathing-pulse' : ''} />
                </button>

                <button
                  type="submit"
                  style={{
                    backgroundColor: inputText.trim() && !isLoading ? 'var(--team-accent)' : 'var(--color-border)',
                    color: inputText.trim() && !isLoading ? '#040810' : 'var(--color-text-secondary)',
                    border: 'none',
                    borderRadius: '8px',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputText.trim() && !isLoading ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Send style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* C. MAP VIEW */}
        {view === 'map' && (
          <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="broadcast-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px' }}>
                {t.mapTitle}
              </h2>
              
              <div style={{
                backgroundColor: 'var(--color-base-bg)',
                borderRadius: '8px',
                padding: '20px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <svg viewBox="0 0 400 300" style={{ width: '100%', maxHeight: '250px' }} aria-label="Northgate Stadium Venue Zones Map">
                  {/* Stadium Center Green Pitch */}
                  <rect x="130" y="105" width="140" height="90" rx="4" fill="#0f4625" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                  <circle cx="200" cy="150" r="18" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                  <line x1="200" y1="105" x2="200" y2="195" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />

                  {/* North Stand Stand/Zone (z1) */}
                  <path 
                    d="M 100 45 L 300 45 L 260 90 L 140 90 Z" 
                    fill={selectedZone === 'z1' ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'} 
                    stroke={selectedZone === 'z1' ? 'var(--team-accent)' : 'var(--color-border)'} 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedZone('z1')}
                    className="breathing-pulse"
                  />
                  <text x="200" y="70" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    North Stand
                  </text>

                  {/* South Stand Stand/Zone (z2) */}
                  <path 
                    d="M 100 255 L 300 255 L 260 210 L 140 210 Z" 
                    fill={selectedZone === 'z2' ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'} 
                    stroke={selectedZone === 'z2' ? 'var(--team-accent)' : 'var(--color-border)'} 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedZone('z2')}
                    className="breathing-pulse"
                  />
                  <text x="200" y="238" fill="#FFF" fontSize="10" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    South Stand
                  </text>

                  {/* East Plaza Zone (z3) */}
                  <path 
                    d="M 280 95 L 350 70 L 350 230 L 280 205 Z" 
                    fill={selectedZone === 'z3' ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'} 
                    stroke={selectedZone === 'z3' ? 'var(--team-accent)' : 'var(--color-border)'} 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedZone('z3')}
                    className="breathing-pulse"
                  />
                  <text x="318" y="153" fill="#FFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    East Plaza
                  </text>

                  {/* West Plaza Zone (z4) */}
                  <path 
                    d="M 120 95 L 50 70 L 50 230 L 120 205 Z" 
                    fill={selectedZone === 'z4' ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'} 
                    stroke={selectedZone === 'z4' ? 'var(--team-accent)' : 'var(--color-border)'} 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedZone('z4')}
                    className="breathing-pulse"
                  />
                  <text x="82" y="153" fill="#FFF" fontSize="9" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    West Plaza
                  </text>

                  {/* Metro Transit Bridge (z5) */}
                  <path 
                    d="M 15 20 L 95 20 L 105 45 L 25 45 Z" 
                    fill={selectedZone === 'z5' ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'} 
                    stroke={selectedZone === 'z5' ? 'var(--team-accent)' : 'var(--color-border)'} 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedZone('z5')}
                    className="breathing-pulse"
                  />
                  <text x="58" y="36" fill="#FFF" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Metro Bridge
                  </text>

                  {/* Fan Zone / Retail Row (z6) */}
                  <path 
                    d="M 305 255 L 385 255 L 375 280 L 295 280 Z" 
                    fill={selectedZone === 'z6' ? 'var(--team-accent-bg)' : 'rgba(0, 230, 118, 0.03)'} 
                    stroke={selectedZone === 'z6' ? 'var(--team-accent)' : 'var(--color-border)'} 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedZone('z6')}
                    className="breathing-pulse"
                  />
                  <text x="340" y="271" fill="#FFF" fontSize="8" fontWeight="bold" textAnchor="middle" pointerEvents="none" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Fan Zone
                  </text>
                </svg>
              </div>

              {selectedZone ? (
                <div style={{ marginTop: '16px', backgroundColor: 'var(--color-surface-elevated)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <h3 style={{ textTransform: 'uppercase', color: 'var(--team-accent)', fontSize: '15px' }}>
                    {zones.find(z => z.id === selectedZone)?.name}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Capacity limit:</span>
                      <strong style={{ display: 'block', color: '#FFF' }}>{zones.find(z => z.id === selectedZone)?.capacity} fans</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Access Type:</span>
                      <strong style={{ display: 'block', color: zones.find(z => z.id === selectedZone)?.accessible ? 'var(--color-pitch-green)' : 'var(--color-state-critical)' }}>
                        {zones.find(z => z.id === selectedZone)?.accessible ? '♿ Step-Free Accessible' : '⚠️ Steps-Only'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>
                  {t.mapSelectZone}
                </p>
              )}
            </div>
          </div>
        )}

        {/* D. TRANSIT VIEW */}
        {view === 'transit' && (
          <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="broadcast-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.transportTitle}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Compare transport modes based on efficiency and CO₂ environmental savings.
              </p>

              {/* Warnings */}
              {transportCompare?.reasoning && (
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: 'var(--color-state-warning)'
                }}>
                  <strong>Matchday Notice:</strong> {transportCompare.reasoning}
                </div>
              )}

              {/* Transit compare table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {transportCompare?.options.map((opt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      padding: '16px 20px',
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#FFF' }}>{opt.mode}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Time: {opt.estTime}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: parseFloat(opt.estCO2) <= 1.5 ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: parseFloat(opt.estCO2) <= 1.5 ? 'var(--color-pitch-green)' : 'var(--color-text-primary)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        {opt.estCO2} CO₂
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* E. MY TRIP VIEW */}
        {view === 'trip' && (
          <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="broadcast-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', textTransform: 'uppercase', marginBottom: '16px' }}>
                My Saved Preferences
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#FFF' }}>Language Setting</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Used for copilot voice translation</span>
                  </div>
                  <span style={{ textTransform: 'uppercase', fontWeight: 800, color: 'var(--team-accent)' }}>
                    {lang}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#FFF' }}>Accessibility Filtering</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Filters routes for step-free access</span>
                  </div>
                  <span style={{ fontWeight: 800, color: accessibilityNeeded ? 'var(--color-pitch-green)' : 'var(--color-text-muted)' }}>
                    {accessibilityNeeded ? 'Enabled (Step-Free)' : 'Disabled'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  <div>
                    <strong style={{ display: 'block', color: '#FFF' }}>Personalized Accent Color</strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Custom matches team color scheme</span>
                  </div>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: teamColor }} />
                </div>
              </div>

              <button
                onClick={resetOnboarding}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  color: 'var(--color-state-critical)',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Reset Copilot Setup Profile
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Styles for Flashing dots */}
      <style>{`
        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--team-accent);
          color: var(--team-accent);
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
          background-color: var(--team-accent);
          color: var(--team-accent);
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 12px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: var(--team-accent);
          color: var(--team-accent);
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: 1s;
        }
        @keyframes dotFlashing {
          0% {
            background-color: var(--team-accent);
          }
          50%, 100% {
            background-color: var(--team-accent-bg);
          }
        }
      `}</style>
    </div>
  );
};
