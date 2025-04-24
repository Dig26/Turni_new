// src/components/turni/base/TurniTable.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveTabellaThunk } from '../../../app/slices/turniSlice';
import { addNotification } from '../../../app/slices/uiSlice';
import '../../../styles/TurniTable.css';

const TurniTable = ({ negozioId, anno, mese, data, onSave, onReturn }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef(null);
  const dispatch = useDispatch();
  const saveMessage = useSelector(state => state.turni.saveMessage);
  
  // Gestione della comunicazione con l'iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Verifica che il messaggio provenga dal nostro dominio
      if (event.origin !== window.location.origin) return;
      
      // Gestisci i vari tipi di messaggi
      if (event.data.type === 'SAVE_DATA') {
        handleSaveData(event.data.payload);
      } else if (event.data.type === 'NAVIGATE_BACK') {
        if (onReturn) onReturn();
      } else if (event.data.type === 'IFRAME_LOADED') {
        setIframeLoaded(true);
      } else if (event.data.type === 'ERROR') {
        dispatch(addNotification({ 
          type: 'error', 
          message: event.data.message || 'Si è verificato un errore' 
        }));
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch, onReturn]);
  
  // Funzione per gestire il salvataggio dei dati dalla tabella
  const handleSaveData = (data) => {
    dispatch(saveTabellaThunk({ negozioId, anno, mese, data }))
      .unwrap()
      .then(() => {
        if (onSave) onSave();
        
        // Notifica l'iframe che il salvataggio è avvenuto con successo
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
            type: 'SAVE_SUCCESS' 
          }, window.location.origin);
        }
        
        dispatch(addNotification({
          type: 'success',
          message: 'Tabella turni salvata con successo!',
          duration: 3000
        }));
      })
      .catch(error => {
        dispatch(addNotification({
          type: 'error',
          message: `Errore nel salvataggio della tabella: ${error}`,
          duration: 5000
        }));
        
        // Notifica l'iframe dell'errore
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ 
            type: 'SAVE_ERROR',
            message: error
          }, window.location.origin);
        }
      });
  };
  
  // Calcola l'URL per l'iframe
  const iframeUrl = `/tabella-turni/index.html?negozioId=${negozioId}&month=${mese}&year=${anno}`;
  
  // Invia i dati iniziali all'iframe quando è caricato
  useEffect(() => {
    if (iframeLoaded && data && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'LOAD_DATA',
        payload: data
      }, window.location.origin);
    }
  }, [iframeLoaded, data]);
  
  return (
    <div className="turni-table-container">
      {!iframeLoaded && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento tabella turni...</span>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        title="Tabella Turni"
        className="turni-iframe"
        onLoad={() => setIframeLoaded(true)}
      />
    </div>
  );
};

export default TurniTable;