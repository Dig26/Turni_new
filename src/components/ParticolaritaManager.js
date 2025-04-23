import React, { useState, useEffect } from 'react';
import { getParticolarita, saveParticolarita, deleteParticolarita } from '../services/particolaritaService';
import '../styles/ParticolaritaManager.css';

function ParticolaritaManager({ onNavigate }) {
  const [particolaritaList, setParticolaritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ nome: '', descrizione: '', sigla: '' });
  const [showConfirm, setShowConfirm] = useState(null);
  
  useEffect(() => {
    const fetchParticolarita = async () => {
      try {
        const data = await getParticolarita();
        setParticolaritaList(data);
      } catch (error) {
        console.error('Errore nel caricamento delle particolarità:', error);
        setError('Errore nel caricamento delle particolarità. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParticolarita();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEdit = (particolarita) => {
    setEditing(particolarita.id);
    setFormData({
      nome: particolarita.nome,
      descrizione: particolarita.descrizione || '',
      sigla: particolarita.sigla
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
      const particolaritaToSave = {
        ...formData,
        id: editing || Date.now().toString()
      };
      
      await saveParticolarita(particolaritaToSave);
      
      // Aggiorna l'elenco
      const updatedList = await getParticolarita();
      setParticolaritaList(updatedList);
      
      // Reset del form
      setEditing(null);
      setFormData({ nome: '', descrizione: '', sigla: '' });
    } catch (error) {
      console.error('Errore nel salvataggio della particolarità:', error);
      setError('Errore nel salvataggio. Riprova.');
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await deleteParticolarita(id);
      
      // Aggiorna l'elenco
      const updatedList = await getParticolarita();
      setParticolaritaList(updatedList);
      
      setShowConfirm(null);
    } catch (error) {
      console.error('Errore nell\'eliminazione della particolarità:', error);
      setError('Errore nell\'eliminazione. Riprova.');
    }
  };
  
  if (loading) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento particolarità...</span>
      </div>
    );
  }
  
  return (
    <div className="particolarita-manager-container">
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
            <span>Gestione Particolarità</span>
          </div>
          <h1>Gestione Particolarità</h1>
          <p>Gestisci le particolarità da utilizzare nelle tabelle turni</p>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="particolarita-grid">
        <div className="particolarita-form-container">
          <div className="particolarita-form-header">
            <h3>{editing ? 'Modifica Particolarità' : 'Aggiungi Nuova Particolarità'}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="particolarita-form">
            <div className="form-group">
              <label htmlFor="nome">Nome*</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Inserisci il nome della particolarità"
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
                placeholder="Es. TN"
                maxLength="3"
                required
              />
              <small className="helper-text">
                Max 3 caratteri. Questa sigla verrà visualizzata nella tabella.
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
        
        <div className="particolarita-list-container">
          <h3>Particolarità Esistenti</h3>
          
          {particolaritaList.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-tags"></i>
              <h3>Nessuna particolarità</h3>
              <p>Inizia aggiungendo la tua prima particolarità utilizzando il form a sinistra.</p>
            </div>
          ) : (
            <div className="particolarita-cards">
              {particolaritaList.map(particolarita => (
                <div key={particolarita.id} className="particolarita-card">
                  <div className="particolarita-card-header">
                    <div className="particolarita-title">
                      <span className="particolarita-name">{particolarita.nome}</span>
                      <span className="particolarita-sigla">{particolarita.sigla}</span>
                    </div>
                    <div className="particolarita-actions">
                      <button 
                        className="btn-icon btn-edit" 
                        onClick={() => handleEdit(particolarita)}
                        title="Modifica particolarità"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        onClick={() => setShowConfirm(particolarita.id)}
                        title="Elimina particolarità"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  {particolarita.descrizione && (
                    <div className="particolarita-card-body">
                      <p>{particolarita.descrizione}</p>
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
              <p>Sei sicuro di voler eliminare questa particolarità? Questa azione non può essere annullata.</p>
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

export default ParticolaritaManager;