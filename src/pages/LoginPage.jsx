// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handler per i cambi nei campi del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Campo ${name} cambiato:`, value);
    
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
    
    console.log('🔄 Form submit con dati:', formData);
    
    // Validazione base
    if (!formData.email || !formData.password) {
      setError('Email e password sono obbligatori');
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError('Inserisci un\'email valida');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🔑 Tentativo login con:', { 
        email: formData.email, 
        password: '***' 
      });
      
      const result = await login(formData.email, formData.password).unwrap();
      
      console.log('✅ Login riuscito:', result);
      navigate('/dashboard');
      
    } catch (error) {
      console.error('❌ Errore di login:', error);
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
                disabled={loading}
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
                disabled={loading}
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
              disabled={loading || !formData.email || !formData.password}
              className="login-button"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer'
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

          <div className="login-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>
              Non hai un account?{' '}
              <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
                Registrati
              </Link>
            </p>
          </div>

          {/* Debug info (rimuovi in produzione) */}
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6c757d'
          }}>
            <strong>Debug:</strong>
            <br />Email: {formData.email || '(vuoto)'}
            <br />Password: {formData.password ? '***' : '(vuoto)'}
            <br />Loading: {loading ? 'Sì' : 'No'}
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

        .login-button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .login-button:disabled {
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;