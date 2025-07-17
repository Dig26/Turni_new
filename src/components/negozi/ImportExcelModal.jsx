// src/components/negozi/ImportExcelModal.jsx
import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import * as XLSX from 'xlsx';
import { addNotification } from '../../app/slices/uiSlice';
import './ImportExcelModal.css';

const ImportExcelModal = ({ isOpen, onClose, onImport, anno }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Verifica tipo file
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      dispatch(addNotification({
        type: 'error',
        message: 'Seleziona un file Excel valido (.xlsx o .xls)',
        duration: 5000
      }));
      return;
    }
    
    setFile(selectedFile);
    setErrors([]);
    processFile(selectedFile);
  };
  
  const processFile = async (file) => {
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Verifica che esista il foglio principale
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Il file Excel è vuoto');
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Valida e processa i dati
      const { validatedData, validationErrors } = validateImportData(jsonData);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setPreview(null);
      } else {
        setPreview(validatedData);
        setErrors([]);
      }
    } catch (error) {
      console.error('Errore nel processamento del file:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nel leggere il file: ' + error.message,
        duration: 5000
      }));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };
  
  const validateImportData = (data) => {
    const validationErrors = [];
    const validatedData = {
      dipendenti: [],
      variazioniOrarie: [],
      residuiAnnoPrecedente: []
    };
    
    // Salta la prima riga (header)
    if (data.length < 2) {
      validationErrors.push('Il file deve contenere almeno una riga di dati oltre all\'header');
      return { validatedData, validationErrors };
    }
    
    // Mappa dei dipendenti già processati
    const dipendentiProcessati = new Set();
    
    // Processa ogni gruppo di 6 righe (1 dipendente)
    for (let i = 1; i < data.length; i += 6) {
      if (i + 5 >= data.length) {
        validationErrors.push(`Dati incompleti per il dipendente alla riga ${i + 1}`);
        continue;
      }
      
      // Estrai dati del dipendente dalla prima riga del gruppo
      const primaRiga = data[i];
      const cognomeNome = primaRiga[0];
      
      if (!cognomeNome) {
        validationErrors.push(`Nome dipendente mancante alla riga ${i + 1}`);
        continue;
      }
      
      // Evita duplicati
      if (dipendentiProcessati.has(cognomeNome)) {
        validationErrors.push(`Dipendente duplicato: ${cognomeNome}`);
        continue;
      }
      
      dipendentiProcessati.add(cognomeNome);
      
      // Estrai dati dalle 6 righe
      const dipendente = {
        cognomeNome,
        dataAssunzione: primaRiga[1],
        dataCessazione: primaRiga[2],
        oreSettimanali: [],
        residuoROL: 0,
        residuoExFest: 0,
        residuoFerie: 0,
        rolGoduti: {},
        exFestGodute: {},
        ferieGodute: {}
      };
      
      // Riga 1: Ore settimanali per mese
      const rigaOre = data[i];
      for (let mese = 0; mese < 12; mese++) {
        const ore = parseFloat(rigaOre[7 + mese]) || 40;
        dipendente.oreSettimanali.push(ore);
      }
      
      // Riga 2: ROL
      const rigaROL = data[i + 1];
      dipendente.residuoROL = parseFloat(rigaROL[6]) || 0;
      
      // Riga 3: ROL goduti
      const rigaROLGoduti = data[i + 2];
      for (let mese = 0; mese < 12; mese++) {
        const valore = parseFloat(rigaROLGoduti[7 + mese]) || 0;
        if (valore > 0) {
          dipendente.rolGoduti[mese + 1] = valore;
        }
      }
      
      // Riga 4: Ex festività
      const rigaExFest = data[i + 3];
      dipendente.residuoExFest = parseFloat(rigaExFest[6]) || 0;
      
      // Riga 5: Ex festività godute
      const rigaExFestGodute = data[i + 4];
      for (let mese = 0; mese < 12; mese++) {
        const valore = parseFloat(rigaExFestGodute[7 + mese]) || 0;
        if (valore > 0) {
          dipendente.exFestGodute[mese + 1] = valore;
        }
      }
      
      // Riga 6: Ferie
      const rigaFerie = data[i + 5];
      dipendente.residuoFerie = parseFloat(rigaFerie[6]) || 0;
      for (let mese = 0; mese < 12; mese++) {
        const valore = parseFloat(rigaFerie[7 + mese]) || 0;
        if (valore > 0) {
          dipendente.ferieGodute[mese + 1] = valore;
        }
      }
      
      validatedData.dipendenti.push(dipendente);
      
      // Rileva variazioni orarie
      const oreBase = dipendente.oreSettimanali[0];
      let variazioneCorrente = null;
      
      for (let mese = 0; mese < 12; mese++) {
        const ore = dipendente.oreSettimanali[mese];
        
        if (ore !== oreBase) {
          if (!variazioneCorrente || variazioneCorrente.oreSettimanali !== ore) {
            if (variazioneCorrente) {
              variazioneCorrente.meseFine = mese;
              validatedData.variazioniOrarie.push(variazioneCorrente);
            }
            
            variazioneCorrente = {
              cognomeNome,
              meseInizio: mese + 1,
              meseFine: mese + 1,
              oreSettimanali: ore
            };
          } else {
            variazioneCorrente.meseFine = mese + 1;
          }
        } else if (variazioneCorrente) {
          validatedData.variazioniOrarie.push(variazioneCorrente);
          variazioneCorrente = null;
        }
      }
      
      if (variazioneCorrente) {
        validatedData.variazioniOrarie.push(variazioneCorrente);
      }
      
      // Residui anno precedente
      if (dipendente.residuoROL > 0 || dipendente.residuoExFest > 0 || dipendente.residuoFerie > 0) {
        validatedData.residuiAnnoPrecedente.push({
          cognomeNome,
          residuoROL: dipendente.residuoROL,
          residuoExFest: dipendente.residuoExFest,
          residuoFerie: dipendente.residuoFerie
        });
      }
    }
    
    return { validatedData, validationErrors };
  };
  
  const handleImport = async () => {
    if (!preview) return;
    
    setLoading(true);
    try {
      await onImport(preview);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Dati importati con successo',
        duration: 3000
      }));
      
      handleClose();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore durante l\'importazione: ' + error.message,
        duration: 5000
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content import-excel-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-file-import"></i> Importa da Excel
          </h3>
          <button className="close-button" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="import-instructions">
            <h4>Istruzioni per l'importazione:</h4>
            <ul>
              <li>Il file Excel deve seguire il formato standard della tabella di calcolo</li>
              <li>Ogni dipendente deve occupare esattamente 6 righe</li>
              <li>I dati devono essere relativi all'anno {anno}</li>
              <li>I valori numerici devono usare il punto come separatore decimale</li>
            </ul>
          </div>
          
          <div className="file-upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <button
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <i className="fas fa-upload"></i>
              {file ? 'Cambia file' : 'Seleziona file Excel'}
            </button>
            
            {file && (
              <div className="file-info">
                <i className="fas fa-file-excel"></i>
                <span>{file.name}</span>
                <span className="file-size">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>
          
          {loading && (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Elaborazione file...</span>
            </div>
          )}
          
          {errors.length > 0 && (
            <div className="import-errors">
              <h4><i className="fas fa-exclamation-triangle"></i> Errori rilevati:</h4>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {preview && (
            <div className="import-preview">
              <h4><i className="fas fa-check-circle"></i> Anteprima importazione:</h4>
              <div className="preview-stats">
                <div className="stat">
                  <span className="stat-label">Dipendenti:</span>
                  <span className="stat-value">{preview.dipendenti.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Variazioni orarie:</span>
                  <span className="stat-value">{preview.variazioniOrarie.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Residui importati:</span>
                  <span className="stat-value">{preview.residuiAnnoPrecedente.length}</span>
                </div>
              </div>
              
              <div className="preview-details">
                <h5>Dipendenti da importare:</h5>
                <ul className="dipendenti-list">
                  {preview.dipendenti.slice(0, 5).map((dip, index) => (
                    <li key={index}>{dip.cognomeNome}</li>
                  ))}
                  {preview.dipendenti.length > 5 && (
                    <li>...e altri {preview.dipendenti.length - 5} dipendenti</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>
            Annulla
          </button>
          <button
            className="btn-primary"
            onClick={handleImport}
            disabled={!preview || loading}
          >
            <i className="fas fa-file-import"></i> Importa dati
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExcelModal;