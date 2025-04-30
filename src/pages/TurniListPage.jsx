// src/pages/TurniListPage.jsx - Versione corretta con gestione sicura dello stato
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNegozioById } from '../app/slices/negoziSlice';
import { fetchDipendentiByNegozioId } from '../app/slices/dipendentiSlice';
import { fetchTurniSalvati, deleteTabellaThunk } from '../app/slices/turniSlice';
import { openConfirmationDialog, addNotification } from '../app/slices/uiSlice';
import '../styles/TurniList.css';

const TurniListPage = () => {
  const { negozioId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Seleziona lo stato con controllo null/undefined
  const negozio = useSelector(state => state.negozi.currentNegozio);
  const dipendenti = useSelector(state => 
    state.dipendenti && state.dipendenti.byNegozio 
      ? state.dipendenti.byNegozio[negozioId] || [] 
      : []
  );
  const tabelleSalvate = useSelector(state => 
    state.turni && state.turni.byNegozio 
      ? state.turni.byNegozio[negozioId] || [] 
      : []
  );
  
  // Nomi dei mesi in italiano
  const mesi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  // Genera gli anni per il selettore (da 2 anni fa a 2 anni in avanti)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
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
        
        // Carica le tabelle turni salvate
        await dispatch(fetchTurniSalvati(negozioId)).unwrap();
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
  
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value, 10));
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value, 10));
  };
  
  const handleCreateTable = () => {
    navigate(`/negozi/${negozioId}/turni/${selectedYear}/${selectedMonth}?nuova=true`);
  };
  
  const handleOpenTable = (year, month) => {
    navigate(`/negozi/${negozioId}/turni/${year}/${month}`);
  };
  
  const handleDeleteTable = (tableId) => {
    dispatch(openConfirmationDialog({
      title: 'Conferma eliminazione',
      message: 'Sei sicuro di voler eliminare questa tabella dei turni? L\'azione non può essere annullata.',
      onConfirm: () => {
        dispatch(deleteTabellaThunk(tableId))
          .unwrap()
          .then(() => {
            dispatch(addNotification({
              type: 'success',
              message: 'Tabella turni eliminata con successo.',
              duration: 3000
            }));
          })
          .catch(error => {
            dispatch(addNotification({
              type: 'error',
              message: `Errore nell'eliminazione della tabella: ${error}`,
              duration: 5000
            }));
          });
      }
    }));
  };
  
  // Formatta la data in modo leggibile
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data non valida';
    }
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
  
  return (
    <div className="turni-list-container">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <button 
              className="btn-link" 
              onClick={() => navigate(`/negozi/${negozioId}`)}
            >
              {negozio?.nome || 'Negozio'}
            </button>
            <i className="fas fa-chevron-right"></i>
            <span>Turni</span>
          </div>
          <h1>Gestione Turni</h1>
          <p>Gestisci i turni di lavoro per {negozio?.nome || 'il negozio selezionato'}</p>
        </div>

        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate(`/negozi/${negozioId}`)}
          >
            <i className="fas fa-arrow-left"></i> Torna al Negozio
          </button>
        </div>
      </div>
      
      {/* Form per creare una nuova tabella */}
      <div className="crea-tabella-container">
        <h3>Crea nuova tabella turni</h3>
        <div className="crea-tabella-form">
          <div className="form-group">
            <label htmlFor="selectMonth">Mese:</label>
            <select
              id="selectMonth"
              value={selectedMonth}
              onChange={handleMonthChange}
            >
              {mesi.map((nomeMese, index) => (
                <option key={index} value={index}>{nomeMese}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="selectYear">Anno:</label>
            <select
              id="selectYear"
              value={selectedYear}
              onChange={handleYearChange}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={handleCreateTable}
            disabled={dipendenti.length === 0}
          >
            <i className="fas fa-calendar-plus"></i> Crea Tabella
          </button>
        </div>

        {dipendenti.length === 0 && (
          <div className="no-dipendenti-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>
              Non ci sono dipendenti configurati per questo negozio.
              <button
                className="btn-link"
                onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
              >
                Aggiungi dipendenti
              </button>
            </span>
          </div>
        )}
      </div>
      
      {/* Elenco delle tabelle salvate */}
      <div className="tabelle-salvate-container">
        <h3>Tabelle turni salvate</h3>

        {tabelleSalvate.length === 0 ? (
          <div className="no-tabelle-message">
            <i className="fas fa-info-circle"></i>
            <p>Non ci sono ancora tabelle turni salvate. Crea la tua prima tabella!</p>
          </div>
        ) : (
          <div className="tabelle-grid">
            {tabelleSalvate.map((tabella) => (
              <div
                key={tabella.id}
                className="tabella-card"
                onClick={() => handleOpenTable(tabella.year, tabella.month)}
              >
                <div className="tabella-card-header">
                  <h4>{tabella.name}</h4>
                  <button
                    className="btn-icon btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(tabella.id);
                    }}
                    title="Elimina tabella"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <div className="tabella-card-body">
                  <div className="tabella-info">
                    <i className="fas fa-clock"></i>
                    <span>Ultimo aggiornamento: {formatDate(tabella.timestamp)}</span>
                  </div>
                </div>
                <div className="tabella-card-footer">
                  <span className="view-prompt">Clicca per visualizzare <i className="fas fa-arrow-right"></i></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Info sui dipendenti */}
      {dipendenti.length > 0 && (
        <div className="dipendenti-info-container">
          <h3>Dipendenti del negozio</h3>
          <div className="dipendenti-mini-list">
            {dipendenti.map(dipendente => (
              <div key={dipendente.id} className="dipendente-mini-card">
                <div className="dipendente-avatar">
                  {dipendente.nome ? dipendente.nome.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="dipendente-mini-info">
                  <div className="dipendente-mini-nome">{dipendente.nome} {dipendente.cognome}</div>
                  <div className="dipendente-mini-ore">{dipendente.oreSettimanali || 40} ore/settimana</div>
                </div>
              </div>
            ))}
          </div>
          <div className="dipendenti-actions">
            <button
              className="btn-primary"
              onClick={() => navigate(`/negozi/${negozioId}/dipendenti/nuovo`)}
            >
              <i className="fas fa-plus"></i> Aggiungi Dipendente
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
            >
              <i className="fas fa-list"></i> Visualizza Tutti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurniListPage;