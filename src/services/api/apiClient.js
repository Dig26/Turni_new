// services/api/apiClient.js - Versione con debug CORS
import { createClient } from '@supabase/supabase-js';
import { objectKeysToSnake, objectKeysToCamel } from '../../utils/caseConverters';

// Configurazione Supabase con fallback
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://plrooiyopvzpkuyetcvh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscm9vaXlvcHZ6cGt1eWV0Y3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTIwNjYsImV4cCI6MjA2NTEyODA2Nn0.hfgaIFZB7yY_teUlTB5KjswjvGTG3gEVBigG8lX6ggM';

// Debug info
console.log('🔧 Supabase Config (DEBUG):');
console.log('📡 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey.substring(0, 20) + '...');
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('📍 Origin:', window.location.origin);

// Verifica configurazione
if (!supabaseUrl.startsWith('http')) {
  console.error('❌ ERRORE: REACT_APP_SUPABASE_URL non configurato correttamente');
}

// Inizializzazione del client Supabase con configurazione CORS migliorata
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'react-app',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test di connessione con debug CORS
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection (DEBUG)...');
    console.log('📍 Testing from origin:', window.location.origin);
    
    // Test 1: Sessione base
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('⚠️ Supabase session warning:', error.message);
      console.log('💡 Possible CORS issue - check Supabase dashboard');
      console.log('💡 URL Configuration should include:', window.location.origin);
    } else {
      console.log('✅ Supabase connection OK');
    }
    
    // Test 2: Database access
    try {
      const { data: testData, error: testError } = await supabase
        .from('utenti')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.warn('⚠️ Database access warning:', testError.message);
        
        if (testError.message.includes('CORS')) {
          console.log('🚨 CORS ERROR DETECTED!');
          console.log('🔧 Go to Supabase Dashboard → Authentication → URL Configuration');
          console.log('🔧 Add:', window.location.origin);
        }
        
        if (testError.message.includes('permission denied') || testError.message.includes('RLS')) {
          console.log('🚨 RLS POLICY ERROR DETECTED!');
          console.log('🔧 Go to Supabase Dashboard → Database → Policies');
          console.log('🔧 Create policies to allow operations on "utenti" table');
        }
      } else {
        console.log('✅ Database access OK');
      }
    } catch (dbError) {
      console.error('❌ Database test failed:', dbError);
    }
    
    return !error;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    
    if (error.message.includes('Failed to fetch')) {
      console.log('🚨 NETWORK/CORS ERROR!');
      console.log('🔧 Solutions:');
      console.log('   1. Check Supabase dashboard URL configuration');
      console.log('   2. Add', window.location.origin, 'to allowed origins');
      console.log('   3. Check your internet connection');
      console.log('   4. Try disabling browser extensions');
    }
    
    return false;
  }
};

// Esegui il test di connessione al caricamento
testConnection().then(success => {
  if (!success) {
    console.error('❌ ATTENZIONE: Problemi di connessione a Supabase');
    console.log('💡 Soluzioni da provare:');
    console.log('   1. Vai su Supabase Dashboard → Authentication → URL Configuration');
    console.log('   2. Aggiungi', window.location.origin, 'agli URL autorizzati');
    console.log('   3. Aggiungi', window.location.origin, 'alle Redirect URLs');
    console.log('   4. Vai su Settings → API → CORS origins');
    console.log('   5. Aggiungi', window.location.origin, 'alle origini CORS');
  }
});

// Funzione di aiuto per gestire risposte ed errori con debug CORS
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
      
      // Debug specifico per errori CORS
      if (error.message?.includes('CORS') || 
          error.message?.includes('Access-Control') ||
          status === 0) {
        console.error('🚨 CORS ERROR DETECTED!');
        console.error('🔧 Fix: Go to Supabase Dashboard → Authentication → URL Configuration');
        console.error('🔧 Add:', window.location.origin);
      }
      
      // Altri debug specifici...
      if (status === 400 || error.code === '23514' || error.code === '23502') {
        console.error('❌ Bad Request (400) - Possibili cause:');
        console.error('   - Campi obbligatori mancanti');
        console.error('   - Formato dati non valido');
        console.error('   - Violazione di vincoli nel database');
      } else if (status === 403) {
        console.error('❌ Forbidden (403) - Problemi di autorizzazione:');
        console.error('   - Verifica le policy RLS (Row Level Security)');
        console.error('   - Assicurati che l\'utente abbia i permessi necessari');
      }
      
      throw error;
    }
    
    // Converti da snake_case a camelCase per l'interfaccia utente
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

export { supabase, handleResponse, prepareData, testConnection };