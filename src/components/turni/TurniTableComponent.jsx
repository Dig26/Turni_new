// src/components/turni/TurniTableComponent.jsx (aggiornato)
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import CellPopup from './popups/CellPopup';
import TimePopup from './popups/TimePopup';
import VariationPopup from './popups/VariationPopup';
import ParticolaritaPopup from './popups/ParticolaritaPopup';
import FatturatoPopup from './popups/FatturatoPopup';
import DifferenzaPrecedentePopup from './popups/DifferenzaPrecedentePopup';
import '../../styles/TurniTable.css';

// Importa Handsontable e i suoi stili
import 'handsontable/dist/handsontable.full.min.css';
import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';

const TurniTableComponent = ({ 
  negozioId, 
  anno, 
  mese, 
  dipendenti, 
  isNewTable = true, 
  initialData = null,
  onSave,
  onReturn
}) => {
  const dispatch = useDispatch();
  const hotRef = useRef(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columnUnits, setColumnUnits] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [showCellPopup, setShowCellPopup] = useState(false);
  const [showTimePopup, setShowTimePopup] = useState(false);
  const [showVariationPopup, setShowVariationPopup] = useState(false);
  const [showParticolaritaPopup, setShowParticolaritaPopup] = useState(false);
  const [showFatturatoPopup, setShowFatturatoPopup] = useState(false);
  const [showDiffPrecedentePopup, setShowDiffPrecedentePopup] = useState(false);
  const [employeeVariations, setEmployeeVariations] = useState({});
  const [allTimes, setAllTimes] = useState([]);
  const [pairToEmployee, setPairToEmployee] = useState([]);
  const [employees, setEmployees] = useState({});
  const [summaryRows, setSummaryRows] = useState({
    oreLavorateRowIndex: 0,
    ferieRowIndex: 0,
    exFestivitaRowIndex: 0,
    rolRowIndex: 0,
    diffPrecedenteRowIndex: 0,
    totaleOreRowIndex: 0,
    orePagateRowIndex: 0,
    diffCorrenteRowIndex: 0
  });
  
  // Costante per i giorni lavorativi settimanali (potrebbe essere recuperata dalle impostazioni del negozio)
  const giorniLavorativiSettimanali = 6;
  
  useEffect(() => {
    if (initialData && !isNewTable) {
      loadSavedTable();
    } else {
      initNewTable();
    }
  }, [negozioId, anno, mese, dipendenti, isNewTable, initialData]);
  
  const generateAllTimesTable = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      const hour = h < 10 ? `0${h}` : `${h}`;
      for (let m = 0; m < 60; m += 15) {
        const minute = m < 10 ? `0${m}` : `${m}`;
        times.push(`${hour}:${minute}`);
      }
    }
    return times;
  };
  
  const initNewTable = () => {
    try {
      setLoading(true);
      
      // Genera gli orari disponibili
      const timesArray = generateAllTimesTable();
      setAllTimes(timesArray);
      
      // Crea la mappatura dei dipendenti
      const pairToEmpArray = dipendenti.map(d => d.nomeTurno || `${d.nome} ${d.cognome.charAt(0)}.`);
      setPairToEmployee(pairToEmpArray);
      
      // Crea le ore settimanali per ogni dipendente
      const employeesObj = {};
      dipendenti.forEach(d => {
        employeesObj[d.nomeTurno || `${d.nome} ${d.cognome.charAt(0)}.`] = d.oreSettimanali || 40;
      });
      setEmployees(employeesObj);
      
      // Inizializza le variazioni orarie vuote
      const employeeVars = {};
      pairToEmpArray.forEach(emp => {
        employeeVars[emp] = [];
      });
      setEmployeeVariations(employeeVars);
      
      // Crea i dati della tabella
      createTableData(pairToEmpArray, employeesObj);
      
    } catch (error) {
      console.error('Errore nell\'inizializzazione della tabella', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nell\'inizializzazione della tabella turni',
        duration: 5000
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const loadSavedTable = () => {
    try {
      setLoading(true);
      
      if (initialData) {
        // Imposta i valori dalle variabili salvate
        setAllTimes(generateAllTimesTable());
        setPairToEmployee(initialData.pairToEmployee || []);
        setEmployees(initialData.employees || {});
        setEmployeeVariations(initialData.employeeVariations || {});
        setColumnUnits(initialData.columnUnits || []);
        
        if (initialData.tableData) {
          setData(initialData.tableData);
        } else {
          // Se non ci sono dati, crea la tabella
          createTableData(initialData.pairToEmployee, initialData.employees);
        }
        
        // Imposta gli indici delle righe di riepilogo
        if (initialData.summaryRows) {
          setSummaryRows(initialData.summaryRows);
        }
      } else {
        // Se non ci sono dati salvati, inizializza una nuova tabella
        initNewTable();
      }
    } catch (error) {
      console.error('Errore nel caricamento della tabella salvata', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nel caricamento della tabella turni salvata',
        duration: 5000
      }));
      
      // Fallback: inizializza una nuova tabella
      initNewTable();
    } finally {
      setLoading(false);
    }
  };
  
  const createTableData = (pairToEmpArray, employeesObj) => {
    const dipendentiCount = pairToEmpArray.length;
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    
    // Crea l'array delle unità per le colonne
    const colUnits = [];
    
    // Aggiungi le unità per i dipendenti
    pairToEmpArray.forEach((emp, i) => {
      colUnits.push({
        type: "employee",
        inizio: `inizio_${i}`,
        fine: `fine_${i}`,
        header: `☰ ${emp}`
      });
    });
    
    // Aggiungi l'unità per il fatturato
    colUnits.push({
      type: "fatturato",
      key: "fatturato",
      header: "☰ Fatturato"
    });
    
    // Aggiungi l'unità per le particolarità
    colUnits.push({
      type: "particolarita",
      key: "particolarita",
      header: "☰ Particolarità"
    });
    
    setColumnUnits(colUnits);
    
    // Crea i dati della tabella
    const tableData = [];
    
    // Header
    const headerRow = {
      giorno: "Giorno Settimana",
      giornoMese: "Giorno"
    };
    
    // Imposta i dati dell'header per ciascuna unità
    colUnits.forEach(unit => {
      if (unit.type === "employee") {
        headerRow[unit.inizio] = unit.header;
        // In "fine" mettiamo il valore di default (le ore di default per il dipendente)
        headerRow[unit.fine] = employeesObj[pairToEmpArray[colUnits.indexOf(unit)]].toString();
      } else if (unit.type === "fatturato" || unit.type === "particolarita") {
        headerRow[unit.key] = unit.header;
      }
    });
    
    tableData.push(headerRow);
    
    // Giorni del mese
    for (let i = 1; i <= giorniNelMese; i++) {
      const row = {};
      const currentDate = new Date(anno, mese, i);
      row["giorno"] = currentDate.toLocaleDateString("it-IT", { weekday: "long" });
      row["giornoMese"] = currentDate.getDate();
      
      colUnits.forEach(unit => {
        if (unit.type === "employee") {
          row[unit.inizio] = "";
          row[unit.fine] = "";
        } else if (unit.type === "fatturato" || unit.type === "particolarita") {
          row[unit.key] = "";
        }
      });
      
      tableData.push(row);
    }
    
    // Righe riepilogative
    const summaryLabels = [
      "ORE LAVORATE",
      "FERIE",
      "EX FESTIVITA",
      "ROL",
      "Differenza +/- mese precedente",
      "TOTALE ORE",
      "ORE PAGATE",
      "Differenza +/- mese corrente"
    ];
    
    // Aggiungi le righe di riepilogo
    summaryLabels.forEach(label => {
      const row = {};
      row["giorno"] = label;
      row["giornoMese"] = "";
      
      colUnits.forEach(unit => {
        if (unit.type === "employee") {
          row[unit.inizio] = "0,00";
          row[unit.fine] = "0,00";
        } else if (unit.type === "fatturato" || unit.type === "particolarita") {
          row[unit.key] = "";
        }
      });
      
      tableData.push(row);
    });
    
    // Imposta gli indici delle righe riepilogative
    const summaryIndices = {
      oreLavorateRowIndex: tableData.length - 8,
      ferieRowIndex: tableData.length - 7,
      exFestivitaRowIndex: tableData.length - 6,
      rolRowIndex: tableData.length - 5,
      diffPrecedenteRowIndex: tableData.length - 4,
      totaleOreRowIndex: tableData.length - 3,
      orePagateRowIndex: tableData.length - 2,
      diffCorrenteRowIndex: tableData.length - 1
    };
    
    setSummaryRows(summaryIndices);
    setData(tableData);
  };
  
  const saveTable = () => {
    try {
      if (!hotRef.current) {
        throw new Error('Tabella non disponibile');
      }
      
      // Ottieni tutti i dati dalla tabella
      const allData = hotRef.current.hotInstance.getData();
      
      // Prepara i dati da salvare
      const dataToSave = {
        tableData: allData,
        employeeVariations,
        columnUnits,
        mese,
        anno,
        pairToEmployee,
        employees,
        summaryRows
      };
      
      // Salvataggio tramite callback fornita dal parent
      if (typeof onSave === 'function') {
        onSave(dataToSave);
      }
      
      // Mostra notifica di successo
      dispatch(addNotification({
        type: 'success',
        message: 'Tabella turni salvata con successo',
        duration: 3000
      }));
      
      return true;
    } catch (error) {
      console.error('Errore nel salvataggio della tabella', error);
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio della tabella: ${error.message}`,
        duration: 5000
      }));
      return false;
    }
  };
  
  const handleCellClick = (event, coords) => {
    // Gestione click su cella
    const { row, col } = coords;
    
    if (row === 0) {
      // Click su header - Per gestire le variazioni orarie
      const unitInfo = getUnitByCol(col);
      if (unitInfo && unitInfo.unit.type === "employee") {
        setSelectedCell({ row, col });
        setShowVariationPopup(true);
      }
    } else {
      // Verifica se è una riga riepilogativa speciale
      if (row === summaryRows.diffPrecedenteRowIndex) {
        // Gestione click su riga differenza mese precedente
        const unitInfo = getUnitByCol(col);
        if (unitInfo && unitInfo.unit.type === "employee") {
          setSelectedCell({ row, col });
          setShowDiffPrecedentePopup(true);
        }
        return;
      }
      
      // Verifica se è un'altra riga riepilogativa (non cliccabile)
      const isRiepilogativaRow = 
        row === summaryRows.oreLavorateRowIndex ||
        row === summaryRows.ferieRowIndex ||
        row === summaryRows.exFestivitaRowIndex ||
        row === summaryRows.rolRowIndex ||
        row === summaryRows.totaleOreRowIndex ||
        row === summaryRows.orePagateRowIndex ||
        row === summaryRows.diffCorrenteRowIndex;
      
      if (isRiepilogativaRow) {
        return;
      }
      
      // Gestione click su celle normali
      const unitInfo = getUnitByCol(col);
      if (!unitInfo) return;
      
      if (unitInfo.unit.type === "fatturato") {
        // Click su cella fatturato
        setSelectedCell({ row, col });
        setShowFatturatoPopup(true);
      } else if (unitInfo.unit.type === "particolarita") {
        // Click su cella particolarità
        setSelectedCell({ row, col });
        setShowParticolaritaPopup(true);
      } else if (unitInfo.unit.type === "employee") {
        // Determina se è colonna "inizio" o "fine"
        const colOffset = col - getUnitStartIndex(unitInfo.unitIndex);
        
        if (colOffset === 0) {
          // Colonna "inizio"
          setSelectedCell({ row, col });
          setShowCellPopup(true);
        } else {
          // Colonna "fine"
          const inizioVal = hotRef.current.hotInstance.getDataAtCell(row, col - 1);
          const fineVal = hotRef.current.hotInstance.getDataAtCell(row, col);
          
          if ((!inizioVal || inizioVal.trim() === "") && (!fineVal || fineVal.trim() === "")) {
            // Entrambe le celle sono vuote, mostra popup orario manuale
            setSelectedCell({ row, col });
            setShowTimePopup(true);
          } else {
            // Celle non vuote, chiedi conferma prima di aprire popup orario
            if (window.confirm("La cella è già valorizzata. Vuoi cancellare il valore?")) {
              // Pulisci le celle
              hotRef.current.hotInstance.setDataAtCell(row, col - 1, "");
              hotRef.current.hotInstance.setDataAtCell(row, col, "");
              
              // Mostra popup orario manuale
              setSelectedCell({ row, col });
              setShowTimePopup(true);
            }
          }
        }
      }
    }
  };
  
  const getUnitByCol = (col) => {
    let current = 2; // Le prime 2 colonne sono giorno e giornoMese
    
    for (let i = 0; i < columnUnits.length; i++) {
      const unit = columnUnits[i];
      const width = unit.type === "employee" ? 2 : 1;
      
      if (col >= current && col < current + width) {
        return { 
          unit, 
          unitIndex: i, 
          start: current, 
          width 
        };
      }
      
      current += width;
    }
    
    return null;
  };
  
  const getUnitStartIndex = (unitIndex) => {
    let index = 2; // Le prime 2 colonne sono giorno e giornoMese
    
    for (let i = 0; i < unitIndex; i++) {
      const unit = columnUnits[i];
      index += unit.type === "employee" ? 2 : 1;
    }
    
    return index;
  };
  
  const buildColumnsFromUnits = () => {
    const cols = [
      { data: "giorno", readOnly: true },
      { data: "giornoMese", readOnly: true },
    ];
    
    columnUnits.forEach(unit => {
      if (unit.type === "employee") {
        cols.push({ data: unit.inizio, editor: false });
        cols.push({ 
          data: unit.fine, 
          readOnly: true,
          renderer: (instance, td, row, col, prop, value, cellProperties) => {
            if (typeof value === "string" && value.indexOf("|") !== -1) {
              value = value.split("|")[1];
            }
            Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
          }
        });
      } else if (unit.type === "fatturato") {
        cols.push({ data: unit.key, readOnly: true });
      } else if (unit.type === "particolarita") {
        cols.push({
          data: unit.key,
          readOnly: true,
          className: "particolarita-cell"
        });
      }
    });
    
    return cols;
  };
  
  const buildMerges = () => {
    const merges = [];
    
    // Merge delle colonne fisse nelle righe riepilogative
    Object.values(summaryRows).forEach(rowIndex => {
      merges.push({ row: rowIndex, col: 0, rowspan: 1, colspan: 2 });
      
      let start = 2;
      columnUnits.forEach(unit => {
        if (unit.type === "employee") {
          merges.push({ row: rowIndex, col: start, rowspan: 1, colspan: 2 });
          start += 2;
        } else if (unit.type === "fatturato" || unit.type === "particolarita") {
          start += 1;
        }
      });
    });
    
    // Merge verticale delle colonne speciali nelle righe riepilogative
    const summaryRowCount = summaryRows.diffCorrenteRowIndex - summaryRows.oreLavorateRowIndex + 1;
    
    for (let i = 0; i < columnUnits.length; i++) {
      if (columnUnits[i].type === "fatturato" || columnUnits[i].type === "particolarita") {
        merges.push({
          row: summaryRows.oreLavorateRowIndex,
          col: getUnitStartIndex(i),
          rowspan: summaryRowCount,
          colspan: 1
        });
      }
    }
    
    return merges;
  };
  
  const updateTotaleOre = () => {
    if (!hotRef.current) return;
    
    for (let u = 0, unitCol = 2; u < columnUnits.length; u++) {
      const unit = columnUnits[u];
      if (unit.type !== "employee") {
        unitCol += unit.type === "employee" ? 2 : 1;
        continue;
      }
      
      let totale = 0;
      const summaryIndices = [
        summaryRows.oreLavorateRowIndex,
        summaryRows.ferieRowIndex,
        summaryRows.exFestivitaRowIndex,
        summaryRows.rolRowIndex,
        summaryRows.diffPrecedenteRowIndex
      ];
      
      summaryIndices.forEach(rowIndex => {
        const cellVal = hotRef.current.hotInstance.getDataAtCell(rowIndex, unitCol);
        
        if (cellVal === null || cellVal === undefined || cellVal === "") {
          return;
        }
        
        const numStr = cellVal.toString().replace(",", ".");
        const num = parseFloat(numStr);
        
        if (!isNaN(num)) {
          totale += num;
        }
      });
      
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.totaleOreRowIndex,
        unitCol,
        totale.toFixed(2).replace(".", ","),
        "updateTotaleOre"
      );
      
      unitCol += 2;
    }
    
    // Aggiorna le differenze mese corrente
    updateDifferenzeCorrente();
  };
  
  const updateOrePagate = () => {
    if (!hotRef.current) return;
    
    const weekDays = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
    const giorniLavorativi = weekDays.slice(0, giorniLavorativiSettimanali);
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    
    for (let u = 0, unitCol = 2; u < columnUnits.length; u++) {
      const unit = columnUnits[u];
      if (unit.type !== "employee") {
        unitCol += unit.type === "employee" ? 2 : 1;
        continue;
      }
      
      let totale = 0;
      
      for (let i = 1; i <= giorniNelMese; i++) {
        const cellDay = hotRef.current.hotInstance.getDataAtCell(i, 0);
        if (!cellDay) continue;
        
        const dayName = cellDay.toLowerCase();
        
        if (giorniLavorativi.indexOf(dayName) !== -1) {
          const emp = pairToEmployee[u];
          let oreSettimanali = employees[emp];
          
          // Controlla variazioni orarie
          if (employeeVariations[emp]) {
            const currentDate = new Date(anno, mese, i);
            
            for (let k = 0; k < employeeVariations[emp].length; k++) {
              const entry = employeeVariations[emp][k];
              const startDate = new Date(entry.start + "T00:00:00");
              const endDate = new Date(entry.end + "T00:00:00");
              
              if (currentDate >= startDate && currentDate <= endDate) {
                oreSettimanali = entry.hours;
                break;
              }
            }
          }
          
          const oreGiornaliere = oreSettimanali / giorniLavorativiSettimanali;
          totale += oreGiornaliere;
        }
      }
      
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.orePagateRowIndex,
        unitCol,
        totale.toFixed(2).replace(".", ","),
        "updateOrePagate"
      );
      
      unitCol += 2;
    }
    
    // Aggiorna le differenze mese corrente
    updateDifferenzeCorrente();
  };
  
  const updateDifferenzeCorrente = () => {
    if (!hotRef.current) return;
    
    for (let u = 0, unitCol = 2; u < columnUnits.length; u++) {
      const unit = columnUnits[u];
      if (unit.type !== "employee") {
        unitCol += unit.type === "employee" ? 2 : 1;
        continue;
      }
      
      // Ottieni i valori di TOTALE ORE e ORE PAGATE
      const totaleOreVal = hotRef.current.hotInstance.getDataAtCell(summaryRows.totaleOreRowIndex, unitCol);
      const orePagateVal = hotRef.current.hotInstance.getDataAtCell(summaryRows.orePagateRowIndex, unitCol);
      
      // Converti in numeri
      const totaleOre = parseFloat(totaleOreVal.toString().replace(",", ".")) || 0;
      const orePagate = parseFloat(orePagateVal.toString().replace(",", ".")) || 0;
      
      // Calcola la differenza
      const differenza = totaleOre - orePagate;
      
      // Aggiorna la cella
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.diffCorrenteRowIndex,
        unitCol,
        differenza.toFixed(2).replace(".", ","),
        "updateDifferenzeCorrente"
      );
      
      // Applica la classe CSS in base al valore
      const cssClass = differenza >= 0 ? "differenza-positiva" : "differenza-negativa";
      hotRef.current.hotInstance.setCellMeta(summaryRows.diffCorrenteRowIndex, unitCol, "className", cssClass);
      
      unitCol += 2;
    }
    
    // Forza il rendering
    hotRef.current.hotInstance.render();
  };
  
  const updateFatturatoTotale = () => {
    if (!hotRef.current) return;
    
    // Cerca l'indice della colonna "Fatturato"
    let fatturatoColIndex = null;
    
    for (let i = 0; i < columnUnits.length; i++) {
      if (columnUnits[i].type === "fatturato") {
        fatturatoColIndex = getUnitStartIndex(i);
        break;
      }
    }
    
    if (fatturatoColIndex === null) return;
    
    let totale = 0;
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    
    // Somma tutti i valori nella colonna fatturato
    for (let i = 1; i <= giorniNelMese; i++) {
      const cellVal = hotRef.current.hotInstance.getDataAtCell(i, fatturatoColIndex);
      
      if (cellVal && cellVal.trim() !== "") {
        // Estrai il valore numerico
        const numValue = parseFloat(cellVal.replace(/[^\d,]/g, "").replace(",", "."));
        
        if (!isNaN(numValue)) {
          totale += numValue;
        }
      }
    }
    
    // Formatta e inserisci il totale
    const formattedTotal = totale.toFixed(2).replace(".", ",") + " €";
    
    hotRef.current.hotInstance.setDataAtCell(
      summaryRows.oreLavorateRowIndex,
      fatturatoColIndex,
      formattedTotal,
      "updateFatturatoTotale"
    );
    
    // Applica lo stile
    for (let i = summaryRows.oreLavorateRowIndex; i <= summaryRows.orePagateRowIndex; i++) {
      hotRef.current.hotInstance.setCellMeta(i, fatturatoColIndex, "className", "fatturato-totale");
    }
    
    // Forza il rendering
    hotRef.current.hotInstance.render();
  };
  
  // Handler per gli aggiornamenti dalla tabella
  const handleAfterChange = (changes, source) => {
    if (!changes || source === "loadData") return;
    
    // Ignora i cambiamenti generati da funzioni di aggiornamento
    if (
      source === "updateTotaleOre" ||
      source === "updateOrePagate" ||
      source === "updateFatturatoTotale" ||
      source === "updateDifferenzeCorrente"
    ) {
      return;
    }
    
    // Controlla se ci sono cambiamenti nelle righe di riepilogo
    const summaryIndices = [
      summaryRows.oreLavorateRowIndex,
      summaryRows.ferieRowIndex,
      summaryRows.exFestivitaRowIndex,
      summaryRows.rolRowIndex,
      summaryRows.diffPrecedenteRowIndex
    ];
    
    let updateNeeded = false;
    
    for (let i = 0; i < changes.length; i++) {
      if (summaryIndices.includes(changes[i][0])) {
        updateNeeded = true;
        break;
      }
    }
    
    if (updateNeeded) {
      updateTotaleOre();
    }
    
    // Aggiorna la differenza mese corrente se totale ore o ore pagate cambiano
    if (
      source === "updateTotaleOre" ||
      source === "updateOrePagate" ||
      changes.some(change => 
        change[0] === summaryRows.totaleOreRowIndex ||
        change[0] === summaryRows.orePagateRowIndex
      )
    ) {
      updateDifferenzeCorrente();
    }
    
    // Controlla se ci sono cambiamenti nella colonna "Fatturato"
    let fatturatoColIndex = null;
    for (let i = 0; i < columnUnits.length; i++) {
      if (columnUnits[i].type === "fatturato") {
        fatturatoColIndex = getUnitStartIndex(i);
        break;
      }
    }
    
    if (fatturatoColIndex !== null) {
      for (let i = 0; i < changes.length; i++) {
        if (changes[i][1] === fatturatoColIndex) {
          updateFatturatoTotale();
          break;
        }
      }
    }
  };
  
  // Aggiorna le ore lavorate
  const recalculateWorkHours = () => {
    if (!hotRef.current) return;
    
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    
    // Per ogni dipendente
    for (let pairIndex = 0; pairIndex < pairToEmployee.length; pairIndex++) {
      let sumHours = 0;
      
      // Per ogni giorno del mese
      for (let day = 1; day <= giorniNelMese; day++) {
        const inizio = hotRef.current.hotInstance.getDataAtCell(day, 2 + 2 * pairIndex);
        const fine = hotRef.current.hotInstance.getDataAtCell(day, 3 + 2 * pairIndex);
        
        // Se c'è un valore nella cella "fine" e non è "X" e non contiene "|"
        if (fine && fine !== "X" && fine.indexOf("|") === -1) {
          // Converti il valore in numero
          const hours = parseFloat(fine.replace(",", "."));
          if (!isNaN(hours)) {
            sumHours += hours;
          }
        }
      }
      
      // Imposta il valore nella tabella
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.oreLavorateRowIndex,
        2 + 2 * pairIndex,
        sumHours.toFixed(2).replace(".", ","),
        "recalculate"
      );
    }
  };
  
  // Gestisce il salvataggio dei dati dal popup cella
  const handleCellPopupSave = (cellData) => {
    if (!selectedCell || !hotRef.current) return;
    
    const { row, col } = selectedCell;
    const unitInfo = getUnitByCol(col);
    
    if (!unitInfo) return;
    
    // Prima puliamo le celle esistenti
    if (col % 2 === 0) {
      // Colonna "inizio"
      hotRef.current.hotInstance.setDataAtCell(row, col, "");
      hotRef.current.hotInstance.setDataAtCell(row, col + 1, "");
    } else {
      // Colonna "fine"
      hotRef.current.hotInstance.setDataAtCell(row, col, "");
      hotRef.current.hotInstance.setDataAtCell(row, col - 1, "");
    }
    
    // Poi inseriamo i nuovi dati
    if (cellData.mode === "lavora") {
      if (cellData.orarioInizio && cellData.orarioFine) {
        // Calcola la differenza di tempo
        const partsA = cellData.orarioInizio.split(":").map(Number);
        const partsB = cellData.orarioFine.split(":").map(Number);
        const h1 = partsA[0], m1 = partsA[1];
        const h2 = partsB[0], m2 = partsB[1];
        const diff = h2 * 60 + m2 - (h1 * 60 + m1);
        const decimalHours = parseFloat((diff / 60).toFixed(2));
        
        // Determina la colonna inizio
        const inizioCol = col % 2 === 0 ? col : col - 1;
        
        hotRef.current.hotInstance.setDataAtCell(
          row,
          inizioCol,
          `${cellData.orarioInizio} - ${cellData.orarioFine}`
        );
        
        hotRef.current.hotInstance.setDataAtCell(
          row,
          inizioCol + 1,
          decimalHours.toFixed(2).replace(".", ",")
        );
      }
    } else {
      // Caso "a casa"
      const inizioCol = col % 2 === 0 ? col : col - 1;
      
      hotRef.current.hotInstance.setDataAtCell(row, inizioCol, "X");
      hotRef.current.hotInstance.setCellMeta(row, inizioCol, "className", "htCenter");
      
      const motivo = cellData.motivo || "nessuna";
      const abbr = cellData.abbr || "";
      
      hotRef.current.hotInstance.setDataAtCell(
        row,
        inizioCol + 1,
        `${motivo}|${abbr}`
      );
    }
    
    // Chiudi il popup
    setShowCellPopup(false);
    
    // Ricalcola tutti i totali
    recalculateWorkHours();
    recalculateMotiveHours();
    updateTotaleOre();
    updateOrePagate();
    updateDifferenzeCorrente();
  };
  
  // Gestisce il salvataggio dei dati dal popup tempo
  const handleTimePopupSave = (timeData) => {
    if (!selectedCell || !hotRef.current) return;
    
    const { row, col } = selectedCell;
    const decimalHours = timeData.hours;
    
    // Identifica la colonna di inizio
    const inizioCol = col % 2 === 0 ? col : col - 1;
    
    // Pulisci i valori esistenti
    hotRef.current.hotInstance.setDataAtCell(row, inizioCol, "");
    hotRef.current.hotInstance.setDataAtCell(row, inizioCol + 1, "");
    
    // Inserisci il nuovo valore solo nella colonna "fine"
    hotRef.current.hotInstance.setDataAtCell(
      row,
      inizioCol + 1,
      decimalHours.toFixed(2).replace(".", ",")
    );
    
    // Chiudi il popup
    setShowTimePopup(false);
    
    // Ricalcola tutti i totali
    recalculateWorkHours();
    updateTotaleOre();
    updateOrePagate();
    updateDifferenzeCorrente();
  };
  
  // Gestisce il salvataggio dei dati dal popup variazione
  const handleVariationPopupSave = (variationData) => {
    if (!selectedCell || !hotRef.current) return;
    
    const { col } = selectedCell;
    const unitInfo = getUnitByCol(col);
    
    if (!unitInfo || unitInfo.unit.type !== "employee") return;
    
    const pairIndex = unitInfo.unitIndex;
    const emp = pairToEmployee[pairIndex];
    
    // Aggiorna le variazioni
    setEmployeeVariations(prev => ({
      ...prev,
      [emp]: variationData.variations
    }));
    
    // Calcola le ore da mostrare nell'header
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    const assignedHours = [];
    
    for (let day = 1; day <= giorniNelMese; day++) {
      const rowDate = new Date(anno, mese, day);
      let hoursForDay = employees[emp];
      
      for (let j = 0; j < variationData.variations.length; j++) {
        const variation = variationData.variations[j];
        const startDate = new Date(variation.start + "T00:00:00");
        const endDate = new Date(variation.end + "T00:00:00");
        
        if (rowDate >= startDate && rowDate <= endDate) {
          hoursForDay = variation.hours;
          break;
        }
      }
      
      assignedHours.push(hoursForDay);
    }
    
    // Mostra le ore nell'header
    const uniqueHours = Array.from(new Set(assignedHours)).sort((a, b) => a - b);
    const headerValue = uniqueHours.join("-");
    const headerCol = col + 1;
    
    hotRef.current.hotInstance.setDataAtCell(0, headerCol, headerValue);
    
    // Chiudi il popup
    setShowVariationPopup(false);
    
    // Ricalcola tutti i totali
    recalculateMotiveHours();
    updateOrePagate();
    updateTotaleOre();
    updateDifferenzeCorrente();
  };
  
  // Gestisce il salvataggio dei dati dal popup particolarità
  const handleParticolaritaPopupSave = (particolaritaData) => {
    if (!selectedCell || !hotRef.current) return;
    
    const { row, col } = selectedCell;
    
    // Imposta il valore nella cella
    hotRef.current.hotInstance.setDataAtCell(
      row,
      col,
      particolaritaData.selected.join("+")
    );
    
    // Chiudi il popup
    setShowParticolaritaPopup(false);
  };
  
  // Gestisce il salvataggio dei dati dal popup fatturato
  const handleFatturatoPopupSave = (fatturatoData) => {
    if (!selectedCell || !hotRef.current) return;
    
    const { row, col } = selectedCell;
    
    // Formatta l'importo
    const formatted = parseFloat(fatturatoData.importo).toFixed(2).replace(".", ",") + " €";
    
    // Aggiorna la cella
    hotRef.current.hotInstance.setDataAtCell(row, col, formatted);
    
    // Chiudi il popup
    setShowFatturatoPopup(false);
    
    // Aggiorna il totale
    updateFatturatoTotale();
  };
  
  // Gestisce il salvataggio dei dati dal popup differenza precedente
  const handleDiffPrecedentePopupSave = (diffData) => {
    if (!selectedCell || !hotRef.current) return;
    
    const { row, col } = selectedCell;
    
    // Formatta il valore
    const formattedValue = parseFloat(diffData.value).toFixed(2).replace(".", ",");
    
    // Aggiorna la cella
    hotRef.current.hotInstance.setDataAtCell(row, col, formattedValue);
    
    // Aggiorna anche la colonna accoppiata
    if (col % 2 === 0) {
      hotRef.current.hotInstance.setDataAtCell(row, col + 1, formattedValue);
    } else {
      hotRef.current.hotInstance.setDataAtCell(row, col - 1, formattedValue);
    }
    
    // Applica la classe CSS
    const cssClass = parseFloat(diffData.value) >= 0 ? "differenza-positiva" : "differenza-negativa";
    hotRef.current.hotInstance.setCellMeta(row, col, "className", cssClass);
    
    if (col % 2 === 0) {
      hotRef.current.hotInstance.setCellMeta(row, col + 1, "className", cssClass);
    } else {
      hotRef.current.hotInstance.setCellMeta(row, col - 1, "className", cssClass);
    }
    
    // Chiudi il popup
    setShowDiffPrecedentePopup(false);
    
    // Ricalcola i totali
    updateTotaleOre();
    updateDifferenzeCorrente();
  };
  
  // Calcola le ore relative ai motivi (ferie, ROL, ex festività)
  const recalculateMotiveHours = () => {
    if (!hotRef.current) return;
    
    // Arrays per i totali dei motivi
    const ferieTotals = Array(pairToEmployee.length).fill(0);
    const exFestivitaTotals = Array(pairToEmployee.length).fill(0);
    const rolTotals = Array(pairToEmployee.length).fill(0);
    
    const giorniNelMese = new Date(anno, mese + 1, 0).getDate();
    
    // Per ogni dipendente
    for (let pairIndex = 0; pairIndex < pairToEmployee.length; pairIndex++) {
      const emp = pairToEmployee[pairIndex];
      
      // Per ogni giorno del mese
      for (let day = 1; day <= giorniNelMese; day++) {
        const inizio = hotRef.current.hotInstance.getDataAtCell(day, 2 + 2 * pairIndex);
        const fine = hotRef.current.hotInstance.getDataAtCell(day, 3 + 2 * pairIndex);
        
        // Se c'è una "X" nella cella "inizio" e un valore con "|" nella cella "fine"
        if (inizio === "X" && fine && fine.indexOf("|") !== -1) {
          const parts = fine.split("|");
          const motive = parts[0].trim().toLowerCase();
          
          // Calcola le ore giornaliere per il dipendente
          const rowDate = new Date(anno, mese, day);
          let oreSettimanali = employees[emp];
          
          // Controllo variazioni orarie
          if (employeeVariations[emp]) {
            for (let i = 0; i < employeeVariations[emp].length; i++) {
              const entry = employeeVariations[emp][i];
              const startDate = new Date(entry.start + "T00:00:00");
              const endDate = new Date(entry.end + "T00:00:00");
              
              if (rowDate >= startDate && rowDate <= endDate) {
                oreSettimanali = entry.hours;
                break;
              }
            }
          }
          
          // Calcola ore giornaliere
          const oreGiornaliere = oreSettimanali / giorniLavorativiSettimanali;
          
          // Aggiungi al totale corrispondente
          if (motive === "ferie") {
            ferieTotals[pairIndex] += oreGiornaliere;
          } else if (motive === "rol") {
            rolTotals[pairIndex] += oreGiornaliere;
          } else if (motive === "exfestivita") {
            exFestivitaTotals[pairIndex] += oreGiornaliere;
          }
        }
      }
      
      // Imposta i valori nella tabella
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.ferieRowIndex,
        2 + 2 * pairIndex,
        ferieTotals[pairIndex].toFixed(2).replace(".", ","),
        "recalculate"
      );
      
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.exFestivitaRowIndex,
        2 + 2 * pairIndex,
        exFestivitaTotals[pairIndex].toFixed(2).replace(".", ","),
        "recalculate"
      );
      
      hotRef.current.hotInstance.setDataAtCell(
        summaryRows.rolRowIndex,
        2 + 2 * pairIndex,
        rolTotals[pairIndex].toFixed(2).replace(".", ","),
        "recalculate"
      );
    }
  };
  
  // Funzione per ricalcolare tutti i totali
  const recalculateAllTotals = () => {
    recalculateWorkHours();
    recalculateMotiveHours();
    updateTotaleOre();
    updateOrePagate();
    updateDifferenzeCorrente();
    updateFatturatoTotale();
  };

  const handleReturn = () => {
    if (typeof onReturn === 'function') {
      onReturn();
    }
  };
  
  return (
    <div className="turni-table-container">
      {loading ? (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento tabella turni...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="table-actions">
            <button 
              className="btn-primary"
              onClick={saveTable}
            >
              <i className="fas fa-save"></i> Salva Tabella
            </button>
            <button 
              className="btn-secondary"
              onClick={handleReturn}
            >
              <i className="fas fa-arrow-left"></i> Torna alla Lista
            </button>
          </div>
          
          <div className="hot-container">
            <HotTable
              ref={hotRef}
              data={data}
              colHeaders={false}
              rowHeaders={false}
              height="auto"
              licenseKey="non-commercial-and-evaluation"
              afterOnCellMouseDown={handleCellClick}
              afterChange={handleAfterChange}
              columns={buildColumnsFromUnits()}
              mergeCells={buildMerges()}
              manualColumnResize={true}
              columnSorting={false}
              disableVisualSelection={true}
            />
          </div>
          
          {/* Popup di modifica cella */}
          {showCellPopup && (
            <CellPopup 
              onClose={() => setShowCellPopup(false)}
              onSave={handleCellPopupSave}
              allTimes={allTimes}
              selectedCell={selectedCell}
              hotInstance={hotRef.current?.hotInstance}
            />
          )}
          
          {/* Popup inserimento orario manuale */}
          {showTimePopup && (
            <TimePopup 
              onClose={() => setShowTimePopup(false)}
              onSave={handleTimePopupSave}
              selectedCell={selectedCell}
              hotInstance={hotRef.current?.hotInstance}
            />
          )}
          
          {/* Popup variazioni dipendente */}
          {showVariationPopup && (
            <VariationPopup 
              onClose={() => setShowVariationPopup(false)}
              onSave={handleVariationPopupSave}
              selectedCell={selectedCell}
              hotInstance={hotRef.current?.hotInstance}
              pairToEmployee={pairToEmployee}
              employees={employees}
              employeeVariations={employeeVariations}
              anno={anno}
              mese={mese}
            />
          )}
          
          {/* Popup particolarità */}
          {showParticolaritaPopup && (
            <ParticolaritaPopup 
              onClose={() => setShowParticolaritaPopup(false)}
              onSave={handleParticolaritaPopupSave}
              selectedCell={selectedCell}
              hotInstance={hotRef.current?.hotInstance}
            />
          )}
          
          {/* Popup fatturato */}
          {showFatturatoPopup && (
            <FatturatoPopup 
              onClose={() => setShowFatturatoPopup(false)}
              onSave={handleFatturatoPopupSave}
              selectedCell={selectedCell}
              hotInstance={hotRef.current?.hotInstance}
            />
          )}
          
          {/* Popup differenza precedente */}
          {showDiffPrecedentePopup && (
            <DifferenzaPrecedentePopup 
              onClose={() => setShowDiffPrecedentePopup(false)}
              onSave={handleDiffPrecedentePopupSave}
              selectedCell={selectedCell}
              hotInstance={hotRef.current?.hotInstance}
              pairToEmployee={pairToEmployee}
            />
          )}
        </>
      )}
    </div>
  );
};

export default TurniTableComponent;