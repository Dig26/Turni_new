import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api/apiClient';
import '../../styles/DebugPanel.css';

/**
 * Componente per il debug dell'applicazione
 * Mostra lo stato della connessione e dettagli su Supabase
 */
const DebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    online: navigator.onLine,
    supabase: 'checking',
    auth: 'checking',
    tables: {}
  });
  
  // Verifica lo stato della connessione
  useEffect(() => {
    const checkConnections = async () => {
      try {
        // Verifica lo stato di auth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        // Controlla le tabelle principali
        const tables = ['utenti', 'negozi', 'dipendenti'];
        const tableStatus = {};
        
        for (const table of tables) {
          try {
            const { data, error } = await supabase.from(table).select('count').limit(1);
            tableStatus[table] = error ? 'error' : 'ok';
            
            if (error) {
              console.error(`Errore tabella ${table}:`, error);
            }
          } catch (e) {
            tableStatus[table] = 'error';
            console.error(`Errore nel check della tabella ${table}:`, e);
          }
        }
        
        setConnectionStatus({
          online: navigator.onLine,
          supabase: 'ok',
          auth: sessionError ? 'error' : 'ok',
          tables: tableStatus
        });
      } catch (error) {
        console.error('Errore nella verifica delle connessioni:', error);
        setConnectionStatus({
          online: navigator.onLine,
          supabase: 'error',
          auth: 'error',
          tables: {}
        });
      }
    };
    
    checkConnections();
    
    // Aggiorna lo stato della connessione ogni 5 secondi
    const intervalId = setInterval(() => {
      setConnectionStatus(prev => ({
        ...prev,
        online: navigator.onLine
      }));
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Ricontrolla le connessioni
  const handleRefresh = async () => {
    setConnectionStatus({
      online: navigator.onLine,
      supabase: 'checking',
      auth: 'checking',
      tables: {}
    });
    
    try {
      // Verifica lo stato di auth
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Controlla le tabelle principali
      const tables = ['utenti', 'negozi', 'dipendenti'];
      const tableStatus = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('count').limit(1);
          tableStatus[table] = error ? 'error' : 'ok';
        } catch (e) {
          tableStatus[table] = 'error';
        }
      }
      
      setConnectionStatus({
        online: navigator.onLine,
        supabase: 'ok',
        auth: sessionError ? 'error' : 'ok',
        tables: tableStatus
      });
    } catch (error) {
      setConnectionStatus({
        online: navigator.onLine,
        supabase: 'error',
        auth: 'error',
        tables: {}
      });
    }
  };
  
  // Colori per gli stati
  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'status-success';
      case 'error': return 'status-error';
      case 'checking': return 'status-checking';
      default: return '';
    }
  };
  
  return (
    <div className={`debug-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="debug-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Debug Panel</h3>
        <button className="debug-toggle">
          <i className={`fas fa-chevron-${isExpanded ? 'down' : 'up'}`}></i>
        </button>
      </div>
      
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-section">
            <h4>Stato Connessione</h4>
            <div className="debug-item">
              <span>Internet: </span>
              <span className={connectionStatus.online ? 'status-success' : 'status-error'}>
                {connectionStatus.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="debug-item">
              <span>Supabase: </span>
              <span className={getStatusColor(connectionStatus.supabase)}>
                {connectionStatus.supabase === 'ok' ? 'Connesso' : 
                 connectionStatus.supabase === 'error' ? 'Errore' : 'Verifica...'}
              </span>
            </div>
            <div className="debug-item">
              <span>Auth: </span>
              <span className={getStatusColor(connectionStatus.auth)}>
                {connectionStatus.auth === 'ok' ? 'Funzionante' : 
                 connectionStatus.auth === 'error' ? 'Errore' : 'Verifica...'}
              </span>
            </div>
          </div>
          
          <div className="debug-section">
            <h4>Tabelle Database</h4>
            {Object.entries(connectionStatus.tables).map(([table, status]) => (
              <div className="debug-item" key={table}>
                <span>{table}: </span>
                <span className={getStatusColor(status)}>
                  {status === 'ok' ? 'Accessibile' : 'Errore'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="debug-actions">
            <button className="btn-secondary" onClick={handleRefresh}>
              <i className="fas fa-sync-alt"></i> Ricontrolla
            </button>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              <i className="fas fa-redo"></i> Ricarica App
            </button>
          </div>
          
          <div className="debug-help">
            <h4>Suggerimenti</h4>
            <ul>
              <li>Verifica che Supabase sia in esecuzione su: <code>http://127.0.0.1:54321</code></li>
              <li>Controlla i log del server Supabase</li>
              <li>Assicurati che le tabelle nel DB abbiano la struttura corretta</li>
              <li>Prova a cancellare la cache del browser</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;