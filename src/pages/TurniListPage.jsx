// src/pages/TurniListPage.jsx - Versione semplificata per test
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNegozioById } from '../services/api/negoziAPI';
import { getDipendentiByNegozioId } from '../services/api/dipendentiAPI';
import '../styles/TurniList.css';

const TurniListPage = () => {
  const { negozioId } = useParams();
  const navigate = useNavigate();
  
  // Stati locali
  const [loading, setLoading] = useState(true);
  const [negozio, setNegozio] = useState(null);
  const [dipendenti, setDipendenti] = useState([]);
  const [tabelleSalvate, setTabelleSalvate] = useState([]);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  console.log('🔄 Render TurniListPage - loading:', loading);
  
  // Nomi dei mesi in italiano
  const mesi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  // Genera gli anni per il selettore
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  
  // Carica i dati all'avvio
  useEffect(() => {
    let isMounted = true;
    console.log('🎯 useEffect chiamato per negozioId:', negozioId);
    
    const loadData = async () => {
      console.log('🚀 Inizio caricamento dati...');
      setLoading(true);
      setError(null);
      
      try {
        // 1. Carica il negozio
        console.log('📦 Carico negozio...');
        const negozioData = await getNegozioById(negozioId);
        if (!isMounted) return;
        setNegozio(negozioData);
        console.log('✅ Negozio caricato:', negozioData);
        
        // 2. Carica i dipendenti
        console.log('👥 Carico dipendenti...');
        const dipendentiData = await getDipendentiByNegozioId(negozioId);
        if (!isMounted) return;
        setDipendenti(dipendentiData || []);
        console.log('✅ Dipendenti caricati:', dipendentiData?.length || 0);
        
        // 3. Carica le tabelle salvate dal localStorage
        console.log('📅 Carico tabelle salvate...');
        const savedTables = loadSavedTablesFromLocalStorage();
        if (!isMounted) return;
        setTabelleSalvate(savedTables);
        console.log('✅ Tabelle salvate caricate:', savedTables.length);
        
      } catch (err) {
        console.error('❌ Errore nel caricamento:', err);
        if (isMounted) {
          setError(err.message || 'Errore nel caricamento dei dati');
        }
      } finally {
        if (isMounted) {
          console.log('🏁 Caricamento completato, setLoading(false)');
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      console.log('🧹 Cleanup useEffect');
      isMounted = false;
    };
  }, [negozioId]); // Solo negozioId come dipendenza
  
  // Funzione per caricare le tabelle dal localStorage
  const loadSavedTablesFromLocalStorage = () => {
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
    
    return tables;
  };
  
  // Altri handler...
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
  
  const handleDeleteTable = (tableId, event) => {
    event.stopPropagation();
    if (window.confirm('Sei sicuro di voler eliminare questa tabella?')) {
      localStorage.removeItem(tableId);
      setTabelleSalvate(prev => prev.filter(t => t.id !== tableId));
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
  
  // Rendering
  if (loading) {
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
    return (
      <div className="error-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Errore: {error}</p>
          <button onClick={() => window.location.reload()}>Ricarica</button>
        </div>
      </div>
    );
  }
  
  const { organizedTables, sortedYears } = organizeTablesByYear();
  
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
    </div>
  );
};

export default TurniListPage;