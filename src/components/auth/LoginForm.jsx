// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../app/slices/authSlice';
import '../../styles/Auth.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ottieni lo stato di autenticazione e di caricamento
  const { loading } = useSelector(state => state.auth);
  
  // Ottieni il percorso da cui l'utente è stato reindirizzato
  const from = location.state?.from || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validazione base
    if (!formData.email || !formData.password) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    
    try {
      // Effettua il login
      await dispatch(login(formData.email, formData.password)).unwrap();
      
      // Reindirizza alla pagina originale dopo il login
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Errore di login:', error);
      setError(error.message || 'Errore durante il login. Controlla le credenziali e riprova.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Accedi</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="La tua email"
              required
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
              placeholder="La tua password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin"></i> Accesso in corso...</>
            ) : (
              'Accedi'
            )}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            Non hai un account? <Link to="/register" className="link">Registrati</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;