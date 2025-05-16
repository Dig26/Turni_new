// services/impostazioniService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni le impostazioni di un utente
export const getImpostazioniUtente = async (userId) => {
  const { data } = await supabase
    .from('impostazioni_utente')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!data) {
    // Se non esistono impostazioni, crea quelle predefinite
    return createImpostazioniDefault(userId);
  }
  
  return data;
};

// Crea le impostazioni predefinite per un utente
const createImpostazioniDefault = async (userId) => {
  const impostazioniDefault = {
    user_id: userId,
    tema_mode: 'light',
    primary_color: '#3498db',
    font_size: 'medium',
    preferenze: {},
    creato_il: new Date().toISOString(),
    aggiornato_il: new Date().toISOString()
  };
  
  const { data } = await supabase
    .from('impostazioni_utente')
    .insert(impostazioniDefault)
    .select()
    .single();
  
  return data;
};

// Salva le impostazioni di un utente
export const saveImpostazioniUtente = async (userId, impostazioni) => {
  // Verifica se esistono già impostazioni per questo utente
  const { data: esistente } = await supabase
    .from('impostazioni_utente')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (esistente) {
    // Aggiorna le impostazioni esistenti
    return handleResponse(
      supabase
        .from('impostazioni_utente')
        .update({
          ...impostazioni,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', esistente.id)
        .select()
        .single()
    );
  } else {
    // Crea nuove impostazioni
    return handleResponse(
      supabase
        .from('impostazioni_utente')
        .insert({
          ...impostazioni,
          user_id: userId,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
  }
};

// Aggiorna un singolo campo delle impostazioni
export const updateImpostazioneCampo = async (userId, campo, valore) => {
  // Verifica se esistono già impostazioni per questo utente
  const { data: esistente } = await supabase
    .from('impostazioni_utente')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (esistente) {
    // Aggiorna solo il campo specifico
    const updateData = {
      [campo]: valore,
      aggiornato_il: new Date().toISOString()
    };
    
    return handleResponse(
      supabase
        .from('impostazioni_utente')
        .update(updateData)
        .eq('id', esistente.id)
        .select()
        .single()
    );
  } else {
    // Crea nuove impostazioni con il campo specifico
    const impostazioniDefault = {
      user_id: userId,
      tema_mode: 'light',
      primary_color: '#3498db',
      font_size: 'medium',
      preferenze: {},
      [campo]: valore,
      creato_il: new Date().toISOString(),
      aggiornato_il: new Date().toISOString()
    };
    
    return handleResponse(
      supabase
        .from('impostazioni_utente')
        .insert(impostazioniDefault)
        .select()
        .single()
    );
  }
};