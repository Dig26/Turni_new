// src/components/negozi/NegozioHub.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNegozioById } from '../../app/slices/negoziSlice';
import { fetchDipendentiByNegozioId } from '../../app/slices/dipendentiSlice';
import { fetchParticolaritaByNegozio } from '../../app/slices/particolaritaSlice';
import { fetchMotivazioniByNegozio } from '../../app/slices/motivazioniSlice';
// import { addNotification } from '../../app/slices/uiSlice';
import ParticolaritaManager from './ParticolaritaManager';
import MotivazioniManager from './MotivazioniManager';
import TurniPanel from './TurniPanel';
import '../../styles/NegozioHub.css';

// Utility functions for formatting
const settoreLabel = (settore) => {
  const settoriMap = {
    'commercio': 'Commercio',
    'ristorazione': 'Ristorazione',
    'abbigliamento': 'Abbigliamento',
    'alimentari': 'Alimentari', 
    'tecnologia': 'Tecnologia',
    'servizi': 'Servizi',
    'altro': 'Altro'
  };
  return settoriMap[settore] || settore;
};

const paeseLabel = (paese) => {
  const paesiMap = {
    'IT': 'Italia',
    'FR': 'Francia',
    'DE': 'Germania',
    'UK': 'Regno Unito',
    'ES': 'Spagna'
  };
  return paesiMap[paese] || paese;
};

const formattaGiorniLiberi = (giorni) => {
  if (!giorni || giorni.length === 0) return 'Nessuno';
  
  const giorniMap = {
    'lunedi': 'Lunedì',
    'martedi': 'Martedì',
    'mercoledi': 'Mercoledì',
    'giovedi': 'Giovedì',
    'venerdi': 'Venerdì',
    'sabato': 'Sabato',
    'domenica': 'Domenica'
  };
  
  return giorni.map(g => giorniMap[g] || g).join(', ');
};

const findResponsabile = (dipendenti) => {
  if (!dipendenti || dipendenti.length === 0) return null;
  
  const responsabile = dipendenti.find(d => d.ruolo === 'responsabile' || d.ruolo === 'direttore');
  if (responsabile) {
    return `${responsabile.nome} ${responsabile.cognome}`;
  }
  return null;
};

const NegozioHub = ({ negozioId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const negozio = useSelector(state => state.negozi.currentNegozio);
  const dipendenti = useSelector(state => 
    state.dipendenti && state.dipendenti.byNegozio && state.dipendenti.byNegozio[negozioId] ? 
    state.dipendenti.byNegozio[negozioId] : 
    []
  );
  const particolarita = useSelector(state => 
    state.particolarita.items[negozioId] || []
  );
  
  const motivazioni = useSelector(state => {
    try {
      if (state.motivazioni && state.motivazioni.items && negozioId) {
        return Array.isArray(state.motivazioni.items[negozioId]) 
          ? state.motivazioni.items[negozioId] 
          : [];
      }
      return [];
    } catch (error) {
      console.error("Errore nell'accesso alle motivazioni:", error);
      return [];
    }
  });
  
  const loading = useSelector(state => 
    state.negozi.loading || 
    state.dipendenti.loading || 
    state.particolarita.loading || 
    (state.motivazioni && state.motivazioni.loading)
  );
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastActiveTab, setLastActiveTab] = useState(null);
  
  // Gestore per il cambio di tab
  const handleTabChange = (tabName) => {
    console.log(`Cambio tab da "${activeTab}" a "${tabName}"`);
    
    // Se si seleziona la tab delle motivazioni, ricarica le motivazioni 
    // per assicurarsi di avere i dati più aggiornati
    if (tabName === 'motivazioni') {
      console.log("Tab motivazioni selezionata, ricarico i dati");
      dispatch(fetchMotivazioniByNegozio(negozioId));
    }
    
    setLastActiveTab(activeTab);
    setActiveTab(tabName);
  };

  // Non è più necessario alcun cleanup quando il componente si smonta
  // poiché tutte le motivazioni sono permanenti nel database locale

  // Effetto per caricare i dati iniziali e quando cambia il negozio
  useEffect(() => {
    if (negozioId) {
      dispatch(fetchNegozioById(negozioId));
      dispatch(fetchDipendentiByNegozioId(negozioId));
      dispatch(fetchParticolaritaByNegozio(negozioId));
      dispatch(fetchMotivazioniByNegozio(negozioId));
    }
  }, [dispatch, negozioId]);
  
  // Effetto per ricaricare le motivazioni quando si cambia tab
  useEffect(() => {
    if (negozioId && activeTab === 'motivazioni') {
      console.log('Ricarico le motivazioni perché è stata selezionata la tab motivazioni');
      dispatch(fetchMotivazioniByNegozio(negozioId));
    }
  }, [dispatch, negozioId, activeTab]);

  if (loading && !negozio) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento...</span>
      </div>
    );
  }

  if (!negozio) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Negozio non trovato</h3>
        <p>Il negozio richiesto non è stato trovato o potrebbe essere stato eliminato.</p>
        <Link to="/negozi">
          <button className="btn-primary">Torna alla lista dei negozi</button>
        </Link>
      </div>
    );
  }

  // Funzioni di navigazione
  const navigateToDipendenti = () => navigate(`/negozi/${negozioId}/dipendenti`);
  const navigateToEdit = () => navigate(`/negozi/${negozioId}/edit`);

  return (
    <div className="negozio-hub-container">
      <div className="negozio-hub-header">
        <div className="negozio-info">
          <h2>{negozio.nome}</h2>
          <p className="negozio-address">
            <i className="fas fa-map-marker-alt"></i> {negozio.citta}, {negozio.indirizzo}
          </p>
        </div>
        <div className="hub-actions">
          <button className="btn-primary" onClick={navigateToEdit}>
            <i className="fas fa-edit"></i> Modifica Negozio
          </button>
          <Link to="/negozi">
            <button className="btn-secondary">
              <i className="fas fa-arrow-left"></i> Torna alla Lista
            </button>
          </Link>
        </div>
      </div>

      <div className="hub-navigation">
        <button 
          className={`nav-button ${activeTab === 'home' ? 'active-nav-button' : ''}`} 
          onClick={() => handleTabChange('home')}
        >
          <i className="fas fa-home"></i> Home
        </button>
        <button 
          className={`nav-button ${activeTab === 'dipendenti' ? 'active-nav-button' : ''}`} 
          onClick={() => handleTabChange('dipendenti')}
        >
          <i className="fas fa-users"></i> Dipendenti
        </button>
        <button 
          className={`nav-button ${activeTab === 'turni' ? 'active-nav-button' : ''}`} 
          onClick={() => handleTabChange('turni')}
        >
          <i className="fas fa-calendar-alt"></i> Turni
        </button>
        <button 
          className={`nav-button ${activeTab === 'particolarita' ? 'active-nav-button' : ''}`} 
          onClick={() => handleTabChange('particolarita')}
        >
          <i className="fas fa-tag"></i> Particolarità
        </button>
        <button 
          className={`nav-button ${activeTab === 'motivazioni' ? 'active-nav-button' : ''}`} 
          onClick={() => handleTabChange('motivazioni')}
        >
          <i className="fas fa-calendar-check"></i> Motivazioni
        </button>
      </div>

      <div className="hub-content">
        {activeTab === 'home' && (
          <div className="home-tab">
            <div className="grid-stats">
              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{dipendenti.length}</h3>
                    <p>Dipendenti</p>
                  </div>
                </div>
                <button className="stat-action" onClick={() => setActiveTab('dipendenti')}>
                  Gestisci <i className="fas fa-arrow-right"></i>
                </button>
              </div>

              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Turni</h3>
                    <p>Pianificazione</p>
                  </div>
                </div>
                <button className="stat-action" onClick={() => setActiveTab('turni')}>
                  Gestisci <i className="fas fa-arrow-right"></i>
                </button>
              </div>

              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-tag"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{particolarita.length}</h3>
                    <p>Particolarità</p>
                  </div>
                </div>
                <button className="stat-action" onClick={() => handleTabChange('particolarita')}>
                  Gestisci <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              
              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{motivazioni.length}</h3>
                    <p>Motivazioni Assenze</p>
                  </div>
                </div>
                <button className="stat-action" onClick={() => setActiveTab('motivazioni')}>
                  Gestisci <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="info-card">
              <h3 className="info-card-title">
                <i className="fas fa-info-circle"></i> Informazioni Negozio
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Responsabile</span>
                  <span className="info-value">
                    {findResponsabile(dipendenti) || 'Non specificato'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Settore</span>
                  <span className="info-value">{settoreLabel(negozio.settore) || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Città</span>
                  <span className="info-value">{negozio.citta || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Paese</span>
                  <span className="info-value">{paeseLabel(negozio.paese) || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Orario apertura</span>
                  <span className="info-value">{negozio.orarioApertura || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Orario chiusura</span>
                  <span className="info-value">{negozio.orarioChiusura || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Giorni lavorativi</span>
                  <span className="info-value">{negozio.giorniLavorativi || 'Non specificato'} giorni/settimana</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Giorni fissi liberi</span>
                  <span className="info-value">{formattaGiorniLiberi(negozio.giorniFissiLiberi) || 'Nessuno'}</span>
                </div>
              </div>
              {negozio.note && (
                <div className="notes-section">
                  <h4>Note</h4>
                  <p>{negozio.note}</p>
                </div>
              )}
              <div className="info-actions">
                <button className="info-action" onClick={navigateToEdit}>
                  <i className="fas fa-edit"></i> Modifica Informazioni
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dipendenti' && (
          <div className="dipendenti-tab">
            <div className="section-header">
              <h3>Dipendenti</h3>
              <div className="header-actions">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Cerca dipendente..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <i className="fas fa-search"></i>
                </div>
                <Link to={`/negozi/${negozioId}/dipendenti/nuovo`}>
                  <button className="btn-primary">
                    <i className="fas fa-plus"></i> Nuovo Dipendente
                  </button>
                </Link>
              </div>
            </div>

            {dipendenti.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-users"></i>
                </div>
                <h3>Nessun dipendente</h3>
                <p>Questo negozio non ha ancora dipendenti assegnati.</p>
                <Link to={`/negozi/${negozioId}/dipendenti/nuovo`}>
                  <button className="btn-primary">
                    <i className="fas fa-plus"></i> Aggiungi Primo Dipendente
                  </button>
                </Link>
              </div>
            ) : (
              <div className="dipendenti-grid">
                {dipendenti
                  .filter(dipendente => 
                    !searchTerm || 
                    dipendente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dipendente.cognome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dipendente.ruolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    dipendente.nomeTurno?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(dipendente => (
                  <div key={dipendente.id} className="dipendente-card">
                    <div className="dipendente-header">
                      <h4>{dipendente.nome} {dipendente.cognome}</h4>
                      <div className="dipendente-actions">
                        <Link to={`/negozi/${negozioId}/dipendenti/${dipendente.id}`}>
                          <button className="icon-button">
                            <i className="fas fa-edit"></i>
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="dipendente-info">
                      <div className="dipendente-info-grid">
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-id-badge"></i> <strong>Ruolo:</strong></div>
                          <div className="info-value">{dipendente.ruolo || 'Non specificato'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-user-tag"></i> <strong>Nome turno:</strong></div>
                          <div className="info-value">{dipendente.nomeTurno || 'Non specificato'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-clock"></i> <strong>Ore sett.:</strong></div>
                          <div className="info-value">{dipendente.oreSettimanali || '0'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-briefcase"></i> <strong>Assunzione:</strong></div>
                          <div className="info-value">{dipendente.dataAssunzione ? new Date(dipendente.dataAssunzione).toLocaleDateString() : 'Non spec.'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-calendar-times"></i> <strong>Fine contr.:</strong></div>
                          <div className="info-value">{dipendente.dataFineContratto ? new Date(dipendente.dataFineContratto).toLocaleDateString() : 'Non spec.'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-umbrella-beach"></i> <strong>Ferie:</strong></div>
                          <div className="info-value">{dipendente.giorniFerie || '0'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-calendar-day"></i> <strong>ROL:</strong></div>
                          <div className="info-value">{dipendente.giorniROL || '0'}</div>
                        </div>
                        <div className="info-row">
                          <div className="info-label"><i className="fas fa-calendar-plus"></i> <strong>Ex fest.:</strong></div>
                          <div className="info-value">{dipendente.giorniExFestivita || '0'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'turni' && (
          <TurniPanel negozioId={negozioId} />
        )}

        {activeTab === 'particolarita' && (
          <div className="particolarita-tab">
            <div className="section-header">
              <h3>Gestione Particolarità</h3>
              <div></div> {/* Placeholder vuoto per mantenere l'allineamento */}
            </div>
            
            <ParticolaritaManager negozioId={negozioId} />
          </div>
        )}
        
        {activeTab === 'motivazioni' && (
          <div className="motivazioni-tab">
            <div className="section-header">
              <h3>
                <i className="fas fa-calendar-check"></i> Gestione Motivazioni Assenze
              </h3>
              <div className="section-info">
                <p>
                  Qui puoi gestire le motivazioni per le assenze dei dipendenti. 
                  <strong> Le motivazioni predefinite (Ferie, ROL, EX Festività) non possono essere eliminate</strong>, 
                  ma puoi personalizzare le loro sigle.
                </p>
              </div>
            </div>
            
            <MotivazioniManager negozioId={negozioId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NegozioHub;