import React, { useState, useEffect } from 'react';
import { getNegozi, deleteNegozio } from '../services/negoziService';
import '../styles/NegoziosList.css';

function NegoziosList({ onNavigate }) {
  const [negozi, setNegozi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  useEffect(() => {
    const fetchNegozi = async () => {
      try {
        const negoziList = await getNegozi();
        setNegozi(negoziList);
      } catch (error) {
        console.error('Errore nel caricamento dei negozi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNegozi();
  }, []);
  
  const handleDelete = async (id) => {
    try {
      await deleteNegozio(id);
      setNegozi(negozi.filter(negozio => negozio.id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Errore nella cancellazione del negozio:', error);
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
        </div>
        <button 
          className="btn-primary" 
          onClick={() => onNavigate('negozioForm')}
        >
          <i className="fas fa-plus"></i> Aggiungi Negozio
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
              <p>Inizia aggiungendo il tuo primo negozio.</p>
              <button 
                className="btn-primary" 
                onClick={() => onNavigate('negozioForm')}
              >
                Aggiungi Negozio
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="negozi-table-container">
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
                        className="btn-icon" 
                        onClick={() => onNavigate('dipendenti', { negozioId: negozio.id })}
                        title="Gestisci Dipendenti"
                      >
                        <i className="fas fa-users"></i>
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => onNavigate('turni', { negozioId: negozio.id })}
                        title="Gestisci Turni"
                      >
                        <i className="fas fa-calendar-alt"></i>
                      </button>
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => onNavigate('negozioForm', { negozioId: negozio.id })}
                        title="Modifica"
                      >
                        <i className="fas fa-edit"></i>
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