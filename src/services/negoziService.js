// services/negoziService.js
import { supabase, handleResponse, prepareData } from './api/apiClient';
import * as authService from './authService';

// Ottieni tutti i negozi dell'utente corrente
export const getNegozi = async () => {
  // Ottieni l'utente corrente
  const currentUser = await authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('Utente non autenticato. Effettua il login e riprova.');
  }
  
  return handleResponse(
    supabase
      .from('negozi')
      .select('*')
      .eq('user_id', currentUser.id) // Filtro per l'utente corrente
      .order('nome')
  );
};

// Ottieni un negozio specifico tramite ID (solo se appartiene all'utente corrente)
export const getNegozioById = async (id) => {
  // Ottieni l'utente corrente
  const currentUser = await authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('Utente non autenticato. Effettua il login e riprova.');
  }
  
  const data = await handleResponse(
    supabase
      .from('negozi')
      .select('*')
      .eq('id', id)
      .eq('user_id', currentUser.id) // Verifica che il negozio appartenga all'utente corrente
      .single()
  );
  
  if (!data) {
    throw new Error('Negozio non trovato o non hai i permessi per accedervi');
  }
  
  return data;
};

// Salva un negozio (creazione o aggiornamento)
export const saveNegozio = async (negozioData, id = null) => {
  // Ottieni l'utente corrente
  const currentUser = await authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('Utente non autenticato. Effettua il login e riprova.');
  }
  
  // Converti i dati da camelCase a snake_case per il database
  const dbData = prepareData(negozioData);
  
  // Assicurati che user_id sia impostato
  if (!dbData.user_id) {
    dbData.user_id = currentUser.id;
  }
  
  // Se c'è un ID, aggiorna il negozio esistente
  if (id) {
    const data = await handleResponse(
      supabase
        .from('negozi')
        .update({
          ...dbData,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', currentUser.id) // Verifica che il negozio appartenga all'utente corrente
        .select()
        .single()
    );
    
    if (!data) {
      throw new Error('Negozio non trovato o non hai i permessi per modificarlo');
    }
    
    return data;
  } 
  // Altrimenti, crea un nuovo negozio
  else {
    const data = await handleResponse(
      supabase
        .from('negozi')
        .insert({
          ...dbData,
          user_id: dbData.user_id || currentUser.id, // Assicurati che user_id sia impostato
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
      nome: 'Riposo',
      sigla: '',
      predefinita: true,
      calcola_ore: false,
      ordine: 0,
      negozio_id: negozioId
    },
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

// Elimina un negozio (solo se appartiene all'utente corrente)
export const deleteNegozio = async (id) => {
  // Ottieni l'utente corrente
  const currentUser = await authService.getCurrentUser();
  if (!currentUser) {
    throw new Error('Utente non autenticato. Effettua il login e riprova.');
  }
  
  // Nota: grazie alle clausole ON DELETE CASCADE nelle foreign key,
  // l'eliminazione di un negozio eliminerà automaticamente tutti i record correlati
  return handleResponse(
    supabase
      .from('negozi')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id) // Verifica che il negozio appartenga all'utente corrente
  );
};