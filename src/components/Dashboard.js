import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import { getNegozi } from '../services/negoziService';
import '../styles/Dashboard.css';

function Dashboard({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [negozi, setNegozi] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Ottieni l'utente corrente
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Carica i negozi dell'utente
    const fetchNegozi = async () => {
      try {
        const negoziList = await getNegozi();
        setNegozi(negoziList);
      } catch (error) {
        console.error('Errore nel caricamento dei negozi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNegozi();
  }, []);
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Benvenuto, {user?.nome}! Gestisci i tuoi negozi e i turni lavorativi.</p>
      </div>
      
      <div className="dashboard-actions">
        <button 
          className="btn-primary" 
          onClick={() => onNavigate('negozioForm')}
        >
          <i className="fas fa-plus"></i> Aggiungi Nuovo Negozio
        </button>
        
        <button 
          className="btn-secondary" 
          onClick={() => onNavigate('negozi')}
        >
          <i className="fas fa-list"></i> Vedi Tutti i Negozi
        </button>
      </div>
      
      <div className="dashboard-content">
        <h2>I tuoi negozi recenti</h2>
        
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento negozi...</span>
          </div>
        ) : negozi.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-store"></i>
            <h3>Nessun negozio trovato</h3>
            <p>Inizia aggiungendo il tuo primo negozio.</p>
            <button 
              className="btn-primary" 
              onClick={() => onNavigate('negozioForm')}
            >
              Aggiungi Negozio
            </button>
          </div>
        ) : (
          <div className="negozi-grid">
            {negozi.slice(0, 3).map(negozio => (
              <div className="negozio-card" key={negozio.id}>
                <div className="negozio-card-header">
                  <h3>{negozio.nome}</h3>
                  <span className="negozio-location">
                    <i className="fas fa-map-marker-alt"></i>
                    {negozio.citta}, {negozio.paese}
                  </span>
                </div>
                <div className="negozio-card-body">
                  <div className="negozio-info">
                    <div className="info-item">
                      <i className="fas fa-clock"></i>
                      <span>{negozio.orarioApertura} - {negozio.orarioChiusura}</span>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-calendar-week"></i>
                      <span>{negozio.giorniLavorativi} giorni/settimana</span>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-tag"></i>
                      <span>{negozio.settore}</span>
                    </div>
                  </div>
                </div>
                <div className="negozio-card-actions">
                  <button 
                    className="btn-outline" 
                    onClick={() => onNavigate('dipendenti', { negozioId: negozio.id })}
                  >
                    <i className="fas fa-users"></i> Dipendenti
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => onNavigate('turni', { negozioId: negozio.id })}
                  >
                    <i className="fas fa-calendar-alt"></i> Turni
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {negozi.length > 3 && (
          <div className="view-all">
            <button 
              className="btn-text" 
              onClick={() => onNavigate('negozi')}
            >
              Vedi tutti i negozi <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;