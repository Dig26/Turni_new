// src/services/tabellaCalcoloService.js
import { supabase, handleResponse, prepareData } from './api/apiClient';

const tabellaCalcoloService = {
  // Recupera i dati per la tabella di calcolo
  async fetchTabellaCalcoloData(negozioId, anno) {
    try {
      console.log(`📊 Fetching tabella calcolo data for negozio ${negozioId}, anno ${anno}`);
      
      const promise = supabase
        .from('tabelle_calcolo')
        .select('*')
        .eq('negozio_id', negozioId)
        .eq('anno', anno)
        .single();
      
      const data = await handleResponse(promise);
      return data ? data.dati : null;
    } catch (error) {
      // Se non trova dati, ritorna null invece di lanciare errore
      if (error.code === 'PGRST116') {
        console.log('📊 Nessuna tabella salvata trovata');
        return null;
      }
      console.error('Errore nel recupero dati tabella calcolo:', error);
      throw error;
    }
  },

  // Salva i dati modificati della tabella
  async saveTabellaCalcoloData(negozioId, anno, data) {
    try {
      console.log(`💾 Saving tabella calcolo data for negozio ${negozioId}, anno ${anno}`);
      
      // Verifica se esiste già
      const { data: existing } = await supabase
        .from('tabelle_calcolo')
        .select('id')
        .eq('negozio_id', negozioId)
        .eq('anno', anno)
        .single();
      
      const payload = prepareData({
        negozioId,
        anno,
        dati: data,
        aggiornatoIl: new Date().toISOString()
      });
      
      let promise;
      if (existing) {
        // Update
        promise = supabase
          .from('tabelle_calcolo')
          .update(payload)
          .eq('negozio_id', negozioId)
          .eq('anno', anno)
          .select();
      } else {
        // Insert
        promise = supabase
          .from('tabelle_calcolo')
          .insert(payload)
          .select();
      }
      
      return await handleResponse(promise);
    } catch (error) {
      console.error('Errore nel salvataggio dati tabella calcolo:', error);
      throw error;
    }
  },

  // Recupera i dati storici dei turni per calcolare valori goduti
  async fetchStoriciTurni(negozioId, anno) {
    try {
      console.log(`📅 Fetching storico turni for negozio ${negozioId}, anno ${anno}`);
      
      const promise = supabase
        .from('storico_assenze')
        .select(`
          dipendente_id,
          mese,
          tipo_assenza,
          valore
        `)
        .in('dipendente_id', 
          supabase
            .from('dipendenti')
            .select('id')
            .eq('negozio_id', negozioId)
        )
        .eq('anno', anno);
      
      const data = await handleResponse(promise);
      
      // Riorganizza i dati per dipendente/mese
      const organized = {};
      data?.forEach(record => {
        if (!organized[record.dipendenteId]) {
          organized[record.dipendenteId] = {};
        }
        if (!organized[record.dipendenteId][record.mese]) {
          organized[record.dipendenteId][record.mese] = {};
        }
        
        switch (record.tipoAssenza) {
          case 'ROL':
            organized[record.dipendenteId][record.mese].rolGoduti = record.valore;
            break;
          case 'EX_FEST':
            organized[record.dipendenteId][record.mese].exFestGodute = record.valore;
            break;
          case 'FERIE':
            organized[record.dipendenteId][record.mese].ferieGodute = record.valore;
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
      
      if (!data) {
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
      
      // Chiama la stored procedure per sincronizzare i dati
      const { data, error } = await supabase
        .rpc('sync_storico_assenze_da_turni', {
          p_negozio_id: negozioId,
          p_anno: anno
        });
      
      if (error) throw error;
      
      // Recupera i valori calcolati per il mese specifico
      const promise = supabase
        .from('storico_assenze')
        .select(`
          dipendente_id,
          tipo_assenza,
          valore
        `)
        .in('dipendente_id', 
          supabase
            .from('dipendenti')
            .select('id')
            .eq('negozio_id', negozioId)
        )
        .eq('anno', anno)
        .eq('mese', mese);
      
      const risultati = await handleResponse(promise);
      
      // Riorganizza per dipendente
      const calcolati = {};
      risultati?.forEach(record => {
        if (!calcolati[record.dipendenteId]) {
          calcolati[record.dipendenteId] = {};
        }
        
        switch (record.tipoAssenza) {
          case 'ROL':
            calcolati[record.dipendenteId].rolGoduti = record.valore;
            break;
          case 'EX_FEST':
            calcolati[record.dipendenteId].exFestGodute = record.valore;
            break;
          case 'FERIE':
            calcolati[record.dipendenteId].ferieGodute = record.valore;
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
      const promise = supabase
        .from('variazioni_orarie')
        .select('*')
        .eq('dipendente_id', dipendenteId)
        .eq('anno', anno)
        .order('mese_inizio', { ascending: true });
      
      return await handleResponse(promise);
    } catch (error) {
      console.error('Errore nel recupero variazioni orarie:', error);
      return [];
    }
  }
};

export default tabellaCalcoloService;