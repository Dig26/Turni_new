import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login, 
  register, 
  logoutUser, 
  initializeAuth,
  setUser,
  clearAuth
} from '../app/slices/authSlice';
import * as authService from '../services/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, error, loading, initialized } = useSelector(state => state.auth);

  // Funzione di inizializzazione
  const initialize = useCallback(async () => {
    console.log('🔄 useAuth initialize called');
    return dispatch(initializeAuth()).unwrap();
  }, [dispatch]);

  // Funzioni di autenticazione
  const loginFn = useCallback((email, password) => {
    console.log('🔄 useAuth login called for:', email);
    return dispatch(login({ email, password }));
  }, [dispatch]);

  const registerFn = useCallback((nome, cognome, email, password) => {
    console.log('🔄 useAuth register called for:', email);
    return dispatch(register({ nome, cognome, email, password }));
  }, [dispatch]);

  const logoutFn = useCallback(() => {
    console.log('🔄 useAuth logout called');
    return dispatch(logoutUser());
  }, [dispatch]);

  // Logout forzato che pulisce tutto
  const forceLogout = useCallback(() => {
    console.log('🔄 useAuth forceLogout called');
    
    // Pulisci storage locale
    localStorage.clear();
    sessionStorage.clear();
    
    // Pulisci Redux
    dispatch(clearAuth());
    
    // Prova il logout da Supabase
    authService.logout().catch(error => {
      console.warn('⚠️ Errore during force logout from Supabase:', error);
    });
    
    return Promise.resolve();
  }, [dispatch]);

  // Listener per i cambiamenti di autenticazione (solo se non è già inizializzato)
  useEffect(() => {
    if (initialized) {
      console.log('✅ Auth già inizializzato, skip listener setup');
      return;
    }

    console.log('👂 Setting up auth state listener');
    
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('🔄 Auth state changed in useAuth:', !!user);
      dispatch(setUser(user));
    });

    return () => {
      console.log('🧹 Cleaning up auth state listener');
      unsubscribe();
    };
  }, [dispatch, initialized]);

  return {
    // Stato
    user,
    isAuthenticated,
    error,
    loading,
    initialized,
    
    // Funzioni
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
    forceLogout,
    initialize
  };
};