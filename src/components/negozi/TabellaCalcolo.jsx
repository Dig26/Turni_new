// src/components/negozi/TabellaCalcolo.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import TabellaCalcoloStats from './TabellaCalcoloStats';
import ImportExcelModal from './ImportExcelModal';
import TabellaCalcoloHelp from './TabellaCalcoloHelp';
import { exportTabellaCalcoloToExcel } from '../../utils/excelExportUtils';
import './TabellaCalcolo.css';

const TabellaCalcolo = ({ negozioId }) => {
  const dispatch = useDispatch();
  
  // Stato locale
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  const calcolaROL = (oreMese, anniServizio) => {
    if (anniServizio < 2) return 0;
    if (anniServizio >= 2 && anniServizio < 4) return (0.15 * oreMese) / 2;
    return 0.15 * oreMese;
  };
  
  const calcolaExFestivita = (oreMese) => {
    return 0.06675 * oreMese;
  };
  
  // Genera i dati della tabella
  const generateTableData = useCallback(() => {
    const data = [];
    
    dipendenti.forEach((dipendente) => {
      const anniServizio = calcolaAnniServizio(dipendente.dataAssunzione);
      const oreSettimanali = dipendente.oreSettimanali || 40;
      const oreMese = calcolaOreMese(oreSettimanali);
      
      // Crea 6 righe per ogni dipendente
      for (let rigaNum = 1; rigaNum <= 6; rigaNum++) {
        const riga = {
          dipendenteId: dipendente.id,
          rigaTipo: rigaNum,
          cognomeNome: `${dipendente.cognome} ${dipendente.nome}`,
          contratto: `Contratto: ${oreSettimanali} ore settimanali`,
          dataAssunzione: dipendente.dataAssunzione ? new Date(dipendente.dataAssunzione).toLocaleDateString('it-IT') : '',
          dataCessazione: dipendente.dataFineContratto ? new Date(dipendente.dataFineContratto).toLocaleDateString('it-IT') : '',
        };
        
        // Configura i dati specifici per ogni riga
        switch (rigaNum) {
          case 1: // Modifica contratto al mese
            riga.descrizioneRatio = 'Modifica contratto al mese';
            riga.tipoRatio = '';
            riga.residuoCol1 = '';
            riga.residuoCol2 = '';
            mesi.forEach(mese => {
              riga[mese] = oreSettimanali;
            });
            riga.totaleAnnuo = '';
            riga.residuo = '';
            break;
            
          case 2: // ROL
            riga.descrizioneRatio = 'ROL';
            riga.tipoRatio = 'Ore';
            riga.residuoCol1 = '';
            riga.residuoCol2 = 0;
            let totaleROL = 0;
            mesi.forEach((mese) => {
              const rol = calcolaROL(oreMese, anniServizio);
              riga[mese] = rol.toFixed(2);
              totaleROL += rol;
            });
            riga.totaleAnnuo = totaleROL.toFixed(2);
            riga.residuo = totaleROL.toFixed(2);
            break;
            
          case 3: // ROL goduti
            riga.descrizioneRatio = '';
            riga.tipoRatio = 'Ore';
            riga.residuoCol1 = 'ROL goduti';
            riga.residuoCol2 = '';
            mesi.forEach((mese) => {
              riga[mese] = '';
            });
            riga.totaleAnnuo = '';
            riga.residuo = '';
            break;
            
          case 4: // Ex festività
            riga.descrizioneRatio = 'Ex festività';
            riga.tipoRatio = 'Ore';
            riga.residuoCol1 = '';
            riga.residuoCol2 = 0;
            let totaleExFest = 0;
            mesi.forEach((mese) => {
              const exFest = calcolaExFestivita(oreMese);
              riga[mese] = exFest.toFixed(2);
              totaleExFest += exFest;
            });
            riga.totaleAnnuo = totaleExFest.toFixed(2);
            riga.residuo = totaleExFest.toFixed(2);
            break;
            
          case 5: // Ex festività godute
            riga.descrizioneRatio = '';
            riga.tipoRatio = 'Ore';
            riga.residuoCol1 = 'Ex festività godute';
            riga.residuoCol2 = '';
            mesi.forEach((mese) => {
              riga[mese] = '';
            });
            riga.totaleAnnuo = '';
            riga.residuo = '';
            break;
            
          case 6: // Ferie
            riga.descrizioneRatio = 'Ferie';
            riga.tipoRatio = 'Giorni';
            riga.residuoCol1 = '';
            riga.residuoCol2 = 0;
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
  
  // Gestisce i cambiamenti nei valori
  const handleCellChange = (rowIndex, field, value) => {
    const newData = [...tableData];
    newData[rowIndex][field] = value;
    setTableData(newData);
    setHasUnsavedChanges(true);
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
    
    // residuoCol2 è editabile solo per righe 2, 4, 6
    if (field === 'residuoCol2') {
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
      
      <div className="tabella-warning">
        <i className="fas fa-info-circle"></i>
        <span>Nota: La versione con Handsontable è temporaneamente disabilitata. Usa questa versione semplificata.</span>
      </div>
      
      <div className="tabella-content">
        <div className="table-responsive">
          <table className="tabella-calcolo-table">
            <thead>
              <tr>
                <th>Cognome e Nome</th>
                <th>Data Assunzione</th>
                <th>Data Cessazione</th>
                <th>Descrizione Ratio</th>
                <th>Tipo Ratio</th>
                <th>Residuo Anno Prec. 1</th>
                <th>Residuo Anno Prec. 2</th>
                {mesi.map(mese => (
                  <th key={mese}>{mese}</th>
                ))}
                <th>Totale Annuo</th>
                <th>Residuo</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex} className={getRowClass(row.rigaTipo)}>
                  <td className="fixed-column">{row.cognomeNome}</td>
                  <td className="fixed-column">{row.dataAssunzione}</td>
                  <td className="fixed-column">{row.dataCessazione}</td>
                  <td>{row.descrizioneRatio}</td>
                  <td className="text-center">{row.tipoRatio}</td>
                  <td>{row.residuoCol1}</td>
                  <td className="text-center">
                    {isCellEditable(rowIndex, 'residuoCol2') ? (
                      <input
                        type="number"
                        value={row.residuoCol2}
                        onChange={(e) => handleCellChange(rowIndex, 'residuoCol2', e.target.value)}
                        className="cell-input"
                      />
                    ) : (
                      row.residuoCol2
                    )}
                  </td>
                  {mesi.map(mese => (
                    <td key={mese} className="text-center">
                      {isCellEditable(rowIndex, mese) ? (
                        <input
                          type="number"
                          value={row[mese]}
                          onChange={(e) => handleCellChange(rowIndex, mese, e.target.value)}
                          className="cell-input"
                        />
                      ) : (
                        row[mese]
                      )}
                    </td>
                  ))}
                  <td className="text-center total-column">{row.totaleAnnuo}</td>
                  <td className="text-center residuo-column">{row.residuo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <TabellaCalcoloStats tableData={tableData} anno={selectedYear} />
      
      <div className="tabella-info">
        <div className="info-section">
          <h4>Note importanti:</h4>
          <ul>
            <li>I valori in <strong>Residuo Anno Prec. 2</strong> sono modificabili per ROL, Ex festività e Ferie</li>
            <li>Le ore settimanali nella prima riga possono essere modificate per riflettere variazioni contrattuali</li>
            <li>I giorni di ferie annuali sono sempre 26 per tutti i dipendenti</li>
          </ul>
        </div>
      </div>
      
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

export default TabellaCalcolo;