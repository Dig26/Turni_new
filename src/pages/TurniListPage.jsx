// src/pages/TurniListPage.jsx - Versione con logging dettagliato per debug
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNegozioById } from '../services/api/negoziAPI';
import { getDipendentiByNegozioId } from '../services/api/dipendentiAPI';
import '../styles/TurniList.css';

// Contatore globale per tracciare i render
let renderCount = 0;

const TurniListPage = () => {
  console.log('🔵 ========== INIZIO RENDER TurniListPage ==========');
  console.log(`🔵 Render #${++renderCount} - Timestamp: ${new Date().toISOString()}`);
  
  const { negozioId } = useParams();
  const navigate = useNavigate();
  
  console.log('🔵 negozioId from params:', negozioId);
  
  // Stati locali
  const [loading, setLoading] = useState(true);
  const [negozio, setNegozio] = useState(null);
  const [dipendenti, setDipendenti] = useState([]);
  const [tabelleSalvate, setTabelleSalvate] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Refs per tracciare lo stato del componente e prevenire loop
  const hasLoadedRef = useRef(false);
  const currentNegozioIdRef = useRef(null);
  const isMountedRef = useRef(true);
  const effectRunCountRef = useRef(0);
  
  console.log('🔵 Stati attuali:', {
    loading,
    hasNegozio: !!negozio,
    numDipendenti: dipendenti.length,
    numTabelle: tabelleSalvate.length,
    hasError: !!error,
    hasLoadedRef: hasLoadedRef.current,
    currentNegozioIdRef: currentNegozioIdRef.current,
    isMountedRef: isMountedRef.current
  });
  
  // Nomi dei mesi in italiano
  const mesi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  // Genera gli anni per il selettore
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  // UseEffect per mount/unmount
  useEffect(() => {
    console.log('🟢 MOUNT: TurniListPage montato');
    isMountedRef.current = true;
    
    // Cleanup function
    return () => {
      console.log('🔴 UNMOUNT: TurniListPage smontato');
      isMountedRef.current = false;
      hasLoadedRef.current = false;
      renderCount = 0; // Reset counter on unmount
    };
  }, []);
  
  // UseEffect principale per caricamento dati
  useEffect(() => {
    effectRunCountRef.current++;
    console.log('🟡 ========== USEEFFECT PRINCIPALE ==========');
    console.log(`🟡 useEffect run #${effectRunCountRef.current} per negozioId: ${negozioId}`);
    console.log('🟡 hasLoadedRef.current:', hasLoadedRef.current);
    console.log('🟡 currentNegozioIdRef.current:', currentNegozioIdRef.current);
    
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
    
    const loadData = async () => {
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
      setError(null);
      
      try {
        // 1. Carica il negozio
        console.log('📦 CHIAMATA API: getNegozioById...');
        const startTime1 = Date.now();
        const negozioData = await getNegozioById(negozioId);
        console.log(`📦 API risposta in ${Date.now() - startTime1}ms`);
        
        if (!isMountedRef.current) {
          console.log('⚠️ Componente smontato durante caricamento negozio');
          return;
        }
        
        console.log('📦 setNegozio:', negozioData);
        setNegozio(negozioData);
        
        // 2. Carica i dipendenti
        console.log('👥 CHIAMATA API: getDipendentiByNegozioId...');
        const startTime2 = Date.now();
        const dipendentiData = await getDipendentiByNegozioId(negozioId);
        console.log(`👥 API risposta in ${Date.now() - startTime2}ms`);
        
        if (!isMountedRef.current) {
          console.log('⚠️ Componente smontato durante caricamento dipendenti');
          return;
        }
        
        console.log('👥 setDipendenti:', dipendentiData?.length || 0, 'elementi');
        setDipendenti(dipendentiData || []);
        
        // 3. Carica le tabelle salvate dal localStorage
        console.log('📅 Carico tabelle da localStorage...');
        const savedTables = loadSavedTablesFromLocalStorage();
        
        if (!isMountedRef.current) {
          console.log('⚠️ Componente smontato durante caricamento tabelle');
          return;
        }
        
        console.log('📅 setTabelleSalvate:', savedTables.length, 'tabelle');
        setTabelleSalvate(savedTables);
        
        // Segna che abbiamo completato il caricamento
        console.log('✅ Imposto hasLoadedRef = true');
        hasLoadedRef.current = true;
        
      } catch (err) {
        console.error('❌ ERRORE nel caricamento:', err);
        if (isMountedRef.current) {
          setError(err.message || 'Errore nel caricamento dei dati');
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
    
    loadData();
  }, [negozioId]); // Solo negozioId come dipendenza
  
  // Funzione per caricare le tabelle dal localStorage
  const loadSavedTablesFromLocalStorage = () => {
    console.log('💾 loadSavedTablesFromLocalStorage chiamata');
    const tables = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`tabella_turni_${negozioId}_`)) {
          const savedData = JSON.parse(localStorage.getItem(key));
          if (savedData && savedData.timestamp) {
            const keyParts = key.split('_');
            const year = keyParts[3];
            const month = keyParts[4];
            
            tables.push({
              id: key,
              year: year,
              month: month,
              monthName: mesi[parseInt(month)],
              timestamp: savedData.timestamp,
              name: `${mesi[parseInt(month)]} ${year}`
            });
          }
        }
      }
    } catch (err) {
      console.error('Errore nel caricamento delle tabelle:', err);
    }
    
    // Ordina le tabelle
    tables.sort((a, b) => {
      if (a.year !== b.year) {
        return parseInt(b.year) - parseInt(a.year);
      }
      return parseInt(a.month) - parseInt(b.month);
    });
    
    console.log('💾 Tabelle trovate:', tables.length);
    return tables;
  };
  
  // Funzione per ricaricare le tabelle salvate (chiamata dopo eliminazione)
  const reloadSavedTables = () => {
    console.log('🔄 reloadSavedTables chiamata');
    const savedTables = loadSavedTablesFromLocalStorage();
    setTabelleSalvate(savedTables);
  };
  
  // Altri handler...
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
    navigate(`/negozi/${negozioId}/turni/${selectedYear}/${selectedMonth}?nuova=true`);
  };
  
  const handleOpenTable = (year, month) => {
    console.log('📂 handleOpenTable:', year, month);
    navigate(`/negozi/${negozioId}/turni/${year}/${month}`);
  };
  
  const handleDeleteTable = (tableId, event) => {
    console.log('🗑️ handleDeleteTable:', tableId);
    event.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questa tabella?')) {
      localStorage.removeItem(tableId);
      reloadSavedTables();
    }
  };
  
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
  
  // Organizza tabelle per anno
  const organizeTablesByYear = () => {
    const organizedTables = {};
    
    tabelleSalvate.forEach(table => {
      const year = table.year;
      if (!organizedTables[year]) {
        organizedTables[year] = [];
      }
      organizedTables[year].push(table);
    });
    
    const sortedYears = Object.keys(organizedTables).sort((a, b) => b - a);
    
    return { organizedTables, sortedYears };
  };
  
  console.log('🔵 ========== INIZIO RENDERING JSX ==========');
  
  // Rendering
  if (loading) {
    console.log('🔵 Rendering: LOADING STATE');
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Caricamento in corso...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    console.log('🔵 Rendering: ERROR STATE');
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Errore: {error}</p>
          <button onClick={() => {
            console.log('🔄 Ricarica pagina richiesta');
            hasLoadedRef.current = false;
            window.location.reload();
          }}>Ricarica</button>
        </div>
      </div>
    );
  }
  
  console.log('🔵 Rendering: CONTENT STATE');
  const { organizedTables, sortedYears } = organizeTablesByYear();
  
  return (
    <div className="turni-list-container">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <button 
              className="btn-link" 
              onClick={() => {
                console.log('🔙 Navigate to negozio');
                navigate(`/negozi/${negozioId}`);
              }}
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
            onClick={() => {
              console.log('🔙 Navigate to negozio (header button)');
              navigate(`/negozi/${negozioId}`);
            }}
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
                onClick={() => {
                  console.log('🔗 Navigate to dipendenti');
                  navigate(`/negozi/${negozioId}/dipendenti`);
                }}
              >
                Aggiungi dipendenti
              </button>
            </span>
          </div>
        )}
      </div>
      
      {/* Elenco tabelle salvate */}
      <div className="tabelle-salvate-container">
        <h3>Tabelle turni salvate</h3>

        {tabelleSalvate.length === 0 ? (
          <div className="no-tabelle-message">
            <i className="fas fa-info-circle"></i>
            <p>Non ci sono ancora tabelle turni salvate. Crea la tua prima tabella!</p>
          </div>
        ) : (
          sortedYears.map(year => (
            <div key={year} className="tabelle-year-section">
              <h4 className="tabelle-year-header">{year}</h4>
              <div className="tabelle-grid">
                {organizedTables[year].map((tabella) => (
                  <div
                    key={tabella.id}
                    className="tabella-card"
                    onClick={() => handleOpenTable(tabella.year, tabella.month)}
                  >
                    <div className="tabella-card-header">
                      <h4>{tabella.monthName}</h4>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => handleDeleteTable(tabella.id, e)}
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
            </div>
          ))
        )}
      </div>
      
      {/* Info sui dipendenti */}
      {dipendenti.length > 0 && (
        <div className="dipendenti-info-container">
          <h3>Dipendenti del negozio ({dipendenti.length})</h3>
          <div className="dipendenti-mini-list">
            {dipendenti.map(dipendente => (
              <div key={dipendente.id} className="dipendente-mini-card">
                <div className="dipendente-avatar">
                  {dipendente.nome ? dipendente.nome.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="dipendente-mini-info">
                  <div className="dipendente-mini-nome">{dipendente.nome} {dipendente.cognome}</div>
                  <div className="dipendente-mini-ore">{dipendente.oreSettimanali || dipendente.ore_settimanali || 40} ore/settimana</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {console.log('🔵 ========== FINE RENDERING JSX ==========')}
    </div>
  );
};

export default TurniListPage;