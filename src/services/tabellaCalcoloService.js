// src/services/tabellaCalcoloService.js
import { supabase, handleResponse, prepareData } from './api/apiClient';

const tabellaCalcoloService = {
  // Recupera i dati per la tabella di calcolo
  async fetchTabellaCalcoloData(negozioId, anno) {
    try {
      console.log(`📊 Fetching tabella calcolo data for negozio ${negozioId}, anno ${anno}`);
      
      const { data, error } = await supabase
        .from('tabelle_calcolo')
        .select('*')
        .eq('negozio_id', negozioId)
        .eq('anno', anno)
        .single();
      
      if (error) {
        // Se non trova dati (errore PGRST116), ritorna array vuoto invece di lanciare errore
        if (error.code === 'PGRST116') {
          console.log('📊 Nessuna tabella salvata trovata, ritorno array vuoto');
          return [];
        }
        throw error;
      }
      
      // Se data.dati è null o undefined, ritorna array vuoto
      return data?.dati || [];
    } catch (error) {
      console.error('Errore nel recupero dati tabella calcolo:', error);
      // In caso di errore, ritorna array vuoto invece di propagare l'errore
      return [];
    }
  },

  // Salva i dati modificati della tabella
  async saveTabellaCalcoloData(negozioId, anno, data) {
    try {
      console.log(`💾 Saving tabella calcolo data for negozio ${negozioId}, anno ${anno}`);
      
      // Verifica se esiste già un record
      const { data: existing, error: checkError } = await supabase
        .from('tabelle_calcolo')
        .select('id')
        .eq('negozio_id', negozioId)
        .eq('anno', anno)
        .single();
      
      const payload = {
        negozio_id: negozioId,
        anno: anno,
        dati: data,
        aggiornato_il: new Date().toISOString()
      };
      
      let result;
      if (existing && !checkError) {
        // Update esistente
        const { data: updateData, error: updateError } = await supabase
          .from('tabelle_calcolo')
          .update(payload)
          .eq('negozio_id', negozioId)
          .eq('anno', anno)
          .select()
          .single();
          
        if (updateError) throw updateError;
        result = updateData;
      } else {
        // Insert nuovo
        const { data: insertData, error: insertError } = await supabase
          .from('tabelle_calcolo')
          .insert(payload)
          .select()
          .single();
          
        if (insertError) throw insertError;
        result = insertData;
      }
      
      return result;
    } catch (error) {
      console.error('Errore nel salvataggio dati tabella calcolo:', error);
      throw error;
    }
  },

  // Recupera i dati storici dei turni per calcolare valori goduti
  async fetchStoriciTurni(negozioId, anno) {
    try {
      console.log(`📅 Fetching storico turni for negozio ${negozioId}, anno ${anno}`);
      
      // Prima ottieni gli ID dei dipendenti del negozio
      const { data: dipendenti, error: dipError } = await supabase
        .from('dipendenti')
        .select('id')
        .eq('negozio_id', negozioId);
        
      if (dipError) throw dipError;
      
      if (!dipendenti || dipendenti.length === 0) {
        return {};
      }
      
      const dipendentiIds = dipendenti.map(d => d.id);
      
      // Poi cerca le assenze
      const { data, error } = await supabase
        .from('storico_assenze')
        .select('dipendente_id, mese, tipo_assenza, valore')
        .in('dipendente_id', dipendentiIds)
        .eq('anno', anno);
        
      if (error) throw error;
      
      // Riorganizza i dati per dipendente/mese
      const organized = {};
      (data || []).forEach(record => {
        if (!organized[record.dipendente_id]) {
          organized[record.dipendente_id] = {};
        }
        if (!organized[record.dipendente_id][record.mese]) {
          organized[record.dipendente_id][record.mese] = {};
        }
        
        switch (record.tipo_assenza) {
          case 'ROL':
            organized[record.dipendente_id][record.mese].rolGoduti = record.valore;
            break;
          case 'EX_FEST':
            organized[record.dipendente_id][record.mese].exFestGodute = record.valore;
            break;
          case 'FERIE':
            organized[record.dipendente_id][record.mese].ferieGodute = record.valore;
            break;
        }
      });
      
      return organized;
    } catch (error) {
      console.error('Errore nel recupero storico turni:', error);
      return {};
    }
  },

  // Esporta la tabella in formato Excel (genera URL per download)
  async exportToExcel(negozioId, anno) {
    try {
      // Recupera i dati
      const data = await this.fetchTabellaCalcoloData(negozioId, anno);
      
      if (!data || data.length === 0) {
        throw new Error('Nessun dato da esportare');
      }
      
      // Per l'export Excel, dovrai implementare la logica lato client
      // usando la libreria xlsx come mostrato in excelExportUtils.js
      return data;
    } catch (error) {
      console.error('Errore nell\'export Excel:', error);
      throw error;
    }
  },

  // Calcola automaticamente i valori dai turni
  async calcolaValoriDaiTurni(negozioId, anno, mese) {
    try {
      console.log(`🧮 Calculating values from turni for ${negozioId}/${anno}/${mese}`);
      
      // Prima ottieni gli ID dei dipendenti del negozio
      const { data: dipendenti, error: dipError } = await supabase
        .from('dipendenti')
        .select('id')
        .eq('negozio_id', negozioId);
        
      if (dipError) throw dipError;
      
      if (!dipendenti || dipendenti.length === 0) {
        return {};
      }
      
      const dipendentiIds = dipendenti.map(d => d.id);
      
      // Recupera i valori calcolati per il mese specifico
      const { data: risultati, error } = await supabase
        .from('storico_assenze')
        .select('dipendente_id, tipo_assenza, valore')
        .in('dipendente_id', dipendentiIds)
        .eq('anno', anno)
        .eq('mese', mese);
        
      if (error) throw error;
      
      // Riorganizza per dipendente
      const calcolati = {};
      (risultati || []).forEach(record => {
        if (!calcolati[record.dipendente_id]) {
          calcolati[record.dipendente_id] = {};
        }
        
        switch (record.tipo_assenza) {
          case 'ROL':
            calcolati[record.dipendente_id].rolGoduti = record.valore;
            break;
          case 'EX_FEST':
            calcolati[record.dipendente_id].exFestGodute = record.valore;
            break;
          case 'FERIE':
            calcolati[record.dipendente_id].ferieGodute = record.valore;
            break;
        }
      });
      
      return calcolati;
    } catch (error) {
      console.error('Errore nel calcolo valori dai turni:', error);
      throw error;
    }
  },

  // Recupera le variazioni orarie per un dipendente
  async fetchVariazioniOrarie(dipendenteId, anno) {
    try {
      const { data, error } = await supabase
        .from('variazioni_orarie')
        .select('*')
        .eq('dipendente_id', dipendenteId)
        .eq('anno', anno)
        .order('mese_inizio', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Errore nel recupero variazioni orarie:', error);
      return [];
    }
  }
};

export default tabellaCalcoloService;