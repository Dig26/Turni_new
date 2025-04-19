// components/TabellaTurni.js
import React, { useState, useEffect, useRef } from 'react';
import { getNegozioById } from '../services/negoziService';
import { getDipendentiByNegozioId } from '../services/dipendentiService';
import '../styles/TabellaTurni.css';

function TabellaTurni({ onNavigate, negozioId }) {
  const [negozio, setNegozio] = useState(null);
  const [dipendenti, setDipendenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [mese, setMese] = useState(new Date().getMonth());
  const [isTableInitialized, setIsTableInitialized] = useState(false);
  const scriptsLoadedRef = useRef(false);
  const librariesLoadedRef = useRef(false);
  
  // Funzione per caricare le librerie necessarie
  const loadLibraries = () => {
    return new Promise((resolve, reject) => {
      // Controlla se le librerie sono già state caricate
      if (librariesLoadedRef.current) {
        resolve();
        return;
      }
      
      // Array di librerie da caricare in ordine
      const libraries = [
        'https://cdn.jsdelivr.net/npm/handsontable@13.0.0/dist/handsontable.full.min.js'
      ];
      
      // Funzione per caricare le librerie in sequenza
      const loadLibrary = (src) => {
        return new Promise((resolveLib, rejectLib) => {
          // Controlla se la libreria è già stata caricata
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            resolveLib();
            return;
          }
          
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          
          script.onload = () => {
            console.log(`Libreria caricata: ${src}`);
            resolveLib();
          };
          
          script.onerror = () => {
            console.error(`Errore nel caricamento della libreria: ${src}`);
            rejectLib(new Error(`Errore nel caricamento della libreria: ${src}`));
          };
          
          document.body.appendChild(script);
        });
      };
      
      // Carica le librerie in sequenza
      const loadLibrariesSequentially = async () => {
        for (const src of libraries) {
          try {
            await loadLibrary(src);
          } catch (error) {
            reject(error);
            return;
          }
        }
        
        librariesLoadedRef.current = true;
        resolve();
      };
      
      loadLibrariesSequentially();
    });
  };
  
  // Funzione per caricare gli script necessari per la tabella
  const loadTableScripts = () => {
    return new Promise((resolve, reject) => {
      // Controlla se gli script sono già stati caricati
      if (scriptsLoadedRef.current) {
        resolve();
        return;
      }
      
      // Verifica che Handsontable sia disponibile
      if (typeof window.Handsontable === 'undefined') {
        reject(new Error('Handsontable non è disponibile. Assicurati che la libreria sia caricata.'));
        return;
      }
      
      // Array di script da caricare in ordine
      const scripts = [
        '/tabella-turni/scripts/utils.js',
        '/tabella-turni/scripts/popups.js',
        '/tabella-turni/scripts/employeeVariations.js',
        '/tabella-turni/scripts/particolarita.js',
        '/tabella-turni/scripts/differenzaPrecedente.js',
        '/tabella-turni/scripts/table.js',
        '/tabella-turni/scripts/main.js'
      ];
      
      let loadedCount = 0;
      
      // Funzione per caricare gli script in sequenza
      const loadScript = (src) => {
        return new Promise((resolveScript, rejectScript) => {
          // Controlla se lo script è già stato caricato
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            resolveScript();
            return;
          }
          
          const script = document.createElement('script');
          script.src = src;
          script.async = false; // Importante: carica gli script in ordine
          
          script.onload = () => {
            console.log(`Script caricato: ${src}`);
            resolveScript();
          };
          
          script.onerror = () => {
            console.error(`Errore nel caricamento dello script: ${src}`);
            rejectScript(new Error(`Errore nel caricamento dello script: ${src}`));
          };
          
          document.body.appendChild(script);
        });
      };
      
      // Carica gli script in sequenza
      const loadScriptsSequentially = async () => {
        for (const src of scripts) {
          try {
            await loadScript(src);
            loadedCount++;
          } catch (error) {
            reject(error);
            return;
          }
        }
        
        if (loadedCount === scripts.length) {
          scriptsLoadedRef.current = true;
          resolve();
        }
      };
      
      loadScriptsSequentially();
    });
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica il negozio
        const negozioData = await getNegozioById(negozioId);
        setNegozio(negozioData);
        
        // Carica i dipendenti del negozio
        const dipendentiList = await getDipendentiByNegozioId(negozioId);
        // Filtra i dipendenti senza nome o cognome
        const validDipendenti = dipendentiList.filter(
          d => d && d.nome && d.cognome
        );
        setDipendenti(validDipendenti);
        
        // Prima carica le librerie necessarie
        await loadLibraries();
        setLibrariesLoaded(true);
        
        // Poi carica gli script della tabella
        await loadTableScripts();
        setScriptsLoaded(true);
        
      } catch (error) {
        console.error('Errore nel caricamento dei dati o degli script:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Assicuriamoci di aggiungere anche il CSS di Handsontable
    const addHandsontableCSS = () => {
      if (document.querySelector('link[href*="handsontable"]')) return;
      
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://cdn.jsdelivr.net/npm/handsontable@13.0.0/dist/handsontable.full.min.css';
      document.head.appendChild(linkElement);
    };
    
    addHandsontableCSS();
    
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
    setMese(parseInt(e.target.value, 10));
  };
  
  const handleYearChange = (e) => {
    setAnno(parseInt(e.target.value, 10));
  };
  
  const handleCreateTable = () => {
    setLoading(true);
    
    try {
      // Verifica che Handsontable sia disponibile
      if (typeof window.Handsontable === 'undefined') {
        console.error("Handsontable non è disponibile");
        alert("Errore: La libreria Handsontable non è disponibile. Ricarica la pagina e riprova.");
        setLoading(false);
        return;
      }
      
      // Verifica se la funzione initTable è disponibile
      if (typeof window.initTable !== 'function') {
        console.error("La funzione initTable non è disponibile");
        alert("Errore: Non è possibile inizializzare la tabella. La funzione initTable non è disponibile.");
        setLoading(false);
        return;
      }
      
      // Verifica che ci siano dipendenti validi
      if (!dipendenti || dipendenti.length === 0) {
        console.error("Nessun dipendente disponibile per creare la tabella");
        alert("Errore: Nessun dipendente disponibile per creare la tabella");
        setLoading(false);
        return;
      }
      
      // Assicurati che la tabella sia visibile
      const hotContainer = document.getElementById("hot");
      if (hotContainer) {
        hotContainer.style.display = "block";
      }
      
      // Preparazione dei nomi dei dipendenti in modo sicuro
      const pairToEmployee = dipendenti.map(dipendente => {
        if (dipendente.nomeTurno) return dipendente.nomeTurno;
        if (dipendente.nome && dipendente.cognome) {
          return `${dipendente.nome} ${dipendente.cognome.charAt(0)}.`;
        }
        return `Dipendente ${Math.random().toString(36).substring(2, 7)}`;
      });
      
      // Configura le variabili globali necessarie per il codice esistente in modo sicuro
      window.pairToEmployee = pairToEmployee;
      window.giorniLavorativiSettimanali = negozio?.giorniLavorativi || 6;
      window.employeeVariations = {};
      window.employees = {};
      window.mese = mese || 0;
      window.anno = anno || new Date().getFullYear();
      window.sums = Array(dipendenti.length).fill(0);
      window.ferieTotals = Array(dipendenti.length).fill(0);
      window.exFestivitaTotals = Array(dipendenti.length).fill(0);
      window.rolTotals = Array(dipendenti.length).fill(0);
      
      // Debug
      console.log("Variabili impostate:", {
        pairToEmployee: window.pairToEmployee,
        giorniLavorativiSettimanali: window.giorniLavorativiSettimanali,
        mese: window.mese,
        anno: window.anno,
        handsontableExists: typeof window.Handsontable !== 'undefined',
        initTableExists: typeof window.initTable === 'function'
      });
      
      // Inizializza le variazioni e le ore settimanali per ogni dipendente
      dipendenti.forEach((dipendente, index) => {
        const nomeTurno = pairToEmployee[index];
        window.employeeVariations[nomeTurno] = [];
        window.employees[nomeTurno] = dipendente.oreSettimanali || 40;
      });
      
      // Nascondi il popup iniziale
      const initialPopup = document.getElementById("initialPopup");
      if (initialPopup) {
        initialPopup.style.display = "none";
      }
      
      // Rimuovi qualsiasi tabella esistente se già inizializzata
      if (isTableInitialized) {
        if (hotContainer) {
          hotContainer.innerHTML = "";
        }
        
        // Se la tabella è già stata creata, ricreala
        if (typeof window.hot !== 'undefined' && window.hot) {
          try {
            window.hot.destroy();
          } catch (e) {
            console.error("Errore durante la distruzione della tabella:", e);
          }
          window.hot = null;
        }
      }
      
      // Inizializza la tabella con try/catch
      try {
        console.log("Inizializzazione tabella...");
        window.initTable();
        setIsTableInitialized(true);
      } catch (error) {
        console.error("Errore durante l'inizializzazione della tabella:", error);
        alert(`Errore durante l'inizializzazione della tabella: ${error.message}. Controlla la console per i dettagli.`);
      }
      
    } catch (error) {
      console.error("Errore nell'inizializzazione della tabella:", error);
      alert("Errore nell'inizializzazione della tabella: " + error.message);
    } finally {
      setLoading(false);
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
  
  if (loading && !isTableInitialized) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento dati turni...</span>
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
              value={mese} 
              onChange={handleMonthChange}
            >
              {mesi.map((nomeMese, index) => (
                <option key={index} value={index}>{nomeMese}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="anno">Anno:</label>
            <select 
              id="anno" 
              value={anno} 
              onChange={handleYearChange}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <button 
            className="btn-primary create-table-btn"
            onClick={handleCreateTable}
            disabled={loading || dipendenti.length === 0 || !scriptsLoaded || !librariesLoaded}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Caricamento...
              </>
            ) : !librariesLoaded ? (
              <>
                <i className="fas fa-exclamation-triangle"></i> Caricamento librerie...
              </>
            ) : !scriptsLoaded ? (
              <>
                <i className="fas fa-exclamation-triangle"></i> Caricamento script...
              </>
            ) : isTableInitialized ? (
              <>
                <i className="fas fa-sync"></i> Aggiorna Tabella
              </>
            ) : (
              <>
                <i className="fas fa-calendar-alt"></i> Crea Tabella
              </>
            )}
          </button>
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
        ) : !librariesLoaded ? (
          <div className="warning-message">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento delle librerie necessarie...</span>
          </div>
        ) : !scriptsLoaded ? (
          <div className="warning-message">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento degli script necessari...</span>
          </div>
        ) : null}
      </div>
      
      {/* Questo div verrà popolato dal codice esistente della tabella */}
      <div className="tabella-wrapper">
        <div id="hot"></div>
        
        {/* Tutti i popup e overlay della tabella esistente */}
        <div id="initialPopup" style={{ display: 'none' }}></div>
        <div id="cellOverlay" className="cellOverlay"></div>
        <div id="headerOverlay" className="headerOverlay"></div>
        <div id="manualTimeOverlay" className="cellOverlay"></div>
        <div id="fatturatoOverlay" className="cellOverlay"></div>
        <div id="particolaritaOverlay" className="cellOverlay"></div>
        <div id="differenzaPrecedenteOverlay" className="cellOverlay"></div>
        <div id="dragPreview" className="drag-preview" style={{ display: 'none' }}></div>
        <div id="dropIndicator" className="drop-indicator"></div>
      </div>
      
      {/* Legenda sempre visibile, indipendentemente dallo stato della tabella */}
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
          <div className="legend-item">
            <i className="fas fa-exchange-alt"></i>
            <span>Puoi trascinare le colonne per riorganizzare la tabella</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TabellaTurni;