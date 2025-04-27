// src/components/negozi/ParticolaritaManager.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchParticolaritaByNegozio,
  saveParticolarita,
  deleteParticolarita
} from '../../app/slices/particolaritaSlice';
import { addNotification } from '../../app/slices/uiSlice';
import styles from './Negozi.module.css';

// Rimosso le categorie predefinite
const defaultCategorie = [];

const ParticolaritaManager = ({ negozioId }) => {
  const dispatch = useDispatch();
  const particolaritaItems = useSelector(state => 
    state.particolarita.items[negozioId] || []);
  const loading = useSelector(state => state.particolarita.loading);
  
  const [formData, setFormData] = useState({
    sigla: '',
    nome: '',
    descrizione: '',
    colore: '#3498db'
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (negozioId) {
      dispatch(fetchParticolaritaByNegozio(negozioId));
    }
  }, [dispatch, negozioId]);

  const resetForm = () => {
    setFormData({
      sigla: '',
      nome: '',
      descrizione: '',
      colore: '#3498db'
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
      console.log('Errore: Sigla e nome sono campi obbligatori');
      // Sostituito temporaneamente la notifica con un console.log
      return;
    }

    // Verifica che la sigla non sia duplicata
    const isDuplicate = particolaritaItems.some(item => 
      item.sigla === formData.sigla && item.id !== editingId
    );

    if (isDuplicate) {
      console.log('Errore: Esiste già una particolarità con questa sigla');
      // Sostituito temporaneamente la notifica con un console.log
      return;
    }

    // Esegue direttamente la funzione del servizio per evitare problemi con Redux durante il test
    const saveAction = saveParticolarita({
      particolaritaData: formData, 
      negozioId, 
      id: editingId
    });
    
    dispatch(saveAction).then(() => {
      resetForm();
      setShowForm(false);
      console.log(`Particolarità ${editingId ? 'aggiornata' : 'creata'} con successo`);
    });
  };

  const handleEdit = (particolarita) => {
    setFormData({
      sigla: particolarita.sigla,
      nome: particolarita.nome,
      descrizione: particolarita.descrizione || '',
      categoria: particolarita.categoria || 'altro',
      colore: particolarita.colore || '#3498db'
    });
    setEditingId(particolarita.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa particolarità?')) {
      dispatch(deleteParticolarita({ id, negozioId })).then(() => {
        console.log('Particolarità eliminata con successo');
        // Sostituito temporaneamente la notifica con un console.log
      });
    }
  };

  const filteredItems = particolaritaItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.sigla.toLowerCase().includes(searchLower) ||
      item.nome.toLowerCase().includes(searchLower) ||
      (item.descrizione && item.descrizione.toLowerCase().includes(searchLower))
    );
  });

  // Raggruppa le particolarità per categoria
  const groupedItems = filteredItems.reduce((acc, item) => {
    const categoria = item.categoria || 'altro';
    if (!acc[categoria]) {
      acc[categoria] = [];
    }
    acc[categoria].push(item);
    return acc;
  }, {});

  return (
    <div className={styles.particolaritaManager}>
      <div className={styles.particolaritaHeader}>
        <h3>
          <i className="fas fa-tag"></i> Gestione Particolarità
        </h3>
        <div className={styles.particolaritaActions}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Cerca particolarità..."
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
              <><i className="fas fa-plus"></i> Nuova Particolarità</>
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.particolaritaForm}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="sigla">Sigla / Visualizzazione nei Turni *</label>
                <input
                  type="text"
                  id="sigla"
                  name="sigla"
                  value={formData.sigla}
                  onChange={handleInputChange}
                  required
                  maxLength={10}
                  placeholder="ES: TN, SW, MAL..."
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  placeholder="ES: Turno Notturno, Smart Working..."
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="colore">Colore</label>
                <input
                  type="color"
                  id="colore"
                  name="colore"
                  value={formData.colore}
                  onChange={handleInputChange}
                />
                <span style={{ marginLeft: '10px' }}>{formData.colore}</span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="descrizione">Descrizione</label>
              <textarea
                id="descrizione"
                name="descrizione"
                value={formData.descrizione}
                onChange={handleInputChange}
                placeholder="Descrizione opzionale della particolarità"
                rows={3}
              />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={() => {
                resetForm();
                setShowForm(false);
              }} className={styles.btnSecondary}>
                Annulla
              </button>
              <button type="submit" className={styles.btnPrimary}>
                {editingId ? 'Aggiorna' : 'Crea'} Particolarità
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
              <p>Nessuna particolarità trovata con il termine: "{searchTerm}"</p>
            ) : (
              <div>
                <p>Non hai ancora creato particolarità per questo negozio</p>
                <button 
                  className={styles.btnPrimary}
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-plus"></i> Crea la prima particolarità
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && Object.keys(groupedItems).map(categoria => {
          const categoriaInfo = defaultCategorie.find(c => c.id === categoria) || {
            nome: 'Altro',
            icona: 'fas fa-ellipsis-h'
          };
          
          return (
            <div key={categoria} className={styles.particolaritaCategory}>
              <h4>
                <i className={categoriaInfo.icona}></i> {categoriaInfo.nome}
              </h4>
              <div className={styles.particolaritaGrid}>
                {groupedItems[categoria].map(item => (
                  <div key={item.id} className={styles.particolaritaCard}>
                    <div className={styles.particolaritaContent}>
                      <div className={styles.particolaritaHeader}>
                        <h5>{item.nome}</h5>
                        <div className={styles.particolaritaActions}>
                          <button
                            onClick={() => handleEdit(item)}
                            className={styles.iconButton}
                            title="Modifica"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className={styles.iconButton}
                            title="Elimina"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                      <div 
                        className={styles.particolaritaSigla}
                        style={{ 
                          backgroundColor: item.colore || '#3498db',
                          color: getContrastColor(item.colore || '#3498db')
                        }}
                      >
                        {item.sigla}
                      </div>
                      {item.descrizione && (
                        <p className={styles.particolaritaDescrizione}>{item.descrizione}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Funzione di utilità per determinare il colore del testo in base al colore di sfondo
function getContrastColor(hexColor) {
  // Converte il colore HEX in RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // Calcola la luminosità
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Se la luminosità è alta, usa il testo scuro, altrimenti usa il testo chiaro
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export default ParticolaritaManager;