// src/features/auth/AuthRequired.jsx - VERSIONE CORRETTA
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AuthRequired = ({ children }) => {
  const { isAuthenticated, loading, initialized } = useAuth();
  const location = useLocation();

  console.log('🔒 AuthRequired check:', {
    isAuthenticated,
    loading,
    initialized,
    currentPath: location.pathname
  });

  // IMPORTANTE: Aspetta che l'auth sia inizializzato prima di decidere
  if (!initialized || loading) {
    console.log('⏳ Auth still loading, showing spinner...');
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Verifica autenticazione...</p>
      </div>
    );
  }

  // Solo DOPO che l'auth è inizializzato, controlla se l'utente è autenticato
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login from:', location.pathname);
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Se autenticato, mostra il componente child SENZA REDIRECT
  console.log('✅ Authenticated, showing protected content at:', location.pathname);
  return children;
};

export default AuthRequired;