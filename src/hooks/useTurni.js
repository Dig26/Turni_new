// src/hooks/useTurni.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTurniSalvati, 
  fetchTabellaById, 
  saveTabellaThunk, 
  deleteTabellaThunk, 
  setCurrentTabella,
  clearSaveMessage
} from '../app/slices/turniSlice';
import { addNotification } from '../app/slices/uiSlice';

export const useTurni = () => {
  const dispatch = useDispatch();
  const { byNegozio, currentTabella, loading, error, saveMessage } = useSelector(state => state.turni);
  
  // Carica tutte le tabelle salvate per un negozio
  const loadTurniSalvati = useCallback(async (negozioId) => {
    try {
      await dispatch(fetchTurniSalvati(negozioId)).unwrap();
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel caricamento delle tabelle turni: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Carica una specifica tabella turni
  const loadTabella = useCallback(async (negozioId, anno, mese) => {
    try {
      await dispatch(fetchTabellaById({ negozioId, anno, mese })).unwrap();
      return true;
    } catch (error) {
      // In questo caso potrebbe essere che la tabella non esiste ancora,
      // quindi non mostriamo un errore
      console.log('Tabella non trovata, potrebbe essere necessario crearne una nuova');
      return false;
    }
  }, [dispatch]);
  
  // Salva una tabella turni
  const saveTabella = useCallback(async (negozioId, anno, mese, data) => {
    try {
      await dispatch(saveTabellaThunk({ negozioId, anno, mese, data })).unwrap();
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio della tabella: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Elimina una tabella turni
  const deleteTabella = useCallback(async (tableId) => {
    try {
      await dispatch(deleteTabellaThunk(tableId)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Tabella turni eliminata con successo',
        duration: 3000
      }));
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nell'eliminazione della tabella: ${error}`,
        duration: 5000
      }));
      return false;
    }
  }, [dispatch]);
  
  // Seleziona una tabella come corrente (senza caricarla dal server)
  const selectTabella = useCallback((tabella) => {
    dispatch(setCurrentTabella(tabella));
  }, [dispatch]);
  
  // Pulisci il messaggio di salvataggio
  const clearSaveMessageAction = useCallback(() => {
    dispatch(clearSaveMessage());
  }, [dispatch]);
  
  // Ottieni le tabelle salvate di un negozio specifico
  const getTabelleByNegozioId = useCallback((negozioId) => {
    return byNegozio[negozioId] || [];
  }, [byNegozio]);
  
  return {
    byNegozio,
    currentTabella,
    loading,
    error,
    saveMessage,
    loadTurniSalvati,
    loadTabella,
    saveTabella,
    deleteTabella,
    selectTabella,
    clearSaveMessage: clearSaveMessageAction,
    getTabelleByNegozioId
  };
};
