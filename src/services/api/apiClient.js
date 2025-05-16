// services/api/apiClient.js
import { createClient } from '@supabase/supabase-js';

// Credenziali per Supabase locale
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Inizializzazione del client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Funzione di aiuto per gestire risposte ed errori
const handleResponse = async (promise) => {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Errore API:', error);
    throw error;
  }
};

export { supabase, handleResponse };