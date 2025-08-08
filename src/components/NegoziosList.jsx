import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getNegozi, deleteNegozio } from '../services/api/negoziAPI';
import { getAvailableShops, hasAvailableShops } from '../services/userService';
import '../styles/NegoziosList.css';

function NegoziosList() {
  const [negozi, setNegozi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [availableShops, setAvailableShops] = useState(0);
  const [loadingShops, setLoadingShops] = useState(false);
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  
  // Funzione per recuperare i negozi disponibili dal database
  const fetchAvailableShops = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingShops(true);
      const shops = await getAvailableShops();
      setAvailableShops(shops);
    } catch (error) {
      console.error('Errore nel recupero dei negozi disponibili:', error);
    } finally {
      setLoadingShops(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica sia i negozi che quelli disponibili in parallelo
        const [negoziList] = await Promise.all([
          getNegozi(),
          fetchAvailableShops()
        ]);
        setNegozi(negoziList);
      } catch (error) {
        console.error('Errore nel caricamento dei negozi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);
  
  const handleDelete = async (id) => {
    try {
      await deleteNegozio(id);
      setNegozi(negozi.filter(negozio => negozio.id !== id));
      setConfirmDelete(null);
      
      // Non aggiungiamo negozi disponibili quando eliminiamo un negozio
      // perché l'abbonamento rimane lo stesso
    } catch (error) {
      console.error('Errore nella cancellazione del negozio:', error);
    }
  };
  
  const handleAddNegozio = async () => {
    try {
      const hasShops = await hasAvailableShops();
      
      if (hasShops) {
        // Ha negozi disponibili, vai direttamente alla creazione
        navigate('/negozi/nuovo');
      } else {
        // Non ha negozi disponibili, vai al pagamento
        navigate('/payment');
      }
    } catch (error) {
      console.error('Errore nella verifica dei negozi disponibili:', error);
      // In caso di errore, vai comunque al pagamento per sicurezza
      navigate('/payment');
    }
  };
  
  const filteredNegozi = negozi.filter(negozio =>
    negozio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    negozio.citta.toLowerCase().includes(searchTerm.toLowerCase()) ||
    negozio.settore.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="negozi-list-container">
      <div className="page-header">
        <div>
          <h1>I Miei Negozi</h1>
          <p>Gestisci tutti i tuoi negozi e il loro personale</p>
          {!loadingShops && user?.id && (
            <div className="available-shops-info">
              {availableShops > 0 ? (
                <div className="available-badge success">
                  <i className="fas fa-check-circle"></i>
                  {availableShops} {availableShops === 1 ? 'negozio disponibile' : 'negozi disponibili'}
                </div>
              ) : (
                <div className="available-badge warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  Nessun negozio disponibile
                </div>
              )}
            </div>
          )}
        </div>
        <button 
          className="btn-primary" 
          onClick={handleAddNegozio}
          disabled={loadingShops}
        >
          <i className="fas fa-plus"></i> 
          {loadingShops ? 'Caricamento...' : 
           availableShops > 0 ? 'Aggiungi Negozio' : 'Acquista Abbonamento'}
        </button>
      </div>
      
      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Cerca negozi per nome, città o settore..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="loading-spinner center">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Caricamento negozi...</span>
        </div>
      ) : filteredNegozi.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <i className="fas fa-search"></i>
              <h3>Nessun risultato trovato</h3>
              <p>Nessun negozio corrisponde alla tua ricerca "{searchTerm}"</p>
              <button 
                className="btn-secondary" 
                onClick={() => setSearchTerm('')}
              >
                Cancella ricerca
              </button>
            </>
          ) : (
            <>
              <i className="fas fa-store"></i>
              <h3>Nessun negozio trovato</h3>
              {loadingShops ? (
                <p>Verifica dei negozi disponibili in corso...</p>
              ) : availableShops > 0 ? (
                <>
                  <p>Hai {availableShops} {availableShops === 1 ? 'negozio disponibile' : 'negozi disponibili'} nel tuo abbonamento.</p>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/negozi/nuovo')}
                  >
                    Crea il tuo primo negozio
                  </button>
                </>
              ) : (
                <>
                  <p>Non hai negozi disponibili. Inizia acquistando un abbonamento.</p>
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/payment')}
                  >
                    Acquista Abbonamento
                  </button>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="negozi-table-container">
          <div className="stats-summary">
            <div className="stat-item">
              <i className="fas fa-store"></i>
              <span className="stat-number">{filteredNegozi.length}</span>
              <span className="stat-label">Negozi attivi</span>
            </div>
            {!loadingShops && user?.id && (
              <div className="stat-item">
                <i className="fas fa-plus-circle"></i>
                <span className="stat-number">{availableShops}</span>
                <span className="stat-label">Negozi disponibili</span>
              </div>
            )}
            <div className="stat-item">
              <i className="fas fa-filter"></i>
              <span className="stat-number">{searchTerm ? filteredNegozi.length : negozi.length}</span>
              <span className="stat-label">{searchTerm ? 'Risultati ricerca' : 'Totale negozi'}</span>
            </div>
          </div>

          <table className="negozi-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Località</th>
                <th>Settore</th>
                <th>Orario</th>
                <th>Giorni Lavorativi</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredNegozi.map(negozio => (
                <tr key={negozio.id}>
                  <td>
                    <div className="negozio-name">
                      <span className="name-text">{negozio.nome}</span>
                    </div>
                  </td>
                  <td>
                    <div className="negozio-location">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{negozio.citta}, {negozio.paese}</span>
                    </div>
                  </td>
                  <td>
                    <span className="negozio-sector">{negozio.settore}</span>
                  </td>
                  <td>
                    <div className="negozio-hours">
                      <i className="fas fa-clock"></i>
                      <span>{negozio.orarioApertura} - {negozio.orarioChiusura}</span>
                    </div>
                  </td>
                  <td>
                    <div className="giorni-lavorativi">
                      <i className="fas fa-calendar-week"></i>
                      <span>{negozio.giorniLavorativi} giorni/settimana</span>
                      {negozio.giorniFissiLiberi && negozio.giorniFissiLiberi.length > 0 && (
                        <div className="giorni-liberi">
                          <span>Giorni liberi: {negozio.giorniFissiLiberi.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => navigate(`/negozi/${negozio.id}/edit`)}
                        title="Modifica Negozio"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => navigate(`/negozi/${negozio.id}`)}
                        title="Gestisci Negozio"
                      >
                        <i className="fas fa-store-alt"></i>
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => setConfirmDelete(negozio.id)}
                        title="Elimina"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal di conferma eliminazione */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Conferma Eliminazione</h3>
            </div>
            <div className="modal-body">
              <p>Sei sicuro di voler eliminare questo negozio? Questa azione non può essere annullata.</p>
              <p>Tutti i dipendenti e i turni associati a questo negozio verranno eliminati.</p>
              <div className="warning-text">
                <i className="fas fa-info-circle"></i>
                <strong>Nota:</strong> L'eliminazione di un negozio non aggiunge slot disponibili al tuo abbonamento.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setConfirmDelete(null)}
              >
                Annulla
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDelete(confirmDelete)}
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NegoziosList;