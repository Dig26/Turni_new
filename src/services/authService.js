// services/authService.js - VERSIONE AGGIORNATA CON SUPPORTO JWT + USER INFO OBJECTS + AUTH_USER_ID
import { supabase, prepareData, handleResponse } from './api/apiClient';

// Cache per evitare chiamate multiple
let userCache = null;
let sessionCache = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 secondi

// Helper per timeout
const withTimeout = (promise, timeoutMs = 5000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

// Helper per attendere che Supabase sia pronto
const waitForSupabaseReady = async () => {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 2000);
      console.log('✅ Supabase ready');
      return data;
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for Supabase (attempt ${attempts}/${maxAttempts})`);
      if (attempts === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};

// 🆕 NUOVA FUNZIONE: Ottieni o crea il record utente con auth_user_id
const ensureUserRecord = async (authUser) => {
  try {
    if (!authUser) {
      throw new Error('Nessun utente auth fornito');
    }

    console.log('🔍 Verifica record utente per:', authUser.email);

    // 1. Prima cerca per auth_user_id
    try {
      const promise = supabase
        .from('utenti')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();

      const userRecord = await handleResponse(promise);
      console.log('✅ Utente trovato tramite auth_user_id:', userRecord.id);
      return userRecord;
      
    } catch (error) {
      console.log('🔍 Utente non trovato tramite auth_user_id, cerco per email...');
    }

    // 2. Se non trovato, cerca per email
    try {
      const promise = supabase
        .from('utenti')
        .select('*')
        .eq('email', authUser.email)
        .single();

      const userRecord = await handleResponse(promise);
      console.log('✅ Utente trovato tramite email:', userRecord.id);
      
      // 3. Aggiorna il record con auth_user_id
      const updateData = prepareData({
        authUserId: authUser.id,
        aggiornatoIl: new Date().toISOString()
      });

      const updatePromise = supabase
        .from('utenti')
        .update(updateData)
        .eq('id', userRecord.id)
        .select();

      const updatedRecord = await handleResponse(updatePromise);
      console.log('✅ Record utente aggiornato con auth_user_id');
      return updatedRecord[0];
      
    } catch (emailError) {
      console.log('🔍 Utente non trovato tramite email, lo creo...');
    }

    // 4. Se non esiste, crea nuovo record
    const emailParts = authUser.email.split('@')[0].split('.');
    const nome = authUser.user_metadata?.nome || emailParts[0] || 'Nome';
    const cognome = authUser.user_metadata?.cognome || emailParts[1] || 'Cognome';

    const newUserData = prepareData({
      nome: nome.charAt(0).toUpperCase() + nome.slice(1),
      cognome: cognome.charAt(0).toUpperCase() + cognome.slice(1),
      email: authUser.email,
      password: 'managed_by_supabase_auth',
      role: authUser.user_metadata?.role || 'user',
      authUserId: authUser.id,
      negoziDisponibili: 0,
      creatoIl: new Date().toISOString(),
      aggiornatoIl: new Date().toISOString()
    });

    const createPromise = supabase
      .from('utenti')
      .insert(newUserData)
      .select();

    const newRecord = await handleResponse(createPromise);
    console.log('✅ Nuovo record utente creato:', newRecord[0].id);
    return newRecord[0];

  } catch (error) {
    console.error('❌ Errore nella gestione del record utente:', error);
    throw error;
  }
};

// 🆕 AGGIORNATO: Helper per processare dati Google (JWT o User Info Object)
const processGoogleData = (googleData) => {
  console.log('🔍 Processing Google data type:', typeof googleData);
  
  // Caso 1: È un JWT token (string)
  if (typeof googleData === 'string') {
    console.log('📄 Processing JWT token');
    try {
      // Decodifica la parte payload del JWT
      const payload = googleData.split('.')[1];
      const decodedPayload = atob(payload);
      const parsed = JSON.parse(decodedPayload);
      
      return {
        email: parsed.email,
        nome: parsed.given_name || parsed.name?.split(' ')[0] || 'User',
        cognome: parsed.family_name || parsed.name?.split(' ').slice(1).join(' ') || 'Google',
        picture: parsed.picture,
        verified: parsed.email_verified,
        source: 'jwt_token'
      };
    } catch (error) {
      console.error('❌ Errore decodifica JWT token:', error);
      throw new Error('Token Google non valido');
    }
  }
  
  // Caso 2: È già un oggetto user info (da OAuth2)
  if (typeof googleData === 'object' && googleData !== null) {
    console.log('📦 Processing user info object');
    
    if (!googleData.email) {
      throw new Error('User info object deve contenere email');
    }
    
    return {
      email: googleData.email,
      nome: googleData.given_name || googleData.name?.split(' ')[0] || 'User',
      cognome: googleData.family_name || googleData.name?.split(' ').slice(1).join(' ') || 'Google',
      picture: googleData.picture,
      verified: googleData.verified_email || googleData.email_verified || true,
      source: 'user_info_object'
    };
  }
  
  throw new Error('Formato dati Google non supportato');
};

// Helper per decodificare token Google (mantenuto per compatibilità)
const decodeGoogleToken = (token) => {
  console.warn('⚠️ decodeGoogleToken deprecato, usa processGoogleData');
  return processGoogleData(token);
};

// 🆕 AGGIORNATO: Funzione per ottenere l'utente dalla sessione con logica robusta
const getUserFromSession = async () => {
  try {
    const { data: sessionData, error } = await withTimeout(supabase.auth.getSession(), 3000);
    
    if (error || !sessionData?.session?.user) {
      console.log('ℹ️ No active session');
      return null;
    }
    
    const authUser = sessionData.session.user;
    console.log('✅ Session user found:', authUser.email);
    
    // Usa la nuova logica robusta per ottenere/creare il record utente
    try {
      const dbUser = await ensureUserRecord(authUser);
      console.log('✅ Database user resolved:', { id: dbUser.id, email: dbUser.email });
      return dbUser;
      
    } catch (dbError) {
      console.error('❌ Error ensuring user record:', dbError.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error in getUserFromSession:', error.message);
    return null;
  }
};

// Funzione principale per ottenere l'utente corrente
export const getCurrentUser = async () => {
  console.log('🔍 getCurrentUser called');
  
  // Usa cache se è fresca
  const now = Date.now();
  if (userCache && (now - cacheTime) < CACHE_DURATION) {
    console.log('✅ Using cached user:', userCache?.email);
    return userCache;
  }
  
  try {
    await waitForSupabaseReady();
    const user = await getUserFromSession();
    
    // Aggiorna cache
    userCache = user;
    cacheTime = now;
    
    if (user) {
      console.log('✅ getCurrentUser success:', user.email);
    } else {
      console.log('ℹ️ getCurrentUser: no user');
    }
    
    return user;
    
  } catch (error) {
    console.error('❌ getCurrentUser error:', error.message);
    return null;
  }
};

// Login
export const login = async (email, password) => {
  console.log('🔄 Login start:', email);
  
  try {
    // Clear cache
    userCache = null;
    sessionCache = null;
    
    await waitForSupabaseReady();
    
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      10000
    );
    
    if (error) {
      console.error('❌ Auth login error:', error.message);
      throw new Error(error.message);
    }
    
    console.log('✅ Auth login success:', data.user?.email);
    
    // Aspetta un momento per permettere al session state di aggiornarsi
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ottieni l'utente completo
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Login riuscito ma impossibile recuperare i dati utente');
    }
    
    console.log('🎉 Login completed:', user.email);
    return user;
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
};

// 🆕 AGGIORNATO: Register con logica auth_user_id
export const register = async (nome, cognome, email, password) => {
  console.log('🔄 Register start:', email);
  
  try {
    // Clear cache
    userCache = null;
    sessionCache = null;
    
    await waitForSupabaseReady();
    
    // Registrazione in Supabase Auth
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome, cognome, role: 'user' }
        }
      }),
      10000
    );
    
    if (authError) {
      console.error('❌ Auth register error:', authError.message);
      throw new Error(authError.message);
    }
    
    if (!authData.user) {
      throw new Error('Registrazione fallita - nessun utente creato');
    }
    
    console.log('✅ Auth register success:', authData.user.email);
    
    // Inserimento nella tabella utenti con auth_user_id
    const userData = prepareData({
      nome,
      cognome,
      email,
      password: 'managed_by_supabase_auth',
      role: 'user',
      authUserId: authData.user.id,
      negoziDisponibili: 0,
      creatoIl: new Date().toISOString(),
      aggiornatoIl: new Date().toISOString()
    });

    const insertPromise = supabase
      .from('utenti')
      .insert(userData)
      .select();

    const dbResult = await handleResponse(insertPromise);
    
    if (!dbResult || dbResult.length === 0) {
      // Rollback: elimina utente da Auth
      try {
        await supabase.auth.signOut();
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
      throw new Error('Errore nella creazione del record utente');
    }
    
    const dbUser = dbResult[0];
    console.log('🎉 Register completed:', dbUser.email);
    return dbUser;
    
  } catch (error) {
    console.error('❌ Register failed:', error.message);
    throw error;
  }
};

// 🆕 AGGIORNATO: Login con Google - supporta JWT + User Info Objects + auth_user_id
export const loginWithGoogle = async (googleData) => {
  console.log('🔄 Login Google start');
  console.log('🔍 Google data type:', typeof googleData);
  
  try {
    // Clear cache
    userCache = null;
    sessionCache = null;
    
    await waitForSupabaseReady();
    
    // Processa i dati Google (JWT o User Info Object)
    const userInfo = processGoogleData(googleData);
    console.log('✅ Google data processed:', { 
      email: userInfo.email, 
      source: userInfo.source 
    });
    
    // Cerca prima se l'utente esiste già nel database
    const { data: existingUsers, error: searchError } = await withTimeout(
      supabase
        .from('utenti')
        .select('*')
        .eq('email', userInfo.email),
      3000
    );
    
    if (searchError) {
      console.error('❌ Error searching for existing user:', searchError.message);
      throw new Error('Errore durante la ricerca utente');
    }
    
    if (!existingUsers || existingUsers.length === 0) {
      throw new Error('Account non trovato. Registrati prima con Google.');
    }
    
    const existingUser = existingUsers[0];
    console.log('✅ Existing user found:', existingUser.email);
    
    // Tentativo di autenticazione con Supabase (solo se abbiamo un JWT)
    if (userInfo.source === 'jwt_token' && typeof googleData === 'string') {
      try {
        console.log('🔧 Attempting Supabase Google auth with JWT...');
        
        const { data, error } = await withTimeout(
          supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleData,
          }),
          10000
        );
        
        if (error) {
          console.warn('⚠️ Supabase Google auth failed:', error.message);
          throw error; // Passa al fallback
        }
        
        console.log('✅ Supabase Google auth success:', data.user?.email);
        
        // Aspetta un momento per permettere al session state di aggiornarsi
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Ottieni l'utente completo dalla sessione (che userà ensureUserRecord)
        const user = await getCurrentUser();
        
        if (user) {
          console.log('🎉 Login Google completed (Supabase):', user.email);
          return user;
        }
        
      } catch (supabaseError) {
        console.log('⚠️ Supabase Google OAuth failed, using fallback...');
        // Continua con il fallback
      }
    }
    
    // Fallback: Login senza sessione Supabase (per OAuth2 user info objects)
    console.log('🔧 Using Google login fallback approach...');
    
    // Verifica che l'email sia verificata (se disponibile)
    if (userInfo.verified === false) {
      throw new Error('Email Google non verificata');
    }
    
    // Aggiorna l'utente esistente con eventuali nuove informazioni
    try {
      const updateData = prepareData({
        // Aggiorna solo se i campi sono vuoti o il nome è generico
        nome: existingUser.nome === 'User' || !existingUser.nome ? userInfo.nome : existingUser.nome,
        cognome: existingUser.cognome === 'Google' || !existingUser.cognome ? userInfo.cognome : existingUser.cognome,
        // Aggiorna sempre la data di ultimo accesso
        aggiornatoIl: new Date().toISOString()
      });

      const updatePromise = supabase
        .from('utenti')
        .update(updateData)
        .eq('id', existingUser.id)
        .select();

      const updatedResult = await handleResponse(updatePromise);
      
      if (updatedResult && updatedResult.length > 0) {
        console.log('✅ User info updated from Google');
        const updatedUser = updatedResult[0];
        // Aggiorna la cache con l'utente aggiornato
        userCache = updatedUser;
        cacheTime = Date.now();
        
        console.log('🎉 Login Google completed (fallback):', updatedUser.email);
        return updatedUser;
      }
      
    } catch (updateError) {
      console.warn('⚠️ Failed to update user info:', updateError);
      // Non è critico, continua con l'utente esistente
    }
    
    // Aggiorna la cache con l'utente esistente
    userCache = existingUser;
    cacheTime = Date.now();
    
    console.log('🎉 Login Google completed (fallback):', existingUser.email);
    return existingUser;
    
  } catch (error) {
    console.error('❌ Login Google failed:', error.message);
    throw error;
  }
};

// 🆕 AGGIORNATO: Registrazione con Google - supporta JWT + User Info Objects + auth_user_id
export const registerWithGoogle = async (googleData) => {
  console.log('🔄 Register Google start');
  console.log('🔍 Google data type:', typeof googleData);
  
  try {
    // Clear cache
    userCache = null;
    sessionCache = null;
    
    await waitForSupabaseReady();
    
    // Processa i dati Google (JWT o User Info Object)
    const userInfo = processGoogleData(googleData);
    console.log('✅ Google data processed for registration:', { 
      email: userInfo.email, 
      source: userInfo.source 
    });
    
    // Controlla se l'utente esiste già
    const { data: existingUsers, error: searchError } = await withTimeout(
      supabase
        .from('utenti')
        .select('*')
        .eq('email', userInfo.email),
      3000
    );
    
    if (searchError) {
      console.error('❌ Error searching for existing user:', searchError.message);
      throw new Error('Errore durante la ricerca utente');
    }
    
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Un account con questa email esiste già. Prova ad accedere.');
    }
    
    console.log('✅ Email available for registration');
    
    // Verifica che l'email sia verificata (se disponibile)
    if (userInfo.verified === false) {
      throw new Error('Email Google non verificata');
    }
    
    // Tentativo di registrazione con Supabase (solo se abbiamo un JWT)
    let supabaseAuthSuccess = false;
    let authUserId = null;
    
    if (userInfo.source === 'jwt_token' && typeof googleData === 'string') {
      try {
        console.log('🔧 Attempting Supabase Google registration with JWT...');
        
        const { data, error } = await withTimeout(
          supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleData,
          }),
          10000
        );
        
        if (error) {
          console.warn('⚠️ Supabase Google registration failed:', error.message);
        } else {
          console.log('✅ Supabase Google registration success:', data.user?.email);
          supabaseAuthSuccess = true;
          authUserId = data.user?.id;
        }
        
      } catch (supabaseError) {
        console.log('⚠️ Supabase Google OAuth non disponibile per registrazione');
        // Continua con l'approccio manuale
      }
    }
    
    // Inserimento nella tabella utenti
    const userData = prepareData({
      nome: userInfo.nome,
      cognome: userInfo.cognome,
      email: userInfo.email,
      password: supabaseAuthSuccess ? 'managed_by_supabase_google_auth' : 'managed_by_google_oauth_fallback',
      role: 'user',
      authUserId: authUserId, // Può essere null se il fallback
      negoziDisponibili: 0,
      creatoIl: new Date().toISOString(),
      aggiornatoIl: new Date().toISOString()
    });

    const insertPromise = supabase
      .from('utenti')
      .insert(userData)
      .select();

    const dbResult = await handleResponse(insertPromise);
    
    if (!dbResult || dbResult.length === 0) {
      // Rollback Supabase auth se era riuscito
      if (supabaseAuthSuccess) {
        try {
          await supabase.auth.signOut();
        } catch (rollbackError) {
          console.error('❌ Rollback error:', rollbackError);
        }
      }
      throw new Error('Errore nella creazione del record utente');
    }
    
    const dbUser = dbResult[0];
    console.log('🎉 Register Google completed:', dbUser.email);
    
    // Aggiorna la cache
    userCache = dbUser;
    cacheTime = Date.now();
    
    return dbUser;
    
  } catch (error) {
    console.error('❌ Register Google failed:', error.message);
    throw error;
  }
};

// Logout
export const logout = async () => {
  console.log('🔄 Logout start');
  
  try {
    // Clear cache
    userCache = null;
    sessionCache = null;
    
    const { error } = await withTimeout(supabase.auth.signOut(), 3000);
    
    if (error) {
      console.error('❌ Logout error:', error.message);
    } else {
      console.log('✅ Logout success');
    }
    
  } catch (error) {
    console.error('❌ Logout error:', error.message);
  }
};

// Controlla se c'è una sessione valida
export const hasValidSession = async () => {
  try {
    const { data, error } = await withTimeout(supabase.auth.getSession(), 2000);
    
    if (error) {
      console.error('❌ Session check error:', error.message);
      return false;
    }
    
    const hasSession = !!data?.session?.user;
    console.log('🔍 Has valid session:', hasSession);
    return hasSession;
    
  } catch (error) {
    console.error('❌ Session check timeout:', error.message);
    return false;
  }
};

// isAuthenticated
export const isAuthenticated = async () => {
  return await hasValidSession();
};

// Listener per i cambiamenti di stato
export const onAuthStateChanged = (callback) => {
  console.log('👂 Setting up auth state listener');
  
  try {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, !!session?.user);
      
      // Clear cache on auth changes
      userCache = null;
      sessionCache = null;
      
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        console.log('✅ Positive auth event, getting user...');
        
        // Aspetta un momento per permettere allo stato di stabilizzarsi
        setTimeout(async () => {
          try {
            const user = await getCurrentUser();
            callback(user);
          } catch (error) {
            console.error('❌ Error getting user in listener:', error);
            callback(null);
          }
        }, 300);
        
      } else if (event === 'SIGNED_OUT') {
        console.log('✅ User signed out');
        callback(null);
      }
    });
    
    return () => {
      if (data?.subscription) {
        data.subscription.unsubscribe();
        console.log('🧹 Auth listener unsubscribed');
      }
    };
    
  } catch (error) {
    console.error('❌ Error setting up auth listener:', error);
    return () => {};
  }
};

// Inizializzazione
export const initializeAuth = async () => {
  console.log('🚀 Initialize auth');
  
  try {
    await waitForSupabaseReady();
    
    const hasSession = await hasValidSession();
    
    if (!hasSession) {
      console.log('ℹ️ No session at startup');
      return null;
    }
    
    console.log('✅ Session exists, getting user...');
    const user = await getCurrentUser();
    
    if (user) {
      console.log('🎉 Initialize success:', user.email);
    } else {
      console.log('ℹ️ Initialize: session exists but no user found');
    }
    
    return user;
    
  } catch (error) {
    console.error('❌ Initialize error:', error.message);
    return null;
  }
};

// Helper per pulire la cache (utile per debug)
export const clearAuthCache = () => {
  userCache = null;
  sessionCache = null;
  cacheTime = 0;
  console.log('🧹 Auth cache cleared');
};