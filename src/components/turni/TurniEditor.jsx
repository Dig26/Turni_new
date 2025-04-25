// src/components/turni/TurniEditor.jsx
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Carica la tabella se esiste
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await dispatch(fetchTabellaById({ negozioId, anno, mese })).unwrap();
        if (result.data && result.data.data) {
          setTabellaData(result.data.data);
          setIsNewTable(false);
        } else {
          setIsNewTable(true);
        }
      } catch (error) {
        console.error('Errore nel caricamento della tabella:', error);
        dispatch(addNotification({
          type: 'error',
          message: `Errore nel caricamento della tabella: ${error.message || String(error)}`,
          duration: 5000
        }));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [dispatch, negozioId, anno, mese]);
  
  // Gestisce il salvataggio della tabella
  const handleSave = (tableData) => {
    dispatch(saveTabellaThunk({
      negozioId, 
      anno, 
      mese, 
      data: tableData
    }))
    .unwrap()
    .then(() => {
      dispatch(addNotification({
        type: 'success',
        message: 'Tabella turni salvata con successo',
        duration: 3000
      }));
      setIsNewTable(false);
    })
    .catch(error => {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio della tabella: ${error}`,
        duration: 5000
      }));
    });
  };
  
  // Gestisce il ritorno alla lista
  const handleReturn = () => {
    navigate(`/negozi/${negozioId}/turni`);
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