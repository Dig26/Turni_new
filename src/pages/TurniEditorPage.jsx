// src/pages/TurniEditorPage.jsx - Versione aggiornata per utilizzare TurniEditor
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNegozioById } from '../app/slices/negoziSlice';
import { fetchDipendentiByNegozioId } from '../app/slices/dipendentiSlice';
import { fetchTabellaById, clearSaveMessage } from '../app/slices/turniSlice';
import { addNotification } from '../app/slices/uiSlice';
import TurniEditor from '../components/turni/TurniEditor';
import '../styles/TurniEditor.css';

const TurniEditorPage = () => {
  const { negozioId, anno, mese } = useParams();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const negozio = useSelector(state => state.negozi.currentNegozio);
  const dipendenti = useSelector(state => 
    state.dipendenti && state.dipendenti.byNegozio 
      ? state.dipendenti.byNegozio[negozioId] || [] 
      : []
  );
  const error = useSelector(state => state.turni?.error);
  
  const mesi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carica il negozio se non è già caricato
        if (!negozio || negozio.id !== negozioId) {
          await dispatch(fetchNegozioById(negozioId)).unwrap();
        }
        
        // Carica i dipendenti
        await dispatch(fetchDipendentiByNegozioId(negozioId)).unwrap();
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        dispatch(addNotification({
          type: 'error',
          message: `Errore nel caricamento dei dati: ${error.message || 'Errore sconosciuto'}`,
          duration: 5000
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Pulisci il messaggio di salvataggio quando si lascia la pagina
    return () => {
      dispatch(clearSaveMessage());
    };
  }, [dispatch, negozioId, anno, mese, negozio]);
  
  const handleReturn = () => {
    navigate(`/negozi/${negozioId}/turni`);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Caricamento dati...</span>
        </div>
      </div>
    );
  }
  
  if (dipendenti.length === 0) {
    return (
      <div className="tabella-turni-container">
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              <button 
                className="btn-link" 
                onClick={() => navigate('/negozi')}
              >
                Negozi
              </button>
              <i className="fas fa-chevron-right"></i>
              <button 
                className="btn-link" 
                onClick={handleReturn}
              >
                Turni
              </button>
              <i className="fas fa-chevron-right"></i>
              <span>{mesi[parseInt(mese)]} {anno}</span>
            </div>
            <h1>Tabella Turni: {mesi[parseInt(mese)]} {anno}</h1>
            <p>Gestisci i turni di lavoro per {negozio?.nome || 'il negozio selezionato'}</p>
          </div>
        </div>
        
        <div className="no-dipendenti-warning">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Non puoi creare una tabella turni senza prima aggiungere dei dipendenti.</p>
          <button
            className="btn-primary"
            onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
          >
            <i className="fas fa-users"></i> Gestisci Dipendenti
          </button>
          <button
            className="btn-secondary"
            onClick={handleReturn}
            style={{marginLeft: '10px'}}
          >
            <i className="fas fa-arrow-left"></i> Torna alla Lista
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tabella-turni-container">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <button 
              className="btn-link" 
              onClick={() => navigate('/negozi')}
            >
              Negozi
            </button>
            <i className="fas fa-chevron-right"></i>
            <button 
              className="btn-link" 
              onClick={handleReturn}
            >
              Turni
            </button>
            <i className="fas fa-chevron-right"></i>
            <span>{mesi[parseInt(mese)]} {anno}</span>
          </div>
          <h1>Tabella Turni: {mesi[parseInt(mese)]} {anno}</h1>
          <p>Gestisci i turni di lavoro per {negozio?.nome || 'il negozio selezionato'}</p>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={handleReturn}
          >
            <i className="fas fa-arrow-left"></i> Torna alla Lista
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
          >
            <i className="fas fa-users"></i> Gestisci Dipendenti
          </button>
        </div>
      </div>
      
      {/* Componente TurniEditor */}
      <TurniEditor 
        negozioId={negozioId}
        anno={anno}
        mese={mese}
        dipendenti={dipendenti}
      />
      
      {/* Istruzioni */}
      <div className="tabella-istruzioni">
        <h3>Istruzioni</h3>
        <div className="istruzioni-content">
          <ul>
            <li>Clicca su una cella per inserire o modificare un turno</li>
            <li>Puoi scegliere tra "Lavora" (inserendo orario) o "A Casa" (specificando il motivo)</li>
            <li>Usa il pulsante "Salva Tabella" per memorizzare i dati</li>
            <li>Per uscire e tornare alla lista, usa il pulsante "Torna alla Lista"</li>
            <li>Le righe di riepilogo (ORE LAVORATE, FERIE, ecc.) si aggiornano automaticamente</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TurniEditorPage;