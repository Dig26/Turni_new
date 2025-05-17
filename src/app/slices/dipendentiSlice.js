// src/app/slices/dipendentiSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as dipendentiService from '../../services/dipendentiService';
import { addNotification } from './uiSlice';

// Thunks
export const fetchDipendentiByNegozioId = createAsyncThunk(
  'dipendenti/fetchDipendentiByNegozioId',
  async (negozioId, { rejectWithValue }) => {
    try {
      const dipendenti = await dipendentiService.getDipendentiByNegozioId(negozioId);
      return { negozioId, dipendenti };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDipendenteById = createAsyncThunk(
  'dipendenti/fetchDipendenteById',
  async (id, { rejectWithValue }) => {
    try {
      const dipendente = await dipendentiService.getDipendenteById(id);
      return dipendente;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveDipendente = createAsyncThunk(
  'dipendenti/saveDipendente',
  async ({ dipendenteData, id }, { rejectWithValue, dispatch }) => {
    try {
      const savedDipendente = await dipendentiService.saveDipendente(dipendenteData, id);
      
      dispatch(addNotification({
        type: 'success',
        message: id ? 'Dipendente aggiornato con successo!' : 'Dipendente creato con successo!',
        duration: 3000
      }));
      
      return savedDipendente;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDipendenteThunk = createAsyncThunk(
  'dipendenti/deleteDipendente',
  async (id, { rejectWithValue }) => {
    try {
      await dipendentiService.deleteDipendente(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Stato iniziale
const initialState = {
  byNegozio: {}, // Dipendenti organizzati per negozio
  currentDipendente: null,
  loading: false,
  error: null
};

const dipendentiSlice = createSlice({
  name: 'dipendenti',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setCurrentDipendente(state, action) {
      state.currentDipendente = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchDipendentiByNegozioId
      .addCase(fetchDipendentiByNegozioId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDipendentiByNegozioId.fulfilled, (state, action) => {
        state.loading = false;
        const { negozioId, dipendenti } = action.payload;
        state.byNegozio[negozioId] = dipendenti;
      })
      .addCase(fetchDipendentiByNegozioId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchDipendenteById
      .addCase(fetchDipendenteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDipendenteById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDipendente = action.payload;
      })
      .addCase(fetchDipendenteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // saveDipendente
      .addCase(saveDipendente.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveDipendente.fulfilled, (state, action) => {
        state.loading = false;
        
        const dipendente = action.payload;
        const negozioId = dipendente.negozio_id;
        
        // Assicurati che esista l'array per il negozio
        if (!state.byNegozio[negozioId]) {
          state.byNegozio[negozioId] = [];
        }
        
        // Aggiorna o aggiungi il dipendente all'array del negozio
        const index = state.byNegozio[negozioId].findIndex(d => d.id === dipendente.id);
        if (index !== -1) {
          state.byNegozio[negozioId][index] = dipendente;
        } else {
          state.byNegozio[negozioId].push(dipendente);
        }
        
        state.currentDipendente = dipendente;
      })
      .addCase(saveDipendente.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // deleteDipendente
      .addCase(deleteDipendenteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDipendenteThunk.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        
        // Rimuovi il dipendente da tutti i negozi (dovrebbe essere in uno solo)
        Object.keys(state.byNegozio).forEach(negozioId => {
          state.byNegozio[negozioId] = state.byNegozio[negozioId].filter(
            dipendente => dipendente.id !== id
          );
        });
        
        if (state.currentDipendente && state.currentDipendente.id === id) {
          state.currentDipendente = null;
        }
      })
      .addCase(deleteDipendenteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setCurrentDipendente } = dipendentiSlice.actions;
export default dipendentiSlice.reducer;