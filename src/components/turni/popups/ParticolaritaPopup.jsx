// src/components/turni/popups/ParticolaritaPopup.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../../../styles/Modal.css';

// Lista vuota di particolarità predefinite
const defaultParticolaritaOptions = [];

// Rimosso categorie predefinite
const categorieParticolarita = [];

const ParticolaritaPopup = ({ onClose, onSave, selectedCell, hotInstance, negozioId }) => {
    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Ottieni le particolarità personalizzate del negozio dallo store Redux
    const particolaritaCustom = useSelector(state => 
        state.particolarita.items[negozioId] || []);
    
    // Combina le particolarità predefinite con quelle personalizzate
    const particolaritaOptions = [...defaultParticolaritaOptions];
    
    // Aggiungi le particolarità personalizzate, sovrascrivendo quelle predefinite con la stessa sigla
    particolaritaCustom.forEach(customOption => {
        const existingIndex = particolaritaOptions.findIndex(opt => opt.sigla === customOption.sigla);
        if (existingIndex !== -1) {
            particolaritaOptions[existingIndex] = { ...customOption };
        } else {
            particolaritaOptions.push({ ...customOption });
        }
    });

    useEffect(() => {
        // Se la cella ha già un valore, caricalo
        if (selectedCell && hotInstance) {
            const { row, col } = selectedCell;
            const cellValue = hotInstance.getDataAtCell(row, col);

            if (cellValue && cellValue.trim() !== '') {
                // Split per il simbolo "+" e prendi le sigle
                const sigle = cellValue.split('+').map(s => s.trim());
                setSelected(sigle);
            }
        }
    }, [selectedCell, hotInstance]);

    const handleItemToggle = (sigla) => {
        if (selected.includes(sigla)) {
            // Rimuovi dalla selezione
            setSelected(selected.filter(s => s !== sigla));
        } else {
            // Aggiungi alla selezione
            setSelected([...selected, sigla]);
        }
    };

    const handleSubmit = () => {
        onSave({
            selected: selected
        });
    };

    const handleReset = () => {
        setSelected([]);
    };

    // Filtra le opzioni in base al termine di ricerca
    const filteredOptions = particolaritaOptions.filter(option => {
        const searchLower = searchTerm.toLowerCase();
        return (
            option.sigla.toLowerCase().includes(searchLower) ||
            option.nome.toLowerCase().includes(searchLower) ||
            (option.descrizione && option.descrizione.toLowerCase().includes(searchLower))
        );
    });

    // Estrai giorno e data per il titolo
    let headerTitle = 'Particolarità';

    if (selectedCell && hotInstance) {
        const { row, col } = selectedCell;
        const dayOfWeek = hotInstance.getDataAtCell(row, 0);
        const dayOfMonth = hotInstance.getDataAtCell(row, 1);

        headerTitle = `Particolarità: ${dayOfWeek} ${dayOfMonth}`;
    }

    // Non raggruppiamo più per categoria
    const allOptions = filteredOptions;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3><i className="fas fa-tag"></i> {headerTitle}</h3>
                </div>

                <div className="modal-body" style={{ maxHeight: 'calc(90vh - 160px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div className="search-container" style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cerca particolarità..."
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }}
                        />
                    </div>

                    <div className="selected-items" style={{
                        display: selected.length ? 'flex' : 'none',
                        flexWrap: 'wrap',
                        gap: '5px',
                        marginBottom: '10px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px'
                    }}>
                        {selected.map(sigla => {
                            const option = particolaritaOptions.find(opt => opt.sigla === sigla);
                            return (
                                <span key={sigla} style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    backgroundColor: option?.colore || '#3498db',
                                    color: getContrastColor(option?.colore || '#3498db'),
                                    padding: '5px 8px',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}>
                                    {option ? option.nome : sigla}
                                    <button
                                        onClick={() => handleItemToggle(sigla)}
                                        style={{
                                            marginLeft: '5px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            color: getContrastColor(option?.colore || '#3498db'),
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '18px',
                                            height: '18px',
                                            padding: 0,
                                            borderRadius: '50%'
                                        }}
                                    >
                                        <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                                    </button>
                                </span>
                            );
                        })}
                    </div>

                    <div className="items-list" style={{
                        overflowY: 'auto',
                        flex: 1,
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#7f8c8d'
                            }}>
                                Nessuna particolarità trovata con il termine di ricerca: "{searchTerm}"
                            </div>
                        ) : (
                            filteredOptions.map(option => (
                                <div
                                    key={option.sigla}
                                    className="item"
                                    style={{
                                        padding: '10px',
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        backgroundColor: selected.includes(option.sigla) ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
                                    }}
                                    onClick={() => handleItemToggle(option.sigla)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(option.sigla)}
                                            onChange={() => { }}
                                            style={{ marginRight: '10px', marginTop: '3px' }}
                                        />
                                        <div>
                                            <div style={{
                                                fontWeight: 'bold',
                                                marginBottom: '3px',
                                                color: selected.includes(option.sigla) ? option.colore || '#3498db' : 'inherit'
                                            }}>
                                                {option.nome}
                                            </div>
                                            {option.descrizione && (
                                                <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                                                    {option.descrizione}
                                                </div>
                                            )}
                                            <div style={{
                                                display: 'inline-block',
                                                marginTop: '5px',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                fontSize: '0.8em',
                                                fontWeight: 'bold',
                                                backgroundColor: selected.includes(option.sigla) ? option.colore || '#3498db' : '#eef7fb',
                                                color: selected.includes(option.sigla) ? getContrastColor(option.colore || '#3498db') : option.colore || '#3498db'
                                            }}>
                                                {option.sigla}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {selected.length > 0 && (
                        <div style={{
                            marginTop: '10px',
                            fontSize: '0.9em',
                            color: '#7f8c8d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            <i className="fas fa-info-circle"></i>
                            <span>Selezionato: {selected.length} {selected.length === 1 ? 'particolarità' : 'particolarità'}</span>
                        </div>
                    )}
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

// Funzione di utilità per determinare il colore del testo in base al colore di sfondo
function getContrastColor(hexColor) {
  // Converte il colore HEX in RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // Calcola la luminosità
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Se la luminosità è alta, usa il testo scuro, altrimenti usa il testo chiaro
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default ParticolaritaPopup;