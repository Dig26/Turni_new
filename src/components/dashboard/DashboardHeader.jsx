 
import React from 'react';
import './Dashboard.module.css';

const DashboardHeader = ({ user, onAddNegozio, onViewAllNegozi }) => {
  return (
    <>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Benvenuto, {user?.nome}! Gestisci i tuoi negozi e i turni lavorativi.</p>
      </div>
      
      <div className="dashboard-actions">
        <button 
          className="btn-primary" 
          onClick={onAddNegozio}
        >
          <i className="fas fa-plus"></i> Aggiungi Nuovo Negozio
        </button>
        
        <button 
          className="btn-secondary" 
          onClick={onViewAllNegozi}
        >
          <i className="fas fa-list"></i> Vedi Tutti i Negozi
        </button>
      </div>
    </>
  );
};

export default DashboardHeader;