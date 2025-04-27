// src/components/turni/popups/VariationPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  const [currentMonthName, setCurrentMonthName] = useState('');
  const [dateLimits, setDateLimits] = useState({ min: '', max: '' });
  // Ref per tracciare se questo è il primo rendering
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Converte anno e mese in numeri interi
    const annoNum = parseInt(anno, 10);
    const meseNum = parseInt(mese, 10);
    
    // Genera oggetti Date per il primo e l'ultimo giorno del mese
    // Aggiungiamo un giorno al primo giorno del mese per evitare il problema di timezone
    // che mostra l'ultimo giorno del mese precedente
    const firstDayOfMonth = new Date(annoNum, meseNum, 2); // Usa il 2 invece dell'1
    
    // Per l'ultimo giorno, prendiamo il primo giorno del mese successivo 
    // (questo è un altro modo per ottenere l'ultimo del mese corrente)
    const lastDayOfMonth = new Date(annoNum, meseNum + 1, 1);
    
    // Formatta le date in formato ISO (YYYY-MM-DD) per gli input date
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];
    
    console.log(`Impostiamo date: min=${firstDayStr}, max=${lastDayStr}`);
    
    // Imposta i limiti delle date
    setDateLimits({
      min: firstDayStr,
      max: lastDayStr
    });
    
    // Imposta il nome del mese per la visualizzazione
    const options = { month: 'long', year: 'numeric' };
    setCurrentMonthName(firstDayOfMonth.toLocaleDateString('it-IT', options));
    
    // Carica variazioni esistenti se presenti
    if (selectedCell && hotInstance && pairToEmployee) {
      const { col } = selectedCell;
      const pairIndex = Math.floor((col - 2) / 2);
      const emp = pairToEmployee[pairIndex];
      
      if (emp && employeeVariations && employeeVariations[emp]) {
        // Copia le variazioni esistenti
        const existingVariations = [...employeeVariations[emp]];
        
        // Adatta le variazioni al mese corrente
        const adjustedVariations = existingVariations.map(variation => {
          // Crea una copia della variazione
          const adjustedVar = { ...variation };
          
          try {
            // Verifica se le date sono nel mese corrente
            const startDate = new Date(adjustedVar.start);
            const endDate = new Date(adjustedVar.end);
            
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth();
            const endYear = endDate.getFullYear();
            const endMonth = endDate.getMonth();
            
            // Se le date non sono nel mese corrente, usa i limiti del mese
            if (startYear !== annoNum || startMonth !== meseNum) {
              adjustedVar.start = firstDayStr;
            }
            
            if (endYear !== annoNum || endMonth !== meseNum) {
              adjustedVar.end = lastDayStr;
            }
            
          } catch (error) {
            // In caso di errore, usa i limiti del mese
            adjustedVar.start = firstDayStr;
            adjustedVar.end = lastDayStr;
          }
          
          return adjustedVar;
        });
        
        setVariations(adjustedVariations);
      }
    }
    
    // Segna che il primo montaggio è completato
    isInitialMount.current = false;
  }, [selectedCell, hotInstance, pairToEmployee, employeeVariations, anno, mese]);
  
  // Effetto aggiuntivo per applicare gli attributi min e max a tutti gli input date dopo ogni render
  useEffect(() => {
    if (!isInitialMount.current) {
      applyDateConstraintsToAllInputs();
    }
  });
  
  // Funzione per applicare i vincoli a tutti gli input date
  const applyDateConstraintsToAllInputs = () => {
    // Seleziona tutti gli input date nel popup
    const dateInputs = document.querySelectorAll('.variation-date-input');
    
    // Imposta gli attributi min e max su ciascuno
    dateInputs.forEach(input => {
      // Rimuove prima qualsiasi vincolo esistente
      input.removeAttribute('min');
      input.removeAttribute('max');
      
      // Applica i nuovi vincoli
      input.setAttribute('min', dateLimits.min);
      input.setAttribute('max', dateLimits.max);
      
      // Applica un gestore di input per prevenire date non valide
      input.onchange = (e) => {
        const value = e.target.value;
        if (!isDateWithinCurrentMonth(value)) {
          // Resetta al valore minimo se la data è esterna al mese
          e.target.value = dateLimits.min;
        }
      };
    });
  };
  
  // Funzione per verificare se una data è all'interno del mese corrente
  const isDateWithinCurrentMonth = (dateStr) => {
    if (!dateStr) return false;
    
    try {
      // Converte anno e mese in numeri
      const annoNum = parseInt(anno, 10);
      const meseNum = parseInt(mese, 10);
      
      // Crea un oggetto Date dalla stringa
      const date = new Date(dateStr + "T12:00:00"); // Aggiungiamo mezzogiorno per evitare problemi di timezone
      
      // Ottieni anno e mese dalla data
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      
      console.log(`Verifica data: ${dateStr}, anno=${dateYear}, mese=${dateMonth}, target: anno=${annoNum}, mese=${meseNum}`);
      
      // Una data è nel mese corrente se anno e mese corrispondono esattamente
      return dateYear === annoNum && dateMonth === meseNum;
    } catch (error) {
      console.error("Errore nella verifica della data:", error);
      return false;
    }
  };
  
  const addVariation = () => {
    // Aggiungi una nuova variazione con date predefinite al mese corrente
    // Usa le stesse date corrette come limiti
    setVariations([
      ...variations,
      {
        start: dateLimits.min, // Qui usiamo il minimo corretto 
        end: dateLimits.max,   // Qui usiamo il massimo corretto
        hours: 0
      }
    ]);
    
    // Applica i vincoli agli input date dopo un breve ritardo
    setTimeout(applyDateConstraintsToAllInputs, 0);
  };
  
  const handleDateChange = (index, field, value) => {
    // Se la data non è valida (al di fuori del mese corrente), non fare nulla
    if (!isDateWithinCurrentMonth(value)) {
      return;
    }
    
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
    
    // Aggiorna lo stato
    setVariations(newVariations);
  };
  
  const handleHoursChange = (index, value) => {
    // Converti il valore in numero
    const hours = parseFloat(value);
    
    // Crea una copia dell'array di variazioni
    const newVariations = [...variations];
    
    // Ottieni le ore settimanali standard del dipendente
    let defaultHours = 0;
    if (selectedCell && pairToEmployee) {
      const { col } = selectedCell;
      const pairIndex = Math.floor((col - 2) / 2);
      const emp = pairToEmployee[pairIndex];
      
      if (emp && employees && employees[emp]) {
        defaultHours = employees[emp];
      }
    }
    
    // Verifica che le ore non siano uguali a quelle predefinite
    if (hours === defaultHours) {
      alert(`Il valore non può essere uguale a quello originale (${defaultHours}).`);
      return;
    }
    
    // Aggiorna il valore delle ore
    newVariations[index].hours = hours;
    
    // Aggiorna lo stato
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
  
  // Crea stile CSS per sovrascrivere il comportamento nativo dell'input date
  // Questo nasconde le date al di fuori del mese corrente nel controllo del calendario
  const dateInputOverrideStyle = `
    <style>
      /* Nasconde le date fuori dal mese corrente nel calendario */
      .date-input-container input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(0.8);
      }
      
      /* Stile per input non validi */
      .date-input-container input:invalid {
        border-color: #e74c3c;
        outline-color: #e74c3c;
      }
    </style>
  `;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        {/* Inserisci lo stile CSS inline */}
        <div dangerouslySetInnerHTML={{ __html: dateInputOverrideStyle }} />
        
        <div className="modal-header">
          <h3><i className="fas fa-user-clock"></i> Gestione Orario: {empName}</h3>
        </div>
        
        <div className="modal-body">
          <div className="employee-info" style={{ marginBottom: '15px' }}>
            <p><strong>Dipendente:</strong> {empName}</p>
            <p><strong>Ore settimanali standard:</strong> {defaultHours}</p>
            <p style={{ color: '#e67e22', fontWeight: 'bold' }}>
              <i className="fas fa-calendar-alt"></i> Periodo: {currentMonthName}
            </p>
          </div>
          
          <div className="notice-box" style={{ 
            padding: '10px', 
            marginBottom: '15px', 
            backgroundColor: '#f8f9fa', 
            borderLeft: '4px solid #3498db',
            borderRadius: '4px'
          }}>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              <i className="fas fa-info-circle"></i> <strong>Nota:</strong> Le date selezionabili sono limitate al mese corrente ({currentMonthName}).
            </p>
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
                  <div className="date-input-container">
                    <label>Data inizio:</label>
                    <input 
                      type="date" 
                      className="variation-date-input"
                      value={variation.start}
                      onChange={(e) => handleDateChange(index, 'start', e.target.value)}
                      min={dateLimits.min}
                      max={dateLimits.max}
                      style={{ 
                        width: '100%', 
                        marginTop: '5px', 
                        padding: '6px',
                        borderColor: isDateWithinCurrentMonth(variation.start) ? '#ddd' : '#e74c3c'
                      }}
                      required
                    />
                    {!isDateWithinCurrentMonth(variation.start) && (
                      <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '2px' }}>
                        Data fuori dal mese corrente
                      </div>
                    )}
                  </div>
                  
                  <div className="date-input-container">
                    <label>Data fine:</label>
                    <input 
                      type="date" 
                      className="variation-date-input"
                      value={variation.end}
                      onChange={(e) => handleDateChange(index, 'end', e.target.value)}
                      min={dateLimits.min}
                      max={dateLimits.max}
                      style={{ 
                        width: '100%', 
                        marginTop: '5px', 
                        padding: '6px',
                        borderColor: isDateWithinCurrentMonth(variation.end) ? '#ddd' : '#e74c3c'
                      }}
                      required
                    />
                    {!isDateWithinCurrentMonth(variation.end) && (
                      <div style={{ color: '#e74c3c', fontSize: '0.8em', marginTop: '2px' }}>
                        Data fuori dal mese corrente
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label>Ore settimanali:</label>
                    <input 
                      type="number" 
                      value={variation.hours || ''}
                      onChange={(e) => handleHoursChange(index, e.target.value)}
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