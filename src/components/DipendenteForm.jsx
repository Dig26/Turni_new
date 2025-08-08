import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveDipendente, getDipendenteById } from '../services/api/dipendentiAPI';
import { getNegozioById } from '../services/api/negoziAPI';
import '../styles/DipendenteForm.css';

function DipendenteForm({ negozioId, dipendenteId }) {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    nomeTurno: '',
    oreSettimanali: 40,
    dataAssunzione: '',
    dataFineContratto: '',
    ruolo: 'dipendente',
    negozioId: negozioId
  });
  
  const [negozio, setNegozio] = useState(null);
  const [loading, setLoading] = useState(dipendenteId ? true : false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const ruoliOptions = [
    { value: 'dipendente', label: 'Dipendente' },
    { value: 'vice-responsabile', label: 'Vice-Responsabile' },
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
          console.log('📅 Dati dipendente caricati COMPLETI:', JSON.stringify(dipendente, null, 2));
          
          // Usa i nomi corretti dei campi dal database (snake_case)
          const dataAssunzioneDB = dipendente.data_assunzione || dipendente.dataAssunzione;
          const dataFineContrattiDB = dipendente.data_fine_contratto || dipendente.dataFineContratto;
          
          console.log('🔍 Dati dal DB:', {
            data_assunzione_db: dipendente.data_assunzione,
            data_fine_contratto_db: dipendente.data_fine_contratto,
            dataAssunzioneDB,
            dataFineContrattiDB
          });
          
          const dataAssunzioneFormatted = dataAssunzioneDB ? formatDateForInput(dataAssunzioneDB) : '';
          const dataFineContrattoFormatted = dataFineContrattiDB ? formatDateForInput(dataFineContrattiDB) : '';
          
          console.log('📅 Date formattate:', {
            dataAssunzione: dataAssunzioneFormatted,
            dataFineContratto: dataFineContrattoFormatted
          });
          
          setFormData({
            nome: dipendente.nome || '',
            cognome: dipendente.cognome || '',
            nomeTurno: dipendente.nomeTurno || dipendente.nome_turno || '',
            oreSettimanali: dipendente.oreSettimanali || dipendente.ore_settimanali || 40,
            dataAssunzione: dataAssunzioneFormatted,
            dataFineContratto: dataFineContrattoFormatted,
            ruolo: dipendente.ruolo || 'dipendente',
            negozioId: negozioId
          });
        } else {
          // Imposta la data di assunzione di default a oggi per un nuovo dipendente
          setFormData(prev => ({
            ...prev,
            dataAssunzione: formatDateForInput(new Date()),
            negozioId: negozioId // Assicurati che sia sempre impostato
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
    
    try {
      let dateObj;
      
      if (typeof date === 'string') {
        // Gestisce diversi formati di data che potrebbero arrivare dal backend
        if (date.includes('T')) {
          // Formato ISO con orario (2024-01-15T00:00:00.000Z)
          dateObj = new Date(date);
        } else if (date.includes('-') && date.length === 10) {
          // Formato YYYY-MM-DD
          dateObj = new Date(date + 'T00:00:00');
        } else {
          // Altri formati
          dateObj = new Date(date);
        }
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return '';
      }
      
      // Verifica che la data sia valida
      if (isNaN(dateObj.getTime())) {
        console.warn('Data non valida ricevuta:', date);
        return '';
      }
      
      // Restituisce nel formato YYYY-MM-DD per gli input HTML
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Errore nella formattazione della data:', error, 'Data ricevuta:', date);
      return '';
    }
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
    
    // Validazione aggiuntiva per il negozioId
    if (!formData.negozioId) {
      setError('Errore: ID negozio mancante.');
      return;
    }
    
    try {
      // Prepara i dati per il salvataggio
      const dataToSave = {
        ...formData,
        negozioId: negozioId, // Usa sempre il negozioId dai props
        nomeTurno: formData.nomeTurno.trim() || `${formData.nome} ${formData.cognome.charAt(0)}.`
      };
      
      console.log('📝 Dati che verranno inviati:', dataToSave);
      
      await saveDipendente(dataToSave, dipendenteId);
      // Reindirizzamento al NegozioHub con la tab dipendenti attiva
      navigate(`/negozi/${negozioId}`);
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
              onClick={() => navigate('/negozi')}
            >
              Negozi
            </button>
            <i className="fas fa-chevron-right"></i>
            <button 
              className="btn-link" 
              onClick={() => navigate(`/negozi/${negozioId}`)}
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
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => navigate(`/negozi/${negozioId}`)}
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