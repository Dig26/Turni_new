// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
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
  const [error, setError] = useState('');
  
  const { register } = useAuth();
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
    
    console.log('🔄 Form submit registrazione con dati:', {
      ...formData,
      password: '***',
      confirmPassword: '***'
    });
    
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
      console.log('📝 Tentativo registrazione con:', { 
        nome: formData.nome,
        cognome: formData.cognome,
        email: formData.email, 
        password: '***' 
      });
      
      const result = await register(
        formData.nome, 
        formData.cognome, 
        formData.email, 
        formData.password
      ).unwrap();
      
      console.log('✅ Registrazione riuscita:', result);
      navigate('/dashboard');
      
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
                  disabled={loading}
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
                  disabled={loading}
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
                placeholder="Scegli una password (min 6 caratteri)"
                disabled={loading}
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
                disabled={loading}
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
              disabled={loading || !formData.nome || !formData.cognome || !formData.email || !formData.password || !formData.confirmPassword}
              className="register-button"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#28a745',
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
            <br />Nome: {formData.nome || '(vuoto)'}
            <br />Cognome: {formData.cognome || '(vuoto)'}
            <br />Email: {formData.email || '(vuoto)'}
            <br />Password: {formData.password ? '***' : '(vuoto)'}
            <br />Conferma: {formData.confirmPassword ? '***' : '(vuoto)'}
            <br />Loading: {loading ? 'Sì' : 'No'}
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
      `}</style>
    </div>
  );
};

export default RegisterPage;