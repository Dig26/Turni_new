// 1. Virtualizzazione dei dati
// Questa funzione configura Handsontable per caricare solo le righe visibili
function configureTableForPerformance() {
    if (!window.hot) return;
    
    // Imposta il rendering virtuale per migliorare le prestazioni con tabelle grandi
    window.hot.updateSettings({
      viewportColumnRenderingOffset: 10, // Renderizza 10 colonne in più oltre il viewport
      viewportRowRenderingOffset: 30,    // Renderizza 30 righe in più oltre il viewport
      renderAllRows: false,              // Non renderizzare tutte le righe contemporaneamente
      renderAllColumns: false,           // Non renderizzare tutte le colonne contemporaneamente
      fragmentSelection: true            // Consente una selezione più efficiente 
    });
  }
  
  // 2. Memorizzazione nella cache per le operazioni comuni
  const memoizeCache = new Map();
  
  function memoize(fn, keyFn) {
    return function(...args) {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      if (memoizeCache.has(key)) {
        return memoizeCache.get(key);
      }
      const result = fn.apply(this, args);
      memoizeCache.set(key, result);
      return result;
    };
  }
  
  // 3. Debouncer per le operazioni costose come l'aggiornamento dei totali
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 4. Batch updates per aggiornamenti multipli insieme
  function batchUpdates(updates) {
    if (!window.hot || !updates || updates.length === 0) return;
    
    // Utilizziamo batchRender per migliorare le prestazioni
    window.hot.batchRender(() => {
      for (let i = 0; i < updates.length; i++) {
        const [row, col, value] = updates[i];
        window.hot.setDataAtCell(row, col, value);
      }
    });
  }
  
  // 5. Ottimizzazione del calcolo dei totali
  // Questo sostituirà la funzione updateTotaleOre con una versione ottimizzata
  const originalUpdateTotaleOre = window.updateTotaleOre;
  window.updateTotaleOre = debounce(function() {
    if (typeof originalUpdateTotaleOre === 'function') {
      originalUpdateTotaleOre.call(this);
    }
  }, 300); // Esegui dopo 300ms di inattività
  
  // 6. Ottimizzazione degli event handler
  function optimizeEventHandlers() {
    // Rimuovi i listener duplicati se presenti
    const elements = ['cellPopupResetBtn', 'headerAddVariationBtn', 'headerAnnullaBtn', 'headerConfermaBtn'];
    for (const id of elements) {
      const el = document.getElementById(id);
      if (el) {
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
      }
    }
    
    // Re-aggiungi i listener necessari
    const resetBtn = document.getElementById('cellPopupResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        const popupInput1 = document.getElementById('popupInput1');
        const popupInput2 = document.getElementById('popupInput2');
        if (popupInput1) popupInput1.value = '';
        if (popupInput2) popupInput2.value = '';
      });
    }
  }
  
  // 7. Risolutore del problema di salvataggio
  // Questa funzione garantisce che i dati vengano salvati correttamente
  function enhanceSaveTableData() {
    // Sovrascrive la funzione saveTableData esistente
    if (typeof window.saveTableData !== 'function') return;
    
    const originalSaveTableData = window.saveTableData;
    window.saveTableData = function() {
      try {
        if (!window.hot) {
          console.error('Tabella non disponibile');
          if (typeof sendMessageToParent === 'function') {
            sendMessageToParent({
              type: 'SAVE_ERROR',
              message: 'Tabella non disponibile'
            });
          }
          return false;
        }
        
        // Assicurati che i dati siano consolidati prima del salvataggio
        window.hot.getPlugin('persistentState').saveValue();
        
        // Ottieni tutti i dati della tabella
        const allData = window.hot.getData();
        
        // Crea una copia profonda di tutti i dati per evitare problemi di riferimento
        const deepCopyAllData = JSON.parse(JSON.stringify(allData));
        
        // Ottieni informazioni aggiuntive come variazioni dei dipendenti
        const employeeVariations = JSON.parse(JSON.stringify(window.employeeVariations || {}));
        
        // Ottieni particolarità e motivazioni
        let particolaritaList = [];
        let motivazioniList = [];
        try {
          const particolaritaData = localStorage.getItem('particolarita');
          if (particolaritaData) {
            particolaritaList = JSON.parse(particolaritaData);
          }
          
          const motivazioniData = localStorage.getItem('motivazioni');
          if (motivazioniData) {
            motivazioniList = JSON.parse(motivazioniData);
          }
        } catch (e) {
          console.warn('Errore nel caricamento di particolarità o motivazioni:', e);
        }
        
        // Crea l'oggetto dati completo
        const dataToSave = {
          tableData: deepCopyAllData,
          employeeVariations: employeeVariations,
          mese: window.mese,
          anno: window.anno,
          pairToEmployee: window.pairToEmployee,
          employees: window.employees,
          sums: window.sums,
          ferieTotals: window.ferieTotals,
          exFestivitaTotals: window.exFestivitaTotals,
          rolTotals: window.rolTotals,
          particolarita: particolaritaList,
          motivazioni: motivazioniList,
          timestamp: new Date().toISOString()
        };
        
        // Invia i dati alla finestra parent se siamo in un iframe
        if (typeof sendMessageToParent === 'function') {
          sendMessageToParent({
            type: 'SAVE_DATA',
            payload: dataToSave
          });
        }
        
        // Salva anche nel localStorage come backup
        try {
          const negozioId = getNegozioIdFromUrl() || 'default';
          const storageKey = `tabella_turni_${negozioId}_${window.anno}_${window.mese}`;
          localStorage.setItem(storageKey, JSON.stringify({
            data: dataToSave,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          console.warn('Errore nel salvataggio locale:', e);
        }
        
        // Mostra messaggio di successo all'utente
        alert('Tabella salvata con successo!');
        
        // Informa il parent del successo
        if (typeof sendMessageToParent === 'function') {
          sendMessageToParent({
            type: 'SAVE_SUCCESS'
          });
        }
        
        return true;
      } catch (error) {
        console.error('Errore nel salvataggio dei dati:', error);
        alert('Errore nel salvataggio: ' + error.message);
        
        if (typeof sendMessageToParent === 'function') {
          sendMessageToParent({
            type: 'SAVE_ERROR',
            message: error.message
          });
        }
        return false;
      }
    };
  }
  
  // 8. Funzione per applicare i dati salvati
  function enhanceApplySavedData() {
    if (typeof window.applySavedData !== 'function') return;
    
    const originalApplySavedData = window.applySavedData;
    window.applySavedData = function() {
      try {
        if (!window.savedData) {
          console.log('Nessun dato da caricare');
          return false;
        }
        
        if (!window.hot) {
          console.error('Tabella non disponibile');
          return false;
        }
        
        console.log('Applicazione dei dati salvati alla tabella');
        
        // Disabilita temporaneamente tutti gli hook per evitare rendering multipli
        window.hot.suspendRender();
        
        // Ripristina variabili globali dai dati salvati
        if (window.savedData.mese !== undefined) window.mese = window.savedData.mese;
        if (window.savedData.anno !== undefined) window.anno = window.savedData.anno;
        if (window.savedData.pairToEmployee) window.pairToEmployee = window.savedData.pairToEmployee;
        if (window.savedData.employees) window.employees = window.savedData.employees;
        if (window.savedData.employeeVariations) window.employeeVariations = window.savedData.employeeVariations;
        if (window.savedData.sums) window.sums = window.savedData.sums;
        if (window.savedData.ferieTotals) window.ferieTotals = window.savedData.ferieTotals;
        if (window.savedData.exFestivitaTotals) window.exFestivitaTotals = window.savedData.exFestivitaTotals;
        if (window.savedData.rolTotals) window.rolTotals = window.savedData.rolTotals;
        
        // Ripristina le particolarità e le motivazioni se presenti
        if (window.savedData.particolarita) {
          localStorage.setItem('particolarita', JSON.stringify(window.savedData.particolarita));
        }
        
        if (window.savedData.motivazioni) {
          localStorage.setItem('motivazioni', JSON.stringify(window.savedData.motivazioni));
        }
        
        // Carica i dati nella tabella
        if (window.savedData.tableData && Array.isArray(window.savedData.tableData)) {
          // Usa loadData che è più efficiente per caricare un dataset completo
          window.hot.loadData(window.savedData.tableData);
          
          // Aggiorna le impostazioni della tabella per supportare le nuove funzionalità
          configureTableForWeekends();
          
          // Riattiva il rendering
          window.hot.resumeRender();
          
          // Aggiorna i totali in modo asincrono per non bloccare l'UI
          setTimeout(function() {
            if (typeof window.updateTotaleOre === 'function') window.updateTotaleOre();
            if (typeof window.updateOrePagate === 'function') window.updateOrePagate();
            if (typeof window.updateDifferenzeCorrente === 'function') window.updateDifferenzeCorrente();
            if (typeof window.updateFatturatoTotale === 'function') window.updateFatturatoTotale();
          }, 100);
          
          console.log('Dati caricati con successo nella tabella');
          return true;
        }
        
        window.hot.resumeRender();
        return false;
      } catch (error) {
        console.error('Errore nell\'applicazione dei dati salvati:', error);
        if (window.hot) {
          window.hot.resumeRender();
        }
        return false;
      }
    };
  }
  
  // 9. Distinzione visiva per il weekend
  function configureTableForWeekends() {
    // Applica stili speciali per il weekend
    if (!window.hot) return;
    
    // Aggiungi un nuovo renderer per le celle del giorno
    const originalDataFactory = window.hot.getCellMeta(0, 0).renderer;
    
    // Definisci un nuovo renderer che aggiunge classi speciali per sabato e domenica
    function weekendRenderer(instance, td, row, col, prop, value, cellProperties) {
      // Usa il renderer originale prima
      if (typeof originalDataFactory === 'function') {
        originalDataFactory(instance, td, row, col, prop, value, cellProperties);
      } else {
        Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
      }
      
      // Se siamo nella colonna del giorno della settimana (col === 0) e nelle righe dei dati (non header)
      if (col === 0 && row > 0 && value) {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'sabato') {
          td.classList.add('weekend-saturday');
        } else if (lowerValue === 'domenica') {
          td.classList.add('weekend-sunday');
        }
      }
      
      // Se siamo nella colonna giorno del mese (col === 1) e nelle righe dei dati
      if (col === 1 && row > 0) {
        // Ottieni il giorno della settimana dalla cella precedente
        const weekday = instance.getDataAtCell(row, 0);
        if (weekday) {
          const lowerWeekday = weekday.toLowerCase();
          if (lowerWeekday === 'sabato') {
            td.classList.add('weekend-saturday');
          } else if (lowerWeekday === 'domenica') {
            td.classList.add('weekend-sunday');
          }
        }
      }
      
      // Per tutte le altre celle nella stessa riga
      if (row > 0 && col > 1) {
        const weekday = instance.getDataAtCell(row, 0);
        if (weekday) {
          const lowerWeekday = weekday.toLowerCase();
          if (lowerWeekday === 'sabato') {
            td.classList.add('weekend-saturday-cell');
          } else if (lowerWeekday === 'domenica') {
            td.classList.add('weekend-sunday-cell');
          }
        }
      }
    }
    
    // Aggiorna le impostazioni per usare il nuovo renderer
    window.hot.updateSettings({
      cells: function(row, col) {
        const cellProperties = {};
        
        if (row >= 0 && col >= 0) {
          cellProperties.renderer = weekendRenderer;
        }
        
        return cellProperties;
      }
    });
    
    // Aggiungi stili CSS per sabato e domenica
    const weekendStyles = document.createElement('style');
    weekendStyles.textContent = `
      .weekend-saturday {
        background-color: #f2f6fc !important;
        font-weight: bold;
        color: #3498db;
      }
      
      .weekend-sunday {
        background-color: #fef4f3 !important;
        font-weight: bold;
        color: #e74c3c;
      }
      
      .weekend-saturday-cell {
        background-color: rgba(52, 152, 219, 0.05) !important;
      }
      
      .weekend-sunday-cell {
        background-color: rgba(231, 76, 60, 0.05) !important;
      }
    `;
    document.head.appendChild(weekendStyles);
  }
  
  // 10. Helper utility per ottenere il negozioId dall'URL
  function getNegozioIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('negozioId');
  }
  
  // 11. Legenda delle particolarità
  function addParticolaritaLegend() {
    // Crea il container per la legenda
    const legendContainer = document.createElement('div');
    legendContainer.id = 'particolaritaLegend';
    legendContainer.className = 'particolarita-legend';
    
    // Stili per la legenda
    legendContainer.style.marginTop = '20px';
    legendContainer.style.padding = '10px 15px';
    legendContainer.style.backgroundColor = 'white';
    legendContainer.style.borderRadius = '8px';
    legendContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    
    // Aggiungi il titolo
    const title = document.createElement('h3');
    title.textContent = 'Legenda Particolarità';
    title.style.marginBottom = '10px';
    title.style.paddingBottom = '5px';
    title.style.borderBottom = '1px solid #eee';
    legendContainer.appendChild(title);
    
    // Contenitore per gli elementi della legenda
    const legendItems = document.createElement('div');
    legendItems.className = 'particolarita-legend-items';
    legendItems.style.display = 'flex';
    legendItems.style.flexWrap = 'wrap';
    legendItems.style.gap = '10px';
    legendContainer.appendChild(legendItems);
    
    // Aggiungi la legenda dopo la tabella
    const hotContainer = document.getElementById('hot');
    if (hotContainer) {
      hotContainer.parentNode.insertBefore(legendContainer, hotContainer.nextSibling);
    } else {
      document.body.appendChild(legendContainer);
    }
    
    // Aggiorna la legenda con le particolarità dal localStorage
    updateParticolaritaLegend();
  }
  
  // Aggiorna la legenda con le particolarità dal localStorage
  function updateParticolaritaLegend() {
    const legendItems = document.querySelector('.particolarita-legend-items');
    if (!legendItems) return;
    
    // Svuota la legenda
    legendItems.innerHTML = '';
    
    // Ottieni le particolarità dal localStorage
    let particolaritaList = [];
    try {
      const particolaritaData = localStorage.getItem('particolarita');
      if (particolaritaData) {
        particolaritaList = JSON.parse(particolaritaData);
      }
    } catch (e) {
      console.warn('Errore nel caricamento delle particolarità:', e);
    }
    
    // Se non ci sono particolarità, mostra un messaggio
    if (particolaritaList.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Nessuna particolarità definita. Puoi aggiungerle dalla gestione particolarità.';
      emptyMessage.style.color = '#7f8c8d';
      legendItems.appendChild(emptyMessage);
      return;
    }
    
    // Aggiungi ogni particolarità alla legenda
    particolaritaList.forEach(particolarita => {
      const item = document.createElement('div');
      item.className = 'particolarita-legend-item';
      item.style.padding = '5px 10px';
      item.style.backgroundColor = '#f8f9fa';
      item.style.borderRadius = '4px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '8px';
      
      const sigla = document.createElement('span');
      sigla.className = 'particolarita-sigla';
      sigla.textContent = particolarita.sigla;
      sigla.style.fontWeight = 'bold';
      sigla.style.color = '#3498db';
      sigla.style.backgroundColor = '#eef7fb';
      sigla.style.padding = '2px 6px';
      sigla.style.borderRadius = '3px';
      
      const nome = document.createElement('span');
      nome.className = 'particolarita-nome';
      nome.textContent = particolarita.nome;
      
      item.appendChild(sigla);
      item.appendChild(nome);
      legendItems.appendChild(item);
    });
  }
  
  // 12. Modifica allo script popups.js per gestire le motivazioni personalizzate
  function enhanceACasaMotivazioniPopup() {
    // Sovrascrive l'apertura del popup per caricare le motivazioni dinamicamente
    const originalOpenCellPopup = window.openCellPopup;
    if (typeof originalOpenCellPopup !== 'function') return;
    
    window.openCellPopup = function() {
      // Chiama la funzione originale per configurare il popup
      originalOpenCellPopup();
      
      // Trova il selettore delle motivazioni
      const aCasaMotivazioni = document.getElementById('aCasaMotivazioni');
      if (!aCasaMotivazioni) return;
      
      // Svuota le opzioni attuali
      aCasaMotivazioni.innerHTML = '';
      
      // Aggiungi l'opzione di default "Nessuna"
      const defaultOption = document.createElement('option');
      defaultOption.value = 'nessuna';
      defaultOption.textContent = 'Nessuna';
      defaultOption.selected = true;
      aCasaMotivazioni.appendChild(defaultOption);
      
      // Carica le motivazioni dal localStorage
      let motivazioni = [];
      try {
        const motivazioniData = localStorage.getItem('motivazioni');
        if (motivazioniData) {
          motivazioni = JSON.parse(motivazioniData);
        }
      } catch (e) {
        console.warn('Errore nel caricamento delle motivazioni:', e);
      }
      
      // Se non ci sono motivazioni, usa quelle di default
      if (motivazioni.length === 0) {
        motivazioni = [
          { id: '1', nome: "Ferie", sigla: "FE" },
          { id: '2', nome: "EX Festività", sigla: "EX" },
          { id: '3', nome: "ROL", sigla: "RL" }
        ];
      }
      
      // Aggiungi le motivazioni al selettore
      motivazioni.forEach(motivazione => {
        const option = document.createElement('option');
        option.value = motivazione.nome.toLowerCase().replace(/\s+/g, '');
        option.textContent = motivazione.nome;
        option.dataset.sigla = motivazione.sigla;
        aCasaMotivazioni.appendChild(option);
      });
      
      // Aggiorna il listener di change
      aCasaMotivazioni.addEventListener('change', function() {
        const abbr = document.getElementById('aCasaAbbr');
        if (!abbr) return;
        
        if (this.value !== "nessuna") {
          abbr.disabled = false;
          abbr.style.opacity = "1";
          
          // Preleva la sigla associata e la imposta come valore dell'abbreviazione
          const selectedOption = this.options[this.selectedIndex];
          if (selectedOption && selectedOption.dataset.sigla) {
            abbr.value = selectedOption.dataset.sigla;
          }
        } else {
          abbr.disabled = true;
          abbr.style.opacity = "0.5";
          abbr.value = "";
        }
      });
    };
  }
  
  // 13. Integrazione di tutti i miglioramenti
  function integrateAllImprovements() {
    // Aggiungi event listener per quando la tabella è pronta
    document.addEventListener('DOMContentLoaded', function() {
      // Se la tabella è già disponibile, applica i miglioramenti
      if (typeof window.hot !== 'undefined') {
        applyImprovements();
      } else {
        // Altrimenti aspetta che la tabella sia disponibile
        const checkInterval = setInterval(() => {
          if (typeof window.hot !== 'undefined') {
            applyImprovements();
            clearInterval(checkInterval);
          }
        }, 500);
        
        // Ferma il controllo dopo 10 secondi per evitare loop infiniti
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    });
    
    // Funzione che applica tutti i miglioramenti
    function applyImprovements() {
      // 1. Ottimizzazione delle prestazioni
      configureTableForPerformance();
      
      // 2. Miglioramento del salvataggio
      enhanceSaveTableData();
      enhanceApplySavedData();
      
      // 3. Distinzione visiva per il weekend
      configureTableForWeekends();
      
      // 4. Legenda particolarità
      addParticolaritaLegend();
      
      // 5. Miglioramento della gestione motivazioni
      enhanceACasaMotivazioniPopup();
      
      // 6. Ottimizzazione event handler
      optimizeEventHandlers();
      
      console.log('Miglioramenti applicati con successo!');
    }
  }
  
  // Chiamare la funzione di integrazione
  integrateAllImprovements();