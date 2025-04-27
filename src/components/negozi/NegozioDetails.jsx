// src/components/negozi/NegozioDetails.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchNegozioById } from '../../app/slices/negoziSlice';
import { fetchDipendentiByNegozio } from '../../app/slices/dipendentiSlice';
import { Container } from '../common/Layout';
import { Title } from '../common/Typography';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Spinner } from '../common/Loaders';
import styles from './Negozi.module.css';
import ParticolaritaManager from './ParticolaritaManager';

const NegozioDetails = ({ negozioId }) => {
  const dispatch = useDispatch();
  const negozio = useSelector(state => state.negozi.currentNegozio);
  const dipendenti = useSelector(state => 
    state.dipendenti.items.filter(d => d.negozioId === negozioId)
  );
  const loading = useSelector(state => state.negozi.loading || state.dipendenti.loading);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (negozioId) {
      dispatch(fetchNegozioById(negozioId));
      dispatch(fetchDipendentiByNegozio(negozioId));
    }
  }, [dispatch, negozioId]);

  if (loading && !negozio) {
    return <Spinner />;
  }

  if (!negozio) {
    return (
      <div className={styles.errorContainer}>
        <h3>Negozio non trovato</h3>
        <Link to="/negozi">
          <Button>Torna alla lista</Button>
        </Link>
      </div>
    );
  }

  return (
    <Container>
      <div className={styles.negozioDetailsHeader}>
        <div>
          <Title level={2}>{negozio.nome}</Title>
          <p>{negozio.indirizzo}, {negozio.citta}</p>
        </div>
        <div className={styles.actionButtons}>
          <Link to={`/negozi/${negozioId}/edit`}>
            <Button>
              <i className="fas fa-edit"></i> Modifica
            </Button>
          </Link>
          <Link to={`/turni/negozio/${negozioId}`}>
            <Button>
              <i className="fas fa-table"></i> Gestione Turni
            </Button>
          </Link>
        </div>
      </div>

      <div className={styles.tabsNavigation}>
        <button 
          className={activeTab === 'info' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('info')}
        >
          <i className="fas fa-info-circle"></i> Informazioni
        </button>
        <button 
          className={activeTab === 'dipendenti' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('dipendenti')}
        >
          <i className="fas fa-users"></i> Dipendenti ({dipendenti.length})
        </button>
        <button 
          className={activeTab === 'particolarita' ? styles.activeTab : ''} 
          onClick={() => setActiveTab('particolarita')}
        >
          <i className="fas fa-tag"></i> Particolarità
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'info' && (
          <Card>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <h4>Contatti</h4>
                <p><i className="fas fa-phone"></i> {negozio.telefono || 'Non specificato'}</p>
                <p><i className="fas fa-envelope"></i> {negozio.email || 'Non specificato'}</p>
              </div>
              <div className={styles.infoItem}>
                <h4>Responsabile</h4>
                <p>{negozio.responsabile || 'Non specificato'}</p>
              </div>
              <div className={styles.infoItem}>
                <h4>Orari di apertura</h4>
                <p>{negozio.orari || 'Non specificato'}</p>
              </div>
            </div>
            {negozio.note && (
              <div className={styles.notesSection}>
                <h4>Note</h4>
                <p>{negozio.note}</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'dipendenti' && (
          <div>
            <div className={styles.sectionHeader}>
              <h3>Dipendenti assegnati a questo negozio</h3>
              <Link to={`/dipendenti/nuovo?negozioId=${negozioId}`}>
                <Button>
                  <i className="fas fa-plus"></i> Nuovo Dipendente
                </Button>
              </Link>
            </div>

            {dipendenti.length === 0 ? (
              <Card>
                <div className={styles.emptyState}>
                  <p>Nessun dipendente assegnato a questo negozio</p>
                </div>
              </Card>
            ) : (
              <div className={styles.dipendentiGrid}>
                {dipendenti.map(dipendente => (
                  <Card key={dipendente.id} className={styles.dipendenteCard}>
                    <div className={styles.dipendenteHeader}>
                      <h4>{dipendente.nome} {dipendente.cognome}</h4>
                      <div>
                        <Link to={`/dipendenti/${dipendente.id}`}>
                          <button className={styles.iconButton}>
                            <i className="fas fa-eye"></i>
                          </button>
                        </Link>
                        <Link to={`/dipendenti/${dipendente.id}/edit`}>
                          <button className={styles.iconButton}>
                            <i className="fas fa-edit"></i>
                          </button>
                        </Link>
                      </div>
                    </div>
                    <div className={styles.dipendenteInfo}>
                      <p><i className="fas fa-id-badge"></i> {dipendente.mansione || 'Nessuna mansione'}</p>
                      <p><i className="fas fa-phone"></i> {dipendente.telefono || 'Non specificato'}</p>
                      <p><i className="fas fa-envelope"></i> {dipendente.email || 'Non specificato'}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'particolarita' && (
          <ParticolaritaManager negozioId={negozioId} />
        )}
      </div>
    </Container>
  );
};

export default NegozioDetails;