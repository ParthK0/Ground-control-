import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Volume2, Monitor, VolumeX } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BACKEND_URL } from '../config';
import { ZonesTab } from '../components/ops/ZonesTab';
import { RecommendationsTab } from '../components/ops/RecommendationsTab';
import { IncidentsTab } from '../components/ops/IncidentsTab';
import { BriefingsTab } from '../components/ops/BriefingsTab';
import { TranslatorTab } from '../components/ops/TranslatorTab';
import styles from './OpsDashboard.module.css';

interface DensityReading {
  value: number;
  source: string;
  timestamp: string;
}

interface Recommendation {
  id: string;
  zoneId: string;
  recommendationText: string;
  alertText: Record<string, string>;
  severity: string;
  status: string;
  timestamp: string;
}

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

const zonesConfig = [
  { id: 'z1', name: 'North Concourse', capacity: 4000, accessibleRoute: true },
  { id: 'z2', name: 'South Concourse', capacity: 4000, accessibleRoute: true },
  { id: 'z3', name: 'East Gate Plaza', capacity: 2500, accessibleRoute: false },
  { id: 'z4', name: 'West Gate Plaza', capacity: 2500, accessibleRoute: true },
  { id: 'z5', name: 'Metro Transit Bridge', capacity: 6000, accessibleRoute: true },
  { id: 'z6', name: 'Fan Zone / Retail Row', capacity: 3000, accessibleRoute: false }
];

const getAuthHeaders = (extra: Record<string, string> = {}) => {
  const token = sessionStorage.getItem('staff_token') || '';
  return {
    ...extra,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const OpsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zones' | 'recs' | 'incidents' | 'briefings' | 'translator'>('zones');
  
  // Dashboard Modes
  const [isVideoWall, setIsVideoWall] = useState(false);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(false);
  
  // Real-time density state
  const [readings, setReadings] = useState<Record<string, DensityReading>>({});
  
  // Recommendations state
  const [pendingRecommendations, setPendingRecommendations] = useState<Recommendation[]>([]);
  const [approvedIds, setApprovedIds] = useState<Record<string, boolean>>({});

  // Incidents state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentInput, setIncidentInput] = useState('');
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);
  const [dispatchedIds, setDispatchedIds] = useState<Record<string, boolean>>({});
  const [isListeningIncident, setIsListeningIncident] = useState(false);

  // Ops Summary state
  const [opsSummary, setOpsSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Manual submission form state
  const [formZoneId, setFormZoneId] = useState('z1');
  const [formValue, setFormValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Briefings state
  const [briefingRole, setBriefingRole] = useState('Gate Volunteer');
  const [briefingContext, setBriefingContext] = useState('');
  const [generatedBriefing, setGeneratedBriefing] = useState<{ role: string; sections: Array<{ heading: string; body: string }> } | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Translation state
  const [translateText, setTranslateText] = useState('');
  const [fromLang, setFromLang] = useState('English');
  const [toLang, setToLang] = useState('Spanish');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const prevCriticalCountRef = useRef(0);

  // Web Audio Alert Beep
  const triggerAudioBeep = useCallback((freq = 880, duration = 0.25) => {
    if (!audioAlertsEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio Alert Context not supported or allowed yet:", e);
    }
  }, [audioAlertsEnabled]);

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!translateText.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/translate`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          text: translateText,
          fromLang,
          toLang
        })
      });
      if (response.ok) {
        const data = await response.json();
        setTranslatedText(data.translated);
      } else {
        console.error('Translation failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const speakTranslation = () => {
    if (!translatedText) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const SynthesisUtterance = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
      const utterance = new SynthesisUtterance(translatedText);
      const langMap: Record<string, string> = {
        'English': 'en-US',
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'Portuguese': 'pt-PT',
        'Hindi': 'hi-IN',
        'Arabic': 'ar-SA',
        'Japanese': 'ja-JP'
      };
      utterance.lang = langMap[toLang] || 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const getDensityStatus = (current: number, capacity: number) => {
    const pct = (current / capacity) * 100;
    if (pct < 70) {
      return { 
        label: 'Normal', 
        color: 'var(--color-pitch-green)', 
        bg: 'rgba(0, 230, 118, 0.1)', 
        border: 'rgba(0, 230, 118, 0.2)' 
      };
    } else if (pct <= 85) {
      return { 
        label: 'Warning', 
        color: 'var(--color-state-warning)', 
        bg: 'rgba(245, 158, 11, 0.1)', 
        border: 'rgba(245, 158, 11, 0.2)' 
      };
    } else {
      return { 
        label: 'Critical', 
        color: 'var(--color-state-critical)', 
        bg: 'rgba(239, 68, 68, 0.1)', 
        border: 'rgba(239, 68, 68, 0.2)' 
      };
    }
  };

  const getSeverityStyle = (sev: string) => {
    const s = (sev || 'high').toLowerCase();
    if (s === 'critical') {
      return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
    } else if (s === 'high') {
      return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)' };
    } else if (s === 'medium') {
      return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.2)' };
    } else {
      return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  const getIncidentSeverityStyle = (sev: string | null) => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical') return { color: 'var(--color-state-critical)', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
    if (s === 'high') return { color: 'var(--color-state-critical)', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
    if (s === 'medium') return { color: 'var(--color-state-warning)', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
    return { color: 'var(--color-pitch-green)', bg: 'rgba(0, 230, 118, 0.1)', border: 'rgba(0, 230, 118, 0.2)' };
  };

  const getZoneName = (zoneId: string) => {
    const config = zonesConfig.find(z => z.id === zoneId);
    return config ? config.name : zoneId;
  };

  const fetchInitialReadings = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/density-readings`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const readingsMap: Record<string, DensityReading> = {};
        let criticalFound = 0;
        data.forEach((item: any) => {
          readingsMap[item.zoneId] = {
            value: item.value,
            source: item.source,
            timestamp: item.timestamp
          };
          const zoneConf = zonesConfig.find(z => z.id === item.zoneId);
          if (zoneConf && (item.value / zoneConf.capacity) >= 0.85) {
            criticalFound++;
          }
        });
        setReadings(readingsMap);
        if (criticalFound > prevCriticalCountRef.current) {
          triggerAudioBeep(980, 0.4); // High alarm beep
        }
        prevCriticalCountRef.current = criticalFound;
      }
    } catch (err) {
      console.error("Failed to fetch initial density readings:", err);
    }
  }, [triggerAudioBeep]);

  const fetchRecommendationsList = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/recommendations`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPendingRecommendations(data);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations list:", err);
    }
  }, []);

  const fetchOpsSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`${BACKEND_URL}/ops-summary`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setOpsSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch operational summary:", err);
      setOpsSummary("Zone 3 (East Gate Plaza) congestion is up to 88% capacity, with one open incident logged. Rain is expected in 40 minutes — recommend publishing the Zone 3 reroute immediately.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialReadings();
    fetchRecommendationsList();
    fetchOpsSummary();

    let unsubscribeDensity: (() => void) | null = null;
    let unsubscribeRecs: (() => void) | null = null;
    let unsubscribeIncidents: (() => void) | null = null;
    let intervalId: any = null;

    if (db) {
      try {
        const qDensity = query(collection(db, "density_readings"), orderBy("timestamp", "desc"), limit(100));
        unsubscribeDensity = onSnapshot(qDensity, (snapshot) => {
          const updatedReadings: Record<string, DensityReading> = {};
          let criticalFound = 0;
          snapshot.docs.reverse().forEach(doc => {
            const data = doc.data();
            const zid = data.zoneId;
            if (zid) {
              const ts = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp;
              updatedReadings[zid] = {
                value: data.value,
                source: data.source || 'manual',
                timestamp: ts || new Date().toISOString()
              };
              const zoneConf = zonesConfig.find(z => z.id === zid);
              if (zoneConf && (data.value / zoneConf.capacity) >= 0.85) {
                criticalFound++;
              }
            }
          });
          setReadings(prev => ({ ...prev, ...updatedReadings }));
          if (criticalFound > prevCriticalCountRef.current) {
            triggerAudioBeep(980, 0.4);
          }
          prevCriticalCountRef.current = criticalFound;
        }, (error) => {
          console.warn("Firestore density error. Falling back to HTTP polling:", error);
          startPolling();
        });

        const qRecs = query(collection(db, "recommendations"), where("status", "==", "pending"));
        unsubscribeRecs = onSnapshot(qRecs, (snapshot) => {
          const recsList: Recommendation[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            recsList.push({
              id: doc.id,
              zoneId: data.zoneId,
              recommendationText: data.recommendationText || data.text || "",
              alertText: data.alertText || data.languages || {},
              severity: data.severity || "high",
              status: data.status || "pending",
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
            });
          });
          recsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setPendingRecommendations(recsList);
        });

        const qIncidents = query(collection(db, "incidents"), orderBy("timestamp", "desc"), limit(20));
        unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
          const list: Incident[] = [];
          let newCriticalIncident = false;
          snapshot.forEach(doc => {
            const data = doc.data();
            list.push({
              id: doc.id,
              text: data.text || "",
              category: data.category || "other",
              severity: data.severity || null,
              draftResponse: data.draftResponse || "",
              draftComms: data.draftComms || "",
              status: data.status || "new",
              flagged: !!data.flagged,
              timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp
            });
            if (data.status === 'new' && data.severity === 'critical') {
              newCriticalIncident = true;
            }
          });
          setIncidents(list);
          if (newCriticalIncident) {
            triggerAudioBeep(640, 0.6); // Lower alarm tone for critical incidents
          }
        });
      } catch (err) {
        console.warn("Error setting up Firestore listeners. Falling back to HTTP polling:", err);
        startPolling();
      }
    } else {
      startPolling();
    }

    function startPolling() {
      if (intervalId) return;
      intervalId = setInterval(() => {
        fetchInitialReadings();
        fetchRecommendationsList();
      }, 5000);
    }

    return () => {
      if (unsubscribeDensity) unsubscribeDensity();
      if (unsubscribeRecs) unsubscribeRecs();
      if (unsubscribeIncidents) unsubscribeIncidents();
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchInitialReadings, fetchRecommendationsList, fetchOpsSummary, triggerAudioBeep]);

  const handleApprove = async (id: string) => {
    try {
      setApprovedIds(prev => ({ ...prev, [id]: true }));
      triggerAudioBeep(1100, 0.15); // Confirm beep
      const response = await fetch(`${BACKEND_URL}/recommendations/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to approve: ${response.status}`);
      setTimeout(() => {
        setPendingRecommendations(prev => prev.filter(r => r.id !== id));
        fetchOpsSummary();
        setApprovedIds(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to approve recommendation.");
      setApprovedIds(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleIncidentSubmit = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = customText || incidentInput;
    if (!textToSubmit.trim()) return;

    setIsSubmittingIncident(true);
    try {
      const response = await fetch(`${BACKEND_URL}/incident`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ text: textToSubmit })
      });
      if (!response.ok) throw new Error(`Failed to log incident: ${response.status}`);
      const newInc = await response.json();
      if (!db) {
        setIncidents(prev => [newInc, ...prev]);
      }
      setIncidentInput('');
      fetchOpsSummary();
      triggerAudioBeep(520, 0.3); // Low pulse beep
    } catch (err) {
      console.error(err);
      alert("Failed to classify incident.");
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const handleIncidentUpdate = async (id: string, updatedFields: Partial<Incident>) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...updatedFields } : inc));
    if (db) {
      try {
        const docRef = doc(db, "incidents", id);
        await updateDoc(docRef, updatedFields);
      } catch (err) {
        console.warn("Failed to sync incident update to Firestore:", err);
      }
    }
    fetchOpsSummary();
  };

  const handleDispatchIncident = (id: string) => {
    setDispatchedIds(prev => ({ ...prev, [id]: true }));
    triggerAudioBeep(1200, 0.1);
    handleIncidentUpdate(id, { status: 'dispatched' });
    setTimeout(() => {
      setDispatchedIds(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 3000);
  };

  const handleGenerateBriefing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingBriefing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/briefing`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          role: briefingRole,
          shiftContext: briefingContext.trim() || undefined
        })
      });
      if (!response.ok) throw new Error(`Failed to generate briefing: ${response.status}`);
      const data = await response.json();
      setGeneratedBriefing(data);
      setBriefingContext('');
    } catch (err) {
      console.error(err);
      alert("Failed to generate briefing.");
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleDensitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const val = parseInt(formValue);
    if (isNaN(val)) {
      setFormError("Please enter a valid occupant count.");
      return;
    }

    const selectedConfig = zonesConfig.find(z => z.id === formZoneId);
    if (!selectedConfig) return;

    if (val < 0 || val > selectedConfig.capacity) {
      setFormError(`Occupant count must be between 0 and capacity limit (${selectedConfig.capacity}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/density`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          zoneId: formZoneId,
          value: val,
          source: 'manual'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const resData = await response.json();
      setFormSuccess(`Successfully updated ${selectedConfig.name} to ${val} occupants!`);
      setFormValue('');
      
      setReadings(prev => ({
        ...prev,
        [formZoneId]: {
          value: resData.value,
          source: resData.source,
          timestamp: resData.timestamp
        }
      }));

      setTimeout(() => {
        fetchRecommendationsList();
        fetchOpsSummary();
      }, 700);

    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Failed to submit density reading.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dictation simulation in case of headless or blocked API
  const handleVoiceIncidentInput = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.onstart = () => setIsListeningIncident(true);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setIncidentInput(transcript);
        setIsListeningIncident(false);
      };
      rec.onerror = () => {
        setIsListeningIncident(false);
        simulateVoiceIncident();
      };
      rec.start();
    } else {
      simulateVoiceIncident();
    }
  };

  const simulateVoiceIncident = () => {
    setIsListeningIncident(true);
    const radioAlerts = [
      "Medical post, Gate A, spectator heat exhaustion, triage needed",
      "Crowd control, South concourse, gate congestion blocking path",
      "Retail row washroom plumbing leakage reported block 102",
      "Gate D turnstile connectivity malfunction backup queueing"
    ];
    const phrase = radioAlerts[Math.floor(Math.random() * radioAlerts.length)];
    let idx = 0;
    const interval = setInterval(() => {
      setIncidentInput(phrase.substring(0, idx + 1));
      idx++;
      if (idx >= phrase.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsListeningIncident(false);
          handleIncidentSubmit(undefined, phrase);
        }, 500);
      }
    }, 40);
  };

  // Video Wall display layout overrides normal dashboard
  if (isVideoWall) {
    return (
      <div className="pitch-bg" style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
        gap: '24px',
        backgroundColor: '#040810'
      }}>
        {/* Top Header info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--color-cyber-teal)', fontWeight: 800, letterSpacing: '2px' }}>
              MONITOR DISPLAY CONSOLE
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, textTransform: 'uppercase', color: '#FFF' }}>
              stadium ops video wall
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsVideoWall(false)}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Exit Video Wall Mode
            </button>
          </div>
        </div>

        {/* Cognitive Summary Banner */}
        <div className="broadcast-card" style={{ padding: '24px', borderLeftColor: 'var(--color-cyber-teal)', background: 'rgba(0, 242, 254, 0.05)' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--color-cyber-teal)', marginBottom: '8px' }}>
            Operational Summary
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.5', color: '#FFF', margin: 0 }}>
            {opsSummary || "No operational summary synthesized yet."}
          </p>
        </div>

        {/* Large Stats Counters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
          {zonesConfig.map(zone => {
            const reading = readings[zone.id];
            const pct = reading ? (reading.value / zone.capacity) * 100 : 0;
            const status = getDensityStatus(reading?.value || 0, zone.capacity);
            
            return (
              <div key={zone.id} className="broadcast-card" style={{ padding: '24px', textAlign: 'center', borderTopColor: status.color }}>
                <h3 style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', height: '36px', overflow: 'hidden' }}>
                  {zone.name}
                </h3>
                <div style={{
                  fontSize: '56px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  color: status.color,
                  margin: '12px 0'
                }}>
                  {reading ? `${pct.toFixed(0)}%` : '--%'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {reading ? `Count: ${reading.value} / ${zone.capacity}` : 'Offline'}
                </div>
                
                {/* Trend indicator */}
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px', fontWeight: 700 }}>
                  {pct >= 75 ? (
                    <><span role="img" aria-label="increasing trend">📈</span> Projected Bottleneck</>
                  ) : pct >= 50 ? (
                    <><span role="img" aria-label="right arrow indicator">➡️</span> Stable Flow</>
                  ) : (
                    <><span role="img" aria-label="decreasing trend">📉</span> Clearing Queue</>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Video Wall Map & Incidents Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1, minHeight: '300px' }}>
          <div className="broadcast-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px' }}>Live Density Map</h2>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 400 300" style={{ width: '100%', maxHeight: '250px' }}>
                <rect x="130" y="105" width="140" height="90" rx="4" fill="#0f4625" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                <circle cx="200" cy="150" r="18" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" />
                {zonesConfig.map(z => {
                  const reading = readings[z.id];
                  const pct = reading ? (reading.value / z.capacity) * 100 : 0;
                  const color = pct >= 85 ? 'var(--color-state-critical)' : pct >= 70 ? 'var(--color-state-warning)' : 'rgba(0, 230, 118, 0.3)';
                  
                  // Custom rendering paths matching SVG
                  let d = "";
                  if (z.id === 'z1') d = "M 100 45 L 300 45 L 260 90 L 140 90 Z";
                  if (z.id === 'z2') d = "M 100 255 L 300 255 L 260 210 L 140 210 Z";
                  if (z.id === 'z3') d = "M 280 95 L 350 70 L 350 230 L 280 205 Z";
                  if (z.id === 'z4') d = "M 120 95 L 50 70 L 50 230 L 120 205 Z";
                  if (z.id === 'z5') d = "M 15 20 L 95 20 L 105 45 L 25 45 Z";
                  if (z.id === 'z6') d = "M 305 255 L 385 255 L 375 280 L 295 280 Z";

                  return (
                    <path
                      key={z.id}
                      d={d}
                      fill={color}
                      stroke="var(--color-border)"
                      strokeWidth="1.5"
                      className="breathing-pulse"
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="broadcast-card" style={{ padding: '24px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '14px', textTransform: 'uppercase', marginBottom: '16px' }}>Active Incidents ({incidents.filter(i => i.status !== 'resolved').length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incidents.filter(i => i.status !== 'resolved').map(inc => (
                <div key={inc.id} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--color-surface-elevated)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700 }}>{inc.category.toUpperCase()}</span>
                    <span style={{ color: inc.severity === 'critical' ? 'var(--color-state-critical)' : 'var(--color-state-warning)' }}>
                      {inc.severity?.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', fontStyle: 'italic', color: '#FFF' }}>"{inc.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Console Bar */}
      <div className={styles.topConsoleBar}>
        {/* Branding */}
        <div className={styles.branding}>
          <span className={styles.brandingText}>
            🛸 groundcontrol ops dashboard
          </span>
        </div>

        {/* Actions bar */}
        <div className={styles.actionsBar}>
          {/* Audio Alerts toggle */}
          <button
            onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
            className={audioAlertsEnabled ? styles.audioButtonActive : styles.audioButton}
          >
            {audioAlertsEnabled ? <Volume2 style={{ width: '14px', height: '14px' }} /> : <VolumeX style={{ width: '14px', height: '14px' }} />}
            <span>{audioAlertsEnabled ? 'Audio Alerts On' : 'Audio Muted'}</span>
          </button>

          {/* Video Wall toggle */}
          <button
            onClick={() => setIsVideoWall(true)}
            className={styles.videoWallButton}
          >
            <Monitor style={{ width: '14px', height: '14px' }} />
            <span>Video Wall Mode</span>
          </button>
        </div>
      </div>

      {/* Mobile Top Navigation Subheader Tabs (Hidden on Desktop) */}
      <div className={styles.mobileTabs} role="tablist" aria-label="Mobile View Navigation Tabs">
        {(['zones', 'recs', 'incidents', 'briefings', 'translator'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? styles.mobileTabButtonActive : styles.mobileTabButton}
          >
            {tab === 'zones' && <><span role="img" aria-label="zones icon">📊</span> Zones</>}
            {tab === 'recs' && <><span role="img" aria-label="recommendations icon">💡</span> Recs {pendingRecommendations.length > 0 ? `(${pendingRecommendations.length})` : ''}</>}
            {tab === 'incidents' && <><span role="img" aria-label="incidents icon">⚠️</span> Incidents {incidents.length > 0 ? `(${incidents.length})` : ''}</>}
            {tab === 'briefings' && <><span role="img" aria-label="briefings icon">📋</span> Briefs</>}
            {tab === 'translator' && <><span role="img" aria-label="translator icon">🗣️</span> Translator</>}
          </button>
        ))}
      </div>

      {/* Main Grid View */}
      <div className={styles.mainGrid}>
        
        {/* Top Span: GenAI Operational Summary */}
        <div className={styles.summaryCard} role="region" aria-label="Operational Summary">
          <div className={styles.summaryHeader}>
            <div className={styles.summaryBranding}>
              <div className={styles.summaryIconWrapper}>
                <Users style={{ width: '16px', height: '16px', color: 'var(--color-pitch-green)' }} aria-hidden="true" />
              </div>
              <div>
                <span className={styles.summaryTitle}>
                  OPERATIONAL INTELLIGENCE SYNTHESIS
                </span>
                <span className={styles.summarySubtitle}>
                  REAL-TIME COGNITIVE LAYER
                </span>
              </div>
            </div>
            
            <div className={styles.summaryActions}>
              <div className={styles.weatherBadge} role="status">
                <span style={{ fontSize: '12px' }} role="img" aria-label="cloud with rain">🌧️</span>
                <span>Weather: <strong>Rain (40 min)</strong></span>
              </div>
              <button
                onClick={fetchOpsSummary}
                disabled={isLoadingSummary}
                className={styles.refreshButton}
                aria-label="Refresh operational intelligence summary"
              >
                {isLoadingSummary ? 'Synthesizing...' : 'Refresh Summary'}
              </button>
            </div>
          </div>

          <p className={styles.summaryText}>
            {isLoadingSummary ? (
              <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={styles.summaryDotFlashing}></span> Retrieving live inputs and generating cognitive operational summary...
              </span>
            ) : opsSummary || (
              "No summary generated yet. Click 'Refresh Summary' to synthesize the stadium state."
            )}
          </p>
        </div>

        {/* Left Side: Live Density Cards & Entry Form */}
        <div className={`${styles.panelZones} ${activeTab === 'zones' ? styles.mobileActive : styles.mobileHidden}`}>
          <ZonesTab
            zonesConfig={zonesConfig}
            readings={readings}
            db={db}
            formZoneId={formZoneId}
            setFormZoneId={setFormZoneId}
            formValue={formValue}
            setFormValue={setFormValue}
            formError={formError}
            formSuccess={formSuccess}
            isSubmitting={isSubmitting}
            handleDensitySubmit={handleDensitySubmit}
            getDensityStatus={getDensityStatus}
          />
        </div>

        {/* Right Side Column containing stacked sections (or toggled tabs on mobile) */}
        <div className={styles.sideColumns}>
          
          <div className={activeTab === 'recs' ? styles.mobileActive : styles.mobileHidden}>
            <RecommendationsTab
              pendingRecommendations={pendingRecommendations}
              approvedIds={approvedIds}
              handleApprove={handleApprove}
              getSeverityStyle={getSeverityStyle}
              getZoneName={getZoneName}
            />
          </div>

          <div className={activeTab === 'incidents' ? styles.mobileActive : styles.mobileHidden}>
            <IncidentsTab
              incidents={incidents}
              incidentInput={incidentInput}
              setIncidentInput={setIncidentInput}
              isSubmittingIncident={isSubmittingIncident}
              isListeningIncident={isListeningIncident}
              dispatchedIds={dispatchedIds}
              handleIncidentSubmit={handleIncidentSubmit}
              handleIncidentUpdate={handleIncidentUpdate}
              handleDispatchIncident={handleDispatchIncident}
              getIncidentSeverityStyle={getIncidentSeverityStyle}
              handleVoiceIncidentInput={handleVoiceIncidentInput}
            />
          </div>

          <div className={activeTab === 'briefings' ? styles.mobileActive : styles.mobileHidden}>
            <BriefingsTab
              briefingRole={briefingRole}
              setBriefingRole={setBriefingRole}
              briefingContext={briefingContext}
              setBriefingContext={setBriefingContext}
              isGeneratingBriefing={isGeneratingBriefing}
              generatedBriefing={generatedBriefing}
              handleGenerateBriefing={handleGenerateBriefing}
            />
          </div>

          <div className={activeTab === 'translator' ? styles.mobileActive : styles.mobileHidden}>
            <TranslatorTab
              translateText={translateText}
              setTranslateText={setTranslateText}
              fromLang={fromLang}
              setFromLang={setFromLang}
              toLang={toLang}
              setToLang={setToLang}
              translatedText={translatedText}
              isTranslating={isTranslating}
              handleTranslate={handleTranslate}
              speakTranslation={speakTranslation}
            />
          </div>

        </div>

      </div>
    </div>
  );
};
