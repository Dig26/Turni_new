// services/authService.js - VERSIONE PRODUCTION-READY (locale + online)
import { supabase } from './api/apiClient';

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

// Funzione per ottenere l'utente dalla sessione (più affidabile di getUser)
const getUserFromSession = async () => {
  try {
    const { data: sessionData, error } = await withTimeout(supabase.auth.getSession(), 3000);
    
    if (error || !sessionData?.session?.user) {
      console.log('ℹ️ No active session');
      return null;
    }
    
    const authUser = sessionData.session.user;
    console.log('✅ Session user found:', authUser.email);
    
    // Ora cerca l'utente nella tabella utenti usando l'email
    const { data: dbUser, error: dbError } = await withTimeout(
      supabase
        .from('utenti')
        .select('*')
        .eq('email', authUser.email)
        .single(),
      3000
    );
    
    if (dbError) {
      console.error('❌ Error getting user from database:', dbError.message);
      
      if (dbError.code === 'PGRST116') { // Not found
        console.warn('⚠️ User exists in auth but not in utenti table');
        
        // Tentativo di auto-sincronizzazione
        console.log('🔄 Attempting to sync user to database...');
        try {
          const { data: newUser, error: insertError } = await supabase
            .from('utenti')
            .insert({
              nome: authUser.user_metadata?.nome || authUser.email.split('@')[0],
              cognome: authUser.user_metadata?.cognome || 'User',
              email: authUser.email,
              password: 'managed_by_supabase_auth',
              role: authUser.user_metadata?.role || 'user'
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Failed to sync user:', insertError.message);
            return null;
          }
          
          console.log('✅ User synced successfully:', newUser);
          return newUser;
          
        } catch (syncError) {
          console.error('❌ Sync attempt failed:', syncError);
          return null;
        }
      }
      return null;
    }
    
    console.log('✅ Database user found:', { id: dbUser.id, email: dbUser.email });
    return dbUser;
    
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

// Register
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
    
    // Inserimento nella tabella utenti
    const { data: dbUser, error: dbError } = await withTimeout(
      supabase
        .from('utenti')
        .insert({
          nome,
          cognome,
          email,
          password: 'managed_by_supabase_auth',
          role: 'user'
        })
        .select()
        .single(),
      5000
    );
    
    if (dbError) {
      console.error('❌ Database insert error:', dbError.message);
      
      // Rollback: elimina utente da Auth
      try {
        await supabase.auth.signOut();
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
      
      if (dbError.code === '23505') {
        throw new Error('Un utente con questa email esiste già');
      } else {
        throw new Error(`Errore database: ${dbError.message}`);
      }
    }
    
    console.log('🎉 Register completed:', dbUser.email);
    return dbUser;
    
  } catch (error) {
    console.error('❌ Register failed:', error.message);
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