// src/services/api/userAPI.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_STRIPE_SERVER_URL || 'http://localhost:3001';

/**
 * Recupera il numero di negozi disponibili per un utente
 * @param {number} userId - ID dell'utente
 * @returns {Promise<number>} Numero di negozi disponibili
 */
export const getAvailableShops = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/${userId}/available-shops`);
    return response.data.availableShops || 0;
  } catch (error) {
    console.error('Errore nel recupero dei negozi disponibili:', error);
    throw new Error('Impossibile recuperare i negozi disponibili');
  }
};

/**
 * Consuma un negozio disponibile (decrementa di 1)
 * @param {number} userId - ID dell'utente
 * @returns {Promise<{availableShops: number, success: boolean}>} Risultato dell'operazione
 */
export const consumeShop = async (userId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/user/${userId}/consume-shop`);
    return {
      availableShops: response.data.availableShops,
      success: response.data.success
    };
  } catch (error) {
    console.error('Errore nel consumo del negozio:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Nessun negozio disponibile nel tuo abbonamento');
    }
    
    throw new Error('Errore nella gestione dei negozi disponibili');
  }
};

/**
 * Verifica una sessione di pagamento Stripe
 * @param {string} sessionId - ID della sessione Stripe
 * @returns {Promise<object>} Dettagli della sessione
 */
export const verifyStripeSession = async (sessionId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/verify-session`, {
      sessionId: sessionId
    });
    return response.data;
  } catch (error) {
    console.error('Errore nella verifica della sessione:', error);
    throw new Error('Errore nella verifica del pagamento');
  }
};

/**
 * Crea una sessione di checkout Stripe
 * @param {object} checkoutData - Dati per il checkout
 * @returns {Promise<{sessionId: string, url: string}>} Dati della sessione
 */
export const createCheckoutSession = async (checkoutData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, checkoutData);
    return {
      sessionId: response.data.sessionId,
      url: response.data.url
    };
  } catch (error) {
    console.error('Errore nella creazione della sessione di checkout:', error);
    throw new Error('Errore nella preparazione del pagamento');
  }
};

/**
 * Controlla lo stato del server Stripe
 * @returns {Promise<boolean>} True se il server è attivo
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Server Stripe non raggiungibile:', error);
    return false;
  }
};

// Utility per gestire errori comuni
export const handleAPIError = (error, defaultMessage = 'Errore del server') => {
  if (error.response) {
    // Errore con risposta dal server
    const status = error.response.status;
    const message = error.response.data?.error || error.response.data?.message;
    
    switch (status) {
      case 400:
        return message || 'Richiesta non valida';
      case 401:
        return 'Non autorizzato. Effettua nuovamente il login';
      case 403:
        return 'Accesso negato';
      case 404:
        return 'Risorsa non trovata';
      case 500:
        return message || 'Errore interno del server';
      default:
        return message || defaultMessage;
    }
  } else if (error.request) {
    // Errore di rete
    return 'Errore di connessione. Verifica la tua connessione internet';
  } else {
    // Errore generico
    return error.message || defaultMessage;
  }
};