// src/components/negozi/TabellaCalcolo.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import TabellaCalcoloStats from './TabellaCalcoloStats';
import ImportExcelModal from './ImportExcelModal';
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const calcolaOreMese = (oreSettimanali) => {
    return Math.round((oreSettimanali * 52) / 12);
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

  // Genera i dati della tabella
  // Genera i dati della tabella
  const generateTableData = useCallback(() => {
    const data = [];

    dipendenti.forEach((dipendente) => {
      const anniServizio = calcolaAnniServizio(dipendente.dataAssunzione);

      // ✅ USA LE ORE DEL DIPENDENTE, NON 40 DI DEFAULT
      const oreSettimanaliBase = dipendente.oreSettimanali; // RIMUOVE || 40

      if (!oreSettimanaliBase) {
        console.warn(`Dipendente ${dipendente.nome} ${dipendente.cognome} non ha ore settimanali definite`);
        return; // Salta questo dipendente se non ha ore definite
      }

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
            // ✅ INIZIALIZZA CON LE ORE DEL DIPENDENTE
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
              // ✅ LEGGE LE ORE SETTIMANALI DALLA RIGA CONTRATTO (non ancora creata, usa base)
              // Questo sarà aggiornato quando l'utente modifica le celle
              const oreSettimanaliMese = oreSettimanaliBase;

              // ✅ CALCOLO CORRETTO: DIRETTAMENTE SU ORE SETTIMANALI
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

          case 4: // Ex festività
            riga.descrizioneRatio = 'Ex festività';
            riga.tipoRatio = 'Ore';
            riga.residuoAnnoPrecedente = 0;
            let totaleExFest = 0;
            mesi.forEach((mese) => {
              // ✅ LEGGE LE ORE SETTIMANALI DALLA RIGA CONTRATTO
              const oreSettimanaliMese = oreSettimanaliBase;

              // ✅ CALCOLO CORRETTO: DIRETTAMENTE SU ORE SETTIMANALI
              const exFest = calcolaExFestivita(oreSettimanaliMese);
              riga[mese] = exFest.toFixed(2);
              totaleExFest += exFest;
            });
            riga.totaleAnnuo = totaleExFest.toFixed(2);
            riga.residuo = totaleExFest.toFixed(2);
            break;

          case 5: // Ex festività godute
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

  // Inizializza i dati
  useEffect(() => {
    if (dipendenti.length > 0) {
      const newData = generateTableData();
      setTableData(newData);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [dipendenti, generateTableData]);

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
  const handleValueSave = (value) => {
    if (editModal.rowIndex !== null && editModal.field) {
      const newData = [...tableData];
      newData[editModal.rowIndex][editModal.field] = value;
      setTableData(newData);
      setHasUnsavedChanges(true);
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

  // Salva i dati
  const handleSave = () => {
    dispatch(addNotification({
      type: 'success',
      message: 'Dati salvati con successo',
      duration: 3000
    }));
    setHasUnsavedChanges(false);
  };

  // Gestione cambio anno
  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);

    if (hasUnsavedChanges) {
      if (!window.confirm('Hai modifiche non salvate. Vuoi continuare?')) {
        return;
      }
    }

    setSelectedYear(newYear);
    setHasUnsavedChanges(false);
  };

  // Gestione import
  const handleImportData = (importedData) => {
    setShowImportModal(false);
    dispatch(addNotification({
      type: 'info',
      message: 'Funzionalità di import in fase di implementazione',
      duration: 3000
    }));
  };

  // Determina se una cella è editabile
  const isCellEditable = (row, field) => {
    const rowData = tableData[row];
    if (!rowData) return false;

    // residuoAnnoPrecedente è editabile solo per righe 2, 4, 6
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
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary"
          >
            <i className="fas fa-file-import"></i> Importa
          </button>
          <button onClick={handleExport} className="btn-secondary">
            <i className="fas fa-file-excel"></i> Esporta
          </button>
          <button onClick={handleSave} className="btn-primary">
            <i className="fas fa-save"></i> Salva
            {hasUnsavedChanges && ' *'}
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

      <TabellaCalcoloStats tableData={tableData} anno={selectedYear} />

      <div className="tabella-info">
        <div className="info-section">
          <h4>Note importanti:</h4>
          <ul>
            <li>Clicca sulle celle evidenziate per modificare i valori</li>
            <li>I valori in <strong>Residuo Anno Precedente</strong> sono modificabili per ROL, Ex festività e Ferie</li>
            <li>Le ore settimanali nella prima riga possono essere modificate per riflettere variazioni contrattuali</li>
            <li>I giorni di ferie annuali sono sempre 26 per tutti i dipendenti</li>
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

      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportData}
        anno={selectedYear}
      />

      <TabellaCalcoloHelp
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};

// CSS aggiornato da includere in TabellaCalcolo.css
const cssUpdates = `
/* TEMA CHIARO - Rimuovere tutti gli sfondi scuri */
.tabella-calcolo-container {
  width: 100%;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Rimuovi scroll e fai in modo che la tabella sia sempre visibile */
.tabella-content {
  margin-bottom: 20px;
  width: 100%;
  overflow: visible;
}

.tabella-calcolo-table {
  width: 100%;
  min-width: max-content;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
}

.tabella-calcolo-table th {
  background-color: #f5f5f5;
  color: #333;
  font-weight: 600;
  text-align: center;
  padding: 12px 8px;
  border: 1px solid #e0e0e0;
}

.tabella-calcolo-table td {
  padding: 8px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #333;
}

/* Celle unite */
.merged-cell {
  vertical-align: middle;
  text-align: center;
  background-color: #f8f9fa;
  font-weight: 500;
}

.merged-cell-horizontal {
  text-align: center;
  background-color: #e3f2fd;
  font-weight: 600;
}

/* Celle editabili - evidenziate con hover */
.editable-cell {
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
}

.editable-cell:hover {
  background-color: #e3f2fd;
}

.editable-cell::after {
  content: '✏️';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.editable-cell:hover::after {
  opacity: 0.7;
}

/* Colori chiari per le righe */
.riga-contratto {
  background-color: #f0f8ff;
}

.riga-rol {
  background-color: #f5f0ff;
}

.riga-exfest {
  background-color: #f0fff4;
}

.riga-ferie {
  background-color: #fffef0;
}

/* Modal per edit */
.edit-modal {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90%;
  animation: slideIn 0.3s ease-out;
}

.edit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.edit-modal-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.edit-modal-body {
  padding: 30px 20px;
}

.edit-modal-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px;
  text-align: center;
  transition: border-color 0.2s;
}

.edit-modal-input:focus {
  outline: none;
  border-color: #3498db;
}

.edit-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

/* Rimuovi warning temporaneo */
.tabella-warning {
  display: none;
}

/* Assicurati che non ci siano sfondi scuri */
.modal-overlay {
  background-color: rgba(0, 0, 0, 0.5);
}

.year-selector {
  background-color: #ffffff;
  color: #333;
}

.btn-primary, .btn-secondary, .btn-help {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #95a5a6;
}

.btn-help {
  background-color: transparent;
  color: #3498db;
}

/* Colonne totali */
.total-column {
  background-color: #e8f5e9;
  font-weight: 600;
}

.residuo-column {
  background-color: #fff3e0;
  font-weight: 600;
}
`;

export default TabellaCalcolo;