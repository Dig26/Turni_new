import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNegozioById } from '../services/api/negoziAPI';
import '../styles/TurniList.css';

function TurniAllPage() {
    const { negozioId } = useParams();
    const navigate = useNavigate();
    
    const [negozio, setNegozio] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savedTables, setSavedTables] = useState([]);
    
    // Nomi dei mesi in italiano
    const mesi = [
        "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ];
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Carica il negozio
                const negozioData = await getNegozioById(negozioId);
                setNegozio(negozioData);
                
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
            
            // Ordina per anno (decrescente) e poi per mese (crescente)
            savedTablesArray.sort((a, b) => {
                if (a.year !== b.year) {
                    return parseInt(b.year) - parseInt(a.year); // Prima gli anni più recenti
                }
                return parseInt(a.month) - parseInt(b.month); // Poi i mesi in ordine crescente
            });
            
            setSavedTables(savedTablesArray);
        } catch (error) {
            console.error('Errore nel caricamento delle tabelle salvate:', error);
        }
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
    
    // Funzione per organizzare le tabelle per anno
    const organizeTablesByYear = () => {
        const organizedTables = {};
        
        // Raggruppa le tabelle per anno
        savedTables.forEach(table => {
            if (!organizedTables[table.year]) {
                organizedTables[table.year] = [];
            }
            organizedTables[table.year].push(table);
        });
        
        // Ordina gli anni in ordine decrescente (più recenti prima)
        const sortedYears = Object.keys(organizedTables).sort((a, b) => b - a);
        
        return { organizedTables, sortedYears };
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
    
    const { organizedTables, sortedYears } = organizeTablesByYear();
    
    return (
        <div className="turni-list-container">
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
                            onClick={() => navigate(`/negozi/${negozioId}`)}
                        >
                            {negozio?.nome || 'Negozio'}
                        </button>
                        <i className="fas fa-chevron-right"></i>
                        <button
                            className="btn-link"
                            onClick={() => navigate(`/negozi/${negozioId}/turni`)}
                        >
                            Turni
                        </button>
                        <i className="fas fa-chevron-right"></i>
                        <span>Archivio</span>
                    </div>
                    <h1>Archivio Turni</h1>
                    <p>Visualizza tutti i turni di lavoro per {negozio?.nome || 'il negozio selezionato'}</p>
                </div>
                
                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => navigate(`/negozi/${negozioId}/turni`)}
                    >
                        <i className="fas fa-arrow-left"></i> Torna alla Gestione Turni
                    </button>
                </div>
            </div>
            
            {/* Elenco delle tabelle salvate organizzate per anno */}
            <div className="tabelle-salvate-container">
                <h3>Tutte le tabelle turni</h3>
                
                {savedTables.length === 0 ? (
                    <div className="no-tabelle-message">
                        <i className="fas fa-info-circle"></i>
                        <p>Non ci sono ancora tabelle turni salvate.</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate(`/negozi/${negozioId}/turni`)}
                        >
                            <i className="fas fa-plus-circle"></i> Crea Nuova Tabella
                        </button>
                    </div>
                ) : (
                    sortedYears.map(year => (
                        <div key={year} className="tabelle-year-section">
                            <h4 className="tabelle-year-header">{year}</h4>
                            <div className="tabelle-grid">
                                {organizedTables[year].map((table) => (
                                    <div
                                        key={table.id}
                                        className="tabella-card"
                                        onClick={() => handleOpenTable(table.id)}
                                    >
                                        <div className="tabella-card-header">
                                            <h4>{table.monthName}</h4>
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
                        </div>
                    ))
                )}
            </div>
            
            {/* Link per tornare alla gestione turni */}
            <div className="back-link-container">
                <button
                    className="btn-primary"
                    onClick={() => navigate(`/negozi/${negozioId}/turni`)}
                >
                    <i className="fas fa-arrow-left"></i> Torna alla Gestione Turni
                </button>
            </div>
        </div>
    );
}

export default TurniAllPage;