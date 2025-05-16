// services/authService.js
import { supabase, handleResponse } from './api/apiClient';

// Autenticazione e gestione utenti
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  
  // Ottieni i dettagli completi dell'utente dal database
  const userDetails = await handleResponse(
    supabase
      .from('utenti')
      .select('*')
      .eq('id', data.user.id)
      .single()
  );
  
  return userDetails;
};

export const login = async (email, password) => {
  const response = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (response.error) {
    throw new Error(response.error.message);
  }
  
  // Aggiorna l'ultimo accesso
  await supabase
    .from('utenti')
    .update({ ultimo_accesso: new Date().toISOString() })
    .eq('id', response.data.user.id);
  
  // Ottieni i dettagli completi dell'utente
  return await getCurrentUser();
};

export const register = async (nome, cognome, email, password) => {
  // Registrazione dell'utente in Supabase Auth
  const authResponse = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authResponse.error) {
    throw new Error(authResponse.error.message);
  }
  
  const userId = authResponse.data.user.id;
  
  // Inserisci i dettagli dell'utente nella tabella utenti
  const { data, error } = await supabase
    .from('utenti')
    .insert({
      id: userId,
      nome,
      cognome,
      email,
      password: '*****', // Non memorizzare mai la password reale
      role: 'user'
    })
    .select();
  
  if (error) {
    // Se c'è un errore, elimina anche l'utente da auth
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(error.message);
  }
  
  return data[0];
};

export const logout = async () => {
  await supabase.auth.signOut();
};

export const isAuthenticated = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Funzione per osservare i cambiamenti nello stato di autenticazione
export const onAuthStateChanged = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      getCurrentUser().then(user => callback(user));
    } else if (event === 'SIGNED_OUT') {
      callback(null);
    }
  });
  
  return data.subscription.unsubscribe;
};