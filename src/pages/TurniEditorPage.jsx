// src/pages/TurniEditorPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNegozioById } from '../app/slices/negoziSlice';
import { fetchDipendentiByNegozioId } from '../app/slices/dipendentiSlice';
import { fetchTabellaById } from '../app/slices/turniSlice';
import { addNotification } from '../app/slices/uiSlice';
import TurniTable from '../components/turni/base/TurniTable';
import '../styles/TurniEditor.css';

const TurniEditorPage = () => {
  const { negozioId, anno, mese } = useParams();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const negozio = useSelector(state => state.negozi.currentNegozio);
  const dipendenti = useSelector(state => state.dipendenti.byNegozio[negozioId] || []);
  const currentTabella = useSelector(state => state.turni.currentTabella);
  const error = useSelector(state => state.turni.error);
  
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
        
        // Carica i dipendenti se non sono già caricati
        if (!dipendenti.length) {
          await dispatch(fetchDipendentiByNegozioId(negozioId)).unwrap();
        }
        
        // Carica la tabella turni specifica
        await dispatch(fetchTabellaById({ negozioId, anno, mese })).unwrap();
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
        dispatch(addNotification({
          type: 'error',
          message: `Errore nel caricamento dei dati: ${error}`,
          duration: 5000
        }));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch, negozioId, anno, mese, negozio, dipendenti.length]);
  
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
  
  if (error && !currentTabella) {
    // Potrebbe essere un errore perché la tabella non esiste ancora
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
            <p>Gestisci i turni di lavoro per {negozio?.nome}</p>
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
        
        {/* Qui inseriamo il componente TurniTable anche se non abbiamo dati, ma creerà una nuova tabella */}
        <TurniTable 
          negozioId={negozioId} 
          anno={parseInt(anno)} 
          mese={parseInt(mese)} 
          data={null}
          onSave={() => {
            dispatch(addNotification({
              type: 'success',
              message: 'Tabella turni salvata con successo!',
              duration: 3000
            }));
          }}
          onReturn={handleReturn}
        />
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
          <p>Gestisci i turni di lavoro per {negozio?.nome}</p>
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
      
      {/* Componente Tabella Turni */}
      <TurniTable 
        negozioId={negozioId} 
        anno={parseInt(anno)} 
        mese={parseInt(mese)} 
        data={currentTabella?.data?.data || null}
        onSave={() => {
          dispatch(addNotification({
            type: 'success',
            message: 'Tabella turni salvata con successo!',
            duration: 3000
          }));
        }}
        onReturn={handleReturn}
      />
      
      {/* Istruzioni */}
      <div className="tabella-istruzioni">
        <h3>Istruzioni</h3>
        <div className="istruzioni-content">
          <ul>
            <li>Clicca su una cella per inserire o modificare un turno</li>
            <li>Usa il pulsante "Salva" per memorizzare i dati</li>
            <li>Per uscire e tornare alla lista, usa il pulsante "Torna alla Lista"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TurniEditorPage;