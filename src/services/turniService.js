// services/turniService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutte le tabelle turni di un negozio
export const getTabelleByNegozio = async (negozioId) => {
  return handleResponse(
    supabase
      .from('tabelle_turni')
      .select('*')
      .eq('negozio_id', negozioId)
      .order('anno', { ascending: false })
      .order('mese', { ascending: false })
  );
};

// Ottieni una tabella turni specifica
export const getTabellaById = async (id) => {
  const tabella = await handleResponse(
    supabase
      .from('tabelle_turni')
      .select(`
        *,
        dati_turni (*)
      `)
      .eq('id', id)
      .single()
  );
  
  if (!tabella) {
    throw new Error('Tabella turni non trovata');
  }
  
  return tabella;
};

// Ottieni una tabella turni per negozio, anno e mese
export const getTabellaByPeriodo = async (negozioId, anno, mese) => {
  const { data } = await supabase
    .from('tabelle_turni')
    .select(`
      *,
      dati_turni (*)
    `)
    .eq('negozio_id', negozioId)
    .eq('anno', anno)
    .eq('mese', mese)
    .maybeSingle();
  
  return data;
};

// Salva una tabella turni (creazione o aggiornamento)
export const saveTabella = async ({ negozioId, anno, mese, nome, dati }) => {
  const timestamp = new Date().toISOString();
  
  try {
    // Verifica se esiste già una tabella per questo periodo
    const { data: tabellaTrovata } = await supabase
      .from('tabelle_turni')
      .select('id')
      .eq('negozio_id', negozioId)
      .eq('anno', anno)
      .eq('mese', mese)
      .maybeSingle();
    
    let tabellaId;
    
    // Se la tabella esiste, aggiornala
    if (tabellaTrovata) {
      tabellaId = tabellaTrovata.id;
      
      await supabase
        .from('tabelle_turni')
        .update({
          nome: nome || `Tabella ${mese+1}/${anno}`,
          aggiornato_il: timestamp
        })
        .eq('id', tabellaId);
    } 
    // Altrimenti, crea una nuova tabella
    else {
      const { data: nuovaTabella } = await supabase
        .from('tabelle_turni')
        .insert({
          nome: nome || `Tabella ${mese+1}/${anno}`,
          anno,
          mese,
          negozio_id: negozioId,
          creato_il: timestamp,
          aggiornato_il: timestamp
        })
        .select()
        .single();
      
      tabellaId = nuovaTabella.id;
    }
    
    // Ora gestisci i dati della tabella
    const { data: datiTrovati } = await supabase
      .from('dati_turni')
      .select('id')
      .eq('tabella_id', tabellaId)
      .maybeSingle();
    
    // Se esistono già i dati, aggiornali
    if (datiTrovati) {
      await supabase
        .from('dati_turni')
        .update({
          dati: dati.data || {},
          riepilogo: dati.riepilogo || {},
          variazioni_orarie: dati.employeeVariations || {},
          aggiornato_il: timestamp
        })
        .eq('id', datiTrovati.id);
    } 
    // Altrimenti, crea nuovi dati
    else {
      await supabase
        .from('dati_turni')
        .insert({
          tabella_id: tabellaId,
          dati: dati.data || {},
          riepilogo: dati.riepilogo || {},
          variazioni_orarie: dati.employeeVariations || {},
          creato_il: timestamp,
          aggiornato_il: timestamp
        });
    }
    
    // Ritorna la tabella completa
    return await getTabellaById(tabellaId);
  } catch (error) {
    console.error('Errore nel salvataggio della tabella turni:', error);
    throw error;
  }
};

// Elimina una tabella turni
export const deleteTabella = async (id) => {
  return handleResponse(
    supabase
      .from('tabelle_turni')
      .delete()
      .eq('id', id)
  );
};

// Ottieni i dettagli dei turni giornalieri
export const getDettagliTurni = async (tabellaId) => {
  return handleResponse(
    supabase
      .from('dettagli_turni')
      .select(`
        *,
        dipendenti (id, nome, cognome, nome_turno),
        motivazioni:motivazione_id (id, nome, sigla)
      `)
      .eq('tabella_id', tabellaId)
  );
};

// Salva un dettaglio turno giornaliero
export const saveDettaglioTurno = async (dettaglio) => {
  const { id, ...dettaglioData } = dettaglio;
  
  if (id) {
    return handleResponse(
      supabase
        .from('dettagli_turni')
        .update({
          ...dettaglioData,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    );
  } else {
    return handleResponse(
      supabase
        .from('dettagli_turni')
        .insert({
          ...dettaglioData,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
  }
};

// Funzione per ottenere i fatturati giornalieri
export const getFatturatiGiornalieri = async (tabellaId) => {
  return handleResponse(
    supabase
      .from('fatturati_giornalieri')
      .select('*')
      .eq('tabella_id', tabellaId)
      .order('giorno')
  );
};

// Salva un fatturato giornaliero
export const saveFatturatoGiornaliero = async (fatturato) => {
  const { id, ...fatturatoData } = fatturato;
  
  if (id) {
    return handleResponse(
      supabase
        .from('fatturati_giornalieri')
        .update({
          ...fatturatoData,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    );
  } else {
    return handleResponse(
      supabase
        .from('fatturati_giornalieri')
        .insert({
          ...fatturatoData,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
  }
};

// Funzione per ottenere le variazioni orarie di un dipendente
export const getVariazioniOrarie = async (dipendenteId) => {
  return handleResponse(
    supabase
      .from('variazioni_orarie')
      .select('*')
      .eq('dipendente_id', dipendenteId)
      .order('data_inizio')
  );
};

// Salva una variazione oraria
export const saveVariazioneOraria = async (variazione) => {
  const { id, ...variazioneData } = variazione;
  
  if (id) {
    return handleResponse(
      supabase
        .from('variazioni_orarie')
        .update({
          ...variazioneData,
          aggiornato_il: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    );
  } else {
    return handleResponse(
      supabase
        .from('variazioni_orarie')
        .insert({
          ...variazioneData,
          creato_il: new Date().toISOString(),
          aggiornato_il: new Date().toISOString()
        })
        .select()
        .single()
    );
  }
};

// Elimina una variazione oraria
export const deleteVariazioneOraria = async (id) => {
  return handleResponse(
    supabase
      .from('variazioni_orarie')
      .delete()
      .eq('id', id)
  );
};

// Funzione per salvare in massa i dettagli turni da un oggetto tabella
export const saveTabellaDettagli = async (tabellaId, dipendenti, datiTabella) => {
  try {
    // Crea un array di operazioni batch per i dettagli turni
    const dettagliTurni = [];
    const giorni = Object.keys(datiTabella).filter(key => !isNaN(key));
    
    for (const giorno of giorni) {
      const giornoNum = parseInt(giorno);
      if (giornoNum < 1 || giornoNum > 31) continue;
      
      for (const dipendente of dipendenti) {
        const orarioInizio = datiTabella[giorno][`inizio_${dipendente.id}`];
        const orarioFine = datiTabella[giorno][`fine_${dipendente.id}`];
        const motivazione = datiTabella[giorno][`motivazione_${dipendente.id}`];
        const note = datiTabella[giorno][`note_${dipendente.id}`];
        
        // Se ci sono dati per questo dipendente in questo giorno
        if (orarioInizio || orarioFine || motivazione) {
          // Calcola le ore lavorate in base agli orari
          let oreLavorate = null;
          let pausaInclusa = false;
          
          if (orarioInizio && orarioFine && !motivazione) {
            // Calcolo semplificato delle ore lavorate
            const [inizioOre, inizioMinuti] = orarioInizio.split(':').map(Number);
            const [fineOre, fineMinuti] = orarioFine.split(':').map(Number);
            
            let minutiTotali = (fineOre * 60 + fineMinuti) - (inizioOre * 60 + inizioMinuti);
            // Gestisci il caso in cui il turno finisca il giorno dopo
            if (minutiTotali < 0) minutiTotali += 24 * 60;
            
            // Se il turno è più lungo di 6 ore, sottrai 30 minuti di pausa
            if (minutiTotali > 360) {
              minutiTotali -= 30;
              pausaInclusa = true;
            }
            
            oreLavorate = parseFloat((minutiTotali / 60).toFixed(2));
          }
          
          dettagliTurni.push({
            tabella_id: tabellaId,
            dipendente_id: dipendente.id,
            giorno: giornoNum,
            orario_inizio: orarioInizio || null,
            orario_fine: orarioFine || null,
            ore_lavorate: oreLavorate,
            pausa_inclusa: pausaInclusa,
            motivazione_id: motivazione || null,
            note: note || null
          });
        }
      }
    }
    
    // Se ci sono dettagli turni da salvare
    if (dettagliTurni.length > 0) {
      // Prima elimina i dettagli esistenti per evitare duplicati
      await supabase
        .from('dettagli_turni')
        .delete()
        .eq('tabella_id', tabellaId);
      
      // Poi inserisci i nuovi dettagli
      await handleResponse(
        supabase
          .from('dettagli_turni')
          .insert(dettagliTurni)
      );
    }
    
    return { success: true, count: dettagliTurni.length };
  } catch (error) {
    console.error('Errore nel salvataggio dei dettagli turni:', error);
    throw error;
  }
};