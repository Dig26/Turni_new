import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSmartNavigation } from '../hooks/useSmartNavigation';
import { getNegozi } from '../services/api/negoziAPI';
import { getAvailableShops } from '../services/userService';
import { DashboardHeader, NegozioCard } from '../components/dashboard';
import '../styles/Dashboard.css';

const DashboardPage = () => {
  const [negozi, setNegozi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableShops, setAvailableShops] = useState(0);
  const [loadingShops, setLoadingShops] = useState(true);
  const { user } = useAuth();
  const { goToCreateShop, goToShopsList, isChecking } = useSmartNavigation();
  
  // Fetch negozi esistenti
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
    
    if (user) {
      fetchNegozi();
    }
  }, [user]);

  // Fetch negozi disponibili
  useEffect(() => {
    const fetchAvailableShops = async () => {
      try {
        const shops = await getAvailableShops();
        setAvailableShops(shops);
      } catch (error) {
        console.error('Errore nel recupero dei negozi disponibili:', error);
      } finally {
        setLoadingShops(false);
      }
    };
    
    if (user) {
      fetchAvailableShops();
    }
  }, [user]);
  
  return (
    <div className="dashboard">
      <DashboardHeader 
        user={user}
        onAddNegozio={goToCreateShop}
        onViewAllNegozi={goToShopsList}
        availableShops={availableShops}
        loadingShops={loadingShops || isChecking}
      />
      
      <div className="dashboard-content">
        <div className="content-header">
          <h2>I tuoi negozi recenti</h2>
          
          {/* Badge dei negozi disponibili */}
          {!loadingShops && (
            <div className="available-shops-badge">
              {availableShops > 0 ? (
                <div className="badge success">
                  <i className="fas fa-check-circle"></i>
                  {availableShops} {availableShops === 1 ? 'negozio disponibile' : 'negozi disponibili'}
                </div>
              ) : (
                <div className="badge info">
                  <i className="fas fa-info-circle"></i>
                  Nessun negozio disponibile
                </div>
              )}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Caricamento negozi...</span>
          </div>
        ) : negozi.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-store"></i>
            <h3>Nessun negozio trovato</h3>
            
            {loadingShops || isChecking ? (
              <p>Verifica dei negozi disponibili in corso...</p>
            ) : availableShops > 0 ? (
              <>
                <p>{`Hai ${availableShops} ${availableShops === 1 ? 'negozio disponibile' : 'negozi disponibili'} nel tuo abbonamento.`}</p>
                <p>Inizia creando il tuo primo negozio!</p>
              </>
            ) : (
              <p>Non hai negozi disponibili. Inizia acquistando un abbonamento.</p>
            )}
            
            <button 
              className="btn-primary" 
              onClick={goToCreateShop}
              disabled={loadingShops || isChecking}
            >
              {loadingShops || isChecking ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Verifica...
                </>
              ) : availableShops > 0 ? (
                <>
                  <i className="fas fa-plus"></i> Crea Negozio
                </>
              ) : (
                <>
                  <i className="fas fa-shopping-cart"></i> Acquista Abbonamento
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="negozi-grid">
            {negozi.slice(0, 3).map(negozio => (
              <NegozioCard 
                key={negozio.id}
                negozio={negozio} 
              />
            ))}
          </div>
        )}
        
        {negozi.length > 3 && (
          <div className="view-all">
            <button 
              className="btn-text" 
              onClick={goToShopsList}
            >
              Vedi tutti i negozi <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}

        {/* Quick Actions quando ci sono negozi disponibili */}
        {!loading && !loadingShops && !isChecking && availableShops > 0 && negozi.length > 0 && (
          <div className="quick-actions">
            <div className="quick-action-card">
              <div className="quick-action-content">
                <div className="quick-action-info">
                  <h4>🚀 Espandi la tua attività</h4>
                  <p>Hai ancora <strong>{availableShops}</strong> {availableShops === 1 ? 'negozio' : 'negozi'} da creare nel tuo abbonamento.</p>
                </div>
                <button 
                  className="btn-primary btn-sm" 
                  onClick={goToCreateShop}
                  disabled={isChecking}
                >
                  <i className="fas fa-plus"></i> Aggiungi Negozio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;