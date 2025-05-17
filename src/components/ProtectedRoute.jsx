// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isAuthenticated } from '../services/authService';

/**
 * Componente per proteggere le rotte che richiedono autenticazione
 * Reindirizza alla pagina di login se l'utente non è autenticato
 */
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const auth = useSelector(state => state.auth);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Se l'auth state di Redux è già disponibile, usiamo quello
    if (auth.isAuthenticated !== undefined) {
      setIsAuth(auth.isAuthenticated);
      setAuthChecked(true);
    } else {
      // Altrimenti verifichiamo direttamente con il servizio
      const checkAuth = async () => {
        try {
          const authenticated = await isAuthenticated();
          setIsAuth(authenticated);
        } catch (error) {
          console.error('Errore nella verifica dell\'autenticazione:', error);
          setIsAuth(false);
        } finally {
          setAuthChecked(true);
        }
      };
      
      checkAuth();
    }
  }, [auth.isAuthenticated]);

  // Mostriamo un indicatore di caricamento mentre verifichiamo l'autenticazione
  if (!authChecked) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Verifica autenticazione...</p>
      </div>
    );
  }

  // Se l'utente non è autenticato, reindirizza alla pagina di login
  // con un parametro "from" per tornare alla pagina originale dopo il login
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Se l'utente è autenticato, mostra il contenuto protetto
  return children;
};

export default ProtectedRoute;