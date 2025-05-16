// services/particolaritaService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutte le particolarità di un negozio
export const getParticolaritaByNegozio = async (negozioId) => {
  const particolarita = await handleResponse(
    supabase
      .from('particolarita')
      .select('*')
      .eq('negozio_id', negozioId)
      .order('nome')
  );
  
  return { negozioId, particolarita };
};

// Salva una particolarità (creazione o aggiornamento)
export const saveParticolarita = async (particolaritaData, negozioId, id = null) => {
  // Se c'è un ID, aggiorna la particolarità esistente
  if (id) {
    const data = await handleResponse(
      supabase
        .from('particolarita')
        .update({
          ...particolaritaData,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    );
    
    return { particolarita: data, negozioId };
  } 
  // Altrimenti, crea una nuova particolarità
  else {
    // Verifica che la sigla non sia già in uso per quel negozio
    const { data: esistente } = await supabase
      .from('particolarita')
      .select('id')
      .eq('sigla', particolaritaData.sigla)
      .eq('negozio_id', negozioId);
    
    if (esistente && esistente.length > 0) {
      throw new Error(`La sigla "${particolaritaData.sigla}" è già in uso in questo negozio`);
    }
    
    const data = await handleResponse(
      supabase
        .from('particolarita')
        .insert({
          ...particolaritaData,
          negozio_id: negozioId,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
    
    return { particolarita: data, negozioId };
  }
};

// Elimina una particolarità
export const deleteParticolarita = async (id, negozioId) => {
  return handleResponse(
    supabase
      .from('particolarita')
      .delete()
      .eq('id', id)
      .eq('negozio_id', negozioId)
  );
};