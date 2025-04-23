import React, { useState, useEffect } from 'react';
import { getMotivazioni, saveMotivazione, deleteMotivazione } from '../services/motivazioniService';
import '../styles/MotivazioniManager.css';

function MotivazioniManager({ onNavigate }) {
  const [motivazioniList, setMotivazioniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nome: '', descrizione: '', sigla: '' });
  const [showConfirm, setShowConfirm] = useState(null);
  
  useEffect(() => {
    const fetchMotivazioni = async () => {
      try {
        const data = await getMotivazioni();
        setMotivazioniList(data);
      } catch (error) {
        console.error('Errore nel caricamento delle motivazioni:', error);
        setError('Errore nel caricamento delle motivazioni. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMotivazioni();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEdit = (motivazione) => {
    setEditing(motivazione.id);
    setFormData({
      nome: motivazione.nome,
      descrizione: motivazione.descrizione || '',
      sigla: motivazione.sigla
    });
  };
  
  const handleCancel = () => {
    setEditing(null);
    setFormData({ nome: '', descrizione: '', sigla: '' });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validazione
    if (!formData.nome.trim()) {
      setError('Il nome è obbligatorio.');
      return;
    }
    
    if (!formData.sigla.trim()) {
      setError('La sigla è obbligatoria.');
      return;
    }
    
    try {
      const motivazioneToSave = {
        ...formData,
        id: editing || Date.now().toString()
      };
      
      await saveMotivazione(motivazioneToSave);
      
      // Aggiorna l'elenco
      const updatedList = await getMotivazioni();
      setMotivazioniList(updatedList);
      
      // Reset del form
      setEditing(null);
      setFormData({ nome: '', descrizione: '', sigla: '' });
    } catch (error) {
      console.error('Errore nel salvataggio della motivazione:', error);
      setError('Errore nel salvataggio. Riprova.');
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteMotivazione(id);
      
      // Aggiorna l'elenco
      const updatedList = await getMotivazioni();
      setMotivazioniList(updatedList);
      
      setShowConfirm(null);
    } catch (error) {
      console.error('Errore nell\'eliminazione della motivazione:', error);
      setError('Errore nell\'eliminazione. Riprova.');
    }
  };
  
  if (loading) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento motivazioni...</span>
      </div>
    );
  }
  
  return (
    <div className="motivazioni-manager-container">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <button 
              className="btn-link" 
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
            <i className="fas fa-chevron-right"></i>
            <span>Gestione Motivazioni</span>
          </div>
          <h1>Gestione Motivazioni per Assenze</h1>
          <p>Gestisci le motivazioni per assenze da utilizzare nelle tabelle turni</p>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="motivazioni-grid">
        <div className="motivazioni-form-container">
          <div className="motivazioni-form-header">
            <h3>{editing ? 'Modifica Motivazione' : 'Aggiungi Nuova Motivazione'}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="motivazioni-form">
            <div className="form-group">
              <label htmlFor="nome">Nome*</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Inserisci il nome della motivazione"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="sigla">Sigla*</label>
              <input
                type="text"
                id="sigla"
                name="sigla"
                value={formData.sigla}
                onChange={handleChange}
                placeholder="Es. FE"
                maxLength="2"
                required
              />
              <small className="helper-text">
                Max 2 caratteri. Questa sigla verrà visualizzata nella tabella.
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="descrizione">Descrizione</label>
              <textarea
                id="descrizione"
                name="descrizione"
                value={formData.descrizione}
                onChange={handleChange}
                placeholder="Descrizione opzionale"
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-actions">
              {editing && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleCancel}
                >
                  Annulla
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editing ? 'Aggiorna' : 'Aggiungi'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="motivazioni-list-container">
          <h3>Motivazioni Esistenti</h3>
          
          {motivazioniList.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h3>Nessuna motivazione</h3>
              <p>Inizia aggiungendo la tua prima motivazione utilizzando il form a sinistra.</p>
            </div>
          ) : (
            <div className="motivazioni-cards">
              {motivazioniList.map(motivazione => (
                <div key={motivazione.id} className="motivazione-card">
                  <div className="motivazione-card-header">
                    <div className="motivazione-title">
                      <span className="motivazione-name">{motivazione.nome}</span>
                      <span className="motivazione-sigla">{motivazione.sigla}</span>
                    </div>
                    <div className="motivazione-actions">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => handleEdit(motivazione)}
                        title="Modifica motivazione"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => setShowConfirm(motivazione.id)}
                        title="Elimina motivazione"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  {motivazione.descrizione && (
                    <div className="motivazione-card-body">
                      <p>{motivazione.descrizione}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal di conferma eliminazione */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Conferma Eliminazione</h3>
            </div>
            <div className="modal-body">
              <p>Sei sicuro di voler eliminare questa motivazione? Questa azione non può essere annullata.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setShowConfirm(null)}
              >
                Annulla
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDelete(showConfirm)}
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

export default MotivazioniManager;