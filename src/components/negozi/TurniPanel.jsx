// src/components/negozi/TurniPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNegozioById } from '../../app/slices/negoziSlice';
import { fetchDipendentiByNegozioId } from '../../app/slices/dipendentiSlice';
import { fetchTurniSalvati, deleteTabellaThunk } from '../../app/slices/turniSlice';
import { openConfirmationDialog, addNotification } from '../../app/slices/uiSlice';
import '../../styles/TurniList.css';

// Contatore globale per tracciare i render
let renderCount = 0;

const TurniPanel = ({ negozioId }) => {
  console.log('🔵 ========== INIZIO RENDER TurniPanel ==========');
  console.log(`🔵 Render #${++renderCount} - Timestamp: ${new Date().toISOString()}`);
  console.log('🔵 negozioId prop:', negozioId);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Refs per tracciare lo stato e prevenire loop
  const hasLoadedRef = useRef(false);
  const currentNegozioIdRef = useRef(null);
  const isMountedRef = useRef(true);
  const effectRunCountRef = useRef(0);
  
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
  
  console.log('🔵 Stati attuali:', {
    loading,
    hasNegozio: !!negozio,
    negozioId: negozio?.id,
    numDipendenti: dipendenti.length,
    numTabelle: tabelleSalvate.length,
    hasLoadedRef: hasLoadedRef.current,
    currentNegozioIdRef: currentNegozioIdRef.current
  });
  
  // Nomi dei mesi in italiano
  const mesi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  // Genera gli anni per il selettore (da 2 anni fa a 2 anni in avanti)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  // UseEffect per mount/unmount
  useEffect(() => {
    console.log('🟢 MOUNT: TurniPanel montato');
    isMountedRef.current = true;
    
    return () => {
      console.log('🔴 UNMOUNT: TurniPanel smontato');
      isMountedRef.current = false;
      hasLoadedRef.current = false;
      renderCount = 0; // Reset counter on unmount
    };
  }, []);
  
  // UseEffect principale per caricamento dati - MODIFICATO
  useEffect(() => {
    effectRunCountRef.current++;
    console.log('🟡 ========== USEEFFECT PRINCIPALE ==========');
    console.log(`🟡 useEffect run #${effectRunCountRef.current} per negozioId: ${negozioId}`);
    console.log('🟡 hasLoadedRef.current:', hasLoadedRef.current);
    console.log('🟡 currentNegozioIdRef.current:', currentNegozioIdRef.current);
    console.log('🟡 negozio?.id:', negozio?.id);
    
    // Previeni caricamenti multipli per lo stesso negozio
    if (hasLoadedRef.current && currentNegozioIdRef.current === negozioId) {
      console.log('⏭️ SKIP: Dati già caricati per questo negozio');
      return;
    }
    
    // Se negozioId non è valido, non fare nulla
    if (!negozioId) {
      console.log('⚠️ SKIP: negozioId non valido');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      console.log('🚀 ========== INIZIO CARICAMENTO DATI ==========');
      console.log('🚀 Timestamp:', new Date().toISOString());
      
      // Previeni caricamenti multipli simultanei
      if (hasLoadedRef.current && currentNegozioIdRef.current === negozioId) {
        console.log('⏭️ SKIP: Caricamento già in corso o completato');
        return;
      }
      
      // Segna che stiamo caricando per questo negozio
      console.log('🚀 Imposto currentNegozioIdRef:', negozioId);
      currentNegozioIdRef.current = negozioId;
      
      console.log('🚀 setLoading(true)');
      setLoading(true);
      
      try {
        // 1. Carica il negozio SOLO se non è già caricato o se l'ID è diverso
        if (!negozio || negozio.id !== parseInt(negozioId)) {
          console.log('📦 CHIAMATA API: fetchNegozioById - negozio non presente o ID diverso');
          const startTime1 = Date.now();
          await dispatch(fetchNegozioById(negozioId)).unwrap();
          console.log(`📦 API risposta in ${Date.now() - startTime1}ms`);
        } else {
          console.log('📦 SKIP: Negozio già caricato con ID corretto');
        }
        
        if (!isMountedRef.current) {
          console.log('⚠️ Componente smontato durante caricamento negozio');
          return;
        }
        
        // 2. Carica i dipendenti
        console.log('👥 CHIAMATA API: fetchDipendentiByNegozioId...');
        const startTime2 = Date.now();
        await dispatch(fetchDipendentiByNegozioId(negozioId)).unwrap();
        console.log(`👥 API risposta in ${Date.now() - startTime2}ms`);
        
        if (!isMountedRef.current) {
          console.log('⚠️ Componente smontato durante caricamento dipendenti');
          return;
        }
        
        // 3. Carica le tabelle turni salvate
        console.log('📅 CHIAMATA API: fetchTurniSalvati...');
        const startTime3 = Date.now();
        await dispatch(fetchTurniSalvati(negozioId)).unwrap();
        console.log(`📅 API risposta in ${Date.now() - startTime3}ms`);
        
        if (!isMountedRef.current) {
          console.log('⚠️ Componente smontato durante caricamento tabelle');
          return;
        }
        
        // Segna che abbiamo completato il caricamento
        console.log('✅ Imposto hasLoadedRef = true');
        hasLoadedRef.current = true;
        
      } catch (error) {
        console.error('❌ ERRORE nel caricamento:', error);
        if (isMountedRef.current) {
          dispatch(addNotification({
            type: 'error',
            message: `Errore nel caricamento dei dati: ${error.message || 'Errore sconosciuto'}`,
            duration: 5000
          }));
          // In caso di errore, resetta il flag per permettere retry
          hasLoadedRef.current = false;
        }
      } finally {
        if (isMountedRef.current) {
          console.log('🏁 FINE CARICAMENTO - setLoading(false)');
          setLoading(false);
        } else {
          console.log('⚠️ Componente smontato, non imposto loading=false');
        }
        console.log('🏁 ========== FINE CARICAMENTO DATI ==========');
      }
    };
    
    fetchData();
  }, [dispatch, negozioId]); // RIMOSSO 'negozio' dalle dipendenze per evitare loop!
  
  const handleMonthChange = (e) => {
    console.log('📅 handleMonthChange:', e.target.value);
    setSelectedMonth(parseInt(e.target.value, 10));
  };

  const handleYearChange = (e) => {
    console.log('📅 handleYearChange:', e.target.value);
    setSelectedYear(parseInt(e.target.value, 10));
  };
  
  const handleCreateTable = () => {
    console.log('➕ handleCreateTable chiamata');
    navigate(`/negozi/${negozioId}/turni/${selectedYear}/${selectedMonth}`);
  };
  
  const handleOpenTable = (year, month) => {
    console.log('📂 handleOpenTable:', year, month);
    navigate(`/negozi/${negozioId}/turni/${year}/${month}`);
  };
  
  const handleDeleteTable = (tableId) => {
    console.log('🗑️ handleDeleteTable:', tableId);
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
  
  console.log('🔵 ========== INIZIO RENDERING JSX ==========');
  
  if (loading) {
    console.log('🔵 Rendering: LOADING STATE');
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento dati turni...</span>
      </div>
    );
  }
  
  console.log('🔵 Rendering: CONTENT STATE');
  
  return (
    <div className="turni-tab">
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
              Aggiungi dipendenti prima di creare una tabella turni.
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
            {dipendenti.slice(0, 5).map(dipendente => (
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
            {dipendenti.length > 5 && (
              <div className="dipendente-mini-card dipendente-more">
                <div className="dipendente-avatar">
                  +{dipendenti.length - 5}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {console.log('🔵 ========== FINE RENDERING JSX ==========')}
    </div>
  );
};

export default TurniPanel;