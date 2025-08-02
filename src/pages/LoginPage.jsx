// src/pages/LoginPage.jsx - Versione pulita senza debug
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
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const { login, loginOrRegisterWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Inizializzazione Google
  useEffect(() => {
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!CLIENT_ID) {
      setError('Google Sign-In non configurato');
      return;
    }

    if (CLIENT_ID.length < 50) {
      setError('Configurazione Google Sign-In non valida');
      return;
    }

    // Carica script Google
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(initializeGoogle, 100);
      };
      script.onerror = () => {
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
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
        
        setGoogleInitialized(true);
        
      } catch (error) {
        setError('Errore inizializzazione Google Sign-In');
      }
    }
  }, []);

  // Handler per la risposta Google
  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setError('');

    try {
      const result = await loginOrRegisterWithGoogle(response.credential);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || error || 'Errore sconosciuto';
      setError(`Errore durante l'accesso con Google: ${errorMessage}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Click del pulsante Google con fallback OAuth2
  const handleGoogleClick = () => {
    if (!window.google) {
      setError('Google Sign-In non caricato. Ricarica la pagina.');
      return;
    }

    if (!googleInitialized) {
      setError('Google Sign-In non inizializzato. Attendi qualche secondo e riprova.');
      return;
    }

    try {
      setError('');
      
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Se il prompt normale non funziona, usa OAuth2 come fallback
          handleGoogleOAuth2Fallback();
        }
      });
      
    } catch (error) {
      handleGoogleOAuth2Fallback();
    }
  };

  // Fallback OAuth2 per quando il prompt normale non funziona
  const handleGoogleOAuth2Fallback = () => {
    try {
      setGoogleLoading(true);
      
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (response) => {
          if (response.access_token) {
            try {
              // Usa l'access token per ottenere le info utente
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                  'Authorization': `Bearer ${response.access_token}`
                }
              });
              
              if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
                
                try {
                  const result = await loginOrRegisterWithGoogle(userInfo);
                  navigate('/dashboard');
                  
                } catch (backendError) {
                  setError(`Errore Google: ${backendError.message || backendError}`);
                }
                
              } else {
                throw new Error('Errore recupero info utente da Google');
              }
            } catch (fetchError) {
              setError(`Errore durante il recupero delle informazioni utente: ${fetchError.message}`);
            }
          } else if (response.error) {
            setError(`Errore OAuth2: ${response.error}`);
          } else {
            setError('Nessun access token ricevuto da Google');
          }
          
          setGoogleLoading(false);
        },
        error_callback: (error) => {
          setError(`Errore OAuth2: ${error.type || error.message || 'Errore sconosciuto'}`);
          setGoogleLoading(false);
        }
      });
      
      // Richiedi il token
      tokenClient.requestAccessToken({
        prompt: 'select_account',
      });
      
    } catch (error) {
      setError(`Errore fallback OAuth2: ${error.message}`);
      setGoogleLoading(false);
    }
  };

  // Form handlers
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

  const isClientIdValid = process.env.REACT_APP_GOOGLE_CLIENT_ID && 
                         process.env.REACT_APP_GOOGLE_CLIENT_ID.length > 50;

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
              border: '1px solid #fcc',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          {/* Pulsante Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || loading || !isClientIdValid || !googleInitialized}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ffffff',
              color: '#333',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: (googleLoading || loading || !isClientIdValid || !googleInitialized) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
              transition: 'all 0.2s',
              opacity: (googleLoading || loading || !isClientIdValid || !googleInitialized) ? 0.6 : 1
            }}
          >
            {googleLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Accesso in corso...
              </>
            ) : !isClientIdValid ? (
              <>
                <i className="fas fa-exclamation-triangle"></i>
                Google non configurato
              </>
            ) : !googleInitialized ? (
              <>
                <i className="fas fa-hourglass-half"></i>
                Inizializzazione Google...
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
          max-width: 500px;
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