// src/components/turni/TurniTableComponent.jsx
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
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
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

    // Array dei mesi con il numero corretto di giorni (considerando anche gli anni bisestili)
    const getDaysInMonth = (month, year) => {
        // Nota: month è 0-based (0-11)
        return new Date(year, month + 1, 0).getDate();
    };

    // Verifica se un anno è bisestile
    const isLeapYear = (year) => {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    };

    useEffect(() => {
        // Verifica il mese e l'anno correnti
        const annoNum = parseInt(anno, 10);
        const meseNum = parseInt(mese, 10);

        // Log per debug
        console.log(`Inizializzazione tabella per ${meseNum + 1}/${annoNum} con ${getDaysInMonth(meseNum, annoNum)} giorni`);

        // Verifica se dobbiamo inizializzare per marzo 2025 (caso specifico)
        if (meseNum === 2 && annoNum === 2025) {
            console.log("Rilevato marzo 2025 - attivazione modalità speciale di inizializzazione");

            // Forza una reinizializzazione completa
            if (initialData && !isNewTable) {
                const timeoutId = setTimeout(() => {
                    console.log("Reinizializzazione forzata per marzo 2025");
                    initNewTable();
                }, 100);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [anno, mese, isNewTable, initialData]);

    const parseNumericValue = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        // Rimuove tutti i caratteri non numerici tranne virgola e punto, poi converte la virgola in punto
        return parseFloat(String(value).replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    };

    const festivitaNazionali = [
        { giorno: 1, mese: 0 },   // Capodanno (1 gennaio)
        { giorno: 6, mese: 0 },   // Epifania (6 gennaio)
        { giorno: 25, mese: 3 },  // Festa della Liberazione (25 aprile)
        { giorno: 1, mese: 4 },   // Festa dei Lavoratori (1 maggio)
        { giorno: 2, mese: 5 },   // Festa della Repubblica (2 giugno)
        { giorno: 15, mese: 7 },  // Ferragosto (15 agosto)
        { giorno: 1, mese: 10 },  // Tutti i Santi (1 novembre)
        { giorno: 8, mese: 11 },  // Immacolata Concezione (8 dicembre)
        { giorno: 25, mese: 11 }, // Natale (25 dicembre)
        { giorno: 26, mese: 11 }, // Santo Stefano (26 dicembre)
    ];

    // Funzione per verificare se una data è una festività
    const isFestivita = (giorno, mese) => {
        return festivitaNazionali.some(fest =>
            fest.giorno === giorno && fest.mese === mese
        );
    };

    // Funzione per calcolare Pasqua e Lunedì dell'Angelo per un dato anno
    const calcolaPasqua = (anno) => {
        const a = anno % 19;
        const b = Math.floor(anno / 100);
        const c = anno % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mese = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based (0 = gennaio)
        const giorno = ((h + l - 7 * m + 114) % 31) + 1;

        // Restituisce Pasqua e Lunedì dell'Angelo
        const pasqua = { giorno, mese };
        // Lunedì dell'Angelo (giorno dopo Pasqua)
        let lunediAngelo = { giorno: giorno + 1, mese };
        // Gestisci cambio mese
        if (lunediAngelo.giorno > new Date(anno, mese + 1, 0).getDate()) {
            lunediAngelo = { giorno: 1, mese: mese + 1 };
        }

        return { pasqua, lunediAngelo };
    };

    // Costante per i giorni lavorativi settimanali (potrebbe essere recuperata dalle impostazioni del negozio)
    const giorniLavorativiSettimanali = 6;

    useEffect(() => {
        if (initialData && !isNewTable) {
            loadSavedTable();
        } else {
            initNewTable();
        }
    }, [negozioId, anno, mese, dipendenti, isNewTable, initialData]);

    // Effect specifico per aggiornare le ore pagate all'avvio della tabella
    useEffect(() => {
        // Esegui solo quando la tabella è stata caricata (non in loading) e hotRef esiste
        if (!loading && hotRef.current && hotRef.current.hotInstance) {
            // Breve timeout per garantire che la tabella sia completamente renderizzata
            const timeoutId = setTimeout(() => {
                console.log("Aggiornamento automatico delle ore pagate all'avvio");

                // Aggiornamento delle ore pagate
                updateOrePagate();

                // Aggiornamento delle differenze del mese corrente
                updateDifferenzeCorrente();

                // Forza il rendering della tabella
                hotRef.current.hotInstance.render();

                console.log("Aggiornamento ore pagate completato");
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [loading]);

    // Aggiungi questa funzione per forzare immediatamente il ricalcolo dopo che le variazioni sono state aggiornate
    useEffect(() => {
        // Questo effetto si attiva quando employeeVariations cambia
        if (Object.keys(employeeVariations).length > 0 && !loading && hotRef.current) {
            console.log("Rilevata modifica alle variazioni, avvio ricalcolo...");

            // Usa un breve timeout per assicurarsi che la UI si sia aggiornata
            const timeoutId = setTimeout(() => {
                recalculateMotiveHours();
                recalculateWorkHours();
                updateTotaleOre();
                updateOrePagate();
                updateDifferenzeCorrente();
                calculateStraordinari();

                // Forza il rendering
                hotRef.current.hotInstance.render();
            }, 50);

            return () => clearTimeout(timeoutId);
        }
    }, [employeeVariations]);

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

        // Converti anno e mese in numeri per garantire il calcolo corretto
        const annoNum = parseInt(anno, 10);
        const meseNum = parseInt(mese, 10);

        // Calcola correttamente i giorni nel mese
        const giorniNelMese = new Date(annoNum, meseNum + 1, 0).getDate();

        // Crea l'array delle unità per le colonne
        const colUnits = [];

        // Prepara tutte le chiavi che useremo per evitare il problema "object is not extensible"
        const allKeys = ['giorno', 'giornoMese'];

        // Aggiungi le unità per i dipendenti e raccogli tutte le chiavi
        pairToEmpArray.forEach((emp, i) => {
            const inizioKey = `inizio_${i}`;
            const fineKey = `fine_${i}`;
            allKeys.push(inizioKey, fineKey);

            colUnits.push({
                type: "employee",
                inizio: inizioKey,
                fine: fineKey,
                header: `☰ ${emp}`
            });
        });

        // Aggiungi l'unità per il fatturato
        const fatturatoKey = "fatturato";
        allKeys.push(fatturatoKey);
        colUnits.push({
            type: "fatturato",
            key: fatturatoKey,
            header: "☰ Fatturato"
        });

        // Aggiungi l'unità per le particolarità
        const particolaritaKey = "particolarita";
        allKeys.push(particolaritaKey);
        colUnits.push({
            type: "particolarita",
            key: particolaritaKey,
            header: "☰ Particolarità"
        });

        setColumnUnits(colUnits);

        // Crea i dati della tabella
        const tableData = [];

        // Funzione helper per creare un oggetto riga con tutte le proprietà inizializzate
        const createRowObject = () => {
            const rowObj = {};
            allKeys.forEach(key => {
                rowObj[key] = "";
            });
            return rowObj;
        };

        // Header
        const headerRow = createRowObject();
        headerRow.giorno = "Giorno Settimana";
        headerRow.giornoMese = "Giorno";

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

        // Giorni del mese - utilizziamo i numeri convertiti per garantire il calcolo esatto
        for (let i = 1; i <= giorniNelMese; i++) {
            // Crea un nuovo oggetto riga con tutte le proprietà inizializzate
            const row = createRowObject();
            // Utilizza i numeri per la creazione della data
            const currentDate = new Date(annoNum, meseNum, i);
            row["giorno"] = currentDate.toLocaleDateString("it-IT", { weekday: "long" });
            row["giornoMese"] = currentDate.getDate();

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
            const row = createRowObject();
            row["giorno"] = label;

            colUnits.forEach(unit => {
                if (unit.type === "employee") {
                    row[unit.inizio] = "0,00";
                    row[unit.fine] = "0,00";
                } else if (unit.type === "fatturato") {
                    row[unit.key] = "0,00 €"; // Inizializza le celle fatturato a 0
                }
                // Niente da fare per particolarità, lasciamo vuoto come già impostato da createRowObject
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

            // Mostra indicatore di salvataggio
            setSaving(true);
            setSavedSuccess(false);

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
                onSave(dataToSave)
                    .then(() => {
                        setSaving(false);
                        setSavedSuccess(true);

                        // Reset dello stato di successo dopo 3 secondi
                        setTimeout(() => {
                            setSavedSuccess(false);
                        }, 3000);

                        // Mostra notifica di successo
                        dispatch(addNotification({
                            type: 'success',
                            message: 'Tabella turni salvata con successo',
                            duration: 3000
                        }));
                    })
                    .catch(error => {
                        setSaving(false);

                        dispatch(addNotification({
                            type: 'error',
                            message: `Errore nel salvataggio della tabella: ${error.message}`,
                            duration: 5000
                        }));
                    });
            } else {
                setSaving(false);
                dispatch(addNotification({
                    type: 'success',
                    message: 'Tabella turni salvata con successo',
                    duration: 3000
                }));
            }

            return true;
        } catch (error) {
            setSaving(false);
            console.error('Errore nel salvataggio della tabella', error);
            dispatch(addNotification({
                type: 'error',
                message: `Errore nel salvataggio della tabella: ${error.message}`,
                duration: 5000
            }));
            return false;
        }
    };

    // Migliora la gestione del drag and drop permettendo solo sulla maniglia
    const handleBeforeOnCellMouseDown = (event, coords) => {
        if (coords.row === 0) {
            // Verifica se si sta facendo click sulla maniglia di trascinamento
            if (event.target.className &&
                (event.target.className.includes('column-drag-handle') ||
                    event.target.parentElement.className.includes('column-drag-handle'))) {
                // Se è la maniglia, permettiamo il drag
                return;
            } else {
                // Altrimenti, blocchiamo il drag ma permettiamo il click normale
                event.stopImmediatePropagation();
            }
        }
    };

    // Verifica se è possibile spostare le colonne
    const handleBeforeColumnMove = (columns, target) => {
        // Verifica se le colonne che si stanno spostando sono pari
        // e corrispondono alle colonne delle unità dipendente (che devono muoversi in coppia)
        const canMove = columns.every(col => {
            const unitInfo = getUnitByCol(col);
            return unitInfo && (unitInfo.unit.type === "fatturato" ||
                unitInfo.unit.type === "particolarita" ||
                (unitInfo.unit.type === "employee" && (col % 2 === 0)));
        });

        // Se target è nelle colonne fisse (giorno e giornoMese), impedisci lo spostamento
        if (target < 2) return false;

        return canMove;
    };

    // Aggiorna le unità dopo lo spostamento delle colonne
    const handleAfterColumnMove = (movedColumns, finalIndex) => {
        if (movedColumns.length === 0) return;

        // Crea un array di unità con l'ordine aggiornato
        const newColumnUnits = [];

        // Mappa per tenere traccia delle colonne già processate
        const processedCols = new Set();

        // Ottieni l'ordine attuale delle colonne
        const columnOrder = hotRef.current.hotInstance.getSettings().manualColumnMove.columnsMapper || [];

        // Scorri tutte le colonne nell'ordine attuale
        for (let col = 2; col < columnOrder.length; col++) {
            if (processedCols.has(col)) continue;

            const unitInfo = getUnitByCol(col);
            if (!unitInfo) continue;

            // Aggiungi l'unità all'array
            newColumnUnits.push(unitInfo.unit);

            // Segna come processate tutte le colonne di questa unità
            processedCols.add(col);
            if (unitInfo.unit.type === "employee") {
                processedCols.add(col + 1);
            }
        }

        // Aggiorna lo stato delle unità
        setColumnUnits(newColumnUnits);

        // Forza il refresh della tabella
        setTimeout(() => {
            if (hotRef.current) {
                hotRef.current.hotInstance.render();
            }
        }, 100);
    };

    // Modifica il metodo handleCellClick per gestire correttamente i click sull'header
    const handleCellClick = (event, coords) => {
        // Gestione click su cella
        const { row, col } = coords;

        if (row === 0) {
            // Click su header - Modifica per gestire meglio l'apertura del popup delle variazioni
            const unitInfo = getUnitByCol(col);

            // Verifica se è un'unità di tipo dipendente
            if (unitInfo && unitInfo.unit.type === "employee") {
                // Ottieni l'elemento DOM cliccato
                const target = event.target;

                // Verifica se il click è stato fatto sulla maniglia di drag and drop
                // o su un elemento figlio della maniglia
                const isDragHandle =
                    target.className.includes('column-drag-handle') ||
                    target.parentElement.className.includes('column-drag-handle');

                // Se non è la maniglia di drag, apri il popup delle variazioni
                if (!isDragHandle) {
                    setSelectedCell({ row, col });
                    setShowVariationPopup(true);
                }
            }
        } else {
            // Gestione click su celle non di intestazione (rimane invariata)
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
                row === summaryRows.diffCorrenteRowIndex ||
                (summaryRows.straordinariRowIndex && row === summaryRows.straordinariRowIndex);

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

    // Funzione helper per gestire il merge in modo più sicuro
    const mergeCellsSafely = (row, col, rowspan, colspan) => {
        if (!hotRef.current) return;

        try {
            const mergePlugin = hotRef.current.hotInstance.getPlugin('mergeCells');

            if (mergePlugin && typeof mergePlugin.merge === 'function') {
                // Handsontable 8+ utilizza questo metodo
                mergePlugin.merge(row, col, row + rowspan - 1, col + colspan - 1);
            } else if (mergePlugin && typeof mergePlugin.mergeCells === 'function') {
                // Versioni precedenti utilizzano questo metodo
                mergePlugin.mergeCells({
                    row: row,
                    col: col,
                    rowspan: rowspan,
                    colspan: colspan
                });
            } else {
                console.warn('Impossibile unire le celle: plugin mergeCells non disponibile o metodo non trovato');
            }
        } catch (error) {
            console.warn('Errore durante l\'unione delle celle:', error);
        }
    };

    // Versione completa e corretta di buildColumnsFromUnits() che include tutte le colonne
    const buildColumnsFromUnits = () => {
        const cols = [
            {
                data: "giorno",
                readOnly: true,
                renderer: (instance, td, row, col, prop, value, cellProperties) => {
                    // Applica stile di riepilogo alle celle di intestazione delle righe riepilogative
                    if (Object.values(summaryRows).includes(row)) {
                        td.className += ' summary-cell summary-row-header';
                    }
                    Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
                }
            },
            {
                data: "giornoMese",
                readOnly: true,
                renderer: (instance, td, row, col, prop, value, cellProperties) => {
                    // Applica stile di riepilogo alle celle di intestazione delle righe riepilogative
                    if (Object.values(summaryRows).includes(row)) {
                        td.className += ' summary-cell summary-row-header';
                    }
                    Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
                }
            },
        ];

        columnUnits.forEach(unit => {
            if (unit.type === "employee") {
                cols.push({
                    data: unit.inizio,
                    readOnly: true,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                        // Se è una riga riepilogativa, aggiungi la classe summary-cell
                        if (Object.values(summaryRows).includes(row)) {
                            td.className += ' summary-cell';
                        }

                        // Se è la riga di intestazione, manteniamo lo stile originale
                        if (row === 0 && value && value.includes('☰')) {
                            // Utilizziamo la struttura originale dell'header
                            td.innerHTML = `<div style="display: flex; align-items: center; width: 100%;">
                            <span class="column-drag-handle" style="cursor: move; padding: 2px 6px; background: #f1f1f1; border-radius: 3px; margin-right: 8px;">☰</span>
                            <span class="employee-name-header" data-col="${col}" style="cursor: pointer; flex: 1; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between; border-radius: 4px; transition: all 0.2s;">
                                <span>${value.replace('☰', '')}</span>
                                <span class="settings-icon" style="margin-left: 8px; font-size: 14px; opacity: 0.7;">⚙️</span>
                            </span>
                        </div>`;
                            td.className += ' header-cell';

                            // Manteniamo le proprietà originali
                            cellProperties.readOnly = true;
                            cellProperties.editor = false;

                            // Manteniamo la gestione del click
                            setTimeout(() => {
                                const headerEl = td.querySelector('.employee-name-header');
                                if (headerEl) {
                                    // Rimuoviamo eventuali listener esistenti per sicurezza
                                    headerEl.removeEventListener('click', handleHeaderClick);
                                    // Aggiungiamo il nuovo listener
                                    headerEl.addEventListener('click', handleHeaderClick);
                                }
                            }, 0);
                        } else {
                            Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
                        }
                    }
                });

                cols.push({
                    data: unit.fine,
                    readOnly: true,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                        // Aggiungi la classe per le celle riepilogative
                        if (Object.values(summaryRows).includes(row)) {
                            td.className += ' summary-cell';
                        }

                        if (typeof value === "string" && value.indexOf("|") !== -1) {
                            value = value.split("|")[1];
                        }
                        Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
                    }
                });
            } else if (unit.type === "fatturato") {
                cols.push({
                    data: unit.key,
                    readOnly: true,
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                        // Se è la riga di intestazione, aggiungi l'icona drag handle con stile migliorato
                        if (row === 0 && value && value.includes('☰')) {
                            td.innerHTML = `<div style="display: flex; align-items: center; width: 100%;">
                            <span class="column-drag-handle" style="cursor: move; padding: 2px 6px; background: #f1f1f1; border-radius: 3px; margin-right: 8px;">☰</span>
                            <span>${value.replace('☰', '')}</span>
                        </div>`;
                            td.className += ' drag-handle-cell';

                            // Aggiungiamo questa proprietà per evitare che Handsontable provi ad aprire un editor
                            cellProperties.readOnly = true;
                            cellProperties.editor = false;
                        } else if (Object.values(summaryRows).includes(row)) {
                            // Aggiungi classe per le celle riepilogative di fatturato
                            td.className += ' fatturato-riepilogo';

                            // Se è una cella riepilogativa vuota, inizializza con 0,00 €
                            if (!value || value.trim() === '') {
                                value = '0,00 €';
                            }
                        }

                        Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
                    }
                });
            } else if (unit.type === "particolarita") {
                cols.push({
                    data: unit.key,
                    readOnly: true,
                    className: "particolarita-cell",
                    renderer: (instance, td, row, col, prop, value, cellProperties) => {
                        // Se è la riga di intestazione, aggiungi l'icona drag handle con stile migliorato
                        if (row === 0 && value && value.includes('☰')) {
                            td.innerHTML = `<div style="display: flex; align-items: center; width: 100%;">
                            <span class="column-drag-handle" style="cursor: move; padding: 2px 6px; background: #f1f1f1; border-radius: 3px; margin-right: 8px;">☰</span>
                            <span>${value.replace('☰', '')}</span>
                        </div>`;
                            td.className += ' drag-handle-cell';

                            // Aggiungiamo questa proprietà per evitare che Handsontable provi ad aprire un editor
                            cellProperties.readOnly = true;
                            cellProperties.editor = false;
                        } else if (Object.values(summaryRows).includes(row)) {
                            // Mantieni solo la classe originale senza aggiungere lo stile summary-cell
                            td.className += ' particolarita-riepilogo';

                            // Per le righe riepilogative, disabilita completamente la cella
                            cellProperties.readOnly = true;
                        }

                        Handsontable.renderers.TextRenderer(instance, td, row, col, prop, value, cellProperties);
                    }
                });
            }
        });

        return cols;
    };

    // Aggiungi il gestore di eventi per il click sull'header
    const handleHeaderClick = (event) => {
        // Recupera l'indice di colonna dall'attributo data-col
        const colStr = event.currentTarget.getAttribute('data-col');
        if (!colStr) return;

        const col = parseInt(colStr, 10);

        // Previeni propagazione per evitare che altri handler gestiscano lo stesso evento
        event.stopPropagation();

        // Ottieni informazioni sull'unità
        const unitInfo = getUnitByCol(col);
        if (unitInfo && unitInfo.unit.type === "employee") {
            setSelectedCell({ row: 0, col });
            setShowVariationPopup(true);
        }
    };

    // Definizione della funzione updateHeaderListeners
    const updateHeaderListeners = () => {
        if (!hotRef.current) return;

        // Seleziona tutti gli header dei dipendenti
        const headerElements = document.querySelectorAll('.employee-name-header');

        // Aggiungi listener di evento click a ciascuno
        headerElements.forEach(el => {
            el.removeEventListener('click', handleHeaderClick);
            el.addEventListener('click', handleHeaderClick);
        });
    };

    // Aggiungiamo un useEffect per aggiornare i listener quando necessario
    useEffect(() => {
        const timeoutId = setTimeout(updateHeaderListeners, 100);
        return () => clearTimeout(timeoutId);
    }, [data, columnUnits]);

    // Aggiungi un handler per prevenire il doppio click
    const handleBeforeCellDblClick = (event, coords) => {
        if (coords.row === 0) {
            // Previeni completamente il doppio click sulle celle di intestazione
            event.stopImmediatePropagation();
            return false;
        }
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

    // Aggiungi questa funzione per generare lo schema dati per Handsontable
    const buildDataSchema = () => {
        const schema = {
            giorno: "",
            giornoMese: ""
        };

        // Aggiungi tutte le proprietà per le colonne definite nelle unità
        columnUnits.forEach(unit => {
            if (unit.type === "employee") {
                schema[unit.inizio] = "";
                schema[unit.fine] = "";
            } else if (unit.type === "fatturato" || unit.type === "particolarita") {
                schema[unit.key] = "";
            }
        });

        return schema;
    };

    // Versione corretta della funzione updateTotaleOre
    const updateTotaleOre = () => {
        if (!hotRef.current || !hotRef.current.hotInstance) return;

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
                if (rowIndex === undefined || rowIndex < 0 || rowIndex >= hotRef.current.hotInstance.countRows()) {
                    console.warn(`Indice riga ${rowIndex} non valido per il calcolo del totale`);
                    return;
                }

                try {
                    const cellVal = hotRef.current.hotInstance.getDataAtCell(rowIndex, unitCol);

                    if (cellVal === null || cellVal === undefined || cellVal === "") {
                        return;
                    }

                    const numStr = String(cellVal).replace(",", ".");
                    const num = parseFloat(numStr);

                    if (!isNaN(num)) {
                        totale += num;
                    }
                } catch (error) {
                    console.error(`Errore nel leggere la cella [${rowIndex}, ${unitCol}]:`, error);
                }
            });

            try {
                if (summaryRows.totaleOreRowIndex === undefined ||
                    summaryRows.totaleOreRowIndex < 0 ||
                    summaryRows.totaleOreRowIndex >= hotRef.current.hotInstance.countRows()) {
                    console.warn(`Indice riga totale ore ${summaryRows.totaleOreRowIndex} non valido`);
                    return;
                }

                hotRef.current.hotInstance.setDataAtCell(
                    summaryRows.totaleOreRowIndex,
                    unitCol,
                    totale.toFixed(2).replace(".", ","),
                    "updateTotaleOre"
                );
            } catch (error) {
                console.error(`Errore nell'impostare la cella totale [${summaryRows.totaleOreRowIndex}, ${unitCol}]:`, error);
            }

            unitCol += 2;
        }

        // Aggiorna le differenze mese corrente
        updateDifferenzeCorrente();
    };

    // Aggiungi questa funzione per aggiornare in modo sicuro i dati della tabella
    const updateCellSafely = (row, col, value, source) => {
        if (!hotRef.current || !hotRef.current.hotInstance) return false;

        // Verifica che gli indici siano validi
        if (row < 0 || row >= hotRef.current.hotInstance.countRows() ||
            col < 0 || col >= hotRef.current.hotInstance.countCols()) {
            console.warn(`Tentativo di aggiornare una cella fuori dai limiti: [${row}, ${col}]`);
            return false;
        }

        try {
            // Ottieni i dati correnti
            const currentData = hotRef.current.hotInstance.getSourceDataAtRow(row);

            // Se i dati non hanno la struttura giusta, crea un nuovo oggetto
            if (!currentData || typeof currentData !== 'object') {
                console.warn(`I dati alla riga ${row} non sono un oggetto valido`);
                return false;
            }

            // Assicurati che la proprietà esista prima di impostarla
            const propertyName = hotRef.current.hotInstance.colToProp(col);
            if (!propertyName) {
                console.warn(`Impossibile ottenere il nome della proprietà per la colonna ${col}`);
                return false;
            }

            // Usa setDataAtCell che è più sicuro
            hotRef.current.hotInstance.setDataAtCell(row, col, value, source);
            return true;
        } catch (error) {
            console.error(`Errore nell'aggiornare la cella [${row}, ${col}]:`, error);
            return false;
        }
    };

    const updateOrePagate = () => {
        if (!hotRef.current) return;

        const weekDays = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
        const giorniLavorativi = weekDays.slice(0, giorniLavorativiSettimanali);
        const giorniNelMese = new Date(anno, mese + 1, 0).getDate();

        // Calcola Pasqua e Lunedì dell'Angelo per l'anno corrente
        const { pasqua, lunediAngelo } = calcolaPasqua(parseInt(anno));

        for (let u = 0, unitCol = 2; u < columnUnits.length; u++) {
            const unit = columnUnits[u];
            if (unit.type !== "employee") {
                unitCol += unit.type === "employee" ? 2 : 1;
                continue;
            }

            let totale = 0;
            const emp = pairToEmployee[u];

            // Per ogni giorno del mese
            for (let i = 1; i <= giorniNelMese; i++) {
                const cellDay = hotRef.current.hotInstance.getDataAtCell(i, 0);
                if (!cellDay) continue;

                const currentDate = new Date(anno, mese, i);
                const dayName = cellDay.toLowerCase();

                // Verifica se è un giorno festivo
                const isFestivo = isFestivita(i, mese) ||
                    (pasqua.giorno === i && pasqua.mese === mese) ||
                    (lunediAngelo.giorno === i && lunediAngelo.mese === mese);

                // Se è un giorno lavorativo normale o domenica
                if (giorniLavorativi.includes(dayName) && !isFestivo) {
                    let oreSettimanali = employees[emp];

                    // Controlla variazioni orarie
                    if (employeeVariations[emp]) {
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
                // Se è festivo, verifica se ha diritto alle ore pagate comunque
                else if (isFestivo) {
                    // Per i festivi, aggiungi ore solo se sono ore pagate normalmente
                    // Verifica nel popup delle particolarità se è contrassegnato come pagato
                    const particolaritaCol = getParticolaritaColumnIndex();
                    if (particolaritaCol !== null) {
                        const particolaritaVal = hotRef.current.hotInstance.getDataAtCell(i, particolaritaCol) || '';

                        // Se contiene il codice "FP" (Festivo Pagato)
                        if (particolaritaVal.includes("FP") || particolaritaVal.includes("FES")) {
                            const emp = pairToEmployee[u];
                            const oreSettimanali = employees[emp];
                            const oreGiornaliere = oreSettimanali / giorniLavorativiSettimanali;
                            totale += oreGiornaliere;
                        }
                    }
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

    // Aggiungi subito dopo updateOrePagate:
    const getParticolaritaColumnIndex = () => {
        for (let i = 0; i < columnUnits.length; i++) {
            if (columnUnits[i].type === "particolarita") {
                return getUnitStartIndex(i);
            }
        }
        return null;
    };

    // Aggiornamento sicuro della funzione updateDifferenzeCorrente
    const updateDifferenzeCorrente = () => {
        if (!hotRef.current || !hotRef.current.hotInstance) return;

        for (let u = 0, unitCol = 2; u < columnUnits.length; u++) {
            const unit = columnUnits[u];
            if (unit.type !== "employee") {
                unitCol += unit.type === "employee" ? 2 : 1;
                continue;
            }

            try {
                // Ottieni i valori di TOTALE ORE e ORE PAGATE
                const totaleOreVal = hotRef.current.hotInstance.getDataAtCell(summaryRows.totaleOreRowIndex, unitCol) || "0,00";
                const orePagateVal = hotRef.current.hotInstance.getDataAtCell(summaryRows.orePagateRowIndex, unitCol) || "0,00";

                // Converti in numeri
                const totaleOre = parseFloat(String(totaleOreVal).replace(",", ".")) || 0;
                const orePagate = parseFloat(String(orePagateVal).replace(",", ".")) || 0;

                // Calcola la differenza
                const differenza = totaleOre - orePagate;
                const formattedDiff = differenza.toFixed(2).replace(".", ",");

                // Aggiorna la cella in modo sicuro
                updateCellSafely(
                    summaryRows.diffCorrenteRowIndex,
                    unitCol,
                    formattedDiff,
                    "updateDifferenzeCorrente"
                );

                // Applica la classe CSS in base al valore
                const cssClass = differenza >= 0 ? "differenza-positiva" : "differenza-negativa";
                hotRef.current.hotInstance.setCellMeta(summaryRows.diffCorrenteRowIndex, unitCol, "className", cssClass);

                unitCol += 2;
            } catch (error) {
                console.error(`Errore nel calcolo della differenza corrente per la colonna ${unitCol}:`, error);
                unitCol += 2; // Continuiamo con la prossima unità
            }
        }

        // Forza il rendering
        try {
            hotRef.current.hotInstance.render();
        } catch (error) {
            console.error("Errore durante il rendering della tabella:", error);
        }
    };

    const calculateStraordinari = () => {
        if (!hotRef.current) return;

        // Per ogni dipendente
        for (let pairIndex = 0; pairIndex < pairToEmployee.length; pairIndex++) {
            const emp = pairToEmployee[pairIndex];
            const oreSettimanaliStandard = employees[emp];
            const colIndex = 2 + 2 * pairIndex;

            // Ottieni il totale ore lavorate
            const oreLavorateCell = hotRef.current.hotInstance.getDataAtCell(summaryRows.oreLavorateRowIndex, colIndex);
            const oreLavorate = parseNumericValue(oreLavorateCell);

            // Calcola le ore settimanali standard per il mese
            const giorniNelMese = new Date(parseInt(anno), parseInt(mese) + 1, 0).getDate();
            const settimaneMese = giorniNelMese / 7;
            const oreStandardMese = oreSettimanaliStandard * settimaneMese;

            // Se le ore lavorate superano le ore standard, la differenza sono straordinari
            const oreStr = Math.max(0, oreLavorate - oreStandardMese);

            // Verifica se esiste già una cella per gli straordinari
            if (!summaryRows.straordinariRowIndex) {
                try {
                    // Inserisci una nuova riga per gli straordinari dopo ore lavorate
                    hotRef.current.hotInstance.alter('insert_row', summaryRows.oreLavorateRowIndex + 1, 1);

                    // Aggiorna gli indici delle righe di riepilogo
                    Object.keys(summaryRows).forEach(key => {
                        if (summaryRows[key] > summaryRows.oreLavorateRowIndex) {
                            summaryRows[key]++;
                        }
                    });

                    // Imposta l'indice per la riga straordinari
                    summaryRows.straordinariRowIndex = summaryRows.oreLavorateRowIndex + 1;

                    // Imposta l'etichetta
                    hotRef.current.hotInstance.setDataAtCell(summaryRows.straordinariRowIndex, 0, "STRAORDINARI");

                    // Utilizziamo un approccio diverso per il merge delle celle
                    // Questo è più sicuro e compatibile con tutte le versioni di Handsontable
                    try {
                        const mergePlugin = hotRef.current.hotInstance.getPlugin('mergeCells');
                        if (mergePlugin && typeof mergePlugin.merge === 'function') {
                            // Handsontable 8+ utilizza questo metodo
                            mergePlugin.merge(summaryRows.straordinariRowIndex, 0, summaryRows.straordinariRowIndex, 1);
                        } else if (mergePlugin && typeof mergePlugin.mergeCells === 'function') {
                            // Versioni precedenti utilizzano questo metodo
                            mergePlugin.mergeCells({
                                row: summaryRows.straordinariRowIndex,
                                col: 0,
                                rowspan: 1,
                                colspan: 2
                            });
                        } else {
                            // Fallback se il plugin non è disponibile o non ha i metodi attesi
                            console.warn('Impossibile unire le celle: plugin mergeCells non disponibile o metodo non trovato');
                        }
                    } catch (error) {
                        console.warn('Errore durante l\'unione delle celle:', error);
                        // Continuiamo comunque con l'esecuzione
                    }
                } catch (error) {
                    console.warn('Errore durante la creazione della riga straordinari:', error);
                    // Continuiamo comunque senza creare la riga
                }
            }

            // Imposta il valore degli straordinari nella cella
            if (summaryRows.straordinariRowIndex) {
                hotRef.current.hotInstance.setDataAtCell(
                    summaryRows.straordinariRowIndex,
                    colIndex,
                    oreStr.toFixed(2).replace(".", ",")
                );

                // Applica lo stile agli straordinari
                hotRef.current.hotInstance.setCellMeta(
                    summaryRows.straordinariRowIndex,
                    colIndex,
                    "className",
                    oreStr > 0 ? "straordinari-cell" : ""
                );
            }
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
        const giorniNelMese = new Date(parseInt(anno), parseInt(mese) + 1, 0).getDate();

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
            source === "updateDifferenzeCorrente" ||
            source === "recalculate"
        ) {
            return;
        }

        // Determina quali ricalcoli sono necessari
        let needsWorkHoursRecalc = false;
        let needsMotiveHoursRecalc = false;
        let needsFatturatoUpdate = false;
        let needsTotaleOreUpdate = false;

        // Verifica quali colonne sono state modificate
        for (let i = 0; i < changes.length; i++) {
            const [row, col, oldVal, newVal] = changes[i];

            // Se la riga è un giorno del mese (non intestazione e non riepilogo)
            if (row > 0 && row <= new Date(parseInt(anno), parseInt(mese) + 1, 0).getDate()) {
                // Determina il tipo di colonna
                const unitInfo = getUnitByCol(col);
                if (!unitInfo) continue;

                if (unitInfo.unit.type === "employee") {
                    // È stata modificata una cella di dipendente
                    needsWorkHoursRecalc = true;

                    // Se contiene "X" o "|", potrebbe influenzare il calcolo dei motivi
                    if (oldVal !== newVal && (
                        (newVal && (newVal === "X" || newVal.includes("|"))) ||
                        (oldVal && (oldVal === "X" || oldVal.includes("|")))
                    )) {
                        needsMotiveHoursRecalc = true;
                    }
                } else if (unitInfo.unit.type === "fatturato") {
                    // È stata modificata una cella di fatturato
                    needsFatturatoUpdate = true;
                }
            }

            // Se è stata modificata una riga di riepilogo
            const isInSummaryRow = Object.values(summaryRows).includes(row);
            if (isInSummaryRow) {
                needsTotaleOreUpdate = true;
            }
        }

        // Esegui i ricalcoli necessari
        if (needsWorkHoursRecalc) {
            recalculateWorkHours();
        }

        if (needsMotiveHoursRecalc) {
            recalculateMotiveHours();
        }

        if (needsFatturatoUpdate) {
            updateFatturatoTotale();
        }

        if (needsTotaleOreUpdate || needsWorkHoursRecalc || needsMotiveHoursRecalc) {
            updateTotaleOre();
        }

        // Aggiorna le ore pagate e le differenze solo se necessario
        if (needsWorkHoursRecalc || needsMotiveHoursRecalc) {
            updateOrePagate();
        }

        // Le differenze correnti si aggiornano sempre quando cambia totale ore o ore pagate
        updateDifferenzeCorrente();
    };

    // Funzione per calcolare correttamente le ore tra due orari
    const calculateHoursBetween = (startTime, endTime) => {
        try {
            const [startHours, startMinutes] = startTime.split(":").map(Number);
            const [endHours, endMinutes] = endTime.split(":").map(Number);

            // Converti in minuti totali
            const startTotalMinutes = startHours * 60 + startMinutes;
            let endTotalMinutes = endHours * 60 + endMinutes;

            // Gestisci il caso in cui il turno finisca il giorno dopo
            if (endTotalMinutes < startTotalMinutes) {
                endTotalMinutes += 24 * 60; // Aggiungi un giorno in minuti
            }

            // Calcola la differenza e converti in ore decimali
            const diffMinutes = endTotalMinutes - startTotalMinutes;
            return parseFloat((diffMinutes / 60).toFixed(2));
        } catch (e) {
            console.error('Errore nel calcolo delle ore:', e);
            return 0;
        }
    };

    // Recalcola le ore lavorate
    const recalculateWorkHours = () => {
        if (!hotRef.current) return;

        const giorniNelMese = new Date(parseInt(anno), parseInt(mese) + 1, 0).getDate();

        // Per ogni dipendente
        for (let pairIndex = 0; pairIndex < pairToEmployee.length; pairIndex++) {
            let sumHours = 0;

            // Per ogni giorno del mese
            for (let day = 1; day <= giorniNelMese; day++) {
                const inizio = hotRef.current.hotInstance.getDataAtCell(day, 2 + 2 * pairIndex);
                const fine = hotRef.current.hotInstance.getDataAtCell(day, 3 + 2 * pairIndex);

                // Se la cella "fine" contiene un valore numerico o con una virgola
                if (fine && fine !== "X" && !fine.includes("|")) {
                    // Usa la funzione helper per estrarre il valore numerico
                    const hours = parseNumericValue(fine);
                    sumHours += hours;
                }
                // Verifica anche se c'è un range di orari nella prima cella ma non è stato calcolato
                else if (inizio && inizio.includes(" - ") && (!fine || fine === "")) {
                    // Estrai orari dall'intervallo
                    const [startTime, endTime] = inizio.split(" - ").map(t => t.trim());
                    if (startTime && endTime) {
                        // Calcola la differenza di ore
                        const hoursWorked = calculateHoursBetween(startTime, endTime);
                        // Aggiorna la seconda cella
                        hotRef.current.hotInstance.setDataAtCell(
                            day,
                            3 + 2 * pairIndex,
                            hoursWorked.toFixed(2).replace(".", ",")
                        );
                        sumHours += hoursWorked;
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

    // Calcola le ore relative ai motivi (ferie, ROL, ex festività)
    const recalculateMotiveHours = () => {
        if (!hotRef.current) return;
        console.log("Ricalcolo ore motivi");

        // Arrays per i totali dei motivi
        const ferieTotals = Array(pairToEmployee.length).fill(0);
        const exFestivitaTotals = Array(pairToEmployee.length).fill(0);
        const rolTotals = Array(pairToEmployee.length).fill(0);

        const giorniNelMese = new Date(parseInt(anno), parseInt(mese) + 1, 0).getDate();

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
                    const rowDate = new Date(parseInt(anno), parseInt(mese), day);
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
                    console.log(`Giorno ${day}, Dipendente ${emp}, Motivo ${motive}, Ore ${oreGiornaliere}`);

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
            console.log(`Dipendente ${emp}: Ferie=${ferieTotals[pairIndex]}, ROL=${rolTotals[pairIndex]}, Ex Festività=${exFestivitaTotals[pairIndex]}`);

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

        // Forza il rendering della tabella
        hotRef.current.hotInstance.render();
    };

    // Funzione per ricalcolare tutti i totali
    const recalculateAllTotals = () => {
        if (!hotRef.current) return;

        // Prima rimuoviamo tutte le classi dalle celle
        const giorniNelMese = new Date(parseInt(anno), parseInt(mese) + 1, 0).getDate();
        const totalRows = giorniNelMese + Object.values(summaryRows).length + 1; // +1 per l'header
        const totalCols = hotRef.current.hotInstance.countCols();

        for (let row = 0; row < totalRows; row++) {
            for (let col = 0; col < totalCols; col++) {
                hotRef.current.hotInstance.removeCellMeta(row, col, "className");
            }
        }

        // Esegui tutti i calcoli necessari in sequenza
        recalculateWorkHours();
        recalculateMotiveHours();
        updateTotaleOre();
        updateOrePagate();
        updateDifferenzeCorrente();
        updateFatturatoTotale();
        calculateStraordinari();

        // Applica gli stili per le celle riepilogative
        applyStylesToCells();

        // Forza il rendering della tabella
        hotRef.current.hotInstance.render();
    };

    const logCurrentMotiveHours = () => {
        if (!hotRef.current) return;

        console.log("STATO ATTUALE DEI CALCOLI:");

        for (let pairIndex = 0; pairIndex < pairToEmployee.length; pairIndex++) {
            const emp = pairToEmployee[pairIndex];
            const ferie = hotRef.current.hotInstance.getDataAtCell(summaryRows.ferieRowIndex, 2 + 2 * pairIndex);
            const rol = hotRef.current.hotInstance.getDataAtCell(summaryRows.rolRowIndex, 2 + 2 * pairIndex);
            const exFestivita = hotRef.current.hotInstance.getDataAtCell(summaryRows.exFestivitaRowIndex, 2 + 2 * pairIndex);

            console.log(`Dipendente ${emp}: Ferie=${ferie}, ROL=${rol}, Ex Festività=${exFestivita}`);

            // Variazioni attive
            if (employeeVariations[emp] && employeeVariations[emp].length > 0) {
                console.log("Variazioni orarie attive:");
                employeeVariations[emp].forEach((v, i) => {
                    console.log(`  ${i + 1}. Da ${v.start} a ${v.end}: ${v.hours} ore`);
                });
            } else {
                console.log("Nessuna variazione oraria attiva");
            }
        }
    };

    // Applica gli stili alle celle riepilogative
    const applyStylesToCells = () => {
        if (!hotRef.current) return;

        // Applica stili alle celle delle righe riepilogative
        Object.values(summaryRows).forEach(rowIndex => {
            // Applica stile alle celle dei titoli delle righe (prime due colonne)
            hotRef.current.hotInstance.setCellMeta(rowIndex, 0, "className", "summary-cell summary-row-header");
            hotRef.current.hotInstance.setCellMeta(rowIndex, 1, "className", "summary-cell summary-row-header");

            // Applica stile alle celle dei dipendenti
            for (let u = 0; u < columnUnits.length; u++) {
                const unit = columnUnits[u];
                const colIndex = getUnitStartIndex(u);

                if (unit.type === "employee") {
                    // Celle dipendente nelle righe riepilogative
                    hotRef.current.hotInstance.setCellMeta(rowIndex, colIndex, "className", "summary-cell");
                    hotRef.current.hotInstance.setCellMeta(rowIndex, colIndex + 1, "className", "summary-cell");
                } else if (unit.type === "fatturato") {
                    // Mantieni lo stile originale per celle fatturato (senza aggiungere summary-cell)
                    hotRef.current.hotInstance.setCellMeta(rowIndex, colIndex, "className", "fatturato-riepilogo");

                    // Inizializza a 0 se vuota
                    const cellVal = hotRef.current.hotInstance.getDataAtCell(rowIndex, colIndex);
                    if (!cellVal || cellVal.trim() === '') {
                        hotRef.current.hotInstance.setDataAtCell(rowIndex, colIndex, "0,00 €");
                    }
                } else if (unit.type === "particolarita") {
                    // Mantieni lo stile originale per celle particolarità (senza aggiungere summary-cell)
                    hotRef.current.hotInstance.setCellMeta(rowIndex, colIndex, "className", "particolarita-riepilogo");
                    hotRef.current.hotInstance.setCellMeta(rowIndex, colIndex, "readOnly", true);
                }
            }
        });

        // Applica stili alle celle di differenza (positive/negative)
        for (let u = 0; u < columnUnits.length; u++) {
            const unit = columnUnits[u];
            if (unit.type !== "employee") continue;

            const colIndex = getUnitStartIndex(u);

            // Differenza mese precedente
            const diffPrecedenteVal = hotRef.current.hotInstance.getDataAtCell(summaryRows.diffPrecedenteRowIndex, colIndex);
            if (diffPrecedenteVal) {
                const diffValue = parseFloat(diffPrecedenteVal.toString().replace(',', '.'));
                const className = diffValue >= 0 ? 'differenza-positiva' : 'differenza-negativa';
                hotRef.current.hotInstance.setCellMeta(summaryRows.diffPrecedenteRowIndex, colIndex, "className", className);
                hotRef.current.hotInstance.setCellMeta(summaryRows.diffPrecedenteRowIndex, colIndex + 1, "className", className);
            }

            // Differenza mese corrente
            const diffCorrenteVal = hotRef.current.hotInstance.getDataAtCell(summaryRows.diffCorrenteRowIndex, colIndex);
            if (diffCorrenteVal) {
                const diffValue = parseFloat(diffCorrenteVal.toString().replace(',', '.'));
                const className = diffValue >= 0 ? 'differenza-positiva' : 'differenza-negativa';
                hotRef.current.hotInstance.setCellMeta(summaryRows.diffCorrenteRowIndex, colIndex, "className", className);
                hotRef.current.hotInstance.setCellMeta(summaryRows.diffCorrenteRowIndex, colIndex + 1, "className", className);
            }
        }
    };

    // Gestione del salvataggio dei dati dal popup cella
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
                const hoursWorked = calculateHoursBetween(cellData.orarioInizio, cellData.orarioFine);

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
                    hoursWorked.toFixed(2).replace(".", ",")
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
        recalculateAllTotals();
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
        recalculateAllTotals();
    };

    // Nuova funzione per aggiornare l'intestazione della colonna
    const updateEmployeeColumnHeader = (pairIndex, emp, variations) => {
        if (!hotRef.current) return;

        const annoNum = parseInt(anno, 10);
        const meseNum = parseInt(mese, 10);
        const giorniNelMese = new Date(annoNum, meseNum + 1, 0).getDate();
        const colInizio = 2 + 2 * pairIndex;
        const colFine = colInizio + 1;

        // Calcola le ore per ogni giorno del mese
        const assignedHours = [];
        for (let day = 1; day <= giorniNelMese; day++) {
            const rowDate = new Date(annoNum, meseNum, day);
            let hoursForDay = employees[emp];

            // Applica le variazioni
            for (let j = 0; j < variations.length; j++) {
                const variation = variations[j];
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

        // Aggiorna l'intestazione
        try {
            hotRef.current.hotInstance.setDataAtCell(0, colFine, headerValue);
        } catch (error) {
            console.error("Errore nell'aggiornare l'intestazione:", error);
        }
    };

    // Nuova funzione per aggiornare i valori delle celle dei giorni
    const updateEmployeeDayValues = (pairIndex, emp, variations) => {
        if (!hotRef.current) return;

        const annoNum = parseInt(anno, 10);
        const meseNum = parseInt(mese, 10);
        const giorniNelMese = new Date(annoNum, meseNum + 1, 0).getDate();
        const colInizio = 2 + 2 * pairIndex;
        const colFine = colInizio + 1;

        // Aggiorna ogni giorno del mese
        for (let day = 1; day <= giorniNelMese; day++) {
            const rowDate = new Date(annoNum, meseNum, day);
            const inizio = hotRef.current.hotInstance.getDataAtCell(day, colInizio);
            const fine = hotRef.current.hotInstance.getDataAtCell(day, colFine);

            // Se è un'assenza (X nella cella inizio e un valore con "|" nella cella fine)
            if (inizio === "X" && fine && fine.indexOf("|") !== -1) {
                const parts = fine.split("|");
                const motivo = parts[0].trim();
                const abbr = parts[1].trim();

                // Calcola le nuove ore giornaliere basate sulle variazioni
                let oreSettimanali = employees[emp];

                // Applica le variazioni
                for (let j = 0; j < variations.length; j++) {
                    const variation = variations[j];
                    const startDate = new Date(variation.start + "T00:00:00");
                    const endDate = new Date(variation.end + "T00:00:00");

                    if (rowDate >= startDate && rowDate <= endDate) {
                        oreSettimanali = variation.hours;
                        break;
                    }
                }

                // Manteniamo lo stesso motivo e abbreviazione ma aggiorniamo la cella
                try {
                    // Aggiorna la cella fine
                    hotRef.current.hotInstance.setDataAtCell(
                        day,
                        colFine,
                        `${motivo}|${abbr}`
                    );
                } catch (error) {
                    console.error(`Errore nell'aggiornare la cella [${day}, ${colFine}]:`, error);
                }
            }
        }
    };

    // Versione migliorata della funzione handleVariationPopupSave
    const handleVariationPopupSave = (variationData) => {
        if (!selectedCell || !hotRef.current) return;

        const { col } = selectedCell;
        const unitInfo = getUnitByCol(col);

        if (!unitInfo || unitInfo.unit.type !== "employee") return;

        const pairIndex = unitInfo.unitIndex;
        const emp = pairToEmployee[pairIndex];

        // Confronta le vecchie variazioni con le nuove per capire se sono cambiate
        const oldVariations = employeeVariations[emp] || [];
        const newVariations = variationData.variations || [];

        // Flag per indicare se ci sono cambiamenti
        let hasChanges = false;

        // Controlla se il numero di variazioni è cambiato
        if (oldVariations.length !== newVariations.length) {
            hasChanges = true;
        } else {
            // Confronta ogni variazione
            for (let i = 0; i < newVariations.length; i++) {
                const newVar = newVariations[i];
                const oldVar = oldVariations[i];
                if (newVar.start !== oldVar.start ||
                    newVar.end !== oldVar.end ||
                    newVar.hours !== oldVar.hours) {
                    hasChanges = true;
                    break;
                }
            }
        }

        // Aggiorna lo stato delle variazioni
        setEmployeeVariations(prev => ({
            ...prev,
            [emp]: newVariations
        }));

        // Chiudi il popup
        setShowVariationPopup(false);

        // Procedi con l'aggiornamento solo se ci sono cambiamenti
        if (hasChanges) {
            // Prima aggiorna l'intestazione della colonna con le nuove ore
            updateEmployeeColumnHeader(pairIndex, emp, newVariations);

            // Poi aggiorna i valori delle celle per le assenze
            updateEmployeeDayValues(pairIndex, emp, newVariations);

            // Infine, forza il ricalcolo di tutti i totali
            recalculateAllTotals();
        }
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

        // Ricalcola i totali perché le particolarità possono influenzare il calcolo delle ore pagate
        recalculateAllTotals();
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
                            className={`btn-primary ${saving ? 'saving' : ''} ${savedSuccess ? 'saved' : ''}`}
                            onClick={saveTable}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Salvataggio...
                                </>
                            ) : savedSuccess ? (
                                <>
                                    <i className="fas fa-check"></i> Salvato!
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> Salva Tabella
                                </>
                            )}
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
                            dataSchema={buildDataSchema()}
                            colHeaders={false}
                            rowHeaders={false}
                            height="auto"
                            licenseKey="non-commercial-and-evaluation"
                            afterOnCellMouseDown={handleCellClick}
                            beforeOnCellDblClick={handleBeforeCellDblClick}
                            afterChange={handleAfterChange}
                            afterRender={() => setTimeout(updateHeaderListeners, 50)}
                            columns={buildColumnsFromUnits()}
                            mergeCells={buildMerges()}
                            manualColumnResize={true}
                            columnSorting={false}
                            disableVisualSelection={true}
                            manualColumnMove={true}
                            beforeColumnMove={handleBeforeColumnMove}
                            afterColumnMove={handleAfterColumnMove}
                            beforeOnCellMouseDown={handleBeforeOnCellMouseDown}
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
                            negozioId={negozioId}
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