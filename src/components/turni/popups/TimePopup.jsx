// src/components/turni/popups/TimePopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import '../../../styles/Modal.css';

const TimePopup = ({ onClose, onSave, selectedCell, hotInstance }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [showPausaOption, setShowPausaOption] = useState(false);
  const [pausaIncluded, setPausaIncluded] = useState(false);
  const pausaCheckboxRef = useRef(null);
  
  // Ottieni il negozio corrente dallo store Redux per determinare il settore
  const negozio = useSelector(state => state.negozi.currentNegozio);
  
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
          // Rimuovi eventuali indicatori per estrarre il valore numerico
          const numericValue = cellValue.replace(/[^0-9,\.]/g, '').trim();
          const decimalHours = parseFloat(numericValue.replace(',', '.'));
          
          if (!isNaN(decimalHours)) {
            const wholeHours = Math.floor(decimalHours);
            const minutesPart = Math.round((decimalHours - wholeHours) * 60);
            
            setHours(wholeHours);
            setMinutes(minutesPart);
            
            // Ottieni gli orari dalle altre celle per determinare le ore teoriche
            const inizioCol = col % 2 === 0 ? col : col - 1;
            const orarioStr = hotInstance.getDataAtCell(row, inizioCol);
            
            if (orarioStr && orarioStr.includes(' - ')) {
              const [startTime, endTime] = orarioStr.split(' - ').map(t => t.trim());
              
              // Calcola le ore teoriche
              const theoreticalHours = calculateHoursBetween(startTime, endTime);
              
              // Se c'è una differenza di circa 0.5 ore, allora la pausa è inclusa
              if (theoreticalHours > 6 && Math.abs(theoreticalHours - decimalHours) > 0.45 && 
                  Math.abs(theoreticalHours - decimalHours) < 0.55) {
                setPausaIncluded(true);
              }
            }
            
            // Mostra l'opzione pausa se le ore superano 6
            if (decimalHours > 5.5) {
              setShowPausaOption(true);
            }
          }
        } catch (e) {
          console.error('Errore nella conversione del valore orario:', e);
        }
      }
    }
  }, [selectedCell, hotInstance]);
  
  // Forza l'aggiornamento visivo della checkbox
  useEffect(() => {
    if (pausaCheckboxRef.current) {
      pausaCheckboxRef.current.checked = pausaIncluded;
    }
  }, [pausaIncluded]);
  
  // Funzione per calcolare le ore tra due orari
  const calculateHoursBetween = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    // Converti in minuti totali
    const startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;
    
    // Gestisci il caso in cui il turno finisca il giorno dopo
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Aggiungi un giorno in minuti
    }
    
    // Calcola la differenza in ore
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return parseFloat((diffMinutes / 60).toFixed(2));
  };
  
  // Monitora i cambiamenti nelle ore totali per mostrare l'opzione pausa
  useEffect(() => {
    const totalHours = hours + (minutes / 60);
    if (totalHours > 6) {
      setShowPausaOption(true);
    } else {
      setShowPausaOption(false);
      setPausaIncluded(false);
    }
  }, [hours, minutes]);
  
  const handleSubmit = () => {
    // Calcola le ore decimali
    const totalHours = hours + (minutes / 60);
    
    // Se la pausa è inclusa e le ore > 6, sottraiamo 0.5 ore
    let effectiveHours = totalHours;
    if (pausaIncluded && totalHours > 6) {
      effectiveHours = totalHours - 0.5;
    }
    
    // Passa le ore effettive già ridotte
    onSave({
      hours: effectiveHours
    });
  };
  
  const handleReset = () => {
    setHours(0);
    setMinutes(0);
    setPausaIncluded(false);
  };
  
  // Gestisce il cambio dell'opzione pausa
  const handlePausaChange = (e) => {
    setPausaIncluded(e.target.checked);
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
  
  // Calcola e formatta le ore effettive considerando la pausa
  const getEffectiveHours = () => {
    const totalHours = hours + (minutes / 60);
    
    if (totalHours > 6 && pausaIncluded) {
      // Sottrai 30 minuti (0.5 ore) se la pausa è inclusa
      return (totalHours - 0.5).toFixed(2).replace('.', ',');
    }
    
    return totalHours.toFixed(2).replace('.', ',');
  };
  
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
          
          {showPausaOption && (
            <div className="form-group" style={{ 
              marginTop: '15px', 
              backgroundColor: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px', 
              border: '1px solid #e9ecef' 
            }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: '#e67e22', 
                fontWeight: 'bold' 
              }}>
                <input 
                  type="checkbox"
                  ref={pausaCheckboxRef}
                  checked={pausaIncluded}
                  onChange={handlePausaChange}
                  style={{ marginRight: '8px' }}
                />
                <i className="fas fa-coffee" style={{ marginRight: '5px' }}></i>
                Includi pausa obbligatoria di 30 minuti
              </label>
              <p style={{ fontSize: '0.85em', marginTop: '5px', color: '#7f8c8d' }}>
                Secondo la normativa, per turni superiori a 6 ore è prevista una pausa di 30 minuti.
                {pausaIncluded 
                  ? " Le ore effettive lavorate saranno ridotte di 30 minuti." 
                  : " Attivare questa opzione ridurrà le ore effettive lavorate."}
              </p>
            </div>
          )}
          
          <div className="total-time" style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold' }}>
            Tempo totale: {hours} ore e {minutes} minuti
            <br />
            <span style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
              ({getEffectiveHours()} ore in formato decimale)
              {pausaIncluded && (hours + (minutes/60)) > 6 && (
                <>
                  <br />
                  <span style={{ color: '#e67e22' }}>
                    (pausa di 30 minuti inclusa)
                  </span>
                </>
              )}
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