// src/services/variazioniOrarieService.js
import { supabase, handleResponse, prepareData } from './api/apiClient';

const variazioniOrarieService = {
  // Recupera tutte le variazioni orarie per un dipendente in un anno
  async fetchVariazioniByDipendente(dipendenteId, anno) {
    try {
      console.log(`📅 Fetching variazioni orarie for dipendente ${dipendenteId}, anno ${anno}`);
      
      const promise = supabase
        .from('variazioni_orarie')
        .select('*')
        .eq('dipendente_id', dipendenteId)
        .eq('anno', anno)
        .order('mese_inizio', { ascending: true });
      
      return await handleResponse(promise);
    } catch (error) {
      console.error('Errore nel recupero variazioni orarie:', error);
      throw error;
    }
  },

  // Crea una nuova variazione oraria
  async createVariazione(variazioneData) {
    try {
      console.log('➕ Creating new variazione oraria');
      
      const data = prepareData(variazioneData);
      
      const promise = supabase
        .from('variazioni_orarie')
        .insert(data)
        .select()
        .single();
      
      return await handleResponse(promise);
    } catch (error) {
      console.error('Errore nella creazione variazione oraria:', error);
      throw error;
    }
  },

  // Aggiorna una variazione oraria esistente
  async updateVariazione(id, variazioneData) {
    try {
      console.log(`✏️ Updating variazione oraria ${id}`);
      
      const data = prepareData(variazioneData);
      
      const promise = supabase
        .from('variazioni_orarie')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      return await handleResponse(promise);
    } catch (error) {
      console.error('Errore nell\'aggiornamento variazione oraria:', error);
      throw error;
    }
  },

  // Elimina una variazione oraria
  async deleteVariazione(id) {
    try {
      console.log(`🗑️ Deleting variazione oraria ${id}`);
      
      const promise = supabase
        .from('variazioni_orarie')
        .delete()
        .eq('id', id);
      
      await handleResponse(promise);
      return true;
    } catch (error) {
      console.error('Errore nell\'eliminazione variazione oraria:', error);
      throw error;
    }
  },

  // Salva tutte le variazioni per un dipendente (batch update)
  async saveVariazioniDipendente(dipendenteId, anno, variazioni) {
    try {
      console.log(`💾 Saving all variazioni for dipendente ${dipendenteId}, anno ${anno}`);
      
      // Prima elimina tutte le variazioni esistenti
      await supabase
        .from('variazioni_orarie')
        .delete()
        .eq('dipendente_id', dipendenteId)
        .eq('anno', anno);
      
      // Poi inserisci le nuove
      if (variazioni && variazioni.length > 0) {
        const dataToInsert = variazioni.map(v => prepareData({
          ...v,
          dipendenteId,
          anno
        }));
        
        const promise = supabase
          .from('variazioni_orarie')
          .insert(dataToInsert)
          .select();
        
        return await handleResponse(promise);
      }
      
      return [];
    } catch (error) {
      console.error('Errore nel salvataggio batch variazioni:', error);
      throw error;
    }
  },

  // Recupera le variazioni orarie per tutti i dipendenti di un negozio
  async fetchVariazioniByNegozio(negozioId, anno) {
    try {
      console.log(`🏢 Fetching variazioni for negozio ${negozioId}, anno ${anno}`);
      
      // Prima ottieni gli ID dei dipendenti del negozio
      const { data: dipendenti } = await supabase
        .from('dipendenti')
        .select('id')
        .eq('negozio_id', negozioId);
      
      if (!dipendenti || dipendenti.length === 0) {
        return [];
      }
      
      const dipendentiIds = dipendenti.map(d => d.id);
      
      const promise = supabase
        .from('variazioni_orarie')
        .select('*')
        .in('dipendente_id', dipendentiIds)
        .eq('anno', anno)
        .order('dipendente_id', { ascending: true })
        .order('mese_inizio', { ascending: true });
      
      return await handleResponse(promise);
    } catch (error) {
      console.error('Errore nel recupero variazioni del negozio:', error);
      throw error;
    }
  },

  // Valida le variazioni orarie (controlla sovrapposizioni, ecc.)
  async validateVariazioni(dipendenteId, variazioni) {
    try {
      const errors = [];
      
      // Controlla sovrapposizioni
      for (let i = 0; i < variazioni.length; i++) {
        for (let j = i + 1; j < variazioni.length; j++) {
          const v1 = variazioni[i];
          const v2 = variazioni[j];
          
          if (
            (v1.meseInizio <= v2.meseFine && v1.meseFine >= v2.meseInizio) ||
            (v2.meseInizio <= v1.meseFine && v2.meseFine >= v1.meseInizio)
          ) {
            errors.push(`Le variazioni ${i + 1} e ${j + 1} si sovrappongono`);
          }
        }
        
        // Valida range mesi
        if (variazioni[i].meseInizio > variazioni[i].meseFine) {
          errors.push(`Variazione ${i + 1}: il mese di inizio deve essere precedente o uguale al mese di fine`);
        }
        
        // Valida ore
        if (variazioni[i].oreSettimanali < 0 || variazioni[i].oreSettimanali > 48) {
          errors.push(`Variazione ${i + 1}: le ore settimanali devono essere tra 0 e 48`);
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Errore nella validazione variazioni:', error);
      throw error;
    }
  },

  // Calcola le ore effettive per un periodo
  async calcolaOreEffettive(dipendenteId, dataInizio, dataFine) {
    try {
      // Recupera il dipendente per le ore base
      const { data: dipendente } = await supabase
        .from('dipendenti')
        .select('ore_settimanali')
        .eq('id', dipendenteId)
        .single();
      
      if (!dipendente) {
        throw new Error('Dipendente non trovato');
      }
      
      const annoInizio = new Date(dataInizio).getFullYear();
      const annoFine = new Date(dataFine).getFullYear();
      
      // Recupera le variazioni per gli anni interessati
      const { data: variazioni } = await supabase
        .from('variazioni_orarie')
        .select('*')
        .eq('dipendente_id', dipendenteId)
        .in('anno', [annoInizio, annoFine])
        .order('anno', { ascending: true })
        .order('mese_inizio', { ascending: true });
      
      // Calcola le ore effettive per ogni mese nel periodo
      const orePerMese = {};
      const meseInizio = new Date(dataInizio).getMonth() + 1;
      const meseFine = new Date(dataFine).getMonth() + 1;
      
      for (let anno = annoInizio; anno <= annoFine; anno++) {
        const mStart = anno === annoInizio ? meseInizio : 1;
        const mEnd = anno === annoFine ? meseFine : 12;
        
        for (let mese = mStart; mese <= mEnd; mese++) {
          // Trova se c'è una variazione per questo mese
          const variazione = variazioni?.find(v => 
            v.anno === anno && 
            v.mese_inizio <= mese && 
            v.mese_fine >= mese
          );
          
          const chiave = `${anno}-${mese}`;
          orePerMese[chiave] = variazione ? variazione.ore_settimanali : dipendente.ore_settimanali;
        }
      }
      
      return orePerMese;
    } catch (error) {
      console.error('Errore nel calcolo ore effettive:', error);
      throw error;
    }
  }
};

export default variazioniOrarieService;