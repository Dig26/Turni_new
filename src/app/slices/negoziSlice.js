// src/app/slices/negoziSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as negoziAPI from '../../services/api/negoziAPI';

// Thunks
export const fetchNegozi = createAsyncThunk(
  'negozi/fetchNegozi',
  async (_, { rejectWithValue }) => {
    try {
      const negozi = await negoziAPI.getNegozi();
      return negozi;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNegozioById = createAsyncThunk(
  'negozi/fetchNegozioById',
  async (id, { rejectWithValue }) => {
    try {
      const negozio = await negoziAPI.getNegozioById(id);
      return negozio;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveNegozio = createAsyncThunk(
  'negozi/saveNegozio',
  async ({ negozioData, id }, { rejectWithValue }) => {
    try {
      const savedNegozio = await negoziAPI.saveNegozio(negozioData, id);
      return savedNegozio;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNegozioThunk = createAsyncThunk(
  'negozi/deleteNegozio',
  async (id, { rejectWithValue }) => {
    try {
      await negoziAPI.deleteNegozio(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  negozi: [],
  currentNegozio: null,
  loading: false,
  error: null,
  lastFetched: null
};

const negoziSlice = createSlice({
  name: 'negozi',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setCurrentNegozio(state, action) {
      state.currentNegozio = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchNegozi
      .addCase(fetchNegozi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNegozi.fulfilled, (state, action) => {
        state.loading = false;
        state.negozi = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchNegozi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // fetchNegozioById
      .addCase(fetchNegozioById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNegozioById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentNegozio = action.payload;
      })
      .addCase(fetchNegozioById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // saveNegozio
      .addCase(saveNegozio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveNegozio.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update or add the negozio in the negozi array
        const index = state.negozi.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.negozi[index] = action.payload;
        } else {
          state.negozi.push(action.payload);
        }
        
        state.currentNegozio = action.payload;
      })
      .addCase(saveNegozio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // deleteNegozio
      .addCase(deleteNegozioThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNegozioThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.negozi = state.negozi.filter(negozio => negozio.id !== action.payload);
        if (state.currentNegozio && state.currentNegozio.id === action.payload) {
          state.currentNegozio = null;
        }
      })
      .addCase(deleteNegozioThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setCurrentNegozio } = negoziSlice.actions;
export default negoziSlice.reducer;