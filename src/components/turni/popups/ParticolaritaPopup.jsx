// src/components/turni/popups/ParticolaritaPopup.jsx
import React, { useState, useEffect } from 'react';
import '../../../styles/Modal.css';

// Lista predefinita di particolarità disponibili
const particolaritaOptions = [
    // Turni speciali
    { sigla: 'TN', nome: 'Turno notturno', descrizione: 'Lavoro svolto durante le ore notturne (22:00-06:00)', categoria: 'turno', colore: '#3949ab' },
    { sigla: 'STR', nome: 'Straordinario', descrizione: 'Ore di lavoro eccedenti l\'orario normale', categoria: 'turno', colore: '#d81b60' },
    { sigla: 'REP', nome: 'Reperibilità', descrizione: 'Disponibilità al di fuori dell\'orario di lavoro', categoria: 'turno', colore: '#00897b' },
    { sigla: 'FES', nome: 'Festivo', descrizione: 'Lavoro svolto durante un giorno festivo', categoria: 'turno', colore: '#e53935' },
    { sigla: 'FP', nome: 'Festivo pagato', descrizione: 'Festivo pagato anche se non lavorato', categoria: 'turno', colore: '#c62828' },

    // Modalità di lavoro
    { sigla: 'SW', nome: 'Smart working', descrizione: 'Lavoro svolto da remoto', categoria: 'modalità', colore: '#8e24aa' },
    { sigla: 'TR', nome: 'Trasferta', descrizione: 'Spostamento per lavoro fuori dalla sede abituale', categoria: 'modalità', colore: '#6a1b9a' },
    { sigla: 'CLE', nome: 'Cliente esterno', descrizione: 'Lavoro presso sede del cliente', categoria: 'modalità', colore: '#5e35b1' },

    // Formazione
    { sigla: 'FOR', nome: 'Formazione', descrizione: 'Partecipazione a corsi di formazione', categoria: 'formazione', colore: '#43a047' },
    { sigla: 'RIU', nome: 'Riunione', descrizione: 'Partecipazione a riunioni aziendali', categoria: 'formazione', colore: '#2e7d32' },
    { sigla: 'CS', nome: 'Corso sicurezza', descrizione: 'Formazione obbligatoria sulla sicurezza', categoria: 'formazione', colore: '#388e3c' },

    // Assenze giustificate
    { sigla: 'MAL', nome: 'Malattia', descrizione: 'Assenza per malattia', categoria: 'assenza', colore: '#ef6c00' },
    { sigla: 'PER', nome: 'Permesso', descrizione: 'Permesso retribuito', categoria: 'assenza', colore: '#f57c00' },
    { sigla: 'CP', nome: 'Congedo parentale', descrizione: 'Assenza per cura dei figli', categoria: 'assenza', colore: '#fb8c00' },
    { sigla: 'VM', nome: 'Visita medica', descrizione: 'Assenza per visita medica', categoria: 'assenza', colore: '#ff9800' },

    // Assenze collettive
    { sigla: 'SCI', nome: 'Sciopero', descrizione: 'Assenza per adesione a sciopero', categoria: 'collettiva', colore: '#757575' },
    { sigla: 'ASS', nome: 'Assemblea', descrizione: 'Partecipazione ad assemblea sindacale', categoria: 'collettiva', colore: '#616161' },
    { sigla: 'ASP', nome: 'Aspettativa', descrizione: 'Periodo di aspettativa non retribuita', categoria: 'collettiva', colore: '#424242' },
    { sigla: 'INF', nome: 'Infortunio', descrizione: 'Assenza per infortunio sul lavoro', categoria: 'collettiva', colore: '#e65100' },
    { sigla: 'SE', nome: 'Servizi esterni', descrizione: 'Attività di servizio esterno', categoria: 'altro', colore: '#0277bd' },
];
const categorieParticolarita = [
    { id: 'turno', nome: 'Turni speciali', icona: 'fas fa-clock' },
    { id: 'modalità', nome: 'Modalità di lavoro', icona: 'fas fa-laptop' },
    { id: 'formazione', nome: 'Formazione e riunioni', icona: 'fas fa-graduation-cap' },
    { id: 'assenza', nome: 'Assenze giustificate', icona: 'fas fa-user-clock' },
    { id: 'collettiva', nome: 'Assenze collettive', icona: 'fas fa-users' },
    { id: 'altro', nome: 'Altro', icona: 'fas fa-ellipsis-h' }
];

const ParticolaritaPopup = ({ onClose, onSave, selectedCell, hotInstance }) => {
    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

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
            option.descrizione.toLowerCase().includes(searchLower)
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
                                    backgroundColor: '#3498db',
                                    color: 'white',
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
                                            color: 'white',
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
                                                color: selected.includes(option.sigla) ? '#3498db' : 'inherit'
                                            }}>
                                                {option.nome}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                                                {option.descrizione}
                                            </div>
                                            <div style={{
                                                display: 'inline-block',
                                                marginTop: '5px',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                fontSize: '0.8em',
                                                fontWeight: 'bold',
                                                backgroundColor: selected.includes(option.sigla) ? '#3498db' : '#eef7fb',
                                                color: selected.includes(option.sigla) ? 'white' : '#3498db'
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

export default ParticolaritaPopup;