import React, { useState, useEffect } from 'react';
import { saveDipendente, getDipendenteById } from '../services/dipendentiService';
import { getNegozioById } from '../services/negoziService';
import '../styles/DipendenteForm.css';

function DipendenteForm({ onNavigate, negozioId, dipendenteId }) {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    nomeTurno: '',
    oreSettimanali: 40,
    dataAssunzione: '',
    dataFineContratto: '',
    ruolo: 'dipendente',
    giorniFerie: 0,
    giorniROL: 0,
    giorniExFestivita: 0,
    negozioId: negozioId
  });
  
  const [negozio, setNegozio] = useState(null);
  const [loading, setLoading] = useState(dipendenteId ? true : false);
  const [error, setError] = useState('');
  
  const ruoliOptions = [
    { value: 'dipendente', label: 'Dipendente' },
    { value: 'direttore', label: 'Direttore' },
    { value: 'vice-direttore', label: 'Vice-Direttore' },
    { value: 'responsabile', label: 'Responsabile' },
    { value: 'stagista', label: 'Stagista' },
    { value: 'altro', label: 'Altro' }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carica il negozio
        const negozioData = await getNegozioById(negozioId);
        setNegozio(negozioData);
        
        // Se è una modifica, carica i dati del dipendente
        if (dipendenteId) {
          const dipendente = await getDipendenteById(dipendenteId);
          setFormData({
            ...dipendente,
            // Assicurati che le date siano in formato YYYY-MM-DD per gli input di tipo date
            dataAssunzione: dipendente.dataAssunzione ? formatDateForInput(dipendente.dataAssunzione) : '',
            dataFineContratto: dipendente.dataFineContratto ? formatDateForInput(dipendente.dataFineContratto) : '',
          });
        } else {
          // Imposta la data di assunzione di default a oggi per un nuovo dipendente
          setFormData(prev => ({
            ...prev,
            dataAssunzione: formatDateForInput(new Date())
          }));
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        setError('Errore nel caricamento dei dati.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [negozioId, dipendenteId]);
  
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    return date.toISOString().split('T')[0];
  };
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Gestisci i campi numerici
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Aggiorna automaticamente il nome del turno quando cambia nome o cognome
    if (name === 'nome' || name === 'cognome') {
      // Solo se il nomeTurno è vuoto o uguale a "Nome Cognome" precedente
      if (!formData.nomeTurno || formData.nomeTurno === `${formData.nome} ${formData.cognome}`) {
        const newNome = name === 'nome' ? value : formData.nome;
        const newCognome = name === 'cognome' ? value : formData.cognome;
        
        if (newNome && newCognome) {
          setFormData(prev => ({
            ...prev,
            nomeTurno: `${newNome} ${newCognome.charAt(0)}.`
          }));
        }
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validazione
    if (!formData.nome.trim()) {
      setError('Il nome è obbligatorio.');
      return;
    }
    
    if (!formData.cognome.trim()) {
      setError('Il cognome è obbligatorio.');
      return;
    }
    
    if (!formData.dataAssunzione) {
      setError('La data di assunzione è obbligatoria.');
      return;
    }
    
    try {
      // Se il nomeTurno è vuoto, usa "Nome Cognome"
      if (!formData.nomeTurno.trim()) {
        formData.nomeTurno = `${formData.nome} ${formData.cognome.charAt(0)}.`;
      }
      
      await saveDipendente(formData, dipendenteId);
      onNavigate('dipendenti', { negozioId });
    } catch (error) {
      console.error('Errore nel salvataggio del dipendente:', error);
      setError('Errore nel salvataggio del dipendente. Riprova.');
    }
  };
  
  if (loading) {
    return (
      <div className="loading-spinner center">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Caricamento dati...</span>
      </div>
    );
  }
  
  return (
    <div className="dipendente-form-container">
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
            <button 
              className="btn-link" 
              onClick={() => onNavigate('dipendenti', { negozioId })}
            >
              {negozio?.nome}
            </button>
            <i className="fas fa-chevron-right"></i>
            <span>{dipendenteId ? 'Modifica Dipendente' : 'Nuovo Dipendente'}</span>
          </div>
          <h1>{dipendenteId ? 'Modifica Dipendente' : 'Aggiungi Nuovo Dipendente'}</h1>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="dipendente-form">
        <div className="form-section">
          <h3>Informazioni Personali</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Nome"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cognome">Cognome *</label>
              <input
                type="text"
                id="cognome"
                name="cognome"
                value={formData.cognome}
                onChange={handleChange}
                required
                placeholder="Cognome"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="nomeTurno">Nome nel Turno</label>
            <input
              type="text"
              id="nomeTurno"
              name="nomeTurno"
              value={formData.nomeTurno}
              onChange={handleChange}
              placeholder="Come apparirà nei turni (es. Mario R.)"
            />
            <small className="helper-text">
              Se lasciato vuoto, verrà utilizzato nome e iniziale del cognome.
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="ruolo">Ruolo</label>
            <select
              id="ruolo"
              name="ruolo"
              value={formData.ruolo}
              onChange={handleChange}
            >
              {ruoliOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Dettagli Contrattuali</h3>
          
          <div className="form-group">
            <label htmlFor="oreSettimanali">Ore Settimanali Standard *</label>
            <input
              type="number"
              id="oreSettimanali"
              name="oreSettimanali"
              value={formData.oreSettimanali}
              onChange={handleChange}
              min="1"
              max="168"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataAssunzione">Data Assunzione *</label>
              <input
                type="date"
                id="dataAssunzione"
                name="dataAssunzione"
                value={formData.dataAssunzione}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dataFineContratto">
                Data Fine Contratto
                <span className="optional"> (opzionale)</span>
              </label>
              <input
                type="date"
                id="dataFineContratto"
                name="dataFineContratto"
                value={formData.dataFineContratto}
                onChange={handleChange}
                min={formData.dataAssunzione}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Giorni Disponibili</h3>
          
          <div className="form-row three-columns">
            <div className="form-group">
              <label htmlFor="giorniFerie">Giorni Ferie</label>
              <input
                type="number"
                id="giorniFerie"
                name="giorniFerie"
                value={formData.giorniFerie}
                onChange={handleChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="giorniROL">Giorni ROL</label>
              <input
                type="number"
                id="giorniROL"
                name="giorniROL"
                value={formData.giorniROL}
                onChange={handleChange}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="giorniExFestivita">Giorni Ex Festività</label>
              <input
                type="number"
                id="giorniExFestivita"
                name="giorniExFestivita"
                value={formData.giorniExFestivita}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => onNavigate('dipendenti', { negozioId })}
          >
            Annulla
          </button>
          <button type="submit" className="btn-primary">
            {dipendenteId ? 'Aggiorna Dipendente' : 'Crea Dipendente'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DipendenteForm;