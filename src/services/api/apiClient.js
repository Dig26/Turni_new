// services/api/apiClient.js
import { createClient } from '@supabase/supabase-js';
import { objectKeysToSnake, objectKeysToCamel } from '../../utils/caseConverters';

// Configurazione Supabase con fallback
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Log della configurazione (senza mostrare la chiave completa)
console.log('🔧 Supabase Config:');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');

// Verifica configurazione
if (!supabaseUrl.startsWith('http')) {
  console.error('❌ ERRORE: REACT_APP_SUPABASE_URL non configurato correttamente');
}

// Inizializzazione del client Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'react-app'
    }
  }
});

// Test di connessione iniziale
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test semplice per verificare se il server risponde
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('⚠️ Supabase connection warning:', error.message);
    } else {
      console.log('✅ Supabase connection OK');
    }
    
    return !error;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

// Esegui il test di connessione al caricamento
testConnection().then(success => {
  if (!success) {
    console.error('❌ ATTENZIONE: Problemi di connessione a Supabase');
    console.log('💡 Verifica:');
    console.log('   - Che Supabase locale sia avviato (supabase start)');
    console.log('   - Oppure che le variabili REACT_APP_SUPABASE_* siano configurate');
  }
});

// Funzione di aiuto per gestire risposte ed errori
const handleResponse = async (promise) => {
  try {
    const { data, error, status, statusText } = await promise;
    
    if (error) {
      console.error('🚫 API Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        status,
        statusText
      });
      
      // Aggiungi informazioni extra per errori comuni
      if (status === 400 || error.code === '23514' || error.code === '23502') {
        console.error('❌ Bad Request (400) - Possibili cause:');
        console.error('   - Campi obbligatori mancanti');
        console.error('   - Formato dati non valido');
        console.error('   - Violazione di vincoli nel database');
        
        if (error.message?.includes('duplicate key') || error.code === '23505') {
          console.error('   - Record duplicato (chiave già esistente)');
        }
        if (error.message?.includes('foreign key') || error.code === '23503') {
          console.error('   - Riferimento a record inesistente (es. negozio_id non valido)');
        }
        if (error.message?.includes('null value') || error.code === '23502') {
          console.error('   - Campo obbligatorio con valore null');
        }
        if (error.message?.includes('numeric field overflow')) {
          console.error('   - Valore numerico troppo grande o formato non valido');
        }
      } else if (status === 403) {
        console.error('❌ Forbidden (403) - Problemi di autorizzazione:');
        console.error('   - Verifica le policy RLS (Row Level Security)');
        console.error('   - Assicurati che l\'utente abbia i permessi necessari');
      } else if (status === 404) {
        console.error('❌ Not Found (404) - La risorsa richiesta non esiste');
      }
      
      // Log specifico per errori Supabase/PostgreSQL
      if (error.code) {
        console.error('📋 Codice errore PostgreSQL:', error.code);
        console.error('   Vedi: https://www.postgresql.org/docs/current/errcodes-appendix.html');
      }
      
      throw error;
    }
    
    // Converti da snake_case a camelCase per l'interfaccia utente (solo se objectKeysToCamel esiste)
    if (typeof objectKeysToCamel === 'function') {
      return Array.isArray(data) 
        ? data.map(item => objectKeysToCamel(item))
        : objectKeysToCamel(data);
    }
    
    return data;
  } catch (error) {
    console.error('🚫 API Error:', error);
    throw error;
  }
};

// Funzione per preparare i dati prima dell'invio (camelCase -> snake_case)
const prepareData = (data) => {
  console.log('📤 Preparing data for API:');
  console.log('   Original:', data);
  
  let prepared = data;
  if (typeof objectKeysToSnake === 'function') {
    prepared = objectKeysToSnake(data);
  }
  
  console.log('   Prepared:', prepared);
  return prepared;
};

// Funzione per testare l'autenticazione
const testAuth = async () => {
  try {
    console.log('🔍 Testing Supabase Auth...');
    
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.log('ℹ️ No authenticated user:', error.message);
      return null;
    }
    
    console.log('✅ Authenticated user found:', data.user?.email);
    return data.user;
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return null;
  }
};

export { supabase, handleResponse, prepareData, testConnection, testAuth };