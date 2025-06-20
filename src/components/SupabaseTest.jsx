// src/components/SupabaseTest.jsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SupabaseTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testConfiguration = () => {
    addResult('🔍 Checking Supabase configuration...', 'info');
    
    // Leggi le variabili d'ambiente
    const envUrl = process.env.REACT_APP_SUPABASE_URL;
    const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
    
    addResult(`📍 ENV URL: ${envUrl || 'NOT SET'}`, envUrl ? 'success' : 'error');
    addResult(`🔑 ENV KEY: ${envKey ? envKey.substring(0, 20) + '...' : 'NOT SET'}`, envKey ? 'success' : 'error');
    
    // Controlla i valori hardcoded nel file
    const hardcodedUrl = 'https://plrooiyopvzpkuyetcvh.supabase.co';
    const hardcodedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscm9vaXlvcHZ6cGt1eWV0Y3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NTIwNjYsImV4cCI6MjA2NTEyODA2Nn0.hfgaIFZB7yY_teUlTB5KjswjvGTG3gEVBigG8lX6ggM';
    
    addResult(`📍 Hardcoded URL: ${hardcodedUrl}`, 'info');
    addResult(`🔑 Hardcoded KEY: ${hardcodedKey.substring(0, 20)}...`, 'info');
    
    const finalUrl = envUrl || hardcodedUrl;
    const finalKey = envKey || hardcodedKey;
    
    addResult(`✅ Final URL: ${finalUrl}`, 'success');
    addResult(`✅ Final KEY: ${finalKey.substring(0, 20)}...`, 'success');
    
    return { url: finalUrl, key: finalKey };
  };

  const testConnection = async () => {
    setLoading(true);
    clearResults();
    
    try {
      const config = testConfiguration();
      
      addResult('🔄 Creating Supabase client...', 'info');
      
      // Crea un client Supabase diretto
      const supabase = createClient(config.url, config.key, {
        auth: {
          persistSession: false // Per test
        }
      });
      
      addResult('✅ Supabase client created', 'success');
      
      // Test 1: Ping base
      addResult('🔄 Testing basic connection...', 'info');
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addResult(`❌ Connection error: ${error.message}`, 'error');
        addResult(`❌ Error details: ${JSON.stringify(error, null, 2)}`, 'error');
      } else {
        addResult('✅ Basic connection OK', 'success');
        addResult(`ℹ️ Session status: ${data.session ? 'Active' : 'None'}`, 'info');
      }
      
      // Test 2: Prova a leggere una tabella (qualsiasi)
      addResult('🔄 Testing database access...', 'info');
      
      try {
        const { data: tables, error: dbError } = await supabase
          .from('utenti')
          .select('count')
          .limit(1);
        
        if (dbError) {
          addResult(`❌ Database error: ${dbError.message}`, 'error');
          addResult(`❌ Error code: ${dbError.code}`, 'error');
          
          if (dbError.message.includes('permission denied') || dbError.message.includes('RLS')) {
            addResult('💡 Possible issue: Row Level Security (RLS) policies', 'warning');
          }
          if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
            addResult('💡 Possible issue: Table "utenti" does not exist', 'warning');
          }
        } else {
          addResult('✅ Database access OK', 'success');
          addResult(`ℹ️ Query result: ${JSON.stringify(tables)}`, 'info');
        }
      } catch (dbErr) {
        addResult(`❌ Database test failed: ${dbErr.message}`, 'error');
      }
      
      // Test 3: Test di signup (solo per verificare che l'endpoint funzioni)
      addResult('🔄 Testing auth endpoint...', 'info');
      
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'test123456'
        });
        
        if (authError) {
          if (authError.message.includes('already registered')) {
            addResult('✅ Auth endpoint working (user already exists)', 'success');
          } else {
            addResult(`⚠️ Auth error: ${authError.message}`, 'warning');
          }
        } else {
          addResult('✅ Auth endpoint working', 'success');
          if (authData.user) {
            addResult('ℹ️ Test user created (this is OK for testing)', 'info');
          }
        }
      } catch (authErr) {
        addResult(`❌ Auth test failed: ${authErr.message}`, 'error');
      }
      
    } catch (error) {
      addResult(`❌ FATAL ERROR: ${error.message}`, 'error');
      addResult(`❌ Stack: ${error.stack}`, 'error');
    }
    
    setLoading(false);
  };

  const testNetworkAccess = async () => {
    setLoading(true);
    clearResults();
    
    addResult('🔄 Testing network access to Supabase...', 'info');
    
    try {
      // Test se l'URL è raggiungibile
      const testUrl = 'https://plrooiyopvzpkuyetcvh.supabase.co';
      
      const response = await fetch(testUrl);
      
      addResult(`✅ Network request status: ${response.status}`, response.ok ? 'success' : 'error');
      addResult(`ℹ️ Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`, 'info');
      
      if (response.ok) {
        const text = await response.text();
        addResult(`ℹ️ Response preview: ${text.substring(0, 200)}...`, 'info');
      }
      
    } catch (networkError) {
      addResult(`❌ Network error: ${networkError.message}`, 'error');
      
      if (networkError.message.includes('Failed to fetch')) {
        addResult('💡 Possible issues:', 'warning');
        addResult('   - Internet connection problems', 'warning');
        addResult('   - Firewall blocking Supabase', 'warning');
        addResult('   - Wrong Supabase URL', 'warning');
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    addResult('🚀 Supabase Test Component loaded', 'success');
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'white',
      border: '2px solid #dc3545',
      borderRadius: '8px',
      padding: '16px',
      zIndex: 9999,
      fontSize: '11px',
      width: '500px',
      maxHeight: '80vh',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      fontFamily: 'monospace',
      overflow: 'hidden'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#dc3545' }}>
        🔧 Supabase Connection Test
      </h4>
      
      <div style={{ marginBottom: '12px' }}>
        <button 
          onClick={testConnection}
          disabled={loading}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '10px',
            marginRight: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Full Connection
        </button>
        
        <button 
          onClick={testNetworkAccess}
          disabled={loading}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '10px',
            marginRight: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Network
        </button>
        
        <button 
          onClick={clearResults}
          style={{
            background: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      {loading && (
        <div style={{ color: '#007bff', marginBottom: '8px' }}>
          ⏳ Testing connection...
        </div>
      )}

      <div style={{ 
        maxHeight: '400px',
        overflow: 'auto',
        background: '#f8f9fa',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #dee2e6'
      }}>
        {results.map((result, index) => (
          <div 
            key={index}
            style={{ 
              marginBottom: '4px',
              color: result.type === 'error' ? '#dc3545' : 
                     result.type === 'success' ? '#28a745' : 
                     result.type === 'warning' ? '#ffc107' : '#333',
              fontSize: '10px'
            }}
          >
            <span style={{ opacity: 0.7 }}>[{result.timestamp}]</span> {result.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupabaseTest;