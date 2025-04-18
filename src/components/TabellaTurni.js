// components/TabellaTurni.js
import React, { useState, useEffect } from 'react';
import { getNegozioById } from '../services/negoziService';
import { getDipendentiByNegozioId } from '../services/dipendentiService';
import '../styles/TabellaTurni.css';

function TabellaTurni({ onNavigate, negozioId }) {
  const [negozio, setNegozio] = useState(null);
  const [dipendenti, setDipendenti] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica il negozio
        const negozioData = await getNegozioById(negozioId);
        setNegozio(negozioData);
        
        // Carica i dipendenti del negozio
        const dipendentiList = await getDipendentiByNegozioId(negozioId);
        setDipendenti(dipendentiList);
        
        // Configurazione delle variabili globali per la tabella esistente
        // Queste variabili sono richieste dal codice esistente della tabella
        window.pairToEmployee = dipendentiList.map(d => d.nomeTurno);
        window.giorniLavorativiSettimanali = negozioData.giorniLavorativi;
        window.employeeVariations = {};
        window.employees = {};
        
        // Inizializza le variazioni e le ore settimanali per ogni dipendente
        dipendentiList.forEach(dipendente => {
          window.employeeVariations[dipendente.nomeTurno] = [];
          window.employees[dipendente.nomeTurno] = dipendente.oreSettimanali;
        });
        
        // Imposta il mese e anno corrente (puoi modificare per consentire la selezione)
        const currentDate = new Date();
        window.mese = currentDate.getMonth();
        window.anno = currentDate.getFullYear();
        
        // Nascondi il popup iniziale poiché gestiamo la selezione della data diversamente
        const initialPopup = document.getElementById("initialPopup");
        if (initialPopup) {
          initialPopup.style.display = "none";
        }
        
        // Inizializza la tabella
        if (typeof window.initTable === 'function') {
          window.initTable();
        }
        
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup quando il componente viene smontato
    return () => {
      // Rimuovi elementi creati dinamicamente
      const hotContainer = document.getElementById("hot");
      if (hotContainer) {
        hotContainer.innerHTML = "";
      }
    };
  }, [negozioId]);
  
  const handleMonthChange = (e) => {
    window.mese = parseInt(e.target.value, 10);
    if (typeof window.initTable === 'function') {
      window.initTable();
    }
  };
  
  const handleYearChange = (e) => {
    window.anno = parseInt(e.target.value, 10);
    if (typeof window.initTable === 'function') {
      window.initTable();
    }
  };
  
  // Nomi dei mesi in italiano
  const mesi = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  // Genera gli anni per il selettore (da 3 anni fa a 3 anni in avanti)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);
  
  if (loading) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento tabella turni...</span>
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
              onClick={() => onNavigate('negozi')}
            >
              Negozi
            </button>
            <i className="fas fa-chevron-right"></i>
            <span>{negozio?.nome}</span>
          </div>
          <h1>Gestione Turni</h1>
          <p>Organizza i turni di lavoro per {negozio?.nome}</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('dipendenti', { negozioId })}
          >
            <i className="fas fa-users"></i> Gestisci Dipendenti
          </button>
        </div>
      </div>
      
      <div className="tabella-controls">
        <div className="date-selectors">
          <div className="form-group">
            <label htmlFor="mese">Mese:</label>
            <select 
              id="mese" 
              value={window.mese} 
              onChange={handleMonthChange}
            >
              {mesi.map((mese, index) => (
                <option key={index} value={index}>{mese}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="anno">Anno:</label>
            <select 
              id="anno" 
              value={window.anno} 
              onChange={handleYearChange}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {dipendenti.length === 0 ? (
          <div className="no-dipendenti-warning">
            <i className="fas fa-exclamation-triangle"></i>
            <span>
              Non ci sono dipendenti configurati per questo negozio. 
              <button 
                className="btn-link" 
                onClick={() => onNavigate('dipendenti', { negozioId })}
              >
                Aggiungi dipendenti
              </button>
            </span>
          </div>
        ) : null}
      </div>
      
      {/* Questo div verrà popolato dal codice esistente della tabella */}
      <div className="tabella-wrapper">
        <div id="hot"></div>
        
        {/* Tutti i popup e overlay della tabella esistente */}
        <div id="initialPopup"></div>
        <div id="cellOverlay" className="cellOverlay" onclick="if(event.target===this) cancelCellPopup()"></div>
        <div id="headerOverlay" className="headerOverlay" onclick="if(event.target===this) cancelHeaderPopup()"></div>
        <div id="manualTimeOverlay" className="cellOverlay" onclick="if(event.target===this) closeManualTimePopup()"></div>
        <div id="fatturatoOverlay" className="cellOverlay" onclick="if(event.target===this) closeFatturatoPopup()"></div>
        <div id="particolaritaOverlay" className="cellOverlay" onclick="if(event.target===this) closeParticolaritaPopup()"></div>
        <div id="differenzaPrecedenteOverlay" className="cellOverlay" onclick="if(event.target===this) closeDifferenzaPrecedentePopup()"></div>
        <div id="dragPreview" className="drag-preview" style={{ display: 'none' }}></div>
        <div id="dropIndicator" className="drop-indicator"></div>
      </div>
      
      {/* Istruzioni o legenda */}
      <div className="tabella-legend">
        <h3>Legenda e Istruzioni</h3>
        <div className="legend-items">
          <div className="legend-item">
            <i className="fas fa-question-circle"></i>
            <span>Clicca su una cella vuota per inserire o modificare un turno</span>
          </div>
          <div className="legend-item">
            <i className="fas fa-calendar-day"></i>
            <span>Per inserire giorni di ferie o permessi, seleziona "A Casa" nel popup</span>
          </div>
          <div className="legend-item">
            <i className="fas fa-clock"></i>
            <span>Clicca sull'intestazione di un dipendente per modificare le sue ore settimanali</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TabellaTurni;