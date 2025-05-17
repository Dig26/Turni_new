// services/authService.js
import { supabase, handleResponse } from './api/apiClient';

// Funzione per ottenere l'ultimo ID autogenerato dalla tabella utenti
async function getLastUserId() {
  try {
    const { data, error } = await supabase
      .from('utenti')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
      
    if (error) throw error;
    return data && data.length > 0 ? data[0].id : 0;
  } catch (error) {
    console.error('Errore nel recupero dell\'ultimo ID utente:', error);
    return 0;
  }
}

// Funzione per ottenere l'utente corrente
export const getCurrentUser = async () => {
  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser || !authUser.user) return null;
  
  try {
    // Cerca l'utente nella tabella utenti tramite email
    const { data, error } = await supabase
      .from('utenti')
      .select('*')
      .eq('email', authUser.user.email)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Errore nel recupero dell\'utente:', error);
    return null;
  }
};

// Funzione per registrare un nuovo utente
export const register = async (nome, cognome, email, password) => {
  try {
    // Prima registrazione in Supabase Auth
    const authResponse = await supabase.auth.signUp({
      email,
      password
    });
    
    if (authResponse.error) {
      throw authResponse.error;
    }
    
    // Ottieni l'ultimo ID utente
    const lastId = await getLastUserId();
    const newId = lastId + 1;
    
    // Inserisci i dettagli dell'utente nella tabella utenti
    const { data, error } = await supabase
      .from('utenti')
      .insert({
        id: newId,
        nome,
        cognome,
        email,
        password: '*****', // Non memorizzare mai la password reale
        role: 'user'
      })
      .select();
    
    if (error) {
      // Se c'è un errore, elimina anche l'utente da auth
      try {
        await supabase.auth.admin.deleteUser(authResponse.data.user.id);
      } catch (deleteError) {
        console.error('Errore nella rimozione dell\'utente auth:', deleteError);
      }
      throw error;
    }
    
    return data[0];
  } catch (error) {
    console.error('Errore nella registrazione:', error);
    throw error;
  }
};

// Funzione per il login
export const login = async (email, password) => {
  try {
    const response = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (response.error) {
      throw response.error;
    }
    
    // Ottieni i dettagli completi dell'utente
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      throw new Error('Utente non trovato nel database locale');
    }
    
    // Aggiorna l'ultimo accesso
    await supabase
      .from('utenti')
      .update({ ultimo_accesso: new Date().toISOString() })
      .eq('id', dbUser.id);
    
    return dbUser;
  } catch (error) {
    console.error('Errore nel login:', error);
    throw error;
  }
};

// Funzione per il logout
export const logout = async () => {
  await supabase.auth.signOut();
};

// Funzione per verificare se l'utente è autenticato
export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Funzione per osservare i cambiamenti nello stato di autenticazione
export const onAuthStateChanged = (callback) => {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      const user = await getCurrentUser();
      callback(user);
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
  
  return data.subscription.unsubscribe;
};