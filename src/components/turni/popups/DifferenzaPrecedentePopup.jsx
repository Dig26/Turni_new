// src/components/turni/popups/DifferenzaPrecedentePopup.jsx
import React, { useState, useEffect } from 'react';
import '../../../styles/Modal.css';

const DifferenzaPrecedentePopup = ({ onClose, onSave, selectedCell, hotInstance, pairToEmployee }) => {
  const [value, setValue] = useState('');
  
  useEffect(() => {
    // Se la cella ha già un valore, caricalo
    if (selectedCell && hotInstance) {
      const { row, col } = selectedCell;
      const cellValue = hotInstance.getDataAtCell(row, col);
      
      if (cellValue && cellValue.trim() !== '') {
        // Converti il valore
        const numValue = cellValue.replace(',', '.');
        setValue(numValue);
      }
    }
  }, [selectedCell, hotInstance]);
  
  const handleSubmit = () => {
    if (value.trim() === '') {
      alert('Inserisci un valore valido.');
      return;
    }
    
    // Verifica che sia un numero
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      alert('Inserisci un valore numerico valido.');
      return;
    }
    
    onSave({
      value: numericValue
    });
  };
  
  const handleReset = () => {
    setValue('');
  };
  
  // Ottieni il nome del dipendente
  let empName = '';
  
  if (selectedCell && pairToEmployee) {
    const { col } = selectedCell;
    const pairIndex = Math.floor((col - 2) / 2);
    empName = pairToEmployee[pairIndex];
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-exchange-alt"></i> Differenza Mese Precedente</h3>
        </div>
        
        <div className="modal-body">
          <p>
            <strong>Dipendente:</strong> {empName}
          </p>
          
          <p style={{ marginTop: '15px' }}>
            Inserisci la differenza ore dal mese precedente (positivo o negativo):
          </p>
          
          <div className="form-group" style={{ marginTop: '15px' }}>
            <input 
              type="number" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0,00"
              step="0.01"
              style={{ 
                width: '100%', 
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#7f8c8d' }}>
            <p>
              <i className="fas fa-info-circle"></i> Inserisci un valore positivo per ore in eccesso o negativo per ore in difetto.
              Questo valore verrà considerato nel calcolo del totale ore.
            </p>
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

export default DifferenzaPrecedentePopup;