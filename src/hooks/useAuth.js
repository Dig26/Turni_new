// hooks/useAuth.js - Versione aggiornata con Google OAuth
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login, 
  register, 
  loginWithGoogle,     // 🆕 NUOVO
  registerWithGoogle,  // 🆕 NUOVO
  logoutUser, 
  initializeAuth,
  setUser,
  clearAuth
} from '../app/slices/authSlice';
import * as authService from '../services/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, error, loading, initialized } = useSelector(state => state.auth);
  const listenerSetup = useRef(false);

  // Funzione di inizializzazione
  const initialize = useCallback(async () => {
    console.log('🔄 useAuth initialize called');
    return dispatch(initializeAuth()).unwrap();
  }, [dispatch]);

  // Funzioni di autenticazione tradizionale
  const loginFn = useCallback((email, password) => {
    console.log('🔄 useAuth login called for:', email);
    return dispatch(login({ email, password }));
  }, [dispatch]);

  const registerFn = useCallback((nome, cognome, email, password) => {
    console.log('🔄 useAuth register called for:', email);
    return dispatch(register({ nome, cognome, email, password }));
  }, [dispatch]);

  // 🆕 NUOVO: Funzioni di autenticazione Google
  const loginWithGoogleFn = useCallback((googleToken) => {
    console.log('🔄 useAuth loginWithGoogle called');
    return dispatch(loginWithGoogle({ googleToken }));
  }, [dispatch]);

  const registerWithGoogleFn = useCallback((googleToken) => {
    console.log('🔄 useAuth registerWithGoogle called');
    return dispatch(registerWithGoogle({ googleToken }));
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

  // Listener semplificato per i cambiamenti di autenticazione
  useEffect(() => {
    // Evita di configurare il listener multiple volte
    if (listenerSetup.current) {
      console.log('👂 Auth listener già configurato, skip...');
      return;
    }

    console.log('👂 Configurazione auth state listener SEMPLIFICATO...');
    listenerSetup.current = true;
    
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('🔄 Auth state changed in useAuth:', !!user);
      if (user) {
        console.log('✅ Utente ricevuto dal listener:', user.email);
      } else {
        console.log('ℹ️ Nessun utente dal listener');
      }
      dispatch(setUser(user));
    });

    return () => {
      console.log('🧹 Cleaning up auth state listener');
      listenerSetup.current = false;
      unsubscribe();
    };
  }, [dispatch]);

  // Controllo sessione esistente all'avvio - SEMPLIFICATO
  useEffect(() => {
    if (initialized) {
      console.log('✅ Auth già inizializzato, skip controllo sessione');
      return;
    }

    console.log('🔍 Controllo sessione esistente all\'avvio (SEMPLIFICATO)...');
    
    // Timeout per evitare attese infinite
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Timeout controllo sessione iniziale');
      dispatch(setUser(null)); // Forza l'inizializzazione
    }, 3000);

    const checkSession = async () => {
      try {
        console.log('🔍 Verifico se c\'è una sessione valida...');
        const hasSession = await authService.hasValidSession();
        
        if (hasSession) {
          console.log('✅ Sessione valida trovata, inizializzo...');
          await initialize();
        } else {
          console.log('ℹ️ Nessuna sessione valida, utente non autenticato');
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error('❌ Errore controllo sessione iniziale:', error);
        dispatch(setUser(null));
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkSession();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialized, initialize, dispatch]);

  // Log di debug per monitorare lo stato
  useEffect(() => {
    console.log('🔍 useAuth state update:', {
      isAuthenticated,
      hasUser: !!user,
      userEmail: user?.email,
      loading,
      initialized,
      listenerSetup: listenerSetup.current
    });
  }, [isAuthenticated, user, loading, initialized]);

  return {
    // Stato
    user,
    isAuthenticated,
    error,
    loading,
    initialized,
    
    // Funzioni tradizionali
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
    forceLogout,
    initialize,
    
    // 🆕 NUOVO: Funzioni Google OAuth
    loginWithGoogle: loginWithGoogleFn,
    registerWithGoogle: registerWithGoogleFn
  };
};