// src/components/turni/popups/CellPopup.jsx
import React, { useState, useEffect } from 'react';
import '../../../styles/Modal.css';

const CellPopup = ({ onClose, onSave, allTimes, selectedCell, hotInstance }) => {
  const [mode, setMode] = useState('lavora');
  const [orarioInizio, setOrarioInizio] = useState('');
  const [orarioFine, setOrarioFine] = useState('');
  const [motivo, setMotivo] = useState('nessuna');
  const [abbr, setAbbr] = useState('');
  
  useEffect(() => {
    if (selectedCell && hotInstance) {
      // Leggi i valori dalle celle selezionate
      const { row, col } = selectedCell;
      
      // Determina se è colonna inizio o fine
      const inizioCol = col % 2 === 0 ? col : col - 1;
      const fineCol = inizioCol + 1;
      
      const inizioVal = hotInstance.getDataAtCell(row, inizioCol);
      const fineVal = hotInstance.getDataAtCell(row, fineCol);
      
      // Se l'inizio è "X", allora siamo in modalità "a casa"
      if (inizioVal === 'X') {
        setMode('aCasa');
        
        // Estrai motivo e abbr dal valore fine
        if (fineVal && fineVal.indexOf('|') !== -1) {
          const parts = fineVal.split('|');
          setMotivo(parts[0].trim());
          setAbbr(parts[1].trim());
        }
      } else if (inizioVal && inizioVal.indexOf(' - ') !== -1) {
        // Siamo in modalità "lavora" con orari già definiti
        setMode('lavora');
        
        // Estrai orario inizio e fine
        const parts = inizioVal.split(' - ');
        setOrarioInizio(parts[0].trim());
        setOrarioFine(parts[1].trim());
      } else {
        // Modalità "lavora" di default, celle vuote
        setMode('lavora');
        setOrarioInizio('');
        setOrarioFine('');
      }
    }
  }, [selectedCell, hotInstance]);
  
  const handleModeChange = (newMode) => {
    setMode(newMode);
  };
  
  const handleSubmit = () => {
    if (mode === 'lavora') {
      // Validazione
      if (!orarioInizio || !orarioFine) {
        alert('Seleziona un orario di inizio e fine.');
        return;
      }
      
      // Verifica che l'orario di fine sia successivo all'orario di inizio
      if (orarioInizio >= orarioFine) {
        alert('L\'orario di fine deve essere successivo all\'orario di inizio.');
        return;
      }
      
      onSave({
        mode: 'lavora',
        orarioInizio,
        orarioFine
      });
    } else {
      onSave({
        mode: 'aCasa',
        motivo,
        abbr
      });
    }
  };
  
  // Filtra le opzioni di orario fine (solo orari successivi all'inizio)
  const filteredEndTimes = orarioInizio 
    ? allTimes.filter(time => time > orarioInizio) 
    : allTimes;
  
  // Filtra le opzioni di orario inizio (solo orari precedenti alla fine)
  const filteredStartTimes = orarioFine 
    ? allTimes.filter(time => time < orarioFine)
    : allTimes;
  
  // Estrai giorno e data per il titolo
  let headerTitle = 'Modifica Turno';
  
  if (selectedCell && hotInstance) {
    const { row, col } = selectedCell;
    const dayOfWeek = hotInstance.getDataAtCell(row, 0);
    const dayOfMonth = hotInstance.getDataAtCell(row, 1);
    
    // Calcola l'indice del dipendente
    const pairIndex = Math.floor((col - 2) / 2);
    const empName = hotInstance.getDataAtCell(0, 2 + 2 * pairIndex);
    
    headerTitle = `${empName}: ${dayOfWeek} ${dayOfMonth}`;
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-user-clock"></i> {headerTitle}</h3>
        </div>
        
        <div className="modal-body">
          <div className="mode-selector">
            <div className="mode-option">
              <label>
                <input 
                  type="radio" 
                  name="workOption" 
                  value="lavora" 
                  checked={mode === 'lavora'} 
                  onChange={() => handleModeChange('lavora')} 
                />
                <span><i className="fas fa-briefcase"></i> Lavora</span>
              </label>
              
              {mode === 'lavora' && (
                <div className="time-container">
                  <div className="form-group">
                    <label htmlFor="orarioInizio">Orario Inizio</label>
                    <select 
                      id="orarioInizio" 
                      value={orarioInizio} 
                      onChange={(e) => setOrarioInizio(e.target.value)}
                    >
                      <option value="">Seleziona orario</option>
                      {filteredStartTimes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="orarioFine">Orario Fine</label>
                    <select 
                      id="orarioFine" 
                      value={orarioFine} 
                      onChange={(e) => setOrarioFine(e.target.value)}
                    >
                      <option value="">Seleziona orario</option>
                      {filteredEndTimes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mode-option">
              <label>
                <input 
                  type="radio" 
                  name="workOption" 
                  value="aCasa" 
                  checked={mode === 'aCasa'} 
                  onChange={() => handleModeChange('aCasa')} 
                />
                <span><i className="fas fa-home"></i> A Casa</span>
              </label>
              
              {mode === 'aCasa' && (
                <div className="a-casa-container">
                  <div className="form-group">
                    <label htmlFor="motivo"><i className="fas fa-tags"></i> Motivazioni:</label>
                    <select 
                      id="motivo" 
                      value={motivo} 
                      onChange={(e) => setMotivo(e.target.value)}
                    >
                      <option value="nessuna">Nessuna</option>
                      <option value="ferie">Ferie</option>
                      <option value="exfestivita">EX Festività</option>
                      <option value="rol">ROL</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="abbr">Abbreviazione (2 char)</label>
                    <input 
                      type="text" 
                      id="abbr" 
                      maxLength="2" 
                      placeholder="XX" 
                      value={abbr} 
                      onChange={(e) => setAbbr(e.target.value)} 
                      disabled={motivo === 'nessuna'} 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose}
          >
            <i className="fas fa-times"></i> Annulla
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleSubmit}
          >
            <i className="fas fa-check"></i> Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default CellPopup;