// src/components/turni/popups/TimePopup.jsx
import React, { useState, useEffect } from 'react';
import '../../../styles/Modal.css';

const TimePopup = ({ onClose, onSave, selectedCell, hotInstance }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  
  useEffect(() => {
    // Se la cella ha già un valore, caricalo come valore iniziale
    if (selectedCell && hotInstance) {
      const { row, col } = selectedCell;
      
      // Indipendentemente che sia colonna "inizio" o "fine", prendi il valore numerico
      const cellCol = col % 2 === 0 ? col + 1 : col;
      const cellValue = hotInstance.getDataAtCell(row, cellCol);
      
      if (cellValue && cellValue.trim() !== '') {
        // Converti in numero e separa ore e minuti
        try {
          const decimalHours = parseFloat(cellValue.replace(',', '.'));
          if (!isNaN(decimalHours)) {
            const wholeHours = Math.floor(decimalHours);
            const minutesPart = Math.round((decimalHours - wholeHours) * 60);
            
            setHours(wholeHours);
            setMinutes(minutesPart);
          }
        } catch (e) {
          console.error('Errore nella conversione del valore orario:', e);
        }
      }
    }
  }, [selectedCell, hotInstance]);
  
  const handleSubmit = () => {
    // Calcola le ore decimali
    const decimalHours = hours + (minutes / 60);
    
    onSave({
      hours: decimalHours
    });
  };
  
  const handleReset = () => {
    setHours(0);
    setMinutes(0);
  };
  
  // Estrai giorno e data per il titolo
  let headerTitle = 'Inserimento Orario Manuale';
  
  if (selectedCell && hotInstance) {
    const { row, col } = selectedCell;
    const dayOfWeek = hotInstance.getDataAtCell(row, 0);
    const dayOfMonth = hotInstance.getDataAtCell(row, 1);
    
    // Calcola l'indice del dipendente
    const pairIndex = Math.floor((col - 2) / 2);
    const empName = hotInstance.getDataAtCell(0, 2 + 2 * pairIndex);
    
    headerTitle = `${empName}: ${dayOfWeek} ${dayOfMonth}`;
  }
  
  // Crea array di opzioni per ore e minuti
  const hoursOptions = Array.from({ length: 25 }, (_, i) => i);
  const minutesOptions = [0, 15, 30, 45]; // Intervalli di 15 minuti
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-clock"></i> {headerTitle}</h3>
        </div>
        
        <div className="modal-body">
          <p>Inserisci l'orario di lavoro in formato ore e minuti:</p>
          
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label htmlFor="hours"><i className="far fa-clock"></i> Ore:</label>
            <select 
              id="hours"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            >
              {hoursOptions.map(h => (
                <option key={`hour-${h}`} value={h}>{h < 10 ? `0${h}` : h}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label htmlFor="minutes"><i className="fas fa-stopwatch"></i> Minuti:</label>
            <select 
              id="minutes"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '5px' }}
            >
              {minutesOptions.map(m => (
                <option key={`minute-${m}`} value={m}>{m < 10 ? `0${m}` : m}</option>
              ))}
            </select>
          </div>
          
          <div className="total-time" style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>
            Tempo totale: {hours} ore e {minutes} minuti
            <br />
            <span style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
              ({(hours + (minutes/60)).toFixed(2).replace('.', ',')} ore in formato decimale)
            </span>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={handleReset}
          >
            <i className="fas fa-undo"></i> Reset
          </button>
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

export default TimePopup;