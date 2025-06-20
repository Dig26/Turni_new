// src/components/LoginTest.jsx
import React, { useState } from 'react';
import { supabase } from '../services/api/apiClient';

const LoginTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setLoading(true);
    setResult('🔍 Testing Supabase connection...\n');
    
    try {
      // Test 1: Connessione base
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      let log = `✅ Supabase import OK\n`;
      log += `🔍 Current session: ${sessionData.session ? 'YES' : 'NO'}\n`;
      
      if (sessionError) {
        log += `❌ Session error: ${sessionError.message}\n`;
      }
      
      setResult(log);
      
      // Test 2: Login diretto
      log += `\n🔍 Testing direct login...\n`;
      setResult(log);
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'digostrent@gmail.com', // USA LA TUA EMAIL
        password: 'abcdef'             // USA LA TUA PASSWORD
      });
      
      if (loginError) {
        log += `❌ Login error: ${loginError.message}\n`;
      } else {
        log += `✅ Login success: ${loginData.user?.email}\n`;
        log += `✅ User ID: ${loginData.user?.id}\n`;
      }
      
      setResult(log);
      
      // Test 3: Tabella utenti (solo se login ok)
      if (loginData.user) {
        log += `\n🔍 Testing utenti table...\n`;
        setResult(log);
        
        const { data: userData, error: userError } = await supabase
          .from('utenti')
          .select('*')
          .eq('email', 'digostrent@email.qui') // USA LA TUA EMAIL
          .single();
        
        if (userError) {
          log += `❌ User table error: ${userError.message}\n`;
          log += `❌ Error code: ${userError.code}\n`;
        } else {
          log += `✅ User found in table: ${userData?.nome} ${userData?.cognome}\n`;
        }
        
        setResult(log);
      }
      
    } catch (error) {
      const log = `❌ FATAL ERROR: ${error.message}\n`;
      setResult(log);
      console.error('Test error:', error);
    }
    
    setLoading(false);
  };

  const testReduxLogin = async () => {
    setLoading(true);
    setResult('🔍 Testing Redux login flow...\n');
    
    try {
      // Importa il servizio auth
      const authService = await import('../services/authService');
      
      let log = `✅ AuthService imported\n`;
      setResult(log);
      
      // Test login
      log += `🔍 Calling authService.login...\n`;
      setResult(log);
      
      const user = await authService.login('digostrent@gmail.com', 'abcdef'); // USA LE TUE CREDENZIALI
      
      log += `✅ Login completed: ${user?.email}\n`;
      log += `✅ User data: ${JSON.stringify(user, null, 2)}\n`;
      
      setResult(log);
      
    } catch (error) {
      const log = `❌ Redux login error: ${error.message}\n`;
      setResult(log);
      console.error('Redux test error:', error);
    }
    
    setLoading(false);
  };

  const clearResult = () => {
    setResult('');
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Non mostrare in produzione
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50px',
      right: '10px',
      background: 'white',
      border: '2px solid #dc3545',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '500px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#dc3545' }}>
        🚨 Login Debug Panel
      </h4>
      
      <div style={{ marginBottom: '12px' }}>
        <button 
          onClick={testSupabaseConnection}
          disabled={loading}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            marginRight: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Supabase Direct
        </button>
        
        <button 
          onClick={testReduxLogin}
          disabled={loading}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            marginRight: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Redux Flow
        </button>
        
        <button 
          onClick={clearResult}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      {loading && (
        <div style={{ color: '#007bff', marginBottom: '8px' }}>
          ⏳ Testing...
        </div>
      )}

      {result && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '8px', 
          borderRadius: '4px',
          border: '1px solid #dee2e6',
          whiteSpace: 'pre-wrap',
          fontSize: '10px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {result}
        </div>
      )}
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '10px',
        color: '#6c757d'
      }}>
        ⚠️ Ricorda di aggiornare email e password nel codice!
      </div>
    </div>
  );
};

export default LoginTest;