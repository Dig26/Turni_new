import React from 'react';
import './Dashboard.module.css';

const NegozioCard = ({ negozio, onViewDipendenti, onViewTurni }) => {
  return (
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
          onClick={() => onViewDipendenti(negozio.id)}
        >
          <i className="fas fa-users"></i> Dipendenti
        </button>
        <button 
          className="btn-primary" 
          onClick={() => onViewTurni(negozio.id)}
        >
          <i className="fas fa-calendar-alt"></i> Turni
        </button>
      </div>
    </div>
  );
};

export default NegozioCard;