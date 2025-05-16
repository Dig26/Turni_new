// src/app/slices/particolaritaSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as particolaritaService from '../services/particolaritaService';
import { addNotification } from './uiSlice';

// Thunks
export const fetchParticolaritaByNegozio = createAsyncThunk(
  'particolarita/fetchByNegozio',
  async (negozioId, { rejectWithValue }) => {
    try {
      const response = await particolaritaService.getParticolaritaByNegozio(negozioId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveParticolarita = createAsyncThunk(
  'particolarita/save',
  async ({ particolaritaData, negozioId, id = null }, { rejectWithValue, dispatch }) => {
    try {
      const savedParticolarita = await particolaritaService.saveParticolarita(particolaritaData, negozioId, id);
      
      dispatch(addNotification({
        type: 'success',
        message: id ? 'Particolarità aggiornata con successo!' : 'Particolarità creata con successo!',
        duration: 3000
      }));
      
      return savedParticolarita;
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

export const deleteParticolarita = createAsyncThunk(
  'particolarita/delete',
  async ({ id, negozioId }, { rejectWithValue, dispatch }) => {
    try {
      await particolaritaService.deleteParticolarita(id, negozioId);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Particolarità eliminata con successo!',
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

const particolaritaSlice = createSlice({
  name: 'particolarita',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchParticolaritaByNegozio
      .addCase(fetchParticolaritaByNegozio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticolaritaByNegozio.fulfilled, (state, action) => {
        state.loading = false;
        const { negozioId, particolarita } = action.payload;
        state.items[negozioId] = particolarita;
      })
      .addCase(fetchParticolaritaByNegozio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // saveParticolarita
      .addCase(saveParticolarita.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveParticolarita.fulfilled, (state, action) => {
        state.loading = false;
        const { particolarita, negozioId } = action.payload;
        
        if (!state.items[negozioId]) {
          state.items[negozioId] = [];
        }
        
        const index = state.items[negozioId].findIndex(p => p.id === particolarita.id);
        if (index !== -1) {
          state.items[negozioId][index] = particolarita;
        } else {
          state.items[negozioId].push(particolarita);
        }
      })
      .addCase(saveParticolarita.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // deleteParticolarita
      .addCase(deleteParticolarita.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteParticolarita.fulfilled, (state, action) => {
        state.loading = false;
        const { id, negozioId } = action.payload;
        
        if (state.items[negozioId]) {
          state.items[negozioId] = state.items[negozioId].filter(
            particolarita => particolarita.id !== id
          );
        }
      })
      .addCase(deleteParticolarita.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = particolaritaSlice.actions;
export default particolaritaSlice.reducer;