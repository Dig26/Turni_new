import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux'; // Aggiungi questa riga
import { saveNegozio, getNegozioById } from '../services/negoziService'; // Importante: cambiato da negoziAPI a negoziService
import '../styles/NegozioForm.css';

function NegozioForm({ negozioId }) {
    // Aggiungi questa riga per ottenere l'utente corrente dallo stato Redux
    const user = useSelector(state => state.auth.user);
    
    const [formData, setFormData] = useState({
        nome: '',
        paese: 'IT',
        citta: '',
        settore: 'commercio',
        orarioApertura: '09:00',
        orarioChiusura: '18:00',
        giorniLavorativi: 6,
        giorniFissiLiberi: [],
        user_id: user?.id // Aggiungi questa proprietà per il campo user_id richiesto dal database
    });

    const [loading, setLoading] = useState(negozioId ? true : false);
    const [error, setError] = useState('');
    const [showGiorniFissi, setShowGiorniFissi] = useState(false);
    const navigate = useNavigate();

    const giorniSettimana = [
        { value: 'lunedi', label: 'Lunedì' },
        { value: 'martedi', label: 'Martedì' },
        { value: 'mercoledi', label: 'Mercoledì' },
        { value: 'giovedi', label: 'Giovedì' },
        { value: 'venerdi', label: 'Venerdì' },
        { value: 'sabato', label: 'Sabato' },
        { value: 'domenica', label: 'Domenica' },
    ];

    // Aggiornati i settori in base ai dati del PDF
    const settoriOptions = [
        { value: 'sanita', label: 'Sanità (Pubblica e Privata)' },
        { value: 'commercio', label: 'Commercio e Grande Distribuzione' },
        { value: 'metalmeccanico', label: 'Metalmeccanico' },
        { value: 'logistica', label: 'Logistica e Trasporti' },
        { value: 'turismo', label: 'Turismo e Ristorazione' },
    ];

    // Aggiungi questo effect per aggiornare user_id quando l'utente cambia
    useEffect(() => {
        if (user && user.id) {
            setFormData(prev => ({
                ...prev,
                user_id: user.id
            }));
        }
    }, [user]);

    useEffect(() => {
        // Se è una modifica, carica i dati del negozio
        if (negozioId) {
            const fetchNegozio = async () => {
                try {
                    const negozio = await getNegozioById(negozioId);
                    
                    // Assicurati che user_id sia presente
                    const negozioConUserID = {
                        ...negozio,
                        user_id: negozio.user_id || user?.id
                    };
                    
                    setFormData(negozioConUserID);
                    setShowGiorniFissi(negozio.giorniFissiLiberi && negozio.giorniFissiLiberi.length > 0);
                } catch (error) {
                    console.error('Errore nel caricamento del negozio:', error);
                    setError('Errore nel caricamento del negozio.');
                } finally {
                    setLoading(false);
                }
            };

            fetchNegozio();
        }
    }, [negozioId, user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox' && name === 'giorniFissiLiberi') {
            const giorniLiberi = [...formData.giorniFissiLiberi];

            if (checked) {
                giorniLiberi.push(value);
            } else {
                const index = giorniLiberi.indexOf(value);
                if (index !== -1) {
                    giorniLiberi.splice(index, 1);
                }
            }

            setFormData(prev => ({
                ...prev,
                giorniFissiLiberi: giorniLiberi,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validazione
        if (!formData.nome.trim()) {
            setError('Il nome del negozio è obbligatorio.');
            return;
        }

        if (!formData.citta.trim()) {
            setError('La città è obbligatoria.');
            return;
        }

        if (!formData.paese.trim()) {
            setError('Il paese è obbligatorio.');
            return;
        }

        // Verifica che user_id sia presente
        if (!formData.user_id) {
            setError('Errore: Utente non identificato. Effettua il login e riprova.');
            return;
        }

        try {
            console.log("Dati inviati:", formData); // Log per debugging
            await saveNegozio(formData, negozioId);
            navigate('/negozi');
        } catch (error) {
            console.error('Errore nel salvataggio del negozio:', error);
            setError(`Errore nel salvataggio del negozio: ${error.message || 'Riprova.'}`);
        }
    };

    if (loading) {
        return (
            <div className="loading-spinner center">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Caricamento dati negozio...</span>
            </div>
        );
    }

    return (
        <div className="negozio-form-container">
            <div className="page-header">
                <h1>{negozioId ? 'Modifica Negozio' : 'Aggiungi Nuovo Negozio'}</h1>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="negozio-form">
                <div className="form-section">
                    <h3>Informazioni di Base</h3>

                    <div className="form-group">
                        <label htmlFor="nome">Nome Negozio *</label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                            placeholder="Inserisci il nome del negozio"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="paese">Paese *</label>
                            <select
                                id="paese"
                                name="paese"
                                value={formData.paese}
                                onChange={handleChange}
                                required
                            >
                                <option value="IT">Italia</option>
                                <option value="FR">Francia</option>
                                <option value="DE">Germania</option>
                                <option value="UK">Regno Unito</option>
                                <option value="ES">Spagna</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="citta">Città *</label>
                            <input
                                type="text"
                                id="citta"
                                name="citta"
                                value={formData.citta}
                                onChange={handleChange}
                                required
                                placeholder="Inserisci la città"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="settore">Settore *</label>
                        <select
                            id="settore"
                            name="settore"
                            value={formData.settore}
                            onChange={handleChange}
                            required
                        >
                            {settoriOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <small className="helper-text">
                            Tutti i settori prevedono una pausa obbligatoria di 30 minuti se si lavora più di 6 ore.
                        </small>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Orari e Giorni Lavorativi</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="orarioApertura">Orario Apertura</label>
                            <input
                                type="time"
                                id="orarioApertura"
                                name="orarioApertura"
                                value={formData.orarioApertura}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="orarioChiusura">Orario Chiusura</label>
                            <input
                                type="time"
                                id="orarioChiusura"
                                name="orarioChiusura"
                                value={formData.orarioChiusura}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="giorniLavorativi">
                            Numero Giorni Lavorativi Settimanali
                        </label>
                        <select
                            id="giorniLavorativi"
                            name="giorniLavorativi"
                            value={formData.giorniLavorativi}
                            onChange={handleChange}
                        >
                            {[5, 6, 7].map((num) => (
                                <option key={num} value={num}>
                                    {num} giorni
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group checkbox-group">
                        <div className="checkbox-header">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={showGiorniFissi}
                                    onChange={() => setShowGiorniFissi(!showGiorniFissi)}
                                />
                                Giorni fissi liberi
                            </label>
                        </div>

                        {showGiorniFissi && (
                            <div className="giorni-checkbox-container">
                                <p className="helper-text">
                                    Seleziona i giorni in cui il negozio è chiuso regolarmente:
                                </p>

                                {giorniSettimana.map((giorno) => (
                                    <label key={giorno.value} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="giorniFissiLiberi"
                                            value={giorno.value}
                                            checked={formData.giorniFissiLiberi && formData.giorniFissiLiberi.includes(
                                                giorno.value
                                            )}
                                            onChange={handleChange}
                                        />
                                        {giorno.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/negozi')}
                    >
                        Annulla
                    </button>
                    <button type="submit" className="btn-primary">
                        {negozioId ? 'Aggiorna Negozio' : 'Crea Negozio'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NegozioForm;