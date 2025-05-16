// services/notificheService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutte le notifiche di un utente
export const getNotificheByUtente = async (userId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .select('*')
      .eq('user_id', userId)
      .order('creato_il', { ascending: false })
  );
};

// Ottieni tutte le notifiche non lette di un utente
export const getNotificheNonLette = async (userId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .select('*')
      .eq('user_id', userId)
      .eq('letta', false)
      .order('creato_il', { ascending: false })
  );
};

// Crea una nuova notifica
export const createNotifica = async (notificaData) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .insert({
        ...notificaData,
        letta: false,
        creato_il: new Date().toISOString()
      })
      .select()
      .single()
  );
};

// Segna una notifica come letta
export const markNotificaAsRead = async (notificaId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .update({ letta: true })
      .eq('id', notificaId)
      .select()
      .single()
  );
};

// Segna tutte le notifiche di un utente come lette
export const markAllNotificheAsRead = async (userId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .update({ letta: true })
      .eq('user_id', userId)
      .eq('letta', false)
  );
};

// Elimina una notifica
export const deleteNotifica = async (notificaId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .delete()
      .eq('id', notificaId)
  );
};

// Elimina tutte le notifiche di un utente
export const deleteAllNotifiche = async (userId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .delete()
      .eq('user_id', userId)
  );
};

// Elimina tutte le notifiche lette di un utente
export const deleteReadNotifiche = async (userId) => {
  return handleResponse(
    supabase
      .from('notifiche')
      .delete()
      .eq('user_id', userId)
      .eq('letta', true)
  );
};

// Crea notifiche per più utenti (es. per un gruppo)
export const createNotificheForUsers = async (userIds, notificaBase) => {
  // Crea un array di notifiche da inserire
  const notifiche = userIds.map(userId => ({
    ...notificaBase,
    user_id: userId,
    letta: false,
    creato_il: new Date().toISOString()
  }));
  
  return handleResponse(
    supabase
      .from('notifiche')
      .insert(notifiche)
  );
};

// Ottieni il conteggio delle notifiche non lette
export const getUnreadCount = async (userId) => {
  const { count } = await supabase
    .from('notifiche')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('letta', false);
  
  return count || 0;
};

// Ascolta le nuove notifiche in tempo reale (utile per interfaccia utente)
export const subscribeToNotifiche = (userId, callback) => {
  const subscription = supabase
    .channel(`notifiche:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifiche',
      filter: `user_id=eq.${userId}`
    }, payload => {
      callback(payload.new);
    })
    .subscribe();
  
  // Ritorna la funzione per cancellare la sottoscrizione
  return () => {
    supabase.removeChannel(subscription);
  };
};