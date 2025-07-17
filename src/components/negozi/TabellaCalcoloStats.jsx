// src/components/negozi/TabellaCalcoloStats.jsx
import React, { useMemo } from 'react';
import { calcolaStatistiche } from '../../utils/tabellaCalcoloUtils';
import './TabellaCalcoloStats.css';

const TabellaCalcoloStats = ({ tableData, anno }) => {
  const stats = useMemo(() => {
    if (!tableData || tableData.length === 0) return null;
    return calcolaStatistiche(tableData);
  }, [tableData]);
  
  if (!stats) return null;
  
  const formatOre = (ore) => {
    const oreNum = parseFloat(ore) || 0;
    return oreNum.toFixed(2);
  };
  
  const formatGiorni = (giorni) => {
    const giorniNum = parseFloat(giorni) || 0;
    return giorniNum.toFixed(0);
  };
  
  return (
    <div className="tabella-calcolo-stats">
      <div className="stats-header">
        <h3>
          <i className="fas fa-chart-bar"></i> Riepilogo Anno {anno}
        </h3>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card stat-rol">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h4>ROL</h4>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Maturati:</span>
                <span className="stat-value">{formatOre(stats.totaleROLMaturati)} ore</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Goduti:</span>
                <span className="stat-value">{formatOre(stats.totaleROLGoduti)} ore</span>
              </div>
              <div className="stat-item residuo">
                <span className="stat-label">Residuo:</span>
                <span className="stat-value">{formatOre(stats.totaleResiduoROL)} ore</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-exfest">
          <div className="stat-icon">
            <i className="fas fa-calendar-plus"></i>
          </div>
          <div className="stat-content">
            <h4>Ex Festività</h4>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Maturate:</span>
                <span className="stat-value">{formatOre(stats.totaleExFestMaturate)} ore</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Godute:</span>
                <span className="stat-value">{formatOre(stats.totaleExFestGodute)} ore</span>
              </div>
              <div className="stat-item residuo">
                <span className="stat-label">Residuo:</span>
                <span className="stat-value">{formatOre(stats.totaleResiduoExFest)} ore</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-ferie">
          <div className="stat-icon">
            <i className="fas fa-umbrella-beach"></i>
          </div>
          <div className="stat-content">
            <h4>Ferie</h4>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Spettanti:</span>
                <span className="stat-value">{stats.numeroDipendenti * 26} giorni</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Godute:</span>
                <span className="stat-value">{formatGiorni(stats.totaleFerieGodute)} giorni</span>
              </div>
              <div className="stat-item residuo">
                <span className="stat-label">Residuo:</span>
                <span className="stat-value">{formatGiorni(stats.totaleResiduoFerie)} giorni</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-summary">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h4>Riepilogo Generale</h4>
            <div className="stat-details">
              <div className="stat-item">
                <span className="stat-label">Dipendenti:</span>
                <span className="stat-value">{stats.numeroDipendenti}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Ore ROL medie:</span>
                <span className="stat-value">
                  {stats.numeroDipendenti > 0 
                    ? formatOre(stats.totaleROLMaturati / stats.numeroDipendenti)
                    : '0.00'
                  } ore/dip
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Ferie medie godute:</span>
                <span className="stat-value">
                  {stats.numeroDipendenti > 0 
                    ? formatGiorni(stats.totaleFerieGodute / stats.numeroDipendenti)
                    : '0'
                  } gg/dip
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="stats-footer">
        <p className="stats-note">
          <i className="fas fa-info-circle"></i>
          I dati sono calcolati in tempo reale sulla base delle informazioni inserite nella tabella.
          I residui includono i valori riportati dall'anno precedente.
        </p>
      </div>
    </div>
  );
};

export default TabellaCalcoloStats;