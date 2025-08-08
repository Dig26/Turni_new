// src/services/userService.js
import { supabase, handleResponse, prepareData } from './api/apiClient';

/**
 * Ottieni o crea il record utente collegato all'auth
 * @returns {Promise<object>} Record utente completo
 */
export const ensureUserRecord = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Utente non autenticato');
    }

    console.log('🔍 Verifica record utente per:', user.email);

    // 1. Prima cerca per auth_user_id
    let userRecord = null;
    try {
      const promise = supabase
        .from('utenti')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      userRecord = await handleResponse(promise);
      console.log('✅ Utente trovato tramite auth_user_id:', userRecord.id);
      return userRecord;
      
    } catch (error) {
      console.log('🔍 Utente non trovato tramite auth_user_id, cerco per email...');
    }

    // 2. Se non trovato, cerca per email
    try {
      const promise = supabase
        .from('utenti')
        .select('*')
        .eq('email', user.email)
        .single();

      userRecord = await handleResponse(promise);
      console.log('✅ Utente trovato tramite email:', userRecord.id);
      
      // 3. Aggiorna il record con auth_user_id
      const updateData = prepareData({
        authUserId: user.id,
        aggiornatoIl: new Date().toISOString()
      });

      const updatePromise = supabase
        .from('utenti')
        .update(updateData)
        .eq('id', userRecord.id)
        .select();

      const updatedRecord = await handleResponse(updatePromise);
      console.log('✅ Record utente aggiornato con auth_user_id');
      return updatedRecord[0];
      
    } catch (emailError) {
      console.log('🔍 Utente non trovato tramite email, lo creo...');
    }

    // 4. Se non esiste, crea nuovo record
    const emailParts = user.email.split('@')[0].split('.');
    const nome = emailParts[0] || 'Nome';
    const cognome = emailParts[1] || 'Cognome';

    const newUserData = prepareData({
      nome: nome.charAt(0).toUpperCase() + nome.slice(1),
      cognome: cognome.charAt(0).toUpperCase() + cognome.slice(1),
      email: user.email,
      password: '', // Gestito da Supabase Auth
      role: 'user',
      authUserId: user.id,
      negoziDisponibili: 0,
      creatoIl: new Date().toISOString(),
      aggiornatoIl: new Date().toISOString()
    });

    const createPromise = supabase
      .from('utenti')
      .insert(newUserData)
      .select();

    const newRecord = await handleResponse(createPromise);
    console.log('✅ Nuovo record utente creato:', newRecord[0].id);
    return newRecord[0];

  } catch (error) {
    console.error('❌ Errore nella gestione del record utente:', error);
    throw error;
  }
};

/**
 * Recupera i negozi disponibili per l'utente corrente
 * @returns {Promise<number>} Numero di negozi disponibili
 */
export const getAvailableShops = async () => {
  try {
    const userRecord = await ensureUserRecord();
    const shops = userRecord?.negoziDisponibili || 0;
    console.log('✅ Negozi disponibili:', shops);
    return shops;
  } catch (error) {
    console.error('❌ Errore nel recupero dei negozi disponibili:', error);
    return 0;
  }
};

/**
 * Aggiorna i negozi disponibili per l'utente corrente
 * @param {number} count - Nuovo numero di negozi disponibili
 * @returns {Promise<boolean>} Success
 */
export const updateAvailableShops = async (count) => {
  try {
    const userRecord = await ensureUserRecord();
    
    if (!userRecord) {
      throw new Error('Impossibile ottenere il record utente');
    }

    console.log('🔄 Aggiornamento negozi disponibili da', userRecord.negoziDisponibili, 'a', count);

    const updateData = prepareData({
      negoziDisponibili: count,
      aggiornatoIl: new Date().toISOString()
    });

    const promise = supabase
      .from('utenti')
      .update(updateData)
      .eq('id', userRecord.id)
      .select();

    const result = await handleResponse(promise);
    
    if (!result || result.length === 0) {
      throw new Error('Aggiornamento non riuscito');
    }

    console.log('✅ Negozi disponibili aggiornati:', result[0].negoziDisponibili);
    return true;
  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento dei negozi disponibili:', error);
    throw error;
  }
};

/**
 * Incrementa i negozi disponibili (dopo acquisto)
 * @param {number} numberOfShops - Numero di negozi da aggiungere
 * @returns {Promise<number>} Nuovo totale di negozi disponibili
 */
export const addAvailableShops = async (numberOfShops) => {
  try {
    console.log('➕ Aggiunta negozi disponibili:', numberOfShops);
    const current = await getAvailableShops();
    const newCount = current + numberOfShops;
    
    await updateAvailableShops(newCount);
    console.log('✅ Totale negozi disponibili dopo aggiunta:', newCount);
    return newCount;
  } catch (error) {
    console.error('❌ Errore nell\'aggiunta dei negozi disponibili:', error);
    throw error;
  }
};

/**
 * Consuma un negozio disponibile (quando ne viene creato uno)
 * @returns {Promise<number>} Numero di negozi rimanenti
 */
export const consumeShop = async () => {
  try {
    console.log('🍴 Consumo di un negozio disponibile...');
    const current = await getAvailableShops();
    
    if (current <= 0) {
      throw new Error('Nessun negozio disponibile');
    }
    
    const newCount = current - 1;
    await updateAvailableShops(newCount);
    console.log('✅ Negozio consumato, rimanenti:', newCount);
    return newCount;
  } catch (error) {
    console.error('❌ Errore nel consumo del negozio:', error);
    throw error;
  }
};

/**
 * Verifica se l'utente ha negozi disponibili
 * @returns {Promise<boolean>} True se ha negozi disponibili
 */
export const hasAvailableShops = async () => {
  try {
    const count = await getAvailableShops();
    return count > 0;
  } catch (error) {
    console.error('❌ Errore nella verifica dei negozi disponibili:', error);
    return false;
  }
};

/**
 * Recupera i dati completi dell'utente corrente
 * @returns {Promise<object>} Dati utente
 */
export const getCurrentUserData = async () => {
  try {
    return await ensureUserRecord();
  } catch (error) {
    console.error('❌ Errore nel recupero dei dati utente:', error);
    throw error;
  }
};