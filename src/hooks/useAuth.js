// hooks/useAuth.js - Versione aggiornata con Google OAuth (JWT + User Info Objects)
import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  login, 
  register, 
  loginWithGoogle,     // 🆕 AGGIORNATO
  registerWithGoogle,  // 🆕 AGGIORNATO
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

  // 🆕 AGGIORNATO: Funzioni di autenticazione Google - supportano JWT + User Info Objects
  const loginWithGoogleFn = useCallback((googleData) => {
    console.log('🔄 useAuth loginWithGoogle called');
    console.log('🔍 Google data type in useAuth:', typeof googleData);
    
    // Supporta sia token JWT (string) che user info objects
    if (typeof googleData === 'string') {
      console.log('📄 Processing JWT token in useAuth');
    } else if (typeof googleData === 'object' && googleData !== null) {
      console.log('📦 Processing user info object in useAuth');
    } else {
      console.error('❌ Invalid Google data format in useAuth:', typeof googleData);
      return Promise.reject(new Error('Formato dati Google non valido'));
    }
    
    return dispatch(loginWithGoogle({ googleData }));
  }, [dispatch]);

  const registerWithGoogleFn = useCallback((googleData) => {
    console.log('🔄 useAuth registerWithGoogle called');
    console.log('🔍 Google data type in useAuth:', typeof googleData);
    
    // Supporta sia token JWT (string) che user info objects
    if (typeof googleData === 'string') {
      console.log('📄 Processing JWT token for registration in useAuth');
    } else if (typeof googleData === 'object' && googleData !== null) {
      console.log('📦 Processing user info object for registration in useAuth');
    } else {
      console.error('❌ Invalid Google data format for registration in useAuth:', typeof googleData);
      return Promise.reject(new Error('Formato dati Google non valido'));
    }
    
    return dispatch(registerWithGoogle({ googleData }));
  }, [dispatch]);

  // 🆕 NUOVO: Helper per login/registrazione automatica con Google
  const loginOrRegisterWithGoogle = useCallback(async (googleData) => {
    console.log('🔄 useAuth loginOrRegisterWithGoogle called');
    
    try {
      // Prova prima il login
      console.log('🔧 Tentativo login con Google...');
      const loginResult = await loginWithGoogleFn(googleData).unwrap();
      console.log('✅ Login Google riuscito:', loginResult.email);
      return { type: 'login', user: loginResult };
      
    } catch (loginError) {
      console.log('⚠️ Login Google fallito:', loginError);
      
      // Se il login fallisce perché l'account non esiste, prova la registrazione
      if (loginError.includes('Account non trovato')) {
        try {
          console.log('🔧 Tentativo registrazione con Google...');
          const registerResult = await registerWithGoogleFn(googleData).unwrap();
          console.log('✅ Registrazione Google riuscita:', registerResult.email);
          return { type: 'register', user: registerResult };
          
        } catch (registerError) {
          console.error('❌ Anche la registrazione Google è fallita:', registerError);
          throw registerError;
        }
      } else {
        // Altri errori di login
        throw loginError;
      }
    }
  }, [loginWithGoogleFn, registerWithGoogleFn]);

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
    
    // 🆕 AGGIORNATO: Funzioni Google OAuth - supportano JWT + User Info Objects
    loginWithGoogle: loginWithGoogleFn,
    registerWithGoogle: registerWithGoogleFn,
    
    // 🆕 NUOVO: Helper combinato
    loginOrRegisterWithGoogle
  };
};