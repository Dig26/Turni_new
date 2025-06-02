// services/authService.js
import { supabase } from './api/apiClient';

// Funzione per ottenere l'utente corrente
export const getCurrentUser = async () => {
  try {
    // Ottieni l'utente da Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser?.user) {
      console.log('ℹ️ Nessun utente autenticato');
      return null;
    }
    
    console.log('👤 Utente Auth trovato:', authUser.user.email);
    
    // Cerca l'utente nella tabella utenti tramite email
    const { data: dbUser, error: dbError } = await supabase
      .from('utenti')
      .select('*')
      .eq('email', authUser.user.email)
      .single();
    
    if (dbError) {
      console.error('❌ Errore ricerca utente in tabella:', dbError);
      
      // Se l'utente non esiste nella tabella ma è in Auth, è un problema
      if (dbError.code === 'PGRST116') { // Not found
        console.error('❌ PROBLEMA: Utente in Auth ma non in tabella utenti!');
        console.log('🔧 Prova a fare logout e registrarti di nuovo');
      }
      return null;
    }
    
    console.log('✅ Utente trovato nella tabella:', dbUser);
    return dbUser;
    
  } catch (error) {
    console.error('❌ Errore getCurrentUser:', error);
    return null;
  }
};

// Funzione per registrare un nuovo utente
export const register = async (nome, cognome, email, password) => {
  console.log('🔄 Inizio registrazione per:', email);
  
  try {
    // PASSO 1: Registrazione in Supabase Auth
    console.log('📝 Passo 1: Registrazione Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cognome,
          role: 'user'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Errore Supabase Auth:', authError);
      throw new Error(authError.message);
    }
    
    if (!authData.user) {
      throw new Error('Registrazione fallita - nessun utente creato in Auth');
    }
    
    console.log('✅ Passo 1 completato - Utente Auth creato:', authData.user.email);
    
    // PASSO 2: Inserimento nella tabella utenti (OBBLIGATORIO)
    console.log('📝 Passo 2: Inserimento nella tabella utenti...');
    
    const { data: dbUser, error: dbError } = await supabase
      .from('utenti')
      .insert({
        nome,
        cognome,
        email,
        password: 'managed_by_supabase_auth', // Placeholder
        role: 'user'
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('❌ ERRORE CRITICO: Inserimento in tabella utenti fallito:', dbError);
      
      // Se l'inserimento nella tabella fallisce, elimina anche l'utente da Auth
      console.log('🔄 Rollback: eliminazione utente da Auth...');
      try {
        await supabase.auth.signOut();
      } catch (rollbackError) {
        console.error('❌ Errore durante rollback:', rollbackError);
      }
      
      // Rilancia l'errore con messaggio chiaro
      if (dbError.code === '23505') { // Unique constraint violation
        throw new Error('Un utente con questa email esiste già');
      } else if (dbError.message?.includes('permission denied') || dbError.message?.includes('RLS')) {
        throw new Error('Errore di permessi database. Contatta l\'amministratore.');
      } else {
        throw new Error(`Errore database: ${dbError.message}`);
      }
    }
    
    console.log('✅ Passo 2 completato - Utente inserito in tabella:', dbUser);
    console.log('🎉 Registrazione completata con successo!');
    
    return dbUser;
    
  } catch (error) {
    console.error('❌ Errore completo registrazione:', error);
    throw error;
  }
};

// Funzione per il login
export const login = async (email, password) => {
  console.log('🔄 Tentativo login per:', email);
  
  try {
    // PASSO 1: Login Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('❌ Errore login Auth:', authError);
      throw new Error(authError.message);
    }
    
    console.log('✅ Login Auth riuscito per:', authData.user.email);
    
    // PASSO 2: Verifica esistenza nella tabella utenti
    const dbUser = await getCurrentUser();
    
    if (!dbUser) {
      console.error('❌ PROBLEMA: Utente autenticato ma non trovato nella tabella utenti');
      
      // Logout automatico se l'utente non esiste nella tabella
      await supabase.auth.signOut();
      throw new Error('Account non trovato nel database. Contatta l\'amministratore.');
    }
    
    // PASSO 3: Aggiorna ultimo accesso
    try {
      await supabase
        .from('utenti')
        .update({ ultimo_accesso: new Date().toISOString() })
        .eq('id', dbUser.id);
      console.log('✅ Ultimo accesso aggiornato');
    } catch (updateError) {
      console.warn('⚠️ Errore aggiornamento ultimo accesso:', updateError);
      // Non bloccare il login per questo
    }
    
    console.log('🎉 Login completato con successo!');
    return dbUser;
    
  } catch (error) {
    console.error('❌ Errore login:', error);
    throw error;
  }
};

// Funzione per il logout
export const logout = async () => {
  console.log('🔄 Logout in corso...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Errore logout:', error);
      throw error;
    }
    
    console.log('✅ Logout completato');
  } catch (error) {
    console.error('❌ Errore nel logout:', error);
    // Non fare throw per il logout
  }
};

// Funzione per verificare se l'utente è autenticato
export const isAuthenticated = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Errore verifica sessione:', error);
      return false;
    }
    
    const isAuth = !!data.session;
    return isAuth;
  } catch (error) {
    console.error('❌ Errore isAuthenticated:', error);
    return false;
  }
};

// Funzione per osservare i cambiamenti nello stato di autenticazione
export const onAuthStateChanged = (callback) => {
  console.log('👂 Setup listener auth state changes');
  
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔄 Auth state change:', event, !!session);
    
    if (session?.user) {
      // Quando c'è una sessione, ottieni l'utente completo dalla tabella
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
  
  return data.subscription.unsubscribe;
};

// Funzione di utilità per sincronizzare utenti esistenti
export const syncExistingUser = async (authUser) => {
  console.log('🔄 Sincronizzazione utente esistente:', authUser.email);
  
  try {
    const { data, error } = await supabase
      .from('utenti')
      .insert({
        nome: authUser.user_metadata?.nome || authUser.email.split('@')[0],
        cognome: authUser.user_metadata?.cognome || '',
        email: authUser.email,
        password: 'managed_by_supabase_auth',
        role: authUser.user_metadata?.role || 'user'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Errore sincronizzazione:', error);
      return null;
    }
    
    console.log('✅ Utente sincronizzato:', data);
    return data;
  } catch (error) {
    console.error('❌ Errore sync:', error);
    return null;
  }
};