// src/hooks/useNegoziCRUD.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchNegozi, 
  fetchNegozioById, 
  saveNegozio, 
  deleteNegozioThunk, 
  setCurrentNegozio 
} from '../app/slices/negoziSlice';
import { addNotification } from '../app/slices/uiSlice';

export const useNegoziCRUD = () => {
  const dispatch = useDispatch();
  const { negozi, currentNegozio, loading, error } = useSelector(state => state.negozi);
  
  // Carica tutti i negozi
  const loadNegozi = useCallback(async () => {
    try {
      await dispatch(fetchNegozi()).unwrap();
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel caricamento dei negozi: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Carica un negozio specifico
  const loadNegozio = useCallback(async (id) => {
    try {
      await dispatch(fetchNegozioById(id)).unwrap();
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel caricamento del negozio: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Salva un negozio (creazione o aggiornamento)
  const saveNegozioData = useCallback(async (negozioData, id = null) => {
    try {
      await dispatch(saveNegozio({ negozioData, id })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: id ? 'Negozio aggiornato con successo' : 'Negozio creato con successo',
        duration: 3000
      }));
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio del negozio: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Elimina un negozio
  const deleteNegozio = useCallback(async (id) => {
    try {
      await dispatch(deleteNegozioThunk(id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Negozio eliminato con successo',
        duration: 3000
      }));
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nell'eliminazione del negozio: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Seleziona un negozio come corrente (senza caricarlo dal server)
  const selectNegozio = useCallback((negozio) => {
    dispatch(setCurrentNegozio(negozio));
  }, [dispatch]);
  
  return {
    negozi,
    currentNegozio,
    loading,
    error,
    loadNegozi,
    loadNegozio,
    saveNegozioData,
    deleteNegozio,
    selectNegozio
  };
};