// src/app/slices/motivazioniSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as motivazioniAPI from '../../services/motivazioniService';

// Thunks
export const fetchMotivazioniByNegozio = createAsyncThunk(
  'motivazioni/fetchByNegozio',
  async (negozioId, { rejectWithValue }) => {
    try {
      const motivazioni = await motivazioniAPI.getMotivazioniByNegozio(negozioId);
      return motivazioni;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveMotivazione = createAsyncThunk(
  'motivazioni/save',
  async ({ motivazioneData, negozioId, id = null }, { rejectWithValue }) => {
    try {
      const savedMotivazione = await motivazioniAPI.saveMotivazione(motivazioneData, negozioId, id);
      return savedMotivazione;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMotivazione = createAsyncThunk(
  'motivazioni/delete',
  async ({ id, negozioId }, { rejectWithValue }) => {
    try {
      await motivazioniAPI.deleteMotivazione(id, negozioId);
      return { id, negozioId };
    } catch (error) {
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
        state.items[negozioId] = motivazioni;
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