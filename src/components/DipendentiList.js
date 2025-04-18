// components/DipendentiList.js
import React, { useState, useEffect } from 'react';
import { getDipendentiByNegozioId, deleteDipendente } from '../services/dipendentiService';
import { getNegozioById } from '../services/negoziService';
import '../styles/DipendentiList.css';

function DipendentiList({ onNavigate, negozioId }) {
  const [dipendenti, setDipendenti] = useState([]);
  const [negozio, setNegozio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica il negozio
        const negozioData = await getNegozioById(negozioId);
        setNegozio(negozioData);
        
        // Carica i dipendenti del negozio
        const dipendentiList = await getDipendentiByNegozioId(negozioId);
        setDipendenti(dipendentiList);
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [negozioId]);
  
  const handleDelete = async (id) => {
    try {
      await deleteDipendente(id);
      setDipendenti(dipendenti.filter(dipendente => dipendente.id !== id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Errore nella cancellazione del dipendente:', error);
    }
  };
  
  const filteredDipendenti = dipendenti.filter(dipendente =>
    dipendente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dipendente.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dipendente.nomeTurno.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dipendente.ruolo.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };
  
  if (loading) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento dipendenti...</span>
      </div>
    );
  }
  
  return (
    <div className="dipendenti-list-container">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <button 
              className="btn-link" 
              onClick={() => onNavigate('negozi')}
            >
              Negozi
            </button>
            <i className="fas fa-chevron-right"></i>
            <span>{negozio?.nome}</span>
          </div>
          <h1>Dipendenti</h1>
          <p>Gestisci i dipendenti del negozio {negozio?.nome}</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={() => onNavigate('turni', { negozioId })}
          >
            <i className="fas fa-calendar-alt"></i> Gestisci Turni
          </button>
          <button 
            className="btn-primary" 
            onClick={() => onNavigate('dipendenteForm', { negozioId })}
          >
            <i className="fas fa-plus"></i> Aggiungi Dipendente
          </button>
        </div>
      </div>
      
      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Cerca dipendenti per nome, cognome o ruolo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredDipendenti.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <i className="fas fa-search"></i>
              <h3>Nessun risultato trovato</h3>
              <p>Nessun dipendente corrisponde alla tua ricerca "{searchTerm}"</p>
              <button 
                className="btn-secondary" 
                onClick={() => setSearchTerm('')}
              >
                Cancella ricerca
              </button>
            </>
          ) : (
            <>
              <i className="fas fa-users"></i>
              <h3>Nessun dipendente trovato</h3>
              <p>Inizia aggiungendo il primo dipendente per questo negozio.</p>
              <button 
                className="btn-primary" 
                onClick={() => onNavigate('dipendenteForm', { negozioId })}
              >
                Aggiungi Dipendente
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="dipendenti-table-container">
          <table className="dipendenti-table">
            <thead>
              <tr>
                <th>Dipendente</th>
                <th>Ore Settimanali</th>
                <th>Ruolo</th>
                <th>Date Contratto</th>
                <th>Giorni Disponibili</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredDipendenti.map(dipendente => (
                <tr key={dipendente.id}>
                  <td>
                    <div className="dipendente-info">
                      <div className="avatar">
                        {dipendente.nomeTurno ? dipendente.nomeTurno.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="dipendente-name">
                          {dipendente.nome} {dipendente.cognome}
                        </div>
                        {dipendente.nomeTurno && dipendente.nomeTurno !== `${dipendente.nome} ${dipendente.cognome}` && (
                          <div className="nome-turno">
                            <small>Nome nel turno: {dipendente.nomeTurno}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="ore-badge">
                      <i className="fas fa-clock"></i>
                      <span>{dipendente.oreSettimanali} ore</span>
                    </div>
                  </td>
                  <td>
                    <span className="ruolo-badge">{dipendente.ruolo}</span>
                  </td>
                  <td>
                    <div className="date-info">
                      <div>
                        <i className="fas fa-calendar-plus"></i>
                        <span>Dal: {formatDate(dipendente.dataAssunzione)}</span>
                      </div>
                      {dipendente.dataFineContratto && (
                        <div>
                          <i className="fas fa-calendar-minus"></i>
                          <span>Al: {formatDate(dipendente.dataFineContratto)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="giorni-disponibili">
                      <div>
                        <i className="fas fa-sun"></i>
                        <span>Ferie: {dipendente.giorniFerie || 0}</span>
                      </div>
                      <div>
                        <i className="fas fa-calendar-day"></i>
                        <span>ROL: {dipendente.giorniROL || 0}</span>
                      </div>
                      <div>
                        <i className="fas fa-star"></i>
                        <span>Ex Festività: {dipendente.giorniExFestivita || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => onNavigate('dipendenteForm', { 
                          negozioId, 
                          dipendenteId: dipendente.id 
                        })}
                        title="Modifica"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => setConfirmDelete(dipendente.id)}
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
              <p>Sei sicuro di voler eliminare questo dipendente? Questa azione non può essere annullata.</p>
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

export default DipendentiList;