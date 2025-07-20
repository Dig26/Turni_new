// src/components/negozi/TabellaCalcolo.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import {
  fetchTabellaCalcoloData,
  saveTabellaCalcoloData,
  updateCellValue
} from '../../app/slices/tabellaCalcoloSlice';
import TabellaCalcoloHelp from './TabellaCalcoloHelp';
import { exportTabellaCalcoloToExcel } from '../../utils/excelExportUtils';
import './TabellaCalcolo.css';

// Componente Modal per modificare i valori
const EditValueModal = ({ isOpen, onClose, value, onSave, label }) => {
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleSave = () => {
    onSave(inputValue);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h4>Modifica {label}</h4>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="edit-modal-body">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
            className="edit-modal-input"
            step="0.01"
          />
        </div>
        <div className="edit-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

const TabellaCalcolo = ({ negozioId }) => {
  const dispatch = useDispatch();

  // Stato locale
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Stato per il modal di editing
  const [editModal, setEditModal] = useState({
    isOpen: false,
    rowIndex: null,
    field: null,
    value: '',
    label: ''
  });

  // Selettori Redux
  const dipendenti = useSelector(state =>
    state.dipendenti && state.dipendenti.byNegozio
      ? state.dipendenti.byNegozio[negozioId] || []
      : []
  );

  const negozio = useSelector(state => state.negozi.currentNegozio);
  
  // Dati dalla tabella di calcolo nel Redux store
  const tableData = useSelector(state => 
    state.tabellaCalcolo?.data?.[negozioId]?.[selectedYear] || []
  );
  
  console.log('TabellaCalcolo - Stati:', {
    negozioId,
    selectedYear,
    dipendentiCount: dipendenti.length,
    tableDataLength: tableData.length
  });

  const mesi = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];

  // Funzioni di calcolo
  const calcolaAnniServizio = (dataAssunzione) => {
    if (!dataAssunzione) return 0;
    const assunzione = new Date(dataAssunzione);
    const dataRiferimento = new Date(selectedYear, 0, 1);
    const anni = dataRiferimento.getFullYear() - assunzione.getFullYear();
    const mese = dataRiferimento.getMonth() - assunzione.getMonth();

    if (mese < 0 || (mese === 0 && dataRiferimento.getDate() < assunzione.getDate())) {
      return Math.max(0, anni - 1);
    }
    return Math.max(0, anni);
  };

  const calcolaROL = (oreSettimanali, anniServizio) => {
    if (anniServizio < 2) return 0;
    if (anniServizio >= 2 && anniServizio < 4)
      return (0.15 * oreSettimanali) / 2;
    return 0.15 * oreSettimanali;
  };

  const calcolaExFestivita = (oreSettimanali) => {
    return (1 / 15) * oreSettimanali;
  };

  // Genera i dati iniziali della tabella
  const generateInitialTableData = useCallback(() => {
    const data = [];

    dipendenti.forEach((dipendente) => {
      const anniServizio = calcolaAnniServizio(dipendente.dataAssunzione);
      const oreSettimanaliBase = dipendente.oreSettimanali || 40;

      // Crea 6 righe per ogni dipendente
      for (let rigaNum = 1; rigaNum <= 6; rigaNum++) {
        const riga = {
          dipendenteId: dipendente.id,
          rigaTipo: rigaNum,
          cognomeNome: `${dipendente.cognome} ${dipendente.nome}`,
          contratto: `Contratto: ${oreSettimanaliBase} ore settimanali`,
          dataAssunzione: dipendente.dataAssunzione ? new Date(dipendente.dataAssunzione).toLocaleDateString('it-IT') : '',
          dataCessazione: dipendente.dataFineContratto ? new Date(dipendente.dataFineContratto).toLocaleDateString('it-IT') : '',
        };

        // Configura i dati specifici per ogni riga
        switch (rigaNum) {
          case 1: // Modifica contratto al mese
            riga.descrizioneRatio = 'Modifica contratto al mese';
            riga.tipoRatio = '';
            riga.residuoAnnoPrecedente = '';
            mesi.forEach(mese => {
              riga[mese] = oreSettimanaliBase;
            });
            riga.totaleAnnuo = '';
            riga.residuo = '';
            break;

          case 2: // ROL
            riga.descrizioneRatio = 'ROL';
            riga.tipoRatio = 'Ore';
            riga.residuoAnnoPrecedente = 0;
            let totaleROL = 0;
            mesi.forEach((mese) => {
              const oreSettimanaliMese = oreSettimanaliBase;
              const rol = calcolaROL(oreSettimanaliMese, anniServizio);
              riga[mese] = rol.toFixed(2);
              totaleROL += rol;
            });
            riga.totaleAnnuo = totaleROL.toFixed(2);
            riga.residuo = totaleROL.toFixed(2);
            break;

          case 3: // ROL goduti
            riga.descrizioneRatio = 'ROL goduti';
            riga.tipoRatio = 'Ore';
            riga.residuoAnnoPrecedente = '';
            mesi.forEach((mese) => {
              riga[mese] = '';
            });
            riga.totaleAnnuo = '';
            riga.residuo = '';
            break;

          case 4: // Ex festivita
            riga.descrizioneRatio = 'Ex festività';
            riga.tipoRatio = 'Ore';
            riga.residuoAnnoPrecedente = 0;
            let totaleExFest = 0;
            mesi.forEach((mese) => {
              const oreSettimanaliMese = oreSettimanaliBase;
              const exFest = calcolaExFestivita(oreSettimanaliMese);
              riga[mese] = exFest.toFixed(2);
              totaleExFest += exFest;
            });
            riga.totaleAnnuo = totaleExFest.toFixed(2);
            riga.residuo = totaleExFest.toFixed(2);
            break;

          case 5: // Ex festivita godute
            riga.descrizioneRatio = 'Ex festività godute';
            riga.tipoRatio = 'Ore';
            riga.residuoAnnoPrecedente = '';
            mesi.forEach((mese) => {
              riga[mese] = '';
            });
            riga.totaleAnnuo = '';
            riga.residuo = '';
            break;

          case 6: // Ferie
            riga.descrizioneRatio = 'Ferie';
            riga.tipoRatio = 'Giorni';
            riga.residuoAnnoPrecedente = 0;
            mesi.forEach((mese) => {
              riga[mese] = '';
            });
            riga.totaleAnnuo = 26;
            riga.residuo = 26;
            break;
        }

        data.push(riga);
      }
    });

    return data;
  }, [dipendenti, selectedYear]);

  // Ricalcola i valori quando cambiano le ore o i valori goduti
  const recalculateValues = useCallback((data) => {
    const newData = [...data];
    const dipendentiGroups = {};

    // Raggruppa le righe per dipendente
    newData.forEach((row, index) => {
      if (!dipendentiGroups[row.dipendenteId]) {
        dipendentiGroups[row.dipendenteId] = {};
      }
      dipendentiGroups[row.dipendenteId][row.rigaTipo] = index;
    });

    // Per ogni dipendente, ricalcola i valori
    Object.entries(dipendentiGroups).forEach(([dipendenteId, righe]) => {
      const dipendente = dipendenti.find(d => d.id === parseInt(dipendenteId));
      if (!dipendente) return;

      const anniServizio = calcolaAnniServizio(dipendente.dataAssunzione);

      // Righe del dipendente
      const rigaContratto = newData[righe[1]];
      const rigaROL = newData[righe[2]];
      const rigaROLGoduti = newData[righe[3]];
      const rigaExFest = newData[righe[4]];
      const rigaExFestGodute = newData[righe[5]];
      const rigaFerie = newData[righe[6]];

      // Ricalcola ROL in base alle ore settimanali modificate
      let totaleROL = 0;
      mesi.forEach((mese) => {
        const oreSettimanaliMese = parseFloat(rigaContratto[mese]) || 0;
        const rol = calcolaROL(oreSettimanaliMese, anniServizio);
        rigaROL[mese] = rol.toFixed(2);
        totaleROL += rol;
      });
      rigaROL.totaleAnnuo = totaleROL.toFixed(2);

      // Calcola ROL goduti
      let totaleROLGoduti = 0;
      mesi.forEach((mese) => {
        const valore = parseFloat(rigaROLGoduti[mese]) || 0;
        totaleROLGoduti += valore;
      });
      rigaROLGoduti.totaleAnnuo = totaleROLGoduti.toFixed(2);

      // Calcola residuo ROL
      const residuoPrecROL = parseFloat(rigaROL.residuoAnnoPrecedente) || 0;
      rigaROL.residuo = (totaleROL + residuoPrecROL - totaleROLGoduti).toFixed(2);

      // Ricalcola Ex festivita
      let totaleExFest = 0;
      mesi.forEach((mese) => {
        const oreSettimanaliMese = parseFloat(rigaContratto[mese]) || 0;
        const exFest = calcolaExFestivita(oreSettimanaliMese);
        rigaExFest[mese] = exFest.toFixed(2);
        totaleExFest += exFest;
      });
      rigaExFest.totaleAnnuo = totaleExFest.toFixed(2);

      // Calcola Ex festivita godute
      let totaleExFestGodute = 0;
      mesi.forEach((mese) => {
        const valore = parseFloat(rigaExFestGodute[mese]) || 0;
        totaleExFestGodute += valore;
      });
      rigaExFestGodute.totaleAnnuo = totaleExFestGodute.toFixed(2);

      // Calcola residuo Ex festivita
      const residuoPrecExFest = parseFloat(rigaExFest.residuoAnnoPrecedente) || 0;
      rigaExFest.residuo = (totaleExFest + residuoPrecExFest - totaleExFestGodute).toFixed(2);

      // Calcola ferie godute
      let totaleFerieGodute = 0;
      mesi.forEach((mese) => {
        const valore = parseFloat(rigaFerie[mese]) || 0;
        totaleFerieGodute += valore;
      });
      rigaFerie.totaleAnnuo = totaleFerieGodute.toFixed(0);

      // Calcola residuo ferie
      const residuoPrecFerie = parseFloat(rigaFerie.residuoAnnoPrecedente) || 0;
      const ferieAnnuali = 26;
      rigaFerie.residuo = (ferieAnnuali + residuoPrecFerie - totaleFerieGodute).toFixed(0);
    });

    return newData;
  }, [dipendenti]);

  // Carica i dati dal database al mount o cambio anno
  useEffect(() => {
    const loadData = async () => {
      console.log('loadData chiamata:', { negozioId, dipendentiLength: dipendenti.length, selectedYear });
      
      if (!negozioId) {
        setIsLoading(false);
        return;
      }
      
      // Se non ci sono dipendenti, aspetta che vengano caricati
      if (dipendenti.length === 0) {
        console.log('Nessun dipendente trovato, aspetto...');
        setIsLoading(true);
        return;
      }

      setIsLoading(true);
      try {
        // Prova a caricare i dati dal database
        const result = await dispatch(fetchTabellaCalcoloData({ negozioId, anno: selectedYear })).unwrap();
        
        // Se non ci sono dati, genera e salva quelli iniziali
        if (!result.data || result.data.length === 0) {
          console.log('Nessun dato trovato, generazione dati iniziali...');
          const initialData = generateInitialTableData();
          console.log('Dati iniziali generati:', initialData.length, 'righe');
          
          const recalculatedData = recalculateValues(initialData);
          console.log('Dati ricalcolati:', recalculatedData.length, 'righe');
          
          // Salva i dati iniziali nel database
          await dispatch(saveTabellaCalcoloData({
            negozioId,
            anno: selectedYear,
            data: recalculatedData
          })).unwrap();
          
          console.log('Dati salvati nel database');
          
          // Ricarica i dati per assicurarsi che siano nello stato
          await dispatch(fetchTabellaCalcoloData({ negozioId, anno: selectedYear })).unwrap();
        }
      } catch (error) {
        console.log('Errore caricamento, generazione dati iniziali...', error);
        // Se c'e un errore, genera i dati iniziali
        const initialData = generateInitialTableData();
        const recalculatedData = recalculateValues(initialData);
        
        // Salva i dati iniziali
        await dispatch(saveTabellaCalcoloData({
          negozioId,
          anno: selectedYear,
          data: recalculatedData
        })).unwrap();
        
        // Ricarica i dati per assicurarsi che siano nello stato
        await dispatch(fetchTabellaCalcoloData({ negozioId, anno: selectedYear })).unwrap();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dispatch, negozioId, selectedYear, dipendenti.length, generateInitialTableData, recalculateValues]);

  // Gestisce l'apertura del modal per modificare un valore
  const handleCellClick = (rowIndex, field) => {
    const rowData = tableData[rowIndex];
    if (!rowData || !isCellEditable(rowIndex, field)) return;

    let label = '';
    if (field === 'residuoAnnoPrecedente') {
      label = `Residuo Anno Precedente - ${rowData.descrizioneRatio}`;
    } else if (mesi.includes(field)) {
      if (rowData.rigaTipo === 1) {
        label = `Ore settimanali - ${field}`;
      } else {
        label = `${rowData.descrizioneRatio} - ${field}`;
      }
    }

    setEditModal({
      isOpen: true,
      rowIndex,
      field,
      value: rowData[field],
      label
    });
  };

  // Gestisce il salvataggio del valore modificato
  const handleValueSave = async (value) => {
    if (editModal.rowIndex === null || !editModal.field) return;

    setIsSaving(true);
    try {
      // Aggiorna il valore nella cella
      await dispatch(updateCellValue({
        negozioId,
        anno: selectedYear,
        rowIndex: editModal.rowIndex,
        columnName: editModal.field,
        value
      })).unwrap();

      // Ricalcola tutti i valori
      const updatedData = [...tableData];
      updatedData[editModal.rowIndex][editModal.field] = value;
      const recalculatedData = recalculateValues(updatedData);

      // Salva tutti i dati ricalcolati nel database
      await dispatch(saveTabellaCalcoloData({
        negozioId,
        anno: selectedYear,
        data: recalculatedData
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Valore aggiornato e salvato',
        duration: 2000
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nel salvataggio: ' + error.message,
        duration: 5000
      }));
    } finally {
      setIsSaving(false);
    }
  };

  // Esporta in Excel
  const handleExport = () => {
    try {
      const metadata = {
        negozioNome: negozio?.nome || 'Negozio',
        negozioId: negozioId,
        anno: selectedYear
      };

      exportTabellaCalcoloToExcel(tableData, metadata);

      dispatch(addNotification({
        type: 'success',
        message: 'Tabella esportata con successo',
        duration: 3000
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore durante l\'export: ' + error.message,
        duration: 5000
      }));
    }
  };

  // Gestione cambio anno
  const handleYearChange = async (e) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
  };

  // Determina se una cella e editabile
  const isCellEditable = (row, field) => {
    const rowData = tableData[row];
    if (!rowData) return false;

    // residuoAnnoPrecedente e editabile solo per righe 2, 4, 6
    if (field === 'residuoAnnoPrecedente') {
      return [2, 4, 6].includes(rowData.rigaTipo);
    }

    // I mesi sono editabili solo per righe 1, 3, 5, 6
    if (mesi.includes(field)) {
      return [1, 3, 5, 6].includes(rowData.rigaTipo);
    }

    return false;
  };

  // Determina la classe CSS per la riga
  const getRowClass = (rigaTipo) => {
    switch (rigaTipo) {
      case 1: return 'riga-contratto';
      case 2:
      case 3: return 'riga-rol';
      case 4:
      case 5: return 'riga-exfest';
      case 6: return 'riga-ferie';
      default: return '';
    }
  };

  // Render delle celle con supporto per rowspan
  const renderTableBody = () => {
    console.log('Rendering table body, tableData length:', tableData.length);
    
    if (!tableData || tableData.length === 0) {
      return (
        <tr>
          <td colSpan="20" style={{ textAlign: 'center', padding: '20px' }}>
            Nessun dato disponibile. Generazione in corso...
          </td>
        </tr>
      );
    }
    
    const rows = [];
    let currentDipendente = null;
    let rowspanCount = 0;

    tableData.forEach((row, rowIndex) => {
      const cells = [];

      // Se cambia dipendente, aggiungi le celle con rowspan
      if (row.dipendenteId !== currentDipendente) {
        currentDipendente = row.dipendenteId;
        rowspanCount = 6;

        cells.push(
          <td key="nome" rowSpan={6} className="merged-cell">
            {row.cognomeNome}
          </td>,
          <td key="assunzione" rowSpan={6} className="merged-cell">
            {row.dataAssunzione}
          </td>,
          <td key="cessazione" rowSpan={6} className="merged-cell">
            {row.dataCessazione}
          </td>
        );
      }

      // Riga 1: unisci le prime 3 colonne di descrizione
      if (row.rigaTipo === 1) {
        cells.push(
          <td key="desc" colSpan={3} className="merged-cell-horizontal">
            {row.descrizioneRatio}
          </td>
        );
      } else {
        cells.push(
          <td key="desc">{row.descrizioneRatio}</td>,
          <td key="tipo" className="text-center">{row.tipoRatio}</td>,
          <td
            key="residuo"
            className={`text-center ${isCellEditable(rowIndex, 'residuoAnnoPrecedente') ? 'editable-cell' : ''}`}
            onClick={() => handleCellClick(rowIndex, 'residuoAnnoPrecedente')}
          >
            {row.residuoAnnoPrecedente}
          </td>
        );
      }

      // Mesi
      mesi.forEach(mese => {
        cells.push(
          <td
            key={mese}
            className={`text-center ${isCellEditable(rowIndex, mese) ? 'editable-cell' : ''}`}
            onClick={() => handleCellClick(rowIndex, mese)}
          >
            {row[mese]}
          </td>
        );
      });

      // Totali
      cells.push(
        <td key="totale" className="text-center total-column">{row.totaleAnnuo}</td>,
        <td key="residuo-finale" className="text-center residuo-column">{row.residuo}</td>
      );

      rows.push(
        <tr key={rowIndex} className={getRowClass(row.rigaTipo)}>
          {cells}
        </tr>
      );
    });

    return rows;
  };

  // Render
  if (isLoading) {
    return (
      <div className="loading-spinner">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento tabella di calcolo...</span>
      </div>
    );
  }

  if (dipendenti.length === 0) {
    return (
      <div className="empty-state">
        <i className="fas fa-exclamation-circle"></i>
        <p>Nessun dipendente trovato per questo negozio.</p>
        <p>Aggiungi dipendenti per visualizzare la tabella di calcolo.</p>
      </div>
    );
  }

  return (
    <div className="tabella-calcolo-container">
      <div className="tabella-header">
        <h3>
          <i className="fas fa-calculator"></i> Tabella di Calcolo {selectedYear}
        </h3>
        <div className="tabella-actions">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="year-selector"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-secondary">
            <i className="fas fa-file-excel"></i> Esporta
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="btn-help"
            title="Guida"
          >
            <i className="fas fa-question-circle"></i>
          </button>
        </div>
      </div>

      <div className="tabella-content-wrapper">
        <div className="tabella-content">
          <table className="tabella-calcolo-table">
            <thead>
              <tr>
                <th>Cognome e Nome</th>
                <th>Data Assunzione</th>
                <th>Data Cessazione</th>
                <th>Descrizione Ratio</th>
                <th>Tipo Ratio</th>
                <th>Residuo Anno Precedente</th>
                {mesi.map(mese => (
                  <th key={mese}>{mese}</th>
                ))}
                <th>Totale Annuo</th>
                <th>Residuo</th>
              </tr>
            </thead>
            <tbody>
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tabella-info">
        <div className="info-section">
          <h4>Note importanti:</h4>
          <ul>
            <li>Clicca sulle celle evidenziate per modificare i valori</li>
            <li>I valori in <strong>Residuo Anno Precedente</strong> sono modificabili per ROL, Ex festività e Ferie</li>
            <li>Le ore settimanali nella prima riga possono essere modificate per riflettere variazioni contrattuali</li>
            <li>I giorni di ferie annuali sono sempre 26 per tutti i dipendenti</li>
            <li>Le modifiche vengono salvate automaticamente nel database</li>
          </ul>
        </div>
      </div>

      <EditValueModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ ...editModal, isOpen: false })}
        value={editModal.value}
        onSave={handleValueSave}
        label={editModal.label}
      />

      <TabellaCalcoloHelp
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {isSaving && (
        <div className="saving-indicator">
          <i className="fas fa-spinner fa-spin"></i> Salvataggio in corso...
        </div>
      )}
    </div>
  );
};

export default TabellaCalcolo;