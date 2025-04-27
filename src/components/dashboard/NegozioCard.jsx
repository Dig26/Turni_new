import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard.css';

const NegozioCard = ({ negozio }) => {
  const navigate = useNavigate();
  
  const handleGestisciNegozio = () => {
    navigate(`/negozi/${negozio.id}`);
  };
  
  return (
    <div className="negozio-card" key={negozio.id} onClick={handleGestisciNegozio}>
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
          className="btn-primary" 
          onClick={(e) => {
            e.stopPropagation();
            handleGestisciNegozio();
          }}
        >
          <i className="fas fa-store-alt"></i> Gestisci Negozio
        </button>
      </div>
    </div>
  );
};

export default NegozioCard;