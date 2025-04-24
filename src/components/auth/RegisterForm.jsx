import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Auth.css';

const RegisterForm = () => {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, error } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    // Validazione password
    if (password !== confirmPassword) {
      setLocalError('Le password non coincidono.');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('La password deve essere di almeno 6 caratteri.');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(nome, cognome, email, password);
      // La navigazione viene gestita automaticamente in App.jsx
    } catch (err) {
      console.error('Errore di registrazione:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Registrazione</h2>
        <p className="subtitle">Crea un nuovo account</p>
        
        {(localError || error) && <div className="error-message">{localError || error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Il tuo nome"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cognome">Cognome</label>
              <input
                type="text"
                id="cognome"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                required
                placeholder="Il tuo cognome"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="La tua email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Crea una password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Conferma Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Conferma la password"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary full-width"
            disabled={loading}
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Hai già un account?{' '}
            <button 
              className="link-button" 
              onClick={() => navigate('/login')}
            >
              Accedi
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;