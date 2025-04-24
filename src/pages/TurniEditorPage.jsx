// src/pages/TurniEditorPage.jsx - Versione corretta
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNegozioById } from '../app/slices/negoziSlice';
import { addNotification } from '../app/slices/uiSlice';
import '../styles/TurniEditor.css';

const TurniEditorPage = () => {
  const { negozioId, anno, mese } = useParams();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const negozio = useSelector(state => state.negozi.currentNegozio);
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
  }, [dispatch, negozioId, negozio]);
  
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
  
  // Costruisci l'URL per l'iframe
  const iframeUrl = `/tabella-turni/index.html?negozioId=${negozioId}&month=${mese}&year=${anno}`;
  
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
      
      {/* Iframe per la tabella dei turni */}
      <div className="tabella-iframe-container">
        <iframe
          src={iframeUrl}
          title="Tabella Turni"
          className="turni-iframe"
          style={{ width: '100%', height: '800px', border: 'none' }}
        />
      </div>
      
      {/* Istruzioni */}
      <div className="tabella-istruzioni">
        <h3>Istruzioni</h3>
        <div className="istruzioni-content">
          <ul>
            <li>Clicca su una cella per inserire o modificare un turno</li>
            <li>Usa i codici: M (Mattina), P (Pomeriggio), S (Sera), R (Riposo), F (Ferie), ML (Malattia)</li>
            <li>Usa il pulsante "Salva" per memorizzare i dati</li>
            <li>Per uscire e tornare alla lista, usa il pulsante "Indietro"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TurniEditorPage;