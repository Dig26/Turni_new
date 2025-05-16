// services/motivazioniService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutte le motivazioni assenze di un negozio
export const getMotivazioniByNegozio = async (negozioId) => {
  try {
    console.log(`getMotivazioniByNegozio chiamato per negozioId: ${negozioId}`);
    
    // Recupera le motivazioni dal database
    const motivazioni = await handleResponse(
      supabase
        .from('motivazioni_assenze')
        .select('*')
        .eq('negozio_id', negozioId)
        .order('ordine')
    );
    
    console.log(`Motivazioni restituite per negozioId ${negozioId}:`, motivazioni);
    
    // Se non ci sono motivazioni, crea quelle predefinite
    if (motivazioni.length === 0) {
      console.log(`Nessuna motivazione trovata, inserimento predefinite per negozio ${negozioId}`);
      await inserisciMotivazioniPredefinite(negozioId);
      
      // Recupera nuovamente le motivazioni
      const nuoveMotivazioni = await handleResponse(
        supabase
          .from('motivazioni_assenze')
          .select('*')
          .eq('negozio_id', negozioId)
          .order('ordine')
      );
      
      return { negozioId, motivazioni: nuoveMotivazioni };
    }
    
    return { negozioId, motivazioni };
  } catch (error) {
    console.error("Errore durante il recupero delle motivazioni:", error);
    throw error;
  }
};

// Funzione per inserire le motivazioni predefinite
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
  
  return handleResponse(
    supabase
      .from('motivazioni_assenze')
      .insert(motivazioniPredefinite)
  );
};

// Salva una motivazione (creazione o aggiornamento)
export const saveMotivazione = async (motivazioneData, negozioId, id = null) => {
  try {
    console.log(`saveMotivazione chiamato con:`, { motivazioneData, negozioId, id });
    
    // Se c'è un ID, aggiorna la motivazione esistente
    if (id) {
      // Verifica prima se è una motivazione predefinita
      const motivazioneEsistente = await handleResponse(
        supabase
          .from('motivazioni_assenze')
          .select('predefinita, ordine, calcola_ore')
          .eq('id', id)
          .single()
      );
      
      // Se è predefinita, preserva alcuni campi
      let dataToUpdate = { ...motivazioneData };
      
      if (motivazioneEsistente.predefinita) {
        dataToUpdate = {
          ...dataToUpdate,
          predefinita: true,
          ordine: motivazioneEsistente.ordine,
          calcola_ore: motivazioneEsistente.calcola_ore
        };
      }
      
      const data = await handleResponse(
        supabase
          .from('motivazioni_assenze')
          .update({
            ...dataToUpdate,
            aggiornato_il: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
      );
      
      return { motivazione: data, negozioId };
    } 
    // Altrimenti, crea una nuova motivazione
    else {
      // Trova l'ordine massimo esistente
      const { data: maxOrdine } = await supabase
        .from('motivazioni_assenze')
        .select('ordine')
        .eq('negozio_id', negozioId)
        .order('ordine', { ascending: false })
        .limit(1);
      
      const nuovoOrdine = maxOrdine.length > 0 ? maxOrdine[0].ordine + 1 : 1;
      
      const data = await handleResponse(
        supabase
          .from('motivazioni_assenze')
          .insert({
            ...motivazioneData,
            negozio_id: negozioId,
            predefinita: false, // Le nuove motivazioni non sono predefinite
            calcola_ore: motivazioneData.calcola_ore || false,
            ordine: nuovoOrdine,
            creato_il: new Date().toISOString(),
            aggiornato_il: new Date().toISOString()
          })
          .select()
          .single()
      );
      
      return { motivazione: data, negozioId };
    }
  } catch (error) {
    console.error("Errore durante il salvataggio della motivazione:", error);
    throw error;
  }
};

// Elimina una motivazione
export const deleteMotivazione = async (id, negozioId) => {
  try {
    console.log(`deleteMotivazione chiamato per id: ${id}, negozioId: ${negozioId}`);
    
    // Verifica se è una motivazione predefinita
    const { data: motivazione } = await supabase
      .from('motivazioni_assenze')
      .select('predefinita')
      .eq('id', id)
      .single();
    
    if (motivazione && motivazione.predefinita) {
      throw new Error('Le motivazioni predefinite non possono essere eliminate');
    }
    
    await handleResponse(
      supabase
        .from('motivazioni_assenze')
        .delete()
        .eq('id', id)
    );
    
    return true;
  } catch (error) {
    console.error("Errore durante l'eliminazione della motivazione:", error);
    throw error;
  }
};