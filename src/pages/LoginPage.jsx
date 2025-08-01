// src/pages/LoginPage.jsx - Versione completa con test Google OAuth integrato
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Componente di test integrato avanzato
const GoogleOAuthTest = () => {
  const [status, setStatus] = useState('Inizializzazione...');
  const [error, setError] = useState('');
  const [solutions, setSolutions] = useState([]);

  useEffect(() => {
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    
    if (!CLIENT_ID) {
      setStatus('❌ Client ID mancante');
      return;
    }

    const loadGoogleScript = () => {
      if (window.google) {
        testGoogleInit();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = testGoogleInit;
      script.onerror = () => setStatus('❌ Errore caricamento script Google');
      document.head.appendChild(script);
    };

    const testGoogleInit = () => {
      try {
        setStatus('🔧 Inizializzazione Google...');
        
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            setStatus('✅ Token ricevuto! Login riuscito!');
            console.log('Google response:', response);
          },
          auto_select: false,
        });

        setStatus('✅ Google inizializzato correttamente');
        
      } catch (error) {
        setStatus(`❌ Errore inizializzazione: ${error.message}`);
        setError(error.message);
      }
    };

    loadGoogleScript();
  }, []);

  const testPrompt = () => {
    setStatus('🔄 Testing Google prompt...');
    setError('');
    setSolutions([]);
    
    try {
      window.google.accounts.id.prompt((notification) => {
        console.log('Notification:', notification);
        
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          setStatus(`❌ Prompt non mostrato: ${reason}`);
          setError(`Motivo: ${reason}`);
          
          if (reason === 'unregistered_origin') {
            setError('ORIGINE NON REGISTRATA - Prova le soluzioni sotto!');
            setSolutions([
              '🔥 PRIORITÀ 1: Vai su APIs & Services > Library e abilita "Google+ API"',
              '🔥 PRIORITÀ 2: Abilita anche "Google Identity Services API"',
              '3. Verifica di essere nel progetto Google Cloud CORRETTO',
              '4. Controlla OAuth consent screen sia configurato',
              '5. Aggiungi ENTRAMBI: http://localhost:3000 E http://127.0.0.1:3000',
              '6. Prova a creare un NUOVO Client ID OAuth 2.0',
              '7. Aspetta 15-30 minuti (non solo 5-10)',
              '8. Cancella TUTTA la cache del browser (non solo ricarica)',
              '9. Prova in modalità incognito'
            ]);
          }
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          setStatus(`⚠️ Prompt saltato: ${reason}`);
        } else {
          setStatus('✅ Prompt mostrato correttamente');
        }
      });
    } catch (error) {
      setStatus(`❌ Errore prompt: ${error.message}`);
      setError(error.message);
    }
  };

  const testWith127 = () => {
    setStatus('🔄 Testando con 127.0.0.1...');    
    const newUrl = window.location.href.replace('localhost', '127.0.0.1');
    window.open(newUrl, '_blank');
  };

  const clearAllCache = () => {
    // Cancella tutti i possibili storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Prova a cancellare anche la cache Google se possibile
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    setStatus('🧹 Cache cancellata - ricarica la pagina');
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  };

  return (
    <div style={{
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      backgroundColor: '#f8f9fa'
    }}>
      <h3>🧪 Test Google OAuth Avanzato</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>Errore:</strong> {error}
        </div>
      )}

      {solutions.length > 0 && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <strong>🔧 Soluzioni da provare:</strong>
          <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
            {solutions.map((solution, index) => (
              <li key={index} style={{ marginBottom: '5px' }}>{solution}</li>
            ))}
          </ol>
        </div>
      )}
      
      <div style={{ marginBottom: '15px', fontSize: '14px' }}>
        <strong>Origin corrente:</strong> {window.location.origin}<br/>
        <strong>Client ID:</strong> {process.env.REACT_APP_GOOGLE_CLIENT_ID ? 
          `${process.env.REACT_APP_GOOGLE_CLIENT_ID.substring(0, 30)}...` : 
          'NON IMPOSTATO'
        }<br/>
        <strong>User Agent:</strong> {navigator.userAgent.includes('Chrome') ? '✅ Chrome' : '⚠️ ' + navigator.userAgent.split(' ')[0]}<br/>
        <strong>⚠️ API Status:</strong> <span style={{color: '#e74c3c'}}>Verifica che Google+ API sia abilitata!</span>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <button
          onClick={testPrompt}
          disabled={!window.google}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧪 Test Prompt
        </button>
        
        <button
          onClick={testWith127}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔗 Prova con 127.0.0.1
        </button>
        
        <button
          onClick={clearAllCache}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧹 Cancella Cache
        </button>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
        <strong>🔥 PASSO FONDAMENTALE - Abilita le API:</strong><br/>
        1. Google Cloud Console - APIs & Services - Library<br/>
        2. Cerca "Google+ API" e clicca ENABLE<br/>
        3. Cerca "Google Identity Services API" e clicca ENABLE<br/>
        4. Poi testa di nuovo il prompt<br/><br/>
        <strong>⚡ Se continua a non funzionare:</strong><br/>
        Crea nuovo Client ID: Credentials - Create Credentials - OAuth 2.0 Client ID - 
        Authorized JavaScript origins: <code>http://localhost:3000</code>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Debug e inizializzazione Google
  useEffect(() => {
    const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Raccogli informazioni di debug
    const debug = {
      clientId: CLIENT_ID,
      clientIdLength: CLIENT_ID?.length,
      origin: window.location.origin,
      href: window.location.href,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      host: window.location.host,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    setDebugInfo(debug);

    console.log('🔍 Debug completo Google OAuth:');
    console.table(debug);

    if (!CLIENT_ID) {
      setError('Client ID Google non configurato nella variabile REACT_APP_GOOGLE_CLIENT_ID');
      return;
    }

    if (CLIENT_ID.length < 50) {
      setError('Client ID Google sembra troppo corto. Verifica che sia corretto.');
      return;
    }

    // Carica script Google
    if (!window.google) {
      console.log('📦 Caricamento script Google...');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Script Google caricato con successo');
        setTimeout(initializeGoogle, 100);
      };
      script.onerror = (e) => {
        console.error('❌ Errore caricamento script Google:', e);
        setError('Impossibile caricare Google Sign-In');
      };
      document.head.appendChild(script);
    } else {
      console.log('✅ Script Google già presente');
      initializeGoogle();
    }

    function initializeGoogle() {
      try {
        console.log('🔧 Inizializzazione Google con CLIENT_ID:', CLIENT_ID);
        console.log('🔧 Inizializzazione Google da origin:', window.location.origin);
        
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        console.log('✅ Google inizializzato con successo');
        
      } catch (error) {
        console.error('❌ Errore inizializzazione Google:', error);
        setError(`Errore inizializzazione Google Sign-In: ${error.message}`);
      }
    }
  }, []);

  // Handler per la risposta Google
  const handleGoogleResponse = async (response) => {
    console.log('🔄 Risposta Google ricevuta');
    console.log('🔍 Response object:', response);
    console.log('🔍 Credential present:', !!response.credential);
    console.log('🔍 Credential length:', response.credential?.length);
    
    setGoogleLoading(true);
    setError('');

    try {
      const result = await loginWithGoogle(response.credential).unwrap();
      console.log('✅ Login Google riuscito:', result);
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Errore login Google nel componente:', error);
      setError(`Errore durante l'accesso con Google: ${error.message || error}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Click del pulsante Google
  const handleGoogleClick = () => {
    console.log('🔄 Click Google button');
    console.log('🔍 Current origin:', window.location.origin);
    console.log('🔍 Google object available:', !!window.google);

    if (!window.google) {
      setError('Google Sign-In non caricato. Ricarica la pagina.');
      return;
    }

    try {
      console.log('🔧 Tentativo prompt Google...');
      
      window.google.accounts.id.prompt((notification) => {
        console.log('🔔 Google prompt notification:', notification);
        
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('⚠️ Prompt non mostrato, motivo:', notification.getNotDisplayedReason());
          console.log('⚠️ Skipped reason:', notification.getSkippedReason());
          
          const reason = notification.getNotDisplayedReason() || notification.getSkippedReason();
          setError(`Google Sign-In non disponibile: ${reason}`);
        }
      });
      
    } catch (error) {
      console.error('❌ Errore Google prompt:', error);
      setError(`Errore apertura Google Sign-In: ${error.message}`);
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

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Accedi</h1>
            <p>Inserisci le tue credenziali per accedere</p>
          </div>

          {/* Componente di test integrato */}
          {process.env.NODE_ENV === 'development' && <GoogleOAuthTest />}

          {error && (
            <div className="error-message" style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              border: '1px solid #fcc',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Informazioni di debug */}
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginBottom: '20px', fontSize: '12px' }}>
              <summary style={{ cursor: 'pointer', padding: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
                🔍 Debug Info (clicca per espandere)
              </summary>
              <div style={{ padding: '10px', background: '#f9f9f9', borderRadius: '4px', marginTop: '5px' }}>
                <div><strong>Client ID:</strong> {debugInfo.clientId ? `${debugInfo.clientId.substring(0, 20)}...` : 'Non impostato'}</div>
                <div><strong>Origin:</strong> {debugInfo.origin}</div>
                <div><strong>Host:</strong> {debugInfo.host}</div>
                <div><strong>Protocol:</strong> {debugInfo.protocol}</div>
                <div><strong>Port:</strong> {debugInfo.port || 'default'}</div>
                <div><strong>Google loaded:</strong> {window.google ? '✅' : '❌'}</div>
                <hr style={{ margin: '10px 0' }} />
                <div><strong>Origins da aggiungere in Google Console:</strong></div>
                <div style={{ fontFamily: 'monospace', background: '#fff', padding: '5px', border: '1px solid #ddd' }}>
                  {debugInfo.origin}<br/>
                  http://127.0.0.1:{debugInfo.port || '3000'}
                </div>
              </div>
            </details>
          )}

          {/* Pulsante Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || loading || !debugInfo.clientId}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#ffffff',
              color: '#333',
              border: '1px solid #dadce0',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: (googleLoading || loading || !debugInfo.clientId) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
              transition: 'all 0.2s',
              opacity: (googleLoading || loading || !debugInfo.clientId) ? 0.6 : 1
            }}
          >
            {googleLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Accesso in corso...
              </>
            ) : !debugInfo.clientId ? (
              <>
                <i className="fas fa-exclamation-triangle"></i>
                Google non configurato
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