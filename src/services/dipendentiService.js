// services/dipendentiService.js
import { supabase, handleResponse } from './api/apiClient';

// Ottieni tutti i dipendenti di un negozio
export const getDipendentiByNegozioId = async (negozioId) => {
  try {
    const query = supabase
      .from('dipendenti')
      .select('*')
      .eq('negozio_id', negozioId)
      .order('cognome', { ascending: true });
    
    return await handleResponse(query);
  } catch (error) {
    console.error('Errore nel recupero dei dipendenti:', error);
    throw error;
  }
};

// Ottieni un dipendente per ID
export const getDipendenteById = async (id) => {
  try {
    const query = supabase
      .from('dipendenti')
      .select('*')
      .eq('id', id)
      .single();
    
    const data = await handleResponse(query);
    
    console.log('🔍 RAW data from handleResponse:', data);
    console.log('🔍 Available keys:', Object.keys(data));
    
    // I dati sono già convertiti in camelCase da handleResponse
    // Quindi usiamo i nomi camelCase
    const mappedData = {
      id: data.id,
      nome: data.nome,
      cognome: data.cognome,
      nomeTurno: data.nomeTurno || '',
      oreSettimanali: parseFloat(data.oreSettimanali) || 40,
      // ✅ FIX: Usa i campi già convertiti in camelCase
      dataAssunzione: data.dataAssunzione || data.data_assunzione,
      dataFineContratto: data.dataFineContratto || data.data_fine_contratto || '',
      ruolo: data.ruolo || 'dipendente',
      giorniFerie: data.giorniFerie || data.giorni_ferie || 0,
      giorniROL: data.giorniRol || data.giorni_rol || 0,
      giorniExFestivita: data.giorniExFestivita || data.giorni_ex_festivita || 0,
      email: data.email || '',
      telefono: data.telefono || '',
      negozioId: data.negozioId || data.negozio_id
    };
    
    console.log('✅ Mapped data:', mappedData);
    return mappedData;
    
  } catch (error) {
    console.error('Errore nel recupero del dipendente:', error);
    throw error;
  }
};

// Salva un dipendente (crea o aggiorna)
export const saveDipendente = async (dipendenteData, dipendenteId = null) => {
  try {
    // Prepara i dati per il database (converti in snake_case manualmente)
    const dataToSave = {
      nome: dipendenteData.nome.trim(),
      cognome: dipendenteData.cognome.trim(),
      nome_turno: dipendenteData.nomeTurno?.trim() || `${dipendenteData.nome} ${dipendenteData.cognome.charAt(0)}.`,
      ore_settimanali: parseFloat(dipendenteData.oreSettimanali) || 40.00,
      data_assunzione: dipendenteData.dataAssunzione,
      data_fine_contratto: dipendenteData.dataFineContratto || null,
      ruolo: dipendenteData.ruolo || 'dipendente',
      giorni_ferie: parseInt(dipendenteData.giorniFerie) || 0,
      giorni_rol: parseInt(dipendenteData.giorniROL) || 0,
      giorni_ex_festivita: parseInt(dipendenteData.giorniExFestivita) || 0,
      email: dipendenteData.email?.trim() || null,
      telefono: dipendenteData.telefono?.trim() || null,
      negozio_id: parseInt(dipendenteData.negozioId)
    };
    
    console.log('📤 Dati da salvare nel database:', dataToSave);
    
    let query;
    
    if (dipendenteId) {
      // Aggiorna dipendente esistente
      console.log('📝 Aggiornamento dipendente ID:', dipendenteId);
      query = supabase
        .from('dipendenti')
        .update(dataToSave)
        .eq('id', dipendenteId)
        .select();
    } else {
      // Crea nuovo dipendente
      console.log('✨ Creazione nuovo dipendente');
      query = supabase
        .from('dipendenti')
        .insert(dataToSave)
        .select();
    }
    
    const result = await handleResponse(query);
    console.log('✅ Dipendente salvato con successo:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Errore nel salvataggio del dipendente:', error);
    
    // Gestisci errori specifici del database
    if (error.code === '23505') {
      if (error.message?.includes('email')) {
        throw new Error('Un dipendente con questa email esiste già in questo negozio');
      }
      throw new Error('Record duplicato');
    } else if (error.code === '23503') {
      throw new Error('Negozio non trovato. Verifica che il negozio esista.');
    } else if (error.message?.includes('null value')) {
      throw new Error('Tutti i campi obbligatori devono essere compilati');
    } else if (error.code === '42501') {
      throw new Error('Non hai i permessi per eseguire questa operazione');
    }
    
    throw error;
  }
};

// Elimina un dipendente
export const deleteDipendente = async (id) => {
  try {
    console.log('🗑️ Eliminazione dipendente ID:', id);
    
    const query = supabase
      .from('dipendenti')
      .delete()
      .eq('id', id);
    
    const result = await handleResponse(query);
    console.log('✅ Dipendente eliminato con successo');
    return result;
  } catch (error) {
    console.error('❌ Errore nell\'eliminazione del dipendente:', error);
    throw error;
  }
};

// Elimina tutti i dipendenti di un negozio
export const deleteDipendentiByNegozioId = async (negozioId) => {
  try {
    console.log('🗑️ Eliminazione dipendenti del negozio ID:', negozioId);
    
    const query = supabase
      .from('dipendenti')
      .delete()
      .eq('negozio_id', negozioId);
    
    const result = await handleResponse(query);
    console.log('✅ Dipendenti eliminati con successo');
    return result;
  } catch (error) {
    console.error('❌ Errore nell\'eliminazione dei dipendenti:', error);
    throw error;
  }
};

// Conta i dipendenti di un negozio
export const countDipendentiByNegozio = async (negozioId) => {
  try {
    const { count, error } = await supabase
      .from('dipendenti')
      .select('*', { count: 'exact', head: true })
      .eq('negozio_id', negozioId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Errore nel conteggio dei dipendenti:', error);
    throw error;
  }
};

// Verifica se un'email è già utilizzata in un negozio
export const checkEmailExists = async (email, negozioId, excludeId = null) => {
  try {
    let query = supabase
      .from('dipendenti')
      .select('id')
      .eq('email', email)
      .eq('negozio_id', negozioId);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Errore nella verifica email:', error);
    throw error;
  }
};