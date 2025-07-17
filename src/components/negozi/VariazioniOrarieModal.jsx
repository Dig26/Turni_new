// src/components/negozi/VariazioniOrarieModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../app/slices/uiSlice';
import './VariazioniOrarieModal.css';

const VariazioniOrarieModal = ({ isOpen, onClose, dipendente, anno }) => {
  const dispatch = useDispatch();
  const [variazioni, setVariazioni] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const mesi = [
    { value: 1, label: 'Gennaio' },
    { value: 2, label: 'Febbraio' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Aprile' },
    { value: 5, label: 'Maggio' },
    { value: 6, label: 'Giugno' },
    { value: 7, label: 'Luglio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Settembre' },
    { value: 10, label: 'Ottobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Dicembre' }
  ];
  
  useEffect(() => {
    if (isOpen && dipendente) {
      loadVariazioni();
    }
  }, [isOpen, dipendente, anno]);
  
  const loadVariazioni = async () => {
    setLoading(true);
    try {
      // Qui dovrebbe chiamare il servizio per caricare le variazioni
      // Per ora usiamo dati mock
      setVariazioni([
        {
          id: 1,
          meseInizio: 3,
          meseFine: 5,
          oreSettimanali: 30,
          note: 'Part-time temporaneo'
        }
      ]);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nel caricamento delle variazioni',
        duration: 5000
      }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddVariazione = () => {
    const nuovaVariazione = {
      id: Date.now(),
      meseInizio: 1,
      meseFine: 1,
      oreSettimanali: dipendente?.oreSettimanali || 40,
      note: ''
    };
    setVariazioni([...variazioni, nuovaVariazione]);
  };
  
  const handleUpdateVariazione = (id, field, value) => {
    setVariazioni(variazioni.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };
  
  const handleDeleteVariazione = (id) => {
    setVariazioni(variazioni.filter(v => v.id !== id));
  };
  
  const handleSave = async () => {
    // Validazione
    for (const variazione of variazioni) {
      if (variazione.meseInizio > variazione.meseFine) {
        dispatch(addNotification({
          type: 'error',
          message: 'Il mese di inizio deve essere precedente o uguale al mese di fine',
          duration: 5000
        }));
        return;
      }
      
      if (variazione.oreSettimanali < 0 || variazione.oreSettimanali > 48) {
        dispatch(addNotification({
          type: 'error',
          message: 'Le ore settimanali devono essere tra 0 e 48',
          duration: 5000
        }));
        return;
      }
    }
    
    // Controlla sovrapposizioni
    for (let i = 0; i < variazioni.length; i++) {
      for (let j = i + 1; j < variazioni.length; j++) {
        const v1 = variazioni[i];
        const v2 = variazioni[j];
        
        if (
          (v1.meseInizio <= v2.meseFine && v1.meseFine >= v2.meseInizio) ||
          (v2.meseInizio <= v1.meseFine && v2.meseFine >= v1.meseInizio)
        ) {
          dispatch(addNotification({
            type: 'error',
            message: 'Le variazioni non possono sovrapporsi',
            duration: 5000
          }));
          return;
        }
      }
    }
    
    try {
      // Qui dovrebbe salvare le variazioni nel backend
      dispatch(addNotification({
        type: 'success',
        message: 'Variazioni orarie salvate con successo',
        duration: 3000
      }));
      onClose();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore nel salvataggio delle variazioni',
        duration: 5000
      }));
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content variazioni-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-clock"></i> Variazioni Orarie - {dipendente?.nome} {dipendente?.cognome}
          </h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          <div className="info-box">
            <p>
              <strong>Anno di riferimento:</strong> {anno}<br />
              <strong>Ore settimanali standard:</strong> {dipendente?.oreSettimanali || 40} ore
            </p>
          </div>
          
          {loading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <span>Caricamento...</span>
            </div>
          ) : (
            <>
              <div className="variazioni-list">
                {variazioni.length === 0 ? (
                  <div className="empty-state">
                    <p>Nessuna variazione oraria per l'anno {anno}</p>
                  </div>
                ) : (
                  variazioni.map(variazione => (
                    <div key={variazione.id} className="variazione-item">
                      <div className="variazione-row">
                        <div className="form-group">
                          <label>Dal mese</label>
                          <select
                            value={variazione.meseInizio}
                            onChange={(e) => handleUpdateVariazione(variazione.id, 'meseInizio', parseInt(e.target.value))}
                          >
                            {mesi.map(mese => (
                              <option key={mese.value} value={mese.value}>
                                {mese.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Al mese</label>
                          <select
                            value={variazione.meseFine}
                            onChange={(e) => handleUpdateVariazione(variazione.id, 'meseFine', parseInt(e.target.value))}
                          >
                            {mesi.map(mese => (
                              <option key={mese.value} value={mese.value}>
                                {mese.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>Ore settimanali</label>
                          <input
                            type="number"
                            min="0"
                            max="48"
                            value={variazione.oreSettimanali}
                            onChange={(e) => handleUpdateVariazione(variazione.id, 'oreSettimanali', parseInt(e.target.value))}
                          />
                        </div>
                        
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteVariazione(variazione.id)}
                          title="Elimina variazione"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      
                      <div className="form-group full-width">
                        <label>Note</label>
                        <input
                          type="text"
                          placeholder="Note opzionali (es. Part-time, Congedo, ecc.)"
                          value={variazione.note}
                          onChange={(e) => handleUpdateVariazione(variazione.id, 'note', e.target.value)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button className="btn-add" onClick={handleAddVariazione}>
                <i className="fas fa-plus"></i> Aggiungi Variazione
              </button>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Annulla
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            <i className="fas fa-save"></i> Salva Variazioni
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariazioniOrarieModal;