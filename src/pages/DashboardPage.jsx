import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getNegozi } from '../services/api/negoziAPI';
import { DashboardHeader, NegozioCard } from '../components/dashboard';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const [negozi, setNegozi] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
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
  
  const handleAddNegozio = () => navigate('/negozi/nuovo');
  const handleViewAllNegozi = () => navigate('/negozi');
  const handleViewDipendenti = (negozioId) => navigate(`/negozi/${negozioId}/dipendenti`);
  const handleViewTurni = (negozioId) => navigate(`/negozi/${negozioId}/turni`);
  
  return (
    <div className="dashboard">
      <DashboardHeader 
        user={user}
        onAddNegozio={handleAddNegozio}
        onViewAllNegozi={handleViewAllNegozi}
      />
      
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
              onClick={handleAddNegozio}
            >
              Aggiungi Negozio
            </button>
          </div>
        ) : (
          <div className="negozi-grid">
            {negozi.slice(0, 3).map(negozio => (
              <NegozioCard 
                key={negozio.id}
                negozio={negozio} 
                onViewDipendenti={handleViewDipendenti}
                onViewTurni={handleViewTurni}
              />
            ))}
          </div>
        )}
        
        {negozi.length > 3 && (
          <div className="view-all">
            <button 
              className="btn-text" 
              onClick={handleViewAllNegozi}
            >
              Vedi tutti i negozi <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;