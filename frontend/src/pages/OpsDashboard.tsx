import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, FileText, Calendar, Plus, Accessibility } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { BACKEND_URL } from '../config';

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

export const OpsDashboard: React.FC = () => {
  // Mobile active tab selection: 'zones' | 'recs' | 'incidents' | 'briefings'
  const [activeTab, setActiveTab] = useState<'zones' | 'recs' | 'incidents' | 'briefings'>('zones');
  
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

  // Calculates density color based on capacity percentage per DESIGN.md thresholds
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
    if (s === 'critical') {
      return { 
        color: 'var(--color-state-critical)', 
        bg: 'rgba(239, 68, 68, 0.1)', 
        border: 'rgba(239, 68, 68, 0.2)' 
      };
    } else if (s === 'high') {
      return { 
        color: 'var(--color-state-critical)', 
        bg: 'rgba(239, 68, 68, 0.1)', 
        border: 'rgba(239, 68, 68, 0.2)' 
      };
    } else if (s === 'medium') {
      return { 
        color: 'var(--color-state-warning)', 
        bg: 'rgba(245, 158, 11, 0.1)', 
        border: 'rgba(245, 158, 11, 0.2)' 
      };
    } else {
      return { 
        color: 'var(--color-pitch-green)', 
        bg: 'rgba(0, 230, 118, 0.1)', 
        border: 'rgba(0, 230, 118, 0.2)' 
      };
    }
  };

  const getZoneName = (zoneId: string) => {
    const config = zonesConfig.find(z => z.id === zoneId);
    return config ? config.name : zoneId;
  };

  const fetchInitialReadings = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/density-readings`);
      if (response.ok) {
        const data = await response.json();
        const readingsMap: Record<string, DensityReading> = {};
        data.forEach((item: any) => {
          readingsMap[item.zoneId] = {
            value: item.value,
            source: item.source,
            timestamp: item.timestamp
          };
        });
        setReadings(readingsMap);
      }
    } catch (err) {
      console.error("Failed to fetch initial density readings:", err);
    }
  };

  const fetchRecommendationsList = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/recommendations`);
      if (response.ok) {
        const data = await response.json();
        setPendingRecommendations(data);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations list:", err);
    }
  };

  useEffect(() => {
    // 1. Initial fetch on load
    fetchInitialReadings();
    fetchRecommendationsList();

    let unsubscribeDensity: (() => void) | null = null;
    let unsubscribeRecs: (() => void) | null = null;
    let unsubscribeIncidents: (() => void) | null = null;
    let intervalId: any = null;

    // 2. Set up real-time listener if db is active
    if (db) {
      try {
        
        // Density Listener
        const qDensity = query(
          collection(db, "density_readings"),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        unsubscribeDensity = onSnapshot(qDensity, (snapshot) => {
          const updatedReadings: Record<string, DensityReading> = {};
          const docs = [...snapshot.docs].reverse();
          docs.forEach(doc => {
            const data = doc.data();
            const zid = data.zoneId;
            if (zid) {
              const ts = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp;
              updatedReadings[zid] = {
                value: data.value,
                source: data.source || 'manual',
                timestamp: ts || new Date().toISOString()
              };
            }
          });
          setReadings(prev => ({ ...prev, ...updatedReadings }));
        }, (error) => {
          console.warn("Firestore density error. Falling back to HTTP polling:", error);
          startPolling();
        });

        // Recommendations Listener
        const qRecs = query(
          collection(db, "recommendations"),
          where("status", "==", "pending")
        );
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
          // Sort by timestamp descending
          recsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setPendingRecommendations(recsList);
        }, (error) => {
          console.warn("Firestore recommendations error:", error);
        });

        // Incidents Listener
        const qIncidents = query(
          collection(db, "incidents"),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        unsubscribeIncidents = onSnapshot(qIncidents, (snapshot) => {
          const list: Incident[] = [];
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
          });
          setIncidents(list);
        }, (error) => {
          console.warn("Firestore incidents subscription error:", error);
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
  }, []);

  const handleApprove = async (id: string) => {
    try {
      // Mark as approved locally for instant transition confirmation state
      setApprovedIds(prev => ({ ...prev, [id]: true }));
      
      const response = await fetch(`${BACKEND_URL}/recommendations/${id}/approve`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to approve: ${response.status}`);
      }

      // Wait 1 second for visual feedback, then remove from UI
      setTimeout(() => {
        setPendingRecommendations(prev => prev.filter(r => r.id !== id));
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

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentInput.trim()) return;

    setIsSubmittingIncident(true);
    try {
      const response = await fetch(`${BACKEND_URL}/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: incidentInput
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log incident: ${response.status}`);
      }

      const newInc = await response.json();
      
      // Update local state if not connected to firestore (so it displays instantly in mock mode)
      if (!db) {
        setIncidents(prev => [newInc, ...prev]);
      }

      setIncidentInput('');
    } catch (err) {
      console.error(err);
      alert("Failed to classify incident.");
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  const handleIncidentUpdate = async (id: string, updatedFields: Partial<Incident>) => {
    // 1. Update React state immediately for snappy edits
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...updatedFields } : inc));

    // 2. If firestore is active, sync to the database
    if (db) {
      try {
        const docRef = doc(db, "incidents", id);
        await updateDoc(docRef, updatedFields);
      } catch (err) {
        console.warn("Failed to sync incident update to Firestore:", err);
      }
    }
  };

  const handleDispatchIncident = (id: string) => {
    setDispatchedIds(prev => ({ ...prev, [id]: true }));
    
    // Update status to dispatched
    handleIncidentUpdate(id, { status: 'dispatched' });
    
    setTimeout(() => {
      // Clear local visual dispatch checkmark state after 3 seconds
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: briefingRole,
          shiftContext: briefingContext.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate briefing: ${response.status}`);
      }

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
        headers: {
          'Content-Type': 'application/json'
        },
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
      
      // Instantly update UI from the API response
      setReadings(prev => ({
        ...prev,
        [formZoneId]: {
          value: resData.value,
          source: resData.source,
          timestamp: resData.timestamp
        }
      }));

      // Trigger recommendation fetch immediately to catch threshold crossings
      setTimeout(() => {
        fetchRecommendationsList();
      }, 700);

    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Failed to submit density reading.");
    } finally {
      setIsSubmitting(false);
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
      {/* Mobile Top Navigation Subheader Tabs (Hidden on Desktop) */}
      <div className="ops-mobile-tabs" style={{
        display: 'none',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '8px',
        gap: '8px'
      }}>
        <button
          onClick={() => setActiveTab('zones')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'zones' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'zones' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'zones' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          📊 Zones
        </button>
        <button
          onClick={() => setActiveTab('recs')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'recs' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'recs' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'recs' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          💡 Recs {pendingRecommendations.length > 0 ? `(${pendingRecommendations.length})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'incidents' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'incidents' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'incidents' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ⚠️ Incidents {incidents.length > 0 ? `(${incidents.length})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('briefings')}
          style={{
            flex: 1,
            padding: '10px 4px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: activeTab === 'briefings' ? 'var(--color-surface-elevated)' : 'transparent',
            color: activeTab === 'briefings' ? 'var(--color-pitch-green)' : 'var(--color-text-secondary)',
            border: activeTab === 'briefings' ? '1px solid var(--color-border)' : '1px solid transparent',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          📋 Briefs
        </button>
      </div>

      {/* Main Grid View */}
      <div className="ops-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1.2fr',
        gap: '24px',
        padding: '24px',
        flex: 1,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Live Density Cards & Entry Form */}
        <div className={`ops-panel-zones ${activeTab === 'zones' ? 'mobile-active' : 'mobile-hidden'}`} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto'
        }}>
          
          {/* Header Panel */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Users style={{ width: '18px', height: '18px', color: 'var(--color-pitch-green)' }} />
              Northgate Stadium Live Density
            </h2>
            <span style={{ 
              fontSize: '10px', 
              color: db ? 'var(--color-pitch-green)' : 'var(--color-state-warning)', 
              fontWeight: 600,
              backgroundColor: db ? 'rgba(0, 230, 118, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              padding: '2px 8px',
              borderRadius: '8px',
              border: db ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)'
            }}>
              {db ? '⚡ FIRESTORE LIVE' : '📡 POLLING FALLBACK'}
            </span>
          </div>

          {/* Cards Grid */}
          <div className="zones-card-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}>
            {zonesConfig.map((zone) => {
              const reading = readings[zone.id];
              
              if (!reading) {
                return (
                  <div key={zone.id} style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    opacity: 0.85
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{zone.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {zone.accessibleRoute ? (
                            <Accessibility style={{ width: '12px', height: '12px', color: 'var(--color-cyber-teal)' }} />
                          ) : null}
                          Accessible Route {zone.accessibleRoute ? 'Available' : 'N/A'}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-muted)',
                        border: '1px solid var(--color-border)'
                      }}>
                        No Data Yet
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          Capacity: {zone.capacity}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                          -- %
                        </span>
                      </div>
                      <div style={{
                        height: '6px',
                        backgroundColor: 'var(--color-surface-elevated)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: '0%',
                          backgroundColor: 'var(--color-border)'
                        }}></div>
                      </div>
                    </div>
                  </div>
                );
              }

              const pct = (reading.value / zone.capacity) * 100;
              const status = getDensityStatus(reading.value, zone.capacity);
              
              return (
                <div key={zone.id} style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{zone.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {zone.accessibleRoute ? (
                          <Accessibility style={{ width: '12px', height: '12px', color: 'var(--color-cyber-teal)' }} />
                        ) : null}
                        Accessible Route {zone.accessibleRoute ? 'Available' : 'N/A'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: status.bg,
                      color: status.color,
                      border: `1px solid ${status.border}`
                    }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Percentage Progress indicator */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        Count: <strong>{reading.value}</strong> / {zone.capacity}
                      </span>
                      <span style={{ fontWeight: 700, color: status.color }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: status.color
                      }}></div>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '9px', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                      Source: {reading.source} | {new Date(reading.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Entry Form */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '8px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Plus style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
              Log Density Reading
            </h3>

            <form onSubmit={handleDensitySubmit} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: '16px',
              alignItems: 'end'
            }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Zone
                </label>
                <select 
                  value={formZoneId}
                  onChange={(e) => setFormZoneId(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    padding: '10px',
                    fontSize: '13px',
                    width: '100%',
                    outline: 'none'
                  }}
                  disabled={isSubmitting}
                >
                  {zonesConfig.map(z => (
                    <option key={z.id} value={z.id}>{z.name} (Max {z.capacity})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Occupant Count
                </label>
                <input 
                  type="number"
                  placeholder="Enter occupants count..."
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    padding: '9px 12px',
                    fontSize: '13px',
                    width: '100%',
                    outline: 'none'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !formValue}
                style={{
                  backgroundColor: isSubmitting || !formValue ? 'var(--color-border)' : 'var(--color-pitch-green)',
                  color: isSubmitting || !formValue ? 'var(--color-text-secondary)' : '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSubmitting || !formValue ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Log Density'}
              </button>
            </form>

            {formError && (
              <div style={{ color: 'var(--color-state-critical)', fontSize: '12px', fontWeight: 600 }}>
                ⚠️ {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ color: 'var(--color-pitch-green)', fontSize: '12px', fontWeight: 600 }}>
                ✓ {formSuccess}
              </div>
            )}
          </div>

        </div>

        {/* Right Side Column containing stacked sections (or toggled tabs on mobile) */}
        <div className="ops-side-columns" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          overflowY: 'auto'
        }}>
          
          {/* Section 1: Recommendations panel */}
          <div className={`ops-panel-recs ${activeTab === 'recs' ? 'mobile-active' : 'mobile-hidden'}`} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
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
                <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
                GenAI Rerouting Drafts
              </span>
              {pendingRecommendations.length > 0 && (
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--color-state-critical)',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {pendingRecommendations.length}
                </span>
              )}
            </h2>

            {pendingRecommendations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '13px',
                padding: '24px 0',
                border: '1px dashed var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface-elevated)'
              }}>
                No pending recommendations.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingRecommendations.map((rec) => {
                  const isApproved = approvedIds[rec.id];
                  const sevStyle = getSeverityStyle(rec.severity);
                  
                  return (
                    <div key={rec.id} style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: isApproved ? '0px solid transparent' : '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: isApproved ? '0px 14px' : '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isApproved ? '0px' : '10px',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: isApproved ? 0 : 1,
                      transform: isApproved ? 'translateY(-10px) scale(0.95)' : 'translateY(0) scale(1)',
                      maxHeight: isApproved ? '0px' : '300px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>
                          {getZoneName(rec.zoneId)}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: sevStyle.color,
                          backgroundColor: sevStyle.bg,
                          border: `1px solid ${sevStyle.border}`
                        }}>
                          {rec.severity}
                        </span>
                      </div>

                      <p style={{
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {rec.recommendationText}
                      </p>

                      <button
                        onClick={() => handleApprove(rec.id)}
                        disabled={isApproved}
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
                        {isApproved ? (
                          <>✓ Approved & Published</>
                        ) : (
                          <>Approve & Publish Alerts</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Incident Triage log */}
          <div className={`ops-panel-incidents ${activeTab === 'incidents' ? 'mobile-active' : 'mobile-hidden'}`} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '10px',
              margin: 0
            }}>
              <FileText style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
              GenAI Incident Triage Log
            </h2>

            {/* Input Form */}
            <form onSubmit={handleIncidentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                LOG NEW STADIUM INCIDENT
              </label>
              <textarea 
                placeholder="Log details in plain language (e.g. 'A fan in seat block 102 reported chest pain' or 'fight near Gate C')..." 
                rows={2}
                value={incidentInput}
                onChange={(e) => setIncidentInput(e.target.value)}
                style={{
                  backgroundColor: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  color: 'var(--color-text-primary)',
                  padding: '8px 12px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none'
                }}
                disabled={isSubmittingIncident}
              />
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
                <Plus style={{ width: '14px', height: '14px' }} />
                {isSubmittingIncident ? 'Classifying...' : 'Log & Classify Incident'}
              </button>
            </form>

            {/* Incidents List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
                RECENTLY LOGGED INCIDENTS ({incidents.length})
              </label>

              {incidents.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  padding: '16px 0',
                  border: '1px dashed var(--color-border)',
                  borderRadius: '6px'
                }}>
                  No incidents logged yet.
                </div>
              ) : (
                incidents.map((inc) => {
                  const severityStyle = getIncidentSeverityStyle(inc.severity);
                  const isDispatched = dispatchedIds[inc.id] || inc.status === 'dispatched';
                  
                  return (
                    <div key={inc.id} style={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      position: 'relative'
                    }}>
                      {inc.flagged && (
                        <span style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          fontSize: '9px',
                          fontWeight: 700,
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          ⚠️ Needs Review
                        </span>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)'
                        }}>
                          {inc.category}
                        </span>
                        
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: severityStyle.color,
                          backgroundColor: severityStyle.bg,
                          border: `1px solid ${severityStyle.border}`
                        }}>
                          {inc.severity || 'UNKNOWN'}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: 'var(--color-text-primary)',
                        fontStyle: 'italic',
                        backgroundColor: 'var(--color-surface)',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        borderLeft: '3px solid var(--color-cyber-teal)',
                        margin: 0
                      }}>
                        "{inc.text}"
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                          DRAFT RESPONSE SUGGESTION
                        </label>
                        <textarea
                          value={inc.draftResponse}
                          onChange={(e) => handleIncidentUpdate(inc.id, { draftResponse: e.target.value })}
                          rows={2}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text-secondary)',
                            padding: '6px 8px',
                            fontSize: '11px',
                            outline: 'none',
                            resize: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                          DRAFT COMMUNICATIONS COPY
                        </label>
                        <textarea
                          value={inc.draftComms}
                          onChange={(e) => handleIncidentUpdate(inc.id, { draftComms: e.target.value })}
                          rows={2}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text-secondary)',
                            padding: '6px 8px',
                            fontSize: '11px',
                            outline: 'none',
                            resize: 'none'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDispatchIncident(inc.id)}
                        disabled={isDispatched}
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
                })
              )}
            </div>
          </div>

          {/* Section 3: Shift Briefings tab */}
          <div className={`ops-panel-briefings ${activeTab === 'briefings' ? 'mobile-active' : 'mobile-hidden'}`} style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '15px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '10px',
              margin: 0
            }}>
              <Calendar style={{ width: '16px', height: '16px', color: 'var(--color-cyber-teal)' }} />
              GenAI Volunteer Briefings
            </h2>
            <form onSubmit={handleGenerateBriefing} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Volunteer Role
                </label>
                <select 
                  value={briefingRole}
                  onChange={(e) => setBriefingRole(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    padding: '8px',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none'
                  }}
                  disabled={isGeneratingBriefing}
                >
                  <option value="Gate Volunteer">Gate Volunteer</option>
                  <option value="Crowd Control Coordinator">Crowd Control Coordinator</option>
                  <option value="General Volunteer">General Volunteer</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Shift Context / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 'Rain expected at 4pm' or 'high gate traffic'..."
                  value={briefingContext}
                  onChange={(e) => setBriefingContext(e.target.value)}
                  style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-text-primary)',
                    padding: '8px 12px',
                    fontSize: '12px',
                    width: '100%',
                    outline: 'none'
                  }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
                  GENERATED BRIEFING FOR {generatedBriefing.role.toUpperCase()}
                </label>

                {generatedBriefing.sections.map((sect, index) => (
                  <div key={index} style={{
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-cyber-teal)' }}>
                      {sect.heading}
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                      lineHeight: '1.4'
                    }}>
                      {sect.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Responsive media overrides embedded directly */}
      <style>{`
        @media (max-width: 767px) {
          .ops-mobile-tabs {
            display: flex !important;
          }
          .ops-grid {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
            gap: 16px !important;
            overflow-y: auto !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .mobile-active {
            display: flex !important;
          }
          .ops-side-columns {
            display: contents !important;
          }
          .zones-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
