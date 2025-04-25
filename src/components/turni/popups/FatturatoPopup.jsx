// src/components/turni/popups/FatturatoPopup.jsx
import React, { useState, useEffect } from 'react';
import '../../../styles/Modal.css';

const FatturatoPopup = ({ onClose, onSave, selectedCell, hotInstance }) => {
  const [importo, setImporto] = useState('');
  
  useEffect(() => {
    // Se la cella ha già un valore, caricalo
    if (selectedCell && hotInstance) {
      const { row, col } = selectedCell;
      const cellValue = hotInstance.getDataAtCell(row, col);
      
      if (cellValue && cellValue.trim() !== '') {
        // Estrai il valore numerico (rimuovi simboli euro e formattazione)
        const numValue = cellValue.replace(/[^\d,]/g, '').replace(',', '.');
        setImporto(numValue);
      }
    }
  }, [selectedCell, hotInstance]);
  
  const handleSubmit = () => {
    if (importo.trim() === '') {
      alert('Inserisci un importo valido.');
      return;
    }
    
    // Verifica che sia un numero
    const numericValue = parseFloat(importo);
    if (isNaN(numericValue)) {
      alert('Inserisci un importo numerico valido.');
      return;
    }
    
    onSave({
      importo: numericValue
    });
  };
  
  const handleReset = () => {
    setImporto('');
  };
  
  // Estrai giorno e data per il titolo
  let headerTitle = 'Inserimento Fatturato';
  
  if (selectedCell && hotInstance) {
    const { row, col } = selectedCell;
    const dayOfWeek = hotInstance.getDataAtCell(row, 0);
    const dayOfMonth = hotInstance.getDataAtCell(row, 1);
    
    headerTitle = `Fatturato: ${dayOfWeek} ${dayOfMonth}`;
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-euro-sign"></i> {headerTitle}</h3>
        </div>
        
        <div className="modal-body">
          <p>Inserisci l'importo del fatturato giornaliero:</p>
          
          <div className="form-group" style={{ marginTop: '15px' }}>
            <div className="input-with-icon" style={{ position: 'relative', marginTop: '10px' }}>
              <input 
                type="number" 
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                style={{ 
                  width: '100%', 
                  padding: '10px 30px 10px 10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <span style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#7f8c8d' 
              }}>
                €
              </span>
            </div>
          </div>
          
          <div style={{ marginTop: '15px', fontSize: '0.9em', color: '#7f8c8d' }}>
            <p><i className="fas fa-info-circle"></i> Il fatturato giornaliero verrà sommato automaticamente nel riepilogo.</p>
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

export default FatturatoPopup;