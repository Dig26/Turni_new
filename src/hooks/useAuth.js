import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout, login as loginAction, register as registerAction, logoutUser } from '../app/slices/authSlice';
import * as authService from '../services/api/authAPI';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, error, loading } = useSelector(state => state.auth);

  // Funzione di inizializzazione migliorata che utilizza solo metodi disponibili
  const initialize = useCallback(async () => {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        return;
      }
      
      // Verifichiamo se l'utente è ancora autenticato usando il metodo disponibile
      const isValid = authService.isAuthenticated();
      
      if (isValid) {
        dispatch(loginSuccess(currentUser));
      } else {
        console.warn('Sessione non più valida. Esecuzione logout automatico.');
        forceLogout();
      }
    } catch (error) {
      console.error('Errore durante l\'inizializzazione dell\'autenticazione:', error);
      // In caso di errore, è più sicuro fare logout
      forceLogout();
    }
  }, [dispatch]);

  const login = useCallback((email, password) => {
    return dispatch(loginAction(email, password));
  }, [dispatch]);

  const register = useCallback((nome, cognome, email, password) => {
    return dispatch(registerAction(nome, cognome, email, password));
  }, [dispatch]);

  // Funzione normale di logout tramite Redux
  const logoutFn = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  // Funzione di logout forzato che rimuove tutti i dati di autenticazione
  const forceLogout = useCallback(() => {
    // Rimuovi tutti i dati di autenticazione dal localStorage e sessionStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    
    // Rimuovi qualsiasi altro dato di autenticazione che potresti aver salvato
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user') || key.includes('token')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user') || key.includes('token')) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Cancella anche eventuali cookie relativi all'autenticazione
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Chiamiamo il logout di Redux
    dispatch(logoutUser());
  }, [dispatch]);

  // Listener per cambiamenti di autenticazione
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        // Quando lo stato dell'autenticazione cambia a loggato, verifichiamo che l'utente sia valido
        const isValid = authService.isAuthenticated();
        if (isValid) {
          dispatch(loginSuccess(user));
        } else {
          console.warn('Sessione non più valida. Esecuzione logout automatico.');
          forceLogout();
        }
      } else {
        dispatch(logout());
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [dispatch, forceLogout]);

  return {
    user,
    isAuthenticated,
    error,
    loading,
    login,
    register,
    logout: logoutFn,
    forceLogout,  // Esponiamo anche la funzione di logout forzato
    initialize
  };
};