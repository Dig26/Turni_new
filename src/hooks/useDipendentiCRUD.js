// src/hooks/useDipendentiCRUD.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchDipendentiByNegozioId, 
  fetchDipendenteById, 
  saveDipendente, 
  deleteDipendenteThunk, 
  setCurrentDipendente 
} from '../app/slices/dipendentiSlice';
import { addNotification } from '../app/slices/uiSlice';

export const useDipendentiCRUD = () => {
  const dispatch = useDispatch();
  const { byNegozio, currentDipendente, loading, error } = useSelector(state => state.dipendenti);
  
  // Carica tutti i dipendenti di un negozio
  const loadDipendenti = useCallback(async (negozioId) => {
    try {
      await dispatch(fetchDipendentiByNegozioId(negozioId)).unwrap();
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel caricamento dei dipendenti: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Carica un dipendente specifico
  const loadDipendente = useCallback(async (id) => {
    try {
      await dispatch(fetchDipendenteById(id)).unwrap();
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel caricamento del dipendente: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Salva un dipendente (creazione o aggiornamento)
  const saveDipendenteData = useCallback(async (dipendenteData, id = null) => {
    try {
      await dispatch(saveDipendente({ dipendenteData, id })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: id ? 'Dipendente aggiornato con successo' : 'Dipendente creato con successo',
        duration: 3000
      }));
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio del dipendente: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Elimina un dipendente
  const deleteDipendente = useCallback(async (id) => {
    try {
      await dispatch(deleteDipendenteThunk(id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Dipendente eliminato con successo',
        duration: 3000
      }));
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nell'eliminazione del dipendente: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Seleziona un dipendente come corrente (senza caricarlo dal server)
  const selectDipendente = useCallback((dipendente) => {
    dispatch(setCurrentDipendente(dipendente));
  }, [dispatch]);
  
  // Ottieni i dipendenti di un negozio specifico
  const getDipendentiByNegozioId = useCallback((negozioId) => {
    return byNegozio[negozioId] || [];
  }, [byNegozio]);
  
  return {
    byNegozio,
    currentDipendente,
    loading,
    error,
    loadDipendenti,
    loadDipendente,
    saveDipendenteData,
    deleteDipendente,
    selectDipendente,
    getDipendentiByNegozioId
  };
};
