// src/components/dashboard/NegozioCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NegozioCard.css';

const NegozioCard = ({ negozio }) => {
  const navigate = useNavigate();

  const handleViewNegozio = () => {
    navigate(`/negozi/${negozio.id}`);
  };

  const handleEditNegozio = (e) => {
    e.stopPropagation(); // Previene il click sul card
    navigate(`/negozi/${negozio.id}/edit`);
  };

  const handleManageEmployees = (e) => {
    e.stopPropagation();
    // Vai al NegozioHub con tab dipendenti attivo
    navigate(`/negozi/${negozio.id}?tab=dipendenti`);
  };

  const handleManageSchedules = (e) => {
    e.stopPropagation();
    // Vai al NegozioHub con tab turni attivo
    navigate(`/negozi/${negozio.id}?tab=turni`);
  };

  // Formatta il settore per la visualizzazione
  const formatSettore = (settore) => {
    const settori = {
      'sanita': 'Sanità',
      'commercio': 'Commercio',
      'metalmeccanico': 'Metalmeccanico', 
      'logistica': 'Logistica',
      'turismo': 'Turismo'
    };
    return settori[settore] || settore;
  };

  return (
    <div className="negozio-card" onClick={handleViewNegozio}>
      <div className="negozio-card-header">
        <div className="negozio-info">
          <h3 className="negozio-name">{negozio.nome}</h3>
          <div className="negozio-location">
            <i className="fas fa-map-marker-alt"></i>
            <span>{negozio.citta}, {negozio.paese}</span>
          </div>
        </div>
        <div className="negozio-actions">
          <button 
            className="btn-icon btn-edit" 
            onClick={handleEditNegozio}
            title="Modifica negozio"
          >
            <i className="fas fa-edit"></i>
          </button>
        </div>
      </div>

      <div className="negozio-details">
        <div className="detail-item">
          <i className="fas fa-tag"></i>
          <span className="detail-label">Settore:</span>
          <span className="detail-value">{formatSettore(negozio.settore)}</span>
        </div>

        <div className="detail-item">
          <i className="fas fa-clock"></i>
          <span className="detail-label">Orario:</span>
          <span className="detail-value">
            {negozio.orarioApertura} - {negozio.orarioChiusura}
          </span>
        </div>

        <div className="detail-item">
          <i className="fas fa-calendar-week"></i>
          <span className="detail-label">Giorni:</span>
          <span className="detail-value">
            {negozio.giorniLavorativi} giorni/settimana
          </span>
        </div>

        {negozio.indirizzo && (
          <div className="detail-item">
            <i className="fas fa-home"></i>
            <span className="detail-label">Indirizzo:</span>
            <span className="detail-value">{negozio.indirizzo}</span>
          </div>
        )}

        {negozio.capoarea && (
          <div className="detail-item">
            <i className="fas fa-user-tie"></i>
            <span className="detail-label">Capoarea:</span>
            <span className="detail-value">{negozio.capoarea}</span>
          </div>
        )}
      </div>

      <div className="negozio-card-footer">
        <div className="quick-actions">
          <button 
            className="btn-quick" 
            onClick={handleManageEmployees}
            title="Gestisci dipendenti"
          >
            <i className="fas fa-users"></i>
            <span>Dipendenti</span>
          </button>
          
          <button 
            className="btn-quick" 
            onClick={handleManageSchedules}
            title="Gestisci turni"
          >
            <i className="fas fa-calendar-alt"></i>
            <span>Turni</span>
          </button>
          
          <button 
            className="btn-quick btn-primary" 
            onClick={handleViewNegozio}
            title="Vedi dettagli"
          >
            <i className="fas fa-arrow-right"></i>
            <span>Dettagli</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NegozioCard;