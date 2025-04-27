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
  
  const motivazioni = useSelector(state => 
    state.motivazioni && state.motivazioni.items[negozioId] || []
  );
  
  const loading = useSelector(state => 
    state.negozi.loading || 
    state.dipendenti.loading || 
    state.particolarita.loading || 
    (state.motivazioni && state.motivazioni.loading)
  );
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (negozioId) {
      dispatch(fetchNegozioById(negozioId));
      dispatch(fetchDipendentiByNegozioId(negozioId));
      dispatch(fetchParticolaritaByNegozio(negozioId));
      dispatch(fetchMotivazioniByNegozio(negozioId));
    }
  }, [dispatch, negozioId]);

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
          onClick={() => setActiveTab('home')}
        >
          <i className="fas fa-home"></i> Home
        </button>
        <button 
          className={`nav-button ${activeTab === 'dipendenti' ? 'active-nav-button' : ''}`} 
          onClick={() => setActiveTab('dipendenti')}
        >
          <i className="fas fa-users"></i> Dipendenti
        </button>
        <button 
          className={`nav-button ${activeTab === 'turni' ? 'active-nav-button' : ''}`} 
          onClick={() => setActiveTab('turni')}
        >
          <i className="fas fa-calendar-alt"></i> Turni
        </button>
        <button 
          className={`nav-button ${activeTab === 'particolarita' ? 'active-nav-button' : ''}`} 
          onClick={() => setActiveTab('particolarita')}
        >
          <i className="fas fa-tag"></i> Particolarità
        </button>
        <button 
          className={`nav-button ${activeTab === 'motivazioni' ? 'active-nav-button' : ''}`} 
          onClick={() => setActiveTab('motivazioni')}
        >
          <i className="fas fa-home"></i> Motivazioni
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
                <button className="stat-action" onClick={() => setActiveTab('particolarita')}>
                  Gestisci <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              
              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon">
                    <i className="fas fa-home"></i>
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
                  <span className="info-value">{negozio.responsabile || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Telefono</span>
                  <span className="info-value">{negozio.telefono || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{negozio.email || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Settore</span>
                  <span className="info-value">{negozio.settore || 'Non specificato'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Orari</span>
                  <span className="info-value">{negozio.orari || 'Non specificato'}</span>
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
                    dipendente.email?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(dipendente => (
                  <div key={dipendente.id} className="dipendente-card">
                    <div className="dipendente-header">
                      <h4>{dipendente.nome} {dipendente.cognome}</h4>
                      <div className="dipendente-actions">
                        <Link to={`/negozi/${negozioId}/dipendenti/${dipendente.id}`}>
                          <button className="icon-button">
                            <i className="fas fa-eye"></i>
                          </button>
                        </Link>
                        <Link to={`/negozi/${negozioId}/dipendenti/${dipendente.id}`}>
                          <button className="icon-button">
                            <i className="fas fa-edit"></i>
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className="dipendente-info">
                      <p><i className="fas fa-id-badge"></i> {dipendente.ruolo || dipendente.mansione || 'Nessuna mansione'}</p>
                      <p><i className="fas fa-phone"></i> {dipendente.telefono || 'Non specificato'}</p>
                      <p><i className="fas fa-envelope"></i> {dipendente.email || 'Non specificato'}</p>
                      <p><i className="fas fa-calendar-alt"></i> {dipendente.orarioLavoro || dipendente.disponibilita || 'Non specificato'}</p>
                      {dipendente.dataNascita && <p><i className="fas fa-birthday-cake"></i> {new Date(dipendente.dataNascita).toLocaleDateString()}</p>}
                      {dipendente.dataAssunzione && <p><i className="fas fa-briefcase"></i> {new Date(dipendente.dataAssunzione).toLocaleDateString()}</p>}
                      {dipendente.note && <p><i className="fas fa-sticky-note"></i> {dipendente.note.substring(0, 50)}...</p>}
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
              <h3>Gestione Motivazioni Assenze</h3>
              <div></div> {/* Placeholder vuoto per mantenere l'allineamento */}
            </div>
            
            <MotivazioniManager negozioId={negozioId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NegozioHub;