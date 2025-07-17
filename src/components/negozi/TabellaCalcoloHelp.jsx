// src/components/negozi/TabellaCalcoloHelp.jsx
import React, { useState } from 'react';
import './TabellaCalcoloHelp.css';

const TabellaCalcoloHelp = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('generale');
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-question-circle"></i> Guida Tabella di Calcolo
          </h3>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="help-tabs">
          <button
            className={activeTab === 'generale' ? 'active' : ''}
            onClick={() => setActiveTab('generale')}
          >
            Generale
          </button>
          <button
            className={activeTab === 'calcoli' ? 'active' : ''}
            onClick={() => setActiveTab('calcoli')}
          >
            Calcoli
          </button>
          <button
            className={activeTab === 'modifiche' ? 'active' : ''}
            onClick={() => setActiveTab('modifiche')}
          >
            Modifiche
          </button>
          <button
            className={activeTab === 'importexport' ? 'active' : ''}
            onClick={() => setActiveTab('importexport')}
          >
            Import/Export
          </button>
        </div>
        
        <div className="help-content">
          {activeTab === 'generale' && (
            <div className="help-section">
              <h4>Cos'è la Tabella di Calcolo?</h4>
              <p>
                La Tabella di Calcolo è uno strumento avanzato per gestire e monitorare 
                ROL, Ex festività e Ferie di tutti i dipendenti del negozio.
              </p>
              
              <h4>Struttura della tabella</h4>
              <p>Ogni dipendente occupa 6 righe:</p>
              <ul>
                <li><strong>Riga 1:</strong> Modifica contratto al mese (ore settimanali)</li>
                <li><strong>Riga 2:</strong> ROL maturati</li>
                <li><strong>Riga 3:</strong> ROL goduti</li>
                <li><strong>Riga 4:</strong> Ex festività maturate</li>
                <li><strong>Riga 5:</strong> Ex festività godute</li>
                <li><strong>Riga 6:</strong> Ferie godute</li>
              </ul>
              
              <h4>Colonne principali</h4>
              <ul>
                <li><strong>Prime 3 colonne:</strong> Dati anagrafici (unite verticalmente)</li>
                <li><strong>Colonne 4-6:</strong> Descrizione e tipo ratio</li>
                <li><strong>Colonna 7:</strong> Residuo anno precedente (modificabile per righe 2, 4, 6)</li>
                <li><strong>Colonne mensili:</strong> Valori per ogni mese dell'anno</li>
                <li><strong>Ultime 2 colonne:</strong> Totale annuo e residuo calcolato</li>
              </ul>
            </div>
          )}
          
          {activeTab === 'calcoli' && (
            <div className="help-section">
              <h4>Come vengono calcolati i valori?</h4>
              
              <h5>ROL (Riduzione Orario di Lavoro)</h5>
              <p>Il calcolo dipende dall'anzianità di servizio:</p>
              <ul>
                <li><strong>Meno di 2 anni:</strong> 0 ore</li>
                <li><strong>Da 2 a 4 anni:</strong> 0,15 × ore mensili ÷ 2</li>
                <li><strong>Oltre 4 anni:</strong> 0,15 × ore mensili</li>
              </ul>
              
              <h5>Ex festività</h5>
              <p>Calcolo fisso: <strong>0,06675 × ore mensili</strong></p>
              
              <h5>Ferie</h5>
              <p>Ogni dipendente ha diritto a <strong>26 giorni</strong> di ferie all'anno.</p>
              
              <h5>Ore mensili</h5>
              <p>Le ore mensili sono calcolate come: <strong>(ore settimanali × 52) ÷ 12</strong></p>
              
              <h5>Residuo</h5>
              <p>Formula: <strong>Totale maturato - Totale goduto + Residuo anno precedente</strong></p>
            </div>
          )}
          
          {activeTab === 'modifiche' && (
            <div className="help-section">
              <h4>Quali celle posso modificare?</h4>
              
              <h5>Celle modificabili:</h5>
              <ul>
                <li>
                  <strong>Residuo Anno Prec. 2 (colonna 7):</strong> 
                  Solo per righe ROL, Ex festività e Ferie
                </li>
                <li>
                  <strong>Ore settimanali (riga 1):</strong> 
                  Per registrare variazioni contrattuali mensili
                </li>
                <li>
                  <strong>Valori goduti (righe 3, 5, 6):</strong> 
                  Per registrare ROL, Ex festività e Ferie utilizzate
                </li>
              </ul>
              
              <h5>Calcoli automatici:</h5>
              <p>
                Quando modifichi le ore settimanali, i valori di ROL ed Ex festività 
                vengono ricalcolati automaticamente per i mesi interessati.
              </p>
              
              <h5>Salvataggio:</h5>
              <p>
                Ricorda di salvare le modifiche usando il pulsante "Salva". 
                Un asterisco (*) indica modifiche non salvate.
              </p>
            </div>
          )}
          
          {activeTab === 'importexport' && (
            <div className="help-section">
              <h4>Import da Excel</h4>
              <p>Puoi importare dati da un file Excel che segue il formato standard:</p>
              <ul>
                <li>Ogni dipendente deve occupare esattamente 6 righe</li>
                <li>L'ordine delle colonne deve corrispondere alla tabella</li>
                <li>I valori numerici devono usare il punto come separatore decimale</li>
                <li>Il file deve contenere dati per l'anno selezionato</li>
              </ul>
              
              <h4>Export in Excel</h4>
              <p>L'export genera un file Excel con:</p>
              <ul>
                <li>Foglio principale con tutti i dati della tabella</li>
                <li>Foglio riepilogo con statistiche aggregate</li>
                <li>Formattazione professionale e colori per tipo di riga</li>
                <li>Celle unite per i dati anagrafici</li>
              </ul>
              
              <h4>Suggerimenti:</h4>
              <ul>
                <li>Esporta regolarmente per backup</li>
                <li>Verifica sempre l'anteprima prima di importare</li>
                <li>In caso di errori, controlla il formato del file Excel</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            <i className="fas fa-check"></i> Ho capito
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabellaCalcoloHelp;