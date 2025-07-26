// src/pages/LoginPage.jsx - Versione test semplificata per Google OAuth
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Debug e inizializzazione Google
  useEffect(() => {
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    console.log('🔍 Debug Google OAuth:');
    console.log('- Client ID:', CLIENT_ID);
    console.log('- Origin:', window.location.origin);
    console.log('- Protocol:', window.location.protocol);
    console.log('- Host:', window.location.host);

    if (!CLIENT_ID) {
      setError('Client ID Google non configurato');
      return;
    }

    // Carica script Google
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Script Google caricato');
        initializeGoogle();
      };
      script.onerror = () => {
        console.error('❌ Errore caricamento script Google');
        setError('Impossibile caricare Google Sign-In');
      };
      document.head.appendChild(script);
    } else {
      initializeGoogle();
    }

    function initializeGoogle() {
      try {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
        console.log('✅ Google inizializzato');
      } catch (error) {
        console.error('❌ Errore inizializzazione Google:', error);
        setError('Errore inizializzazione Google Sign-In');
      }
    }
  }, []);

  // Aggiungi questo useEffect nella LoginPage.jsx per debug
  useEffect(() => {
    console.log('🔍 CLIENT_ID trovato:', process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('🔍 Tipo CLIENT_ID:', typeof process.env.REACT_APP_GOOGLE_CLIENT_ID);
    console.log('🔍 Lunghezza CLIENT_ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID?.length);
  }, []);

  // Handler per la risposta Google
  const handleGoogleResponse = async (response) => {
    console.log('🔄 Risposta Google ricevuta:', response);
    setGoogleLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle(response.credential).unwrap();
      console.log('✅ Login Google riuscito');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Errore login Google:', error);
      setError('Errore durante l\'accesso con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Click del pulsante Google - versione semplificata
  const handleGoogleClick = () => {
    console.log('🔄 Click Google button');

    if (!window.google) {
      setError('Google Sign-In non caricato');
      return;
    }

    try {
      // Metodo semplificato - solo prompt
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('❌ Errore Google prompt:', error);
      setError('Errore apertura Google Sign-In');
    }
  };

  // Form handlers (invariati)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Email e password sono obbligatori');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password).unwrap();
      navigate('/dashboard');
    } catch (error) {
      setError(error || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Accedi</h1>
            <p>Inserisci le tue credenziali per accedere</p>
          </div>

          {error && (
            <div className="error-message" style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {/* Pulsante Google semplificato */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ffffff',
              color: '#333',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: googleLoading || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
              transition: 'all 0.2s'
            }}
          >
            {googleLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Accesso in corso...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Accedi con Google
              </>
            )}
          </button>

          {/* Divisore */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: '#666'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#dadce0' }}></div>
            <span style={{ padding: '0 16px', fontSize: '14px' }}>oppure</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#dadce0' }}></div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Inserisci la tua email"
                disabled={loading || googleLoading}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Inserisci la tua password"
                disabled={loading || googleLoading}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || !formData.email || !formData.password}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading || googleLoading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading || googleLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {' '}Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>
              Non hai un account?{' '}
              <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
                Registrati
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--background-color, #f5f7fa);
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
        }

        .login-card {
          background: var(--card-bg, white);
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h1 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
        }

        .login-header p {
          color: var(--text-light, #7f8c8d);
          margin: 0;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          color: var(--text-color, #2c3e50);
          font-weight: 500;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;