import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNegozioById } from '../services/api/negoziAPI';
import { getDipendentiByNegozioId } from '../services/api/dipendentiAPI';
import '../styles/TabellaTurni.css';

function TabellaTurni({ negozioId, anno, mese }) {
    const [negozio, setNegozio] = useState(null);
    const [dipendenti, setDipendenti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(mese ? parseInt(mese) : new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(anno ? parseInt(anno) : new Date().getFullYear());
    const [showTable, setShowTable] = useState(!!anno && !!mese);
    const [savedTables, setSavedTables] = useState([]);
    const [saveMessage, setSaveMessage] = useState('');

    const iframeRef = useRef(null);
    const navigate = useNavigate();

    // Nomi dei mesi in italiano
    const mesi = [
        "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];

    // Genera gli anni per il selettore (da 2 anni fa a 2 anni in avanti)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Carica il negozio
                const negozioData = await getNegozioById(negozioId);
                setNegozio(negozioData);

                // Carica i dipendenti del negozio
                const dipendentiList = await getDipendentiByNegozioId(negozioId);
                setDipendenti(dipendentiList);

                // Carica l'elenco delle tabelle salvate
                loadSavedTablesList();

            } catch (error) {
                console.error('Errore nel caricamento dei dati:', error);
                setError('Errore nel caricamento dei dati. Riprova più tardi.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [negozioId]);

    // Funzione per caricare l'elenco delle tabelle salvate
    const loadSavedTablesList = () => {
        try {
            const savedTablesArray = [];

            // Cerca tutte le chiavi nel localStorage che iniziano con il prefisso
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`tabella_turni_${negozioId}_`)) {
                    try {
                        const savedData = JSON.parse(localStorage.getItem(key));
                        if (savedData && savedData.timestamp) {
                            // Estrai anno e mese dalla chiave
                            const keyParts = key.split('_');
                            const year = keyParts[3];
                            const month = keyParts[4];

                            // Nome del mese
                            const monthName = mesi[parseInt(month)];

                            savedTablesArray.push({
                                id: key,
                                year: year,
                                month: month,
                                monthName: monthName,
                                timestamp: savedData.timestamp,
                                name: `${monthName} ${year}`
                            });
                        }
                    } catch (e) {
                        console.error('Errore nella lettura della tabella salvata:', e);
                    }
                }
            }

            // Ordina per data, più recenti prima
            savedTablesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            setSavedTables(savedTablesArray);
        } catch (error) {
            console.error('Errore nel caricamento delle tabelle salvate:', error);
        }
    };

    // Funzione per comunicare con l'iframe
    const sendMessageToIframe = (message) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(message, window.location.origin);
        }
    };

    // Ascolta i messaggi provenienti dall'iframe
    useEffect(() => {
        const handleMessage = (event) => {
            // Verifica che il messaggio provenga dal nostro dominio
            if (event.origin !== window.location.origin) return;

            // Gestisci i vari tipi di messaggi
            if (event.data.type === 'SAVE_DATA') {
                saveTableData(event.data.payload);
            } else if (event.data.type === 'SAVE_SUCCESS') {
                setSaveMessage('Turni salvati con successo!');
                setTimeout(() => setSaveMessage(''), 3000);

                // Ricarica l'elenco delle tabelle salvate
                loadSavedTablesList();
            } else if (event.data.type === 'SAVE_ERROR') {
                setSaveMessage('Errore nel salvataggio: ' + event.data.message);
                setTimeout(() => setSaveMessage(''), 5000);
            } else if (event.data.type === 'NAVIGATE_BACK') {
                handleBackToList();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [negozioId]);

    // Funzione per salvare i dati della tabella
    const saveTableData = (data) => {
        try {
            // Crea una chiave specifica per questo negozio e periodo
            const storageKey = `tabella_turni_${negozioId}_${selectedYear}_${selectedMonth}`;

            // Salva i dati nella localStorage
            localStorage.setItem(storageKey, JSON.stringify({
                data: data,
                timestamp: new Date().toISOString(),
                negozioId: negozioId
            }));

            // Aggiorna l'elenco delle tabelle salvate
            loadSavedTablesList();

            // Mostra messaggio di successo
            setSaveMessage('Turni salvati con successo!');
            setTimeout(() => setSaveMessage(''), 3000);

            // Invia messaggio di successo all'iframe
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'SAVE_SUCCESS'
                }, window.location.origin);
            }

            return Promise.resolve(true);
        } catch (error) {
            console.error('Errore nel salvataggio dei dati:', error);

            // Mostra messaggio di errore
            setSaveMessage('Errore nel salvataggio: ' + (error.message || String(error)));
            setTimeout(() => setSaveMessage(''), 5000);

            // Invia messaggio di errore all'iframe
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'SAVE_ERROR',
                    message: error.message || String(error)
                }, window.location.origin);
            }

            return Promise.reject(error);
        }
    };

    // Gestione del cambio mese/anno
    const handleMonthChange = (e) => {
        setSelectedMonth(parseInt(e.target.value, 10));
    };

    const handleYearChange = (e) => {
        setSelectedYear(parseInt(e.target.value, 10));
    };

    // Gestione creazione nuova tabella
    const handleCreateTable = () => {
        setShowTable(true);
    };

    // Gestione ritorno alla lista
    const handleBackToList = () => {
        setShowTable(false);
        // Ricarica l'elenco delle tabelle salvate
        loadSavedTablesList();
    };

    // Gestione apertura tabella esistente
    const handleOpenTable = (tableId) => {
        // Estrai anno e mese dall'ID della tabella
        const parts = tableId.split('_');
        const year = parseInt(parts[3], 10);
        const month = parseInt(parts[4], 10);

        // Naviga alla pagina specifica per questo periodo
        navigate(`/negozi/${negozioId}/turni/${year}/${month}`);
    };

    // Gestione eliminazione tabella
    const handleDeleteTable = (tableId, event) => {
        event.stopPropagation(); // Impedisce di aprire la tabella al click

        if (window.confirm('Sei sicuro di voler eliminare questa tabella dei turni?')) {
            try {
                localStorage.removeItem(tableId);
                setSavedTables(savedTables.filter(table => table.id !== tableId));
            } catch (error) {
                console.error('Errore nell\'eliminazione della tabella:', error);
                alert('Errore nell\'eliminazione della tabella.');
            }
        }
    };

    // Funzione per navigare alla pagina con tutti i turni
    const handleViewAllTables = () => {
        navigate(`/negozi/${negozioId}/turni/all`);
    };

    // Formatta la data in modo leggibile
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="loading-spinner center">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Caricamento dati...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
            </div>
        );
    }

    // Visualizza la pagina con la tabella
    if (showTable) {
        // URL per l'iframe con i parametri
        const iframeUrl = `/tabella-turni/index.html?negozioId=${negozioId}&month=${selectedMonth}&year=${selectedYear}`;

        return (
            <div className="tabella-turni-container">
                <div className="page-header">
                    <div>
                        <div className="breadcrumb">
                            <button
                                className="btn-link"
                                onClick={() => navigate('/negozi')}
                            >
                                Negozi
                            </button>
                            <i className="fas fa-chevron-right"></i>
                            <button
                                className="btn-link"
                                onClick={handleBackToList}
                            >
                                Turni
                            </button>
                            <i className="fas fa-chevron-right"></i>
                            <span>{mesi[selectedMonth]} {selectedYear}</span>
                        </div>
                        <h1>Tabella Turni: {mesi[selectedMonth]} {selectedYear}</h1>
                        <p>Gestisci i turni di lavoro per {negozio?.nome}</p>
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn-secondary"
                            onClick={handleBackToList}
                        >
                            <i className="fas fa-arrow-left"></i> Torna alla Lista
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
                        >
                            <i className="fas fa-users"></i> Gestisci Dipendenti
                        </button>
                    </div>
                </div>

                {/* Messaggio di salvataggio */}
                {saveMessage && (
                    <div className={`save-message ${saveMessage.includes('Errore') ? 'error' : 'success'}`}>
                        <i className={saveMessage.includes('Errore') ? 'fas fa-times-circle' : 'fas fa-check-circle'}></i>
                        <span>{saveMessage}</span>
                    </div>
                )}

                {/* Contenitore per l'iframe che carica la pagina della tabella */}
                <div className="tabella-iframe-container">
                    <iframe
                        ref={iframeRef}
                        src={iframeUrl}
                        title="Tabella Turni"
                        className="tabella-iframe"
                    />
                </div>

                {/* Istruzioni e legenda */}
                <div className="tabella-istruzioni">
                    <h3>Istruzioni</h3>
                    <div className="istruzioni-content">
                        <ul>
                            <li>Clicca su una cella per inserire o modificare un turno</li>
                            <li>Usa il pulsante "Salva" per memorizzare i dati</li>
                            <li>Per uscire e tornare alla lista, usa il pulsante "Torna alla Lista"</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Filtra solo gli ultimi 5 turni per mostrarli nella pagina principale
    const recentTables = savedTables.slice(0, 5);

    // Visualizza la pagina con l'elenco delle tabelle salvate
    return (
        <div className="tabella-turni-container">
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <button
                            className="btn-link"
                            onClick={() => navigate('/negozi')}
                        >
                            Negozi
                        </button>
                        <i className="fas fa-chevron-right"></i>
                        <span>Turni</span>
                    </div>
                    <h1>Gestione Turni</h1>
                    <p>Gestisci i turni di lavoro per {negozio?.nome}</p>
                </div>

                <div className="header-actions">
                    <button
                        className="btn-primary"
                        onClick={handleViewAllTables}
                        title="Visualizza tutti i turni ordinati per anno e mese"
                    >
                        <i className="fas fa-calendar-alt"></i> Visualizza Tutti i Turni
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
                    >
                        <i className="fas fa-users"></i> Gestisci Dipendenti
                    </button>
                </div>
            </div>

            {/* Form per creare una nuova tabella */}
            <div className="crea-tabella-container">
                <h3>Crea nuova tabella turni</h3>
                <div className="crea-tabella-form">
                    <div className="form-group">
                        <label htmlFor="selectMonth">Mese:</label>
                        <select
                            id="selectMonth"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                        >
                            {mesi.map((nomeMese, index) => (
                                <option key={index} value={index}>{nomeMese}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="selectYear">Anno:</label>
                        <select
                            id="selectYear"
                            value={selectedYear}
                            onChange={handleYearChange}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleCreateTable}
                        disabled={dipendenti.length === 0}
                    >
                        <i className="fas fa-calendar-plus"></i> Crea Tabella
                    </button>
                </div>

                {dipendenti.length === 0 && (
                    <div className="no-dipendenti-warning">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>
                            Non ci sono dipendenti configurati per questo negozio.
                            <button
                                className="btn-link"
                                onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
                            >
                                Aggiungi dipendenti
                            </button>
                        </span>
                    </div>
                )}
            </div>

            {/* Elenco delle tabelle salvate (solo le ultime 5) */}
            <div className="tabelle-salvate-container">
                <div className="tabelle-header">
                    <h3>Tabelle turni recenti</h3>
                    <button
                        className="btn-link view-all"
                        onClick={handleViewAllTables}
                    >
                        Visualizza tutti <i className="fas fa-arrow-right"></i>
                    </button>
                </div>

                {recentTables.length === 0 ? (
                    <div className="no-tabelle-message">
                        <i className="fas fa-info-circle"></i>
                        <p>Non ci sono ancora tabelle turni salvate. Crea la tua prima tabella!</p>
                    </div>
                ) : (
                    <div className="tabelle-grid">
                        {recentTables.map((table) => (
                            <div
                                key={table.id}
                                className="tabella-card"
                                onClick={() => handleOpenTable(table.id)}
                            >
                                <div className="tabella-card-header">
                                    <h4>{table.name}</h4>
                                    <button
                                        className="btn-icon btn-delete"
                                        onClick={(e) => handleDeleteTable(table.id, e)}
                                        title="Elimina tabella"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div className="tabella-card-body">
                                    <div className="tabella-info">
                                        <i className="fas fa-clock"></i>
                                        <span>Ultimo aggiornamento: {formatDate(table.timestamp)}</span>
                                    </div>
                                </div>
                                <div className="tabella-card-footer">
                                    <span className="view-prompt">Clicca per visualizzare <i className="fas fa-arrow-right"></i></span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info sui dipendenti */}
            {dipendenti.length > 0 && (
                <div className="dipendenti-info-container">
                    <h3>Dipendenti del negozio</h3>
                    <div className="dipendenti-mini-list">
                        {dipendenti.map(dipendente => (
                            <div key={dipendente.id} className="dipendente-mini-card">
                                <div className="dipendente-avatar">
                                    {dipendente.nome ? dipendente.nome.charAt(0) : '?'}
                                </div>
                                <div className="dipendente-mini-info">
                                    <div className="dipendente-mini-nome">{dipendente.nome} {dipendente.cognome}</div>
                                    <div className="dipendente-mini-ore">{dipendente.oreSettimanali || 40} ore/settimana</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="dipendenti-actions">
                        <button
                            className="btn-primary"
                            onClick={() => navigate(`/negozi/${negozioId}/dipendenti/nuovo`)}
                        >
                            <i className="fas fa-plus"></i> Aggiungi Dipendente
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => navigate(`/negozi/${negozioId}/dipendenti`)}
                        >
                            <i className="fas fa-list"></i> Visualizza Tutti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TabellaTurni;