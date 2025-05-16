// services/negoziService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutti i negozi
export const getNegozi = async () => {
  return handleResponse(
    supabase
      .from('negozi')
      .select('*')
      .order('nome')
  );
};

// Ottieni un negozio specifico tramite ID
export const getNegozioById = async (id) => {
  const data = await handleResponse(
    supabase
      .from('negozi')
      .select('*')
      .eq('id', id)
      .single()
  );
  
  if (!data) {
    throw new Error('Negozio non trovato');
  }
  
  return data;
};

// Salva un negozio (creazione o aggiornamento)
export const saveNegozio = async (negozioData, id = null) => {
  // Se c'è un ID, aggiorna il negozio esistente
  if (id) {
    const data = await handleResponse(
      supabase
        .from('negozi')
        .update({
          ...negozioData,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    );
    
    return data;
  } 
  // Altrimenti, crea un nuovo negozio
  else {
    const data = await handleResponse(
      supabase
        .from('negozi')
        .insert({
          ...negozioData,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
    
    // Dopo la creazione di un nuovo negozio, inserisci le motivazioni assenze predefinite
    await inserisciMotivazioniPredefinite(data.id);
    
    return data;
  }
};

// Funzione per inserire le motivazioni assenze predefinite per un nuovo negozio
const inserisciMotivazioniPredefinite = async (negozioId) => {
  const motivazioniPredefinite = [
    {
      nome: 'Ferie',
      sigla: 'FE',
      predefinita: true,
      calcola_ore: true,
      ordine: 1,
      negozio_id: negozioId
    },
    {
      nome: 'ROL',
      sigla: 'RL',
      predefinita: true,
      calcola_ore: true,
      ordine: 2,
      negozio_id: negozioId
    },
    {
      nome: 'EX Festività',
      sigla: 'EX',
      predefinita: true,
      calcola_ore: true,
      ordine: 3,
      negozio_id: negozioId
    }
  ];
  
  await handleResponse(
    supabase
      .from('motivazioni_assenze')
      .insert(motivazioniPredefinite)
  );
};

// Elimina un negozio
export const deleteNegozio = async (id) => {
  // Nota: grazie alle clausole ON DELETE CASCADE nelle foreign key,
  // l'eliminazione di un negozio eliminerà automaticamente tutti i record correlati
  return handleResponse(
    supabase
      .from('negozi')
      .delete()
      .eq('id', id)
  );
};