// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, registerWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Inizializza Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
          auto_select: false,
        });
      }
    };

    // Carica lo script di Google se non è già presente
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, []);

  // Handler per il Google Sign-In
  const handleGoogleSignIn = async (response) => {
    setGoogleLoading(true);
    setError('');
    
    try {
      const result = await registerWithGoogle(response.credential).unwrap();
      console.log('✅ Registrazione Google riuscita:', result);
      
      // Reindirizza alla dashboard o alla conferma email in base alla risposta
      if (result.needsEmailConfirmation) {
        navigate('/email-confirmation', { 
          state: { 
            email: result.email,
            fromRegistration: true 
          } 
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Errore registrazione Google:', error);
      setError(error || 'Errore durante la registrazione con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handler per il click del pulsante Google
  const handleGoogleButtonClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  // Handler per i cambi nei campi del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Pulisci l'errore quando l'utente inizia a digitare
    if (error) {
      setError('');
    }
  };

  // Handler per il submit del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione base
    if (!formData.nome || !formData.cognome || !formData.email || !formData.password) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError('Inserisci un\'email valida');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await register(
        formData.nome, 
        formData.cognome, 
        formData.email, 
        formData.password
      ).unwrap();
      
      // Reindirizza alla pagina di conferma email invece che alla dashboard
      navigate('/email-confirmation', { 
        state: { 
          email: formData.email,
          fromRegistration: true 
        } 
      });
      
    } catch (error) {
      console.error('❌ Errore di registrazione:', error);
      setError(error || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h1>Registrati</h1>
            <p>Crea un nuovo account per iniziare</p>
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

          {/* Pulsante Google Sign-Up */}
          <button
            type="button"
            onClick={handleGoogleButtonClick}
            disabled={googleLoading || loading}
            className="google-signup-button"
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
              transition: 'background-color 0.2s, box-shadow 0.2s'
            }}
          >
            {googleLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Registrazione in corso...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Registrati con Google
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
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#dadce0'
            }}></div>
            <span style={{
              padding: '0 16px',
              fontSize: '14px'
            }}>oppure</span>
            <div style={{
              flex: 1,
              height: '1px',
              backgroundColor: '#dadce0'
            }}></div>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Il tuo nome"
                  disabled={loading || googleLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="cognome">Cognome</label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleChange}
                  placeholder="Il tuo cognome"
                  disabled={loading || googleLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="La tua email"
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
                placeholder="Scegli una password (min 6 caratteri)"
                disabled={loading || googleLoading}
                autoComplete="new-password"
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
              <label htmlFor="confirmPassword">Conferma Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ripeti la password"
                disabled={loading || googleLoading}
                autoComplete="new-password"
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
              disabled={loading || googleLoading || !formData.nome || !formData.cognome || !formData.email || !formData.password || !formData.confirmPassword}
              className="register-button"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading || googleLoading ? '#ccc' : '#28a745',
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
                  {' '}Registrazione in corso...
                </>
              ) : (
                'Registrati'
              )}
            </button>
          </form>

          <div className="register-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>
              Hai già un account?{' '}
              <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
                Accedi qui
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--background-color, #f5f7fa);
          padding: 20px;
        }

        .register-container {
          width: 100%;
          max-width: 500px;
        }

        .register-card {
          background: var(--card-bg, white);
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .register-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .register-header h1 {
          color: var(--text-color, #2c3e50);
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
        }

        .register-header p {
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

        .register-button:hover:not(:disabled) {
          background-color: #218838;
        }

        .register-button:disabled {
          opacity: 0.6;
        }

        .google-signup-button:hover:not(:disabled) {
          background-color: #f8f9fa;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        }

        .google-signup-button:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;