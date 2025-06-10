// src/components/turni/popups/CellPopup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import '../../../styles/Modal.css';

const CellPopup = ({ onClose, onSave, allTimes, selectedCell, hotInstance }) => {
  const [mode, setMode] = useState('lavora');
  const [orarioInizio, setOrarioInizio] = useState('');
  const [orarioFine, setOrarioFine] = useState('');
  const [motivo, setMotivo] = useState('');
  const [abbr, setAbbr] = useState('');
  const [totalHours, setTotalHours] = useState(0);
  const [theoreticalHours, setTheoreticalHours] = useState(0);
  const [pausaIncluded, setPausaIncluded] = useState(false);
  const [showPausaOption, setShowPausaOption] = useState(false);
  const pausaCheckboxRef = useRef(null);

  // Ottieni le motivazioni dal Redux store
  const negozioId = useSelector(state => state.negozi.currentNegozio ? state.negozi.currentNegozio.id : null);
  const negozio = useSelector(state => state.negozi.currentNegozio);
  const motivazioni = useSelector(state => {
    try {
      if (state.motivazioni && state.motivazioni.items && negozioId) {
        return Array.isArray(state.motivazioni.items[negozioId])
          ? state.motivazioni.items[negozioId]
          : [];
      }
      return [];
    } catch (error) {
      console.error("Errore nell'accesso alle motivazioni:", error);
      return [];
    }
  });

  // Inizializza il motivo di default dopo che le motivazioni sono caricate
  useEffect(() => {
    if (motivazioni.length > 0 && !motivo) {
      // Trova la prima motivazione o usa la prima disponibile come default
      const defaultMotivazione = motivazioni.find(m => 
        m.nome?.toLowerCase().includes('ferie') || 
        m.nome?.toLowerCase().includes('assenza')
      ) || motivazioni[0];
      
      if (defaultMotivazione) {
        setMotivo(defaultMotivazione.id);
      }
    }
  }, [motivazioni, motivo]);

  // Effect per aggiornare automaticamente la sigla quando cambia il motivo
  useEffect(() => {
    console.log('Motivo cambiato:', motivo);
    console.log('Motivazioni disponibili:', motivazioni);
    
    if (motivo && motivazioni.length > 0) {
      const selectedMotivazione = motivazioni.find(m => {
        // Confronto sia con id che con nome per sicurezza
        return m.id === motivo || m.nome === motivo;
      });
      
      console.log('Motivazione selezionata:', selectedMotivazione);
      
      if (selectedMotivazione && selectedMotivazione.sigla) {
        console.log('Aggiornamento sigla a:', selectedMotivazione.sigla);
        setAbbr(selectedMotivazione.sigla);
      } else {
        console.log('Nessuna sigla trovata per la motivazione');
        setAbbr('');
      }
    } else {
      setAbbr('');
    }
  }, [motivo, motivazioni]);

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

        // Estrai motivo e abbreviazione
        if (fineVal && fineVal.indexOf('|') !== -1) {
          const parts = fineVal.split('|');
          const motivoFromCell = parts[0].trim();
          const abbrFromCell = parts[1].trim();
          
          // Cerca la motivazione corrispondente
          const foundMotivazione = motivazioni.find(m => 
            m.nome === motivoFromCell || m.id === motivoFromCell || m.sigla === abbrFromCell
          );
          
          if (foundMotivazione) {
            setMotivo(foundMotivazione.id);
            setAbbr(foundMotivazione.sigla);
          } else {
            setMotivo(motivoFromCell);
            setAbbr(abbrFromCell);
          }
        }
      } else if (inizioVal && inizioVal.indexOf(' - ') !== -1) {
        // Siamo in modalità "lavora" con orari già definiti
        setMode('lavora');

        // Estrai orario inizio e fine
        const parts = inizioVal.split(' - ');
        const startTime = parts[0].trim().replace(/\s*\([P]\)|\s*\(P\)/g, '');
        const endTime = parts[1].trim();

        setOrarioInizio(startTime);
        setOrarioFine(endTime);

        // Calcola le ore teoriche basate sugli orari (sempre senza pausa)
        const calculatedTheoreticalHours = calculateHoursBetween(startTime, endTime);
        setTheoreticalHours(calculatedTheoreticalHours);

        // Leggi le ore effettive dalla cella fine
        let actualHours = 0;
        if (fineVal) {
          try {
            const numericValue = fineVal.replace(/[^0-9,\.]/g, '');
            actualHours = parseFloat(numericValue.replace(',', '.'));
          } catch (e) {
            console.error('Errore nella conversione delle ore:', e);
          }
        }

        // Se è un turno di almeno 6 ore, mostra l'opzione pausa
        if (calculatedTheoreticalHours >= 6) {
          setShowPausaOption(true);

          // Calcola la differenza tra ore teoriche e ore effettive
          const difference = calculatedTheoreticalHours - actualHours;
          
          if (difference >= 0.4 && difference <= 0.6) {
            setPausaIncluded(true);
            setTotalHours(calculatedTheoreticalHours);
          } else {
            setPausaIncluded(false);
            setTotalHours(actualHours);
          }
        } else {
          setShowPausaOption(false);
          setPausaIncluded(false);
          setTotalHours(actualHours);
        }

        // Verifica se il valore di inizio contiene l'indicatore di pausa
        const hasPauseIndicator = inizioVal.includes('(P)');
        if (hasPauseIndicator) {
          setPausaIncluded(true);
        }
      } else {
        // Se non ci sono orari definiti, imposta la modalità "lavora" di default
        setMode('lavora');
      }
    }
  }, [selectedCell, hotInstance, motivazioni]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (pausaCheckboxRef.current) {
        pausaCheckboxRef.current.checked = pausaIncluded;
        const event = new Event('change', { bubbles: true });
        pausaCheckboxRef.current.dispatchEvent(event);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pausaIncluded]);

  // Funzione per calcolare le ore tra due orari
  const calculateHoursBetween = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60;
    }

    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return parseFloat((diffMinutes / 60).toFixed(2));
  };

  // Funzione per calcolare l'orario di fine dato l'orario di inizio e le ore totali
  const calculateEndTime = (startTime, hours) => {
    if (!startTime || isNaN(hours)) return '';

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const totalMinutes = startHours * 60 + startMinutes + hours * 60;

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = Math.round(totalMinutes % 60);

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Funzione per calcolare l'orario di inizio dato l'orario di fine e le ore totali
  const calculateStartTime = (endTime, hours) => {
    if (!endTime || isNaN(hours)) return '';

    const [endHours, endMinutes] = endTime.split(':').map(Number);
    let totalMinutes = endHours * 60 + endMinutes - hours * 60;

    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    const startHours = Math.floor(totalMinutes / 60) % 24;
    const startMinutes = Math.round(totalMinutes % 60);

    return `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  // Gestisce il cambio di motivazione
  const handleMotivoChange = (newMotivoId) => {
    console.log('=== CAMBIO MOTIVO ===');
    console.log('Nuovo motivo selezionato:', newMotivoId);
    setMotivo(newMotivoId);
  };

  // Verifica se la motivazione corrente è "nessuna" (controllo per nome o id)
  const isNessunaMotivazione = React.useMemo(() => {
    if (!motivo || !motivazioni.length) return true;
    
    const currentMotivazione = motivazioni.find(m => String(m.id) === String(motivo));
    const isNessuna = currentMotivazione && 
      (currentMotivazione.nome?.toLowerCase().includes('nessuna') || 
       currentMotivazione.id?.toLowerCase?.().includes('nessuna') ||
       String(currentMotivazione.id).toLowerCase() === 'nessuna');
    
    console.log('Verifica nessuna:', { currentMotivazione, isNessuna });
    return isNessuna;
  }, [motivo, motivazioni]);

  // Quando cambiano le ore totali, verifica se mostrare l'opzione pausa
  useEffect(() => {
    if (totalHours >= 6) {
      setShowPausaOption(true);
    } else {
      setShowPausaOption(false);
      setPausaIncluded(false);
    }
  }, [totalHours]);

  // Gestisci il cambio dell'opzione pausa
  const handlePausaChange = (e) => {
    const isChecked = e.target.checked;
    setPausaIncluded(isChecked);
  };

  const handleSubmit = () => {
    if (mode === 'lavora') {
      // Validazione
      if (!orarioInizio || !orarioFine) {
        alert('Seleziona un orario di inizio e fine.');
        return;
      }

      // Verifica che l'orario di fine sia successivo all'orario di inizio
      const startMinutes = orarioInizio.split(':').map(Number).reduce((acc, val, i) => i === 0 ? val * 60 : acc + val, 0);
      const endMinutes = orarioFine.split(':').map(Number).reduce((acc, val, i) => i === 0 ? val * 60 : acc + val, 0);

      if (endMinutes <= startMinutes && endMinutes !== 0) {
        if (startMinutes - endMinutes >= 24 * 60) {
          alert('L\'orario di fine deve essere successivo all\'orario di inizio.');
          return;
        }
      }

      // Calcola le ore totali tra inizio e fine
      const hoursWorked = calculateHoursBetween(orarioInizio, orarioFine);

      // Calcola le ore effettive considerando la pausa
      let effectiveHours = hoursWorked;

      if (pausaIncluded && hoursWorked >= 6) {
        effectiveHours = hoursWorked - 0.5;
      }

      onSave({
        mode: 'lavora',
        orarioInizio: orarioInizio,
        orarioFine: orarioFine,
        effectiveHours: effectiveHours
      });
    } else {
      // Modalità "a casa" - validazione
      if (isNessunaMotivazione) {
        alert('Seleziona una motivazione valida.');
        return;
      }

      if (!abbr) {
        alert('La sigla è obbligatoria.');
        return;
      }

      onSave({
        mode: 'aCasa',
        motivo,
        abbr
      });
    }
  };

  // Gestione cambio orario inizio
  const handleStartTimeChange = (value) => {
    setOrarioInizio(value);

    if (orarioFine) {
      const hours = calculateHoursBetween(value, orarioFine);
      setTotalHours(hours);
      setTheoreticalHours(hours);

      if (hours >= 6) {
        setShowPausaOption(true);
      } else {
        setShowPausaOption(false);
        setPausaIncluded(false);
      }
    }
  };

  // Gestione cambio orario fine
  const handleEndTimeChange = (value) => {
    setOrarioFine(value);

    if (orarioInizio) {
      const hours = calculateHoursBetween(orarioInizio, value);
      setTotalHours(hours);
      setTheoreticalHours(hours);

      if (hours >= 6) {
        setShowPausaOption(true);
      } else {
        setShowPausaOption(false);
        setPausaIncluded(false);
      }
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

  // Calcola e formatta le ore effettive considerando la pausa
  const getEffectiveHours = () => {
    if (pausaIncluded && totalHours >= 6) {
      return (totalHours - 0.5).toFixed(2).replace('.', ',');
    }
    return totalHours.toFixed(2).replace('.', ',');
  };

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
                      onChange={(e) => handleStartTimeChange(e.target.value)}
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
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                    >
                      <option value="">Seleziona orario</option>
                      {filteredEndTimes.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>

                  {totalHours > 0 && (
                    <div className="form-group" style={{ marginTop: '10px', color: '#2980b9', fontSize: '0.9em' }}>
                      <i className="fas fa-info-circle"></i> Ore teoriche: {totalHours.toFixed(2).replace('.', ',')} ore
                      {pausaIncluded && totalHours >= 6 && (
                        <>
                          <br />
                          <span style={{ marginLeft: '5px', color: '#e67e22' }}>
                            Ore effettive: {getEffectiveHours()} ore (con pausa)
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {showPausaOption && (
                    <div className="form-group" style={{ marginTop: '15px', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', border: '1px solid #e9ecef' }}>
                      <label style={{ display: 'flex', alignItems: 'center', color: '#e67e22', fontWeight: 'bold' }}>
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
                          ? " Le ore effettive lavorate saranno ridotte di 30 minuti nel calcolo."
                          : " Attivare questa opzione ridurrà le ore effettive di 30 minuti."}
                      </p>
                    </div>
                  )}
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
                      onChange={(e) => handleMotivoChange(e.target.value)}
                      required
                    >
                      {motivazioni.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="abbr">Sigla</label>
                    <input
                      type="text"
                      id="abbr"
                      maxLength="10"
                      placeholder="Sigla"
                      value={abbr}
                      onChange={(e) => setAbbr(e.target.value)}
                      disabled={isNessunaMotivazione}
                      style={{ 
                        backgroundColor: !isNessunaMotivazione ? '#f8f9fa' : '#fff',
                        color: !isNessunaMotivazione ? '#6c757d' : '#495057'
                      }}
                    />
                    <small className="info-text">
                      {!isNessunaMotivazione
                        ? 'La sigla viene impostata automaticamente. Puoi modificarla se necessario.' 
                        : 'Seleziona una motivazione per vedere la sigla automatica'
                      }
                    </small>
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
            disabled={mode === 'aCasa' && (isNessunaMotivazione || !abbr)}
          >
            <i className="fas fa-check"></i> Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default CellPopup;