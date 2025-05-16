// services/dipendentiService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutti i dipendenti di un negozio
export const getDipendentiByNegozioId = async (negozioId) => {
  return handleResponse(
    supabase
      .from('dipendenti')
      .select('*')
      .eq('negozio_id', negozioId)
      .order('cognome')
  );
};

// Ottieni un dipendente specifico tramite ID
export const getDipendenteById = async (id) => {
  const data = await handleResponse(
    supabase
      .from('dipendenti')
      .select('*')
      .eq('id', id)
      .single()
  );
  
  if (!data) {
    throw new Error('Dipendente non trovato');
  }
  
  return data;
};

// Salva un dipendente (creazione o aggiornamento)
export const saveDipendente = async (dipendenteData, id = null) => {
  // Prepara i dati del dipendente
  const dipendente = {
    ...dipendenteData,
    // Assicurati che nome_turno sia valorizzato
    nome_turno: dipendenteData.nome_turno || `${dipendenteData.nome} ${dipendenteData.cognome.charAt(0)}.`
  };
  
  // Se c'è un ID, aggiorna il dipendente esistente
  if (id) {
    const data = await handleResponse(
      supabase
        .from('dipendenti')
        .update({
          ...dipendente,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    );
    
    return data;
  } 
  // Altrimenti, crea un nuovo dipendente
  else {
    const data = await handleResponse(
      supabase
        .from('dipendenti')
        .insert({
          ...dipendente,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
    
    return data;
  }
};

// Elimina un dipendente
export const deleteDipendente = async (id) => {
  return handleResponse(
    supabase
      .from('dipendenti')
      .delete()
      .eq('id', id)
  );
};

// Elimina tutti i dipendenti di un negozio (usato quando si elimina un negozio)
export const deleteDipendentiByNegozioId = async (negozioId) => {
  return handleResponse(
    supabase
      .from('dipendenti')
      .delete()
      .eq('negozio_id', negozioId)
  );
};