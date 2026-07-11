import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Lock, Mail, AlertTriangle, ShieldAlert, Key } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [useTokenBypass, setUseTokenBypass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Firebase Auth is not initialized. Please use the Bypass Token method below.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      sessionStorage.setItem('staff_token', token);
      sessionStorage.setItem('staff_email', userCredential.user.email || '');
      navigate('/ops');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypassLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter a valid bypass token.');
      return;
    }
    setError('');
    // Store token directly in sessionStorage. The backend require_staff_auth will validate it
    // against the staff_auth_secret in settings.
    sessionStorage.setItem('staff_token', tokenInput.trim());
    sessionStorage.setItem('staff_email', 'bypass_staff@groundcontrol.com');
    navigate('/ops');
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '80px auto',
      padding: '0 24px',
      zIndex: 10
    }}>
      <div className="broadcast-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        {/* Kinetic diagonal banner */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6px',
          height: '100%',
          backgroundColor: 'var(--color-cyber-teal)',
        }} />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.2)',
            marginBottom: '16px'
          }}>
            <ShieldAlert style={{ width: '24px', height: '24px', color: 'var(--color-cyber-teal)' }} />
          </div>
          <h1 style={{
            fontSize: '28px',
            textTransform: 'uppercase',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.5px',
            margin: 0
          }}>
            Organizer Control Access
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '14px' }}>
            Secure login for GroundControl stadium operations personnel.
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'start',
            gap: '10px',
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#FCA5A5',
            fontSize: '13px'
          }}>
            <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {!useTokenBypass ? (
          <form onSubmit={handleFirebaseLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: 'var(--color-text-muted)'
                }} />
                <input
                  type="email"
                  required
                  placeholder="name@stadiumops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--color-base-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: 'var(--color-text-muted)'
                }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--color-base-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--color-cyber-teal)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--color-base-bg)',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setUseTokenBypass(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-pitch-green)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Use Local Bypass Token (Offline Mode)
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBypassLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '6px'
              }}>Staff Authorization Bypass Token</label>
              <div style={{ position: 'relative' }}>
                <Key style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: 'var(--color-text-muted)'
                }} />
                <input
                  type="password"
                  required
                  placeholder="Enter STAFF_AUTH_SECRET"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'var(--color-base-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--color-pitch-green)',
                border: 'none',
                borderRadius: '4px',
                color: 'var(--color-base-bg)',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              Verify & Enter Console
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setUseTokenBypass(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-cyber-teal)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Return to Email/Password Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
