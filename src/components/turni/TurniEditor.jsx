// Modifica del componente TurniEditor per rispettare la richiesta di creare una nuova tabella

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTabellaById, saveTabellaThunk } from '../../app/slices/turniSlice';
import { addNotification } from '../../app/slices/uiSlice';
import TurniTableComponent from './TurniTableComponent';
import '../../styles/TurniTable.css';

const TurniEditor = ({ negozioId, anno, mese, dipendenti }) => {
  const [isNewTable, setIsNewTable] = useState(true);
  const [tabellaData, setTabellaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceNew, setForceNew] = useState(false); // Nuovo stato per forzare una nuova tabella
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Verifica se l'URL contiene un parametro "nuova=true"
  useEffect(() => {
    const url = new URL(window.location.href);
    const nuovaParam = url.searchParams.get('nuova');
    if (nuovaParam === 'true') {
      console.log('Richiesta nuova tabella forzata tramite URL');
      setForceNew(true);
    }
  }, []);
  
  // Carica la tabella se esiste
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Se l'utente ha esplicitamente richiesto una nuova tabella, non caricare dati esistenti
        if (forceNew) {
          console.log('Creazione nuova tabella forzata, non verranno caricati dati esistenti');
          setIsNewTable(true);
          setTabellaData(null);
          setLoading(false);
          return;
        }
        
        console.log('Verifica esistenza tabella salvata...');
        const result = await dispatch(fetchTabellaById({ negozioId, anno, mese })).unwrap();
        
        if (result.data && result.data.data) {
          console.log('Tabella esistente trovata, caricamento dati');
          setTabellaData(result.data.data);
          setIsNewTable(false);
        } else {
          console.log('Nessuna tabella esistente trovata, creazione nuova tabella');
          setIsNewTable(true);
        }
      } catch (error) {
        console.error('Errore nel caricamento della tabella:', error);
        dispatch(addNotification({
          type: 'error',
          message: `Errore nel caricamento della tabella: ${error.message || String(error)}`,
          duration: 5000
        }));
        // In caso di errore, creiamo comunque una nuova tabella
        setIsNewTable(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [dispatch, negozioId, anno, mese, forceNew]);
  
  // Gestisce il salvataggio della tabella
  const handleSave = (tableData) => {
    // Return the promise from the dispatch call
    return dispatch(saveTabellaThunk({
      negozioId, 
      anno, 
      mese, 
      data: tableData
    }))
    .unwrap()
    .then(() => {
      // Se i dati contengono il flag isSaved, imposta isNewTable a false
      if (tableData && tableData.isSaved) {
        setIsNewTable(false);
      }
      
      dispatch(addNotification({
        type: 'success',
        message: 'Tabella turni salvata con successo',
        duration: 3000
      }));
      
      // Aggiornamento del browser URL per rimuovere eventuali parametri "nuova"
      if (forceNew) {
        const url = new URL(window.location.href);
        url.searchParams.delete('nuova');
        window.history.replaceState({}, '', url.toString());
        setForceNew(false);
      }
      
      // Return true to indicate success to the caller
      return true;
    })
    .catch(error => {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio della tabella: ${error}`,
        duration: 5000
      }));
      // Rethrow the error to propagate it to the caller
      throw error;
    });
  };
  
  // Gestisce il ritorno alla hub del negozio
  const handleReturn = () => {
    navigate(`/negozi/${negozioId}`);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Caricamento tabella turni...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="turni-editor-container">
      <TurniTableComponent
        negozioId={negozioId}
        anno={anno}
        mese={mese}
        dipendenti={dipendenti}
        isNewTable={isNewTable}
        initialData={tabellaData}
        onSave={handleSave}
        onReturn={handleReturn}
      />
    </div>
  );
};

export default TurniEditor;