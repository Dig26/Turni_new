// src/app/slices/motivazioniSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as motivazioniService from '../../services/motivazioniService';
import { addNotification } from './uiSlice';

// Thunks
export const fetchMotivazioniByNegozio = createAsyncThunk(
  'motivazioni/fetchByNegozio',
  async (negozioId, { rejectWithValue, getState }) => {
    try {
      console.log(`fetchMotivazioniByNegozio thunk chiamato per negozioId: ${negozioId}`);
      
      // Verifica se ci sono già motivazioni personalizzate nello store
      const currentMotivazioni = getState().motivazioni.items[negozioId] || [];
      const hasCustomMotivazioni = currentMotivazioni.some(m => !m.predefinita);
      
      console.log("Stato attuale motivazioni:", currentMotivazioni);
      console.log("Ci sono motivazioni personalizzate?", hasCustomMotivazioni);
      
      // Se ci sono già motivazioni personalizzate, restituisci quelle esistenti
      if (hasCustomMotivazioni && currentMotivazioni.length > 0) {
        console.log("Utilizzo le motivazioni esistenti anziché ricaricarle");
        return {
          negozioId,
          motivazioni: currentMotivazioni
        };
      }
      
      // Altrimenti carica le motivazioni dal servizio
      console.log("Carico le motivazioni dal servizio");
      const response = await motivazioniService.getMotivazioniByNegozio(negozioId);
      
      console.log(`fetchMotivazioniByNegozio thunk risultato:`, response);
      return response;
    } catch (error) {
      console.error(`fetchMotivazioniByNegozio thunk errore:`, error);
      return rejectWithValue(error.message);
    }
  }
);

export const saveMotivazione = createAsyncThunk(
  'motivazioni/save',
  async ({ motivazioneData, negozioId, id = null }, { rejectWithValue, dispatch }) => {
    try {
      console.log("saveMotivazione thunk called with:", { motivazioneData, negozioId, id });
      const savedMotivazione = await motivazioniService.saveMotivazione(motivazioneData, negozioId, id);
      
      dispatch(addNotification({
        type: 'success',
        message: id ? 'Motivazione aggiornata con successo!' : 'Motivazione creata con successo!',
        duration: 3000
      }));
      
      console.log("saveMotivazione thunk result:", savedMotivazione);
      return savedMotivazione;
    } catch (error) {
      console.error("saveMotivazione thunk error:", error);
      
      dispatch(addNotification({
        type: 'error',
        message: `Errore: ${error.message || "Errore sconosciuto"}`,
        duration: 5000
      }));
      
      return rejectWithValue(error.message || "Errore sconosciuto");
    }
  }
);

export const deleteMotivazione = createAsyncThunk(
  'motivazioni/delete',
  async ({ id, negozioId }, { rejectWithValue, dispatch }) => {
    try {
      await motivazioniService.deleteMotivazione(id, negozioId);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Motivazione eliminata con successo!',
        duration: 3000
      }));
      
      return { id, negozioId };
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore: ${error.message || "Errore sconosciuto"}`,
        duration: 5000
      }));
      
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: {},  // Organizzati per negozioId
  loading: false,
  error: null
};

const motivazioniSlice = createSlice({
  name: 'motivazioni',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchMotivazioniByNegozio
      .addCase(fetchMotivazioniByNegozio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMotivazioniByNegozio.fulfilled, (state, action) => {
        state.loading = false;
        const { negozioId, motivazioni } = action.payload;
        
        // Cambiato qui: se non ci sono motivazioni o se sono vuote, 
        // aggiorna lo stato. Altrimenti preserva le motivazioni esistenti.
        if (!state.items[negozioId] || state.items[negozioId].length === 0) {
          state.items[negozioId] = motivazioni;
        }
        // Non sovrascriviamo se ci sono già motivazioni per evitare di perdere quelle personalizzate
      })
      .addCase(fetchMotivazioniByNegozio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // saveMotivazione
      .addCase(saveMotivazione.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveMotivazione.fulfilled, (state, action) => {
        state.loading = false;
        const { motivazione, negozioId } = action.payload;
        
        if (!state.items[negozioId]) {
          state.items[negozioId] = [];
        }
        
        const index = state.items[negozioId].findIndex(m => m.id === motivazione.id);
        if (index !== -1) {
          state.items[negozioId][index] = motivazione;
        } else {
          state.items[negozioId].push(motivazione);
        }
      })
      .addCase(saveMotivazione.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // deleteMotivazione
      .addCase(deleteMotivazione.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMotivazione.fulfilled, (state, action) => {
        state.loading = false;
        const { id, negozioId } = action.payload;
        
        if (state.items[negozioId]) {
          state.items[negozioId] = state.items[negozioId].filter(
            motivazione => motivazione.id !== id
          );
        }
      })
      .addCase(deleteMotivazione.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = motivazioniSlice.actions;
export default motivazioniSlice.reducer;