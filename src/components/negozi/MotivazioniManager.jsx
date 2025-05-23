// src/components/negozi/MotivazioniManager.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchMotivazioniByNegozio,
  saveMotivazione,
  deleteMotivazione
} from '../../app/slices/motivazioniSlice';
import { addNotification } from '../../app/slices/uiSlice';
import styles from './Negozi.module.css';

const MotivazioniManager = ({ negozioId }) => {
  const dispatch = useDispatch();
  const motivazioniItems = useSelector(state => 
    state.motivazioni && state.motivazioni.items[negozioId] 
      ? state.motivazioni.items[negozioId] 
      : []);
  const loading = useSelector(state => 
    state.motivazioni ? state.motivazioni.loading : false);
  
  const [formData, setFormData] = useState({
    nome: '',
    sigla: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Effect per caricare le motivazioni all'inizializzazione e quando cambia il negozio
  useEffect(() => {
    if (negozioId) {
      console.log(`MotivazioniManager: carico motivazioni per negozioId ${negozioId}`);
      // Carica le motivazioni solo all'inizializzazione o cambio negozio
      dispatch(fetchMotivazioniByNegozio(negozioId))
        .then(result => {
          console.log("MotivazioniManager: motivazioni caricate con successo:", result);
        })
        .catch(error => {
          console.error("MotivazioniManager: errore caricamento motivazioni:", error);
        });
    }
    
    // Rimuoviamo l'intervallo di ricarica automatica che causava la perdita
    // delle motivazioni personalizzate
    
  }, [dispatch, negozioId]);

  const resetForm = () => {
    setFormData({
      nome: '',
      sigla: ''
    });
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validazione
    if (!formData.sigla.trim() || !formData.nome.trim()) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore: Nome e sigla sono campi obbligatori',
        duration: 3000
      }));
      return;
    }

    // Verifica che la sigla non sia duplicata
    const isDuplicate = motivazioniItems.some(item => 
      item.sigla === formData.sigla && item.id !== editingId
    );

    if (isDuplicate) {
      dispatch(addNotification({
        type: 'error',
        message: 'Errore: Esiste già una motivazione con questa sigla',
        duration: 3000
      }));
      return;
    }

    try {
      console.log("Tentativo di salvataggio motivazione:", {
        formData,
        negozioId,
        editingId
      });
      
      dispatch(saveMotivazione({
        motivazioneData: formData, 
        negozioId, 
        id: editingId
      }))
        .unwrap()
        .then(() => {
          resetForm();
          setShowForm(false);
          dispatch(addNotification({
            type: 'success',
            message: `Motivazione ${editingId ? 'aggiornata' : 'creata'} con successo`,
            duration: 3000
          }));
        })
        .catch(error => {
          console.error("Errore nel dispatch:", error);
          dispatch(addNotification({
            type: 'error',
            message: `Errore: ${error}`,
            duration: 5000
          }));
        });
    } catch (error) {
      console.error("Errore nel try/catch:", error);
      dispatch(addNotification({
        type: 'error',
        message: `Errore durante il salvataggio: ${error.message || 'Errore sconosciuto'}`,
        duration: 5000
      }));
    }
  };

  const handleEdit = (motivazione) => {
    setFormData({
      nome: motivazione.nome,
      sigla: motivazione.sigla || ''
    });
    setEditingId(motivazione.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    dispatch(deleteMotivazione({ id, negozioId }))
      .unwrap()
      .then(() => {
        dispatch(addNotification({
          type: 'success',
          message: 'Motivazione eliminata con successo',
          duration: 3000
        }));
      })
      .catch(error => {
        dispatch(addNotification({
          type: 'error',
          message: `Errore: ${error}`,
          duration: 5000
        }));
      });
  };

  // Log delle motivazioni caricate ogni volta che cambiano
  useEffect(() => {
    console.log("MotivazioniManager: motivazioni nel componente:", motivazioniItems);
  }, [motivazioniItems]);

  const filteredItems = (motivazioniItems || []).filter(item => {
    if (!item) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.sigla || '').toLowerCase().includes(searchLower) ||
      (item.nome || '').toLowerCase().includes(searchLower)
    );
  });

  // Ordina le motivazioni in base alla loro priorità e ordine
  const sortedItems = [...filteredItems].sort((a, b) => {
    // Prima per la proprietà 'ordine'
    if (a.ordine !== undefined && b.ordine !== undefined) {
      return a.ordine - b.ordine;
    }
    
    // Se solo uno ha la proprietà 'ordine' definita, quello viene prima
    if (a.ordine !== undefined) return -1;
    if (b.ordine !== undefined) return 1;
    
    // Predefinite prima delle altre
    if (a.predefinita && !b.predefinita) return -1;
    if (!a.predefinita && b.predefinita) return 1;
    
    // Infine per data di creazione (prima i più vecchi)
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    
    return 0;
  });

  return (
    <div className={styles.motivazioniManager}>
      <div className={styles.particolaritaHeader}>
        <h3>
          <i className="fas fa-calendar-check"></i> Gestione Motivazioni Assenze
        </h3>
        <div className={styles.particolaritaActions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Cerca motivazione..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search"></i>
          </div>
          <button 
            className={styles.addButton}
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? (
              <><i className="fas fa-times"></i> Annulla</>
            ) : (
              <><i className="fas fa-plus"></i> Nuova Motivazione</>
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.particolaritaForm}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="ES: Malattia, Permesso, ecc."
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="sigla">Sigla (max 2 caratteri) *</label>
                <input
                  type="text"
                  id="sigla"
                  name="sigla"
                  value={formData.sigla}
                  onChange={handleInputChange}
                  required
                  maxLength={2}
                  placeholder="ES: ML, PR, ecc."
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={() => {
                resetForm();
                setShowForm(false);
              }} className={styles.btnSecondary}>
                Annulla
              </button>
              <button type="submit" className={styles.btnPrimary}>
                {editingId ? 'Aggiorna' : 'Crea'} Motivazione
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.particolaritaList}>
        {loading && <div className={styles.loading}>Caricamento in corso...</div>}
        
        {!loading && filteredItems.length === 0 && (
          <div className={styles.emptyState}>
            {searchTerm ? (
              <p>Nessuna motivazione trovata con il termine: "{searchTerm}"</p>
            ) : (
              <div>
                <p>Non hai ancora creato motivazioni per questo negozio</p>
                <button 
                  className={styles.btnPrimary}
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus"></i> Crea la prima motivazione
                </button>
              </div>
            )}
          </div>
        )}

        <div className={styles.motivazioniGrid}>
          {sortedItems.map(item => (
            <div key={item.id} className={styles.motivazioneCard}>
              <div className={styles.motivazioneContent}>
                <div className={styles.motivazioneHeader}>
                  <h5>
                    {item.nome}
                    {item.predefinita && (
                      <span className={styles.predefinedBadge} title="Motivazione predefinita">
                        <i className="fas fa-star"></i>
                      </span>
                    )}
                    {item.calcolaOre && (
                      <span className={styles.calcOreBadge} title="Calcola ore automaticamente">
                        <i className="fas fa-calculator"></i>
                      </span>
                    )}
                  </h5>
                  <div className={styles.motivazioneActions}>
                    <button
                      onClick={() => handleEdit(item)}
                      className={styles.iconButton}
                      title="Modifica"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    {!item.predefinita && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={styles.iconButton}
                        title="Elimina"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.motivazioneSigla}>
                  {item.sigla ? (
                    <span className={styles.siglaBox}>
                      {item.sigla}
                    </span>
                  ) : (
                    <span className={styles.noSigla}>
                      Nessuna sigla
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MotivazioniManager;