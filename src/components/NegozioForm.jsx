import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { saveNegozio, getNegozioById } from '../services/negoziService';
import { addNotification } from '../app/slices/uiSlice';
import axios from 'axios';
import '../styles/NegozioForm.css';

function NegozioForm({ negozioId }) {
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        nome: '',
        paese: 'IT',
        citta: '',
        indirizzo: '',
        settore: 'commercio',
        orarioApertura: '09:00',
        orarioChiusura: '18:00',
        giorniLavorativi: 6,
        capoarea: '',
        user_id: user?.id
    });

    const [loading, setLoading] = useState(negozioId ? true : false);
    const [error, setError] = useState('');
    const [pendingShops, setPendingShops] = useState(0);
    const [verifyingSession, setVerifyingSession] = useState(false);

    // Aggiornati i settori in base ai dati del PDF
    const settoriOptions = [
        { value: 'sanita', label: 'Sanità (Pubblica e Privata)' },
        { value: 'commercio', label: 'Commercio e Grande Distribuzione' },
        { value: 'metalmeccanico', label: 'Metalmeccanico' },
        { value: 'logistica', label: 'Logistica e Trasporti' },
        { value: 'turismo', label: 'Turismo e Ristorazione' },
    ];

    // Gestisci il ritorno da Stripe Checkout
    useEffect(() => {
        const checkStripeSession = async () => {
            // Controlla se c'è un session_id nei parametri URL (ritorno da Stripe)
            const urlParams = new URLSearchParams(location.search);
            const sessionId = urlParams.get('session_id');
            
            if (sessionId && !negozioId) {
                setVerifyingSession(true);
                try {
                    // Verifica la sessione con il backend
                    const response = await axios.post('http://localhost:3001/api/verify-session', {
                        sessionId: sessionId
                    });
                    
                    console.log('Sessione verificata:', response.data);
                    
                    if (response.data.status === 'paid' || response.data.status === 'complete') {
                        // Recupera il numero di negozi acquistati
                        const numberOfShops = response.data.numberOfShops || localStorage.getItem('pendingShops');
                        
                        if (numberOfShops) {
                            setPendingShops(parseInt(numberOfShops));
                            localStorage.setItem('pendingShops', numberOfShops);
                        }
                        
                        // Mostra notifica di successo
                        dispatch(addNotification({
                            type: 'success',
                            message: `✅ Abbonamento attivato con successo! Hai ${numberOfShops} negozi disponibili. Inizia creando il tuo primo negozio.`,
                            duration: 7000
                        }));
                        
                        // Pulisci l'URL rimuovendo il session_id
                        window.history.replaceState({}, document.title, '/negozi/nuovo');
                    } else {
                        // Pagamento non completato
                        dispatch(addNotification({
                            type: 'warning',
                            message: 'Il pagamento non è stato completato. Riprova.',
                            duration: 5000
                        }));
                        navigate('/payment');
                    }
                } catch (error) {
                    console.error('Errore nella verifica della sessione:', error);
                    dispatch(addNotification({
                        type: 'error',
                        message: 'Errore nella verifica del pagamento. Contatta il supporto se il problema persiste.',
                        duration: 5000
                    }));
                } finally {
                    setVerifyingSession(false);
                }
            }
        };
        
        checkStripeSession();
    }, [location.search, dispatch, navigate, negozioId]);

    // Effect per controllare i negozi pendenti (quando non c'è session_id)
    useEffect(() => {
        const shops = localStorage.getItem('pendingShops');
        if (shops && !negozioId && !location.search.includes('session_id')) {
            setPendingShops(parseInt(shops));
            
            // Mostra notifica solo se non l'abbiamo già mostrata
            if (!sessionStorage.getItem('pendingShopsNotificationShown')) {
                dispatch(addNotification({
                    type: 'info',
                    message: `📦 Hai ${shops} negozi disponibili da configurare nel tuo abbonamento.`,
                    duration: 5000
                }));
                sessionStorage.setItem('pendingShopsNotificationShown', 'true');
            }
        }
    }, [negozioId, location.search, dispatch]);

    // Effect per aggiornare user_id quando l'utente cambia
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
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
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
            console.log("Dati inviati:", formData);
            await saveNegozio(formData, negozioId);
            
            // Se abbiamo negozi pendenti, decrementa il contatore
            if (pendingShops > 0 && !negozioId) {
                const remaining = pendingShops - 1;
                
                // Mostra notifica di successo
                dispatch(addNotification({
                    type: 'success',
                    message: `✅ Negozio "${formData.nome}" creato con successo!`,
                    duration: 3000
                }));
                
                if (remaining > 0) {
                    localStorage.setItem('pendingShops', remaining);
                    
                    // Usa una notifica invece di window.confirm per un'esperienza migliore
                    setTimeout(() => {
                        dispatch(addNotification({
                            type: 'info',
                            message: `Ti rimangono ancora ${remaining} negozi da creare. Vuoi crearne un altro?`,
                            duration: 5000,
                            action: {
                                label: 'Crea altro negozio',
                                onClick: () => {
                                    // Reset form per il prossimo negozio
                                    setFormData({
                                        nome: '',
                                        paese: 'IT',
                                        citta: '',
                                        indirizzo: '',
                                        settore: 'commercio',
                                        orarioApertura: '09:00',
                                        orarioChiusura: '18:00',
                                        giorniLavorativi: 6,
                                        capoarea: '',
                                        user_id: user?.id
                                    });
                                    setPendingShops(remaining);
                                    window.scrollTo(0, 0);
                                }
                            }
                        }));
                    }, 500);
                    
                    // Dopo 3 secondi, se l'utente non ha cliccato, vai alla lista negozi
                    setTimeout(() => {
                        navigate('/negozi');
                    }, 3500);
                } else {
                    localStorage.removeItem('pendingShops');
                    sessionStorage.removeItem('pendingShopsNotificationShown');
                    dispatch(addNotification({
                        type: 'success',
                        message: '🎉 Tutti i negozi del tuo abbonamento sono stati configurati!',
                        duration: 5000
                    }));
                    navigate('/negozi');
                }
            } else {
                navigate('/negozi');
            }
        } catch (error) {
            console.error('Errore nel salvataggio del negozio:', error);
            setError(`Errore nel salvataggio del negozio: ${error.message || 'Riprova.'}`);
        }
    };

    if (loading || verifyingSession) {
        return (
            <div className="loading-spinner center">
                <i className="fas fa-spinner fa-spin"></i>
                <span>
                    {verifyingSession ? 'Verifica pagamento in corso...' : 'Caricamento dati negozio...'}
                </span>
            </div>
        );
    }

    return (
        <div className="negozio-form-container">
            <div className="page-header">
                <h1>{negozioId ? 'Modifica Negozio' : 'Aggiungi Nuovo Negozio'}</h1>
                {pendingShops > 0 && !negozioId && (
                    <div className="pending-shops-info">
                        <i className="fas fa-shopping-cart"></i>
                        Hai ancora <strong>{pendingShops} {pendingShops === 1 ? 'negozio' : 'negozi'}</strong> da creare con il tuo abbonamento.
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            )}

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
                        <label htmlFor="indirizzo">Indirizzo</label>
                        <input
                            type="text"
                            id="indirizzo"
                            name="indirizzo"
                            value={formData.indirizzo || ''}
                            onChange={handleChange}
                            placeholder="Inserisci l'indirizzo (opzionale)"
                        />
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

                    <div className="form-group">
                        <label htmlFor="capoarea">Capoarea</label>
                        <input
                            type="text"
                            id="capoarea"
                            name="capoarea"
                            value={formData.capoarea || ''}
                            onChange={handleChange}
                            placeholder="Inserisci il nome del capoarea (opzionale)"
                        />
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