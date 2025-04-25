// src/components/turni/popups/VariationPopup.jsx
import React, { useState, useEffect } from 'react';
import '../../../styles/Modal.css';

const VariationPopup = ({ 
  onClose, 
  onSave, 
  selectedCell, 
  hotInstance, 
  pairToEmployee, 
  employees, 
  employeeVariations,
  anno,
  mese
}) => {
  const [variations, setVariations] = useState([]);
  
  useEffect(() => {
    // Se ci sono già variazioni per questo dipendente, caricale
    if (selectedCell && hotInstance && pairToEmployee) {
      const { col } = selectedCell;
      const pairIndex = Math.floor((col - 2) / 2);
      const emp = pairToEmployee[pairIndex];
      
      if (emp && employeeVariations && employeeVariations[emp]) {
        // Copia le variazioni esistenti
        setVariations([...employeeVariations[emp]]);
      }
    }
  }, [selectedCell, hotInstance, pairToEmployee, employeeVariations]);
  
  const addVariation = () => {
    // Data del primo giorno del mese corrente
    const firstDayOfMonth = new Date(anno, mese, 1);
    const lastDayOfMonth = new Date(anno, mese + 1, 0);
    
    // Formatta le date in formato ISO
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];
    
    // Aggiungi una nuova variazione con le date predefinite
    setVariations([
      ...variations,
      {
        start: firstDayStr,
        end: lastDayStr,
        hours: 0
      }
    ]);
  };
  
  const updateVariation = (index, field, value) => {
    // Crea una copia dell'array di variazioni
    const newVariations = [...variations];
    
    // Aggiorna il campo specifico
    newVariations[index][field] = value;
    
    // Gestisci la logica di validazione data inizio/fine
    if (field === 'start' && new Date(value) > new Date(newVariations[index].end)) {
      newVariations[index].end = value;
    } else if (field === 'end' && new Date(value) < new Date(newVariations[index].start)) {
      newVariations[index].start = value;
    }
    
    setVariations(newVariations);
  };
  
  const removeVariation = (index) => {
    // Rimuovi la variazione all'indice specificato
    const newVariations = variations.filter((_, i) => i !== index);
    setVariations(newVariations);
  };
  
  const handleSubmit = () => {
    // Verifica che tutte le variazioni abbiano valori validi
    const validVariations = variations.filter(v => 
      v.start && v.end && !isNaN(v.hours) && v.hours > 0
    );
    
    onSave({
      variations: validVariations
    });
  };
  
  // Ottieni il nome e le ore settimanali predefinite del dipendente
  let empName = '';
  let defaultHours = 0;
  
  if (selectedCell && pairToEmployee) {
    const { col } = selectedCell;
    const pairIndex = Math.floor((col - 2) / 2);
    empName = pairToEmployee[pairIndex];
    
    if (empName && employees && employees[empName]) {
      defaultHours = employees[empName];
    }
  }
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><i className="fas fa-user-clock"></i> Gestione Orario: {empName}</h3>
        </div>
        
        <div className="modal-body">
          <div className="employee-info" style={{ marginBottom: '15px' }}>
            <p><strong>Dipendente:</strong> {empName}</p>
            <p><strong>Ore settimanali standard:</strong> {defaultHours}</p>
          </div>
          
          <button 
            onClick={addVariation}
            style={{ 
              width: '100%', 
              padding: '8px', 
              marginBottom: '15px',
              background: '#f1f2f6',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <i className="fas fa-plus-circle"></i> Aggiungi Variazione
          </button>
          
          <div className="variations-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {variations.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
                Nessuna variazione. Il dipendente lavorerà sempre {defaultHours} ore settimanali.
              </p>
            ) : (
              variations.map((variation, index) => (
                <div key={index} className="variation-row" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr) auto',
                  gap: '10px',
                  marginBottom: '10px',
                  padding: '10px',
                  border: '1px solid #eee',
                  borderRadius: '4px'
                }}>
                  <div>
                    <label>Data inizio:</label>
                    <input 
                      type="date" 
                      value={variation.start}
                      onChange={(e) => updateVariation(index, 'start', e.target.value)}
                      style={{ width: '100%', marginTop: '5px', padding: '6px' }}
                    />
                  </div>
                  
                  <div>
                    <label>Data fine:</label>
                    <input 
                      type="date" 
                      value={variation.end}
                      onChange={(e) => updateVariation(index, 'end', e.target.value)}
                      style={{ width: '100%', marginTop: '5px', padding: '6px' }}
                    />
                  </div>
                  
                  <div>
                    <label>Ore settimanali:</label>
                    <input 
                      type="number" 
                      value={variation.hours || ''}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value);
                        // Verifica che le ore non siano uguali a quelle predefinite
                        if (hours === defaultHours) {
                          alert(`Il valore non può essere uguale a quello originale (${defaultHours}).`);
                          return;
                        }
                        updateVariation(index, 'hours', hours);
                      }}
                      placeholder="Ore"
                      min="1"
                      max="168" // max ore in una settimana
                      style={{ width: '100%', marginTop: '5px', padding: '6px' }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button 
                      onClick={() => removeVariation(index)}
                      style={{ 
                        padding: '8px', 
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {variations.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#7f8c8d' }}>
              <p>
                <i className="fas fa-info-circle"></i> Le variazioni si applicano solo ai giorni compresi nel periodo specificato.
                Per i giorni restanti verrà utilizzato il valore standard ({defaultHours} ore).
              </p>
            </div>
          )}
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

export default VariationPopup;