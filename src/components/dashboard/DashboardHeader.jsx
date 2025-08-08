// src/components/dashboard/DashboardHeader.jsx
import React from 'react';

const DashboardHeader = ({ 
  user, 
  onAddNegozio, 
  onViewAllNegozi, 
  availableShops = 0, 
  loadingShops = false 
}) => {
  // Determina il testo del bottone in base ai negozi disponibili
  const getButtonText = () => {
    if (loadingShops) {
      return (
        <>
          <i className="fas fa-spinner fa-spin"></i> Verifica...
        </>
      );
    }
    
    if (availableShops > 0) {
      return (
        <>
          <i className="fas fa-plus"></i> Aggiungi Negozio
        </>
      );
    }
    
    return (
      <>
        <i className="fas fa-shopping-cart"></i> Acquista Abbonamento
      </>
    );
  };

  // Determina la classe CSS del bottone
  const getButtonClass = () => {
    if (loadingShops) return 'btn-primary loading';
    if (availableShops > 0) return 'btn-primary';
    return 'btn-primary purchase';
  };

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="welcome-section">
          <h1>
            Benvenuto, <span className="user-name">{user?.nome || 'Utente'}</span>! 👋
          </h1>
          <p className="welcome-subtitle">
            Gestisci i tuoi negozi e il personale da un unico posto
          </p>
          
          {/* Info negozi disponibili */}
          {!loadingShops && (
            <div className="shops-info">
              {availableShops > 0 ? (
                <div className="shops-available">
                  <i className="fas fa-check-circle text-success"></i>
                  <span>
                    {`Hai ${availableShops} ${availableShops === 1 ? 'negozio disponibile' : 'negozi disponibili'} nel tuo abbonamento`}
                  </span>
                </div>
              ) : (
                <div className="shops-empty">
                  <i className="fas fa-info-circle text-info"></i>
                  <span>Nessun negozio disponibile - acquista un abbonamento per iniziare</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="header-actions">
          <button 
            className={getButtonClass()}
            onClick={onAddNegozio}
            disabled={loadingShops}
          >
            {getButtonText()}
          </button>
          
          <button 
            className="btn-secondary"
            onClick={onViewAllNegozi}
          >
            <i className="fas fa-store"></i> Vedi tutti
          </button>
        </div>
      </div>
      
      {/* Progess bar per negozi disponibili */}
      {!loadingShops && availableShops > 0 && (
        <div className="shops-progress">
          <div className="progress-info">
            <span className="progress-label">Negozi disponibili</span>
            <span className="progress-count">{availableShops}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min(100, (availableShops / 10) * 100)}%` 
              }}
            ></div>
          </div>
          <small className="progress-hint">
            Crea i tuoi negozi quando vuoi - il tuo abbonamento è sempre attivo!
          </small>
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;