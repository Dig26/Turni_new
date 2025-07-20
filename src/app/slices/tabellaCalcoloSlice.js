// src/app/slices/tabellaCalcoloSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import tabellaCalcoloService from "../../services/tabellaCalcoloService";

// Thunks asincroni
export const fetchTabellaCalcoloData = createAsyncThunk(
  "tabellaCalcolo/fetchData",
  async ({ negozioId, anno }) => {
    const response = await tabellaCalcoloService.fetchTabellaCalcoloData(
      negozioId,
      anno
    );
    return { negozioId, anno, data: response };
  }
);

export const saveTabellaCalcoloData = createAsyncThunk(
  "tabellaCalcolo/saveData",
  async ({ negozioId, anno, data }) => {
    const response = await tabellaCalcoloService.saveTabellaCalcoloData(
      negozioId,
      anno,
      data
    );
    return { negozioId, anno, data };
  }
);

export const fetchStoriciTurni = createAsyncThunk(
  "tabellaCalcolo/fetchStorici",
  async ({ negozioId, anno }) => {
    const response = await tabellaCalcoloService.fetchStoriciTurni(
      negozioId,
      anno
    );
    return { negozioId, anno, storici: response };
  }
);

export const exportToExcel = createAsyncThunk(
  "tabellaCalcolo/export",
  async ({ negozioId, anno }) => {
    await tabellaCalcoloService.exportToExcel(negozioId, anno);
    return true;
  }
);

export const calcolaValoriDaiTurni = createAsyncThunk(
  "tabellaCalcolo/calcolaValori",
  async ({ negozioId, anno, mese }) => {
    const response = await tabellaCalcoloService.calcolaValoriDaiTurni(
      negozioId,
      anno,
      mese
    );
    return { negozioId, anno, mese, valori: response };
  }
);

// Slice
const tabellaCalcoloSlice = createSlice({
  name: "tabellaCalcolo",
  initialState: {
    data: {},
    storiciTurni: {},
    loading: false,
    saving: false,
    error: null,
    lastUpdate: null,
  },
  reducers: {
    updateCellValue: (state, action) => {
      const { negozioId, anno, rowIndex, columnName, value } = action.payload;

      if (!state.data[negozioId]) {
        state.data[negozioId] = {};
      }
      if (!state.data[negozioId][anno]) {
        state.data[negozioId][anno] = [];
      }
      if (state.data[negozioId][anno][rowIndex]) {
        state.data[negozioId][anno][rowIndex][columnName] = value;
      }
    },
    clearTabellaData: (state, action) => {
      const { negozioId, anno } = action.payload;
      if (state.data[negozioId] && state.data[negozioId][anno]) {
        delete state.data[negozioId][anno];
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch data
      .addCase(fetchTabellaCalcoloData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTabellaCalcoloData.fulfilled, (state, action) => {
        const { negozioId, anno, data } = action.payload;
        if (!state.data[negozioId]) {
          state.data[negozioId] = {};
        }
        // Assicurati che data sia sempre un array
        state.data[negozioId][anno] = Array.isArray(data) ? data : [];
        state.loading = false;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchTabellaCalcoloData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Save data
      .addCase(saveTabellaCalcoloData.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveTabellaCalcoloData.fulfilled, (state, action) => {
        const { negozioId, anno, data } = action.payload;
        if (!state.data[negozioId]) {
          state.data[negozioId] = {};
        }
        // Salva i dati dell'array direttamente
        state.data[negozioId][anno] = Array.isArray(data) ? data : [];
        state.saving = false;
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(saveTabellaCalcoloData.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message;
      })

      // Fetch storici
      .addCase(fetchStoriciTurni.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStoriciTurni.fulfilled, (state, action) => {
        const { negozioId, anno, storici } = action.payload;
        if (!state.storiciTurni[negozioId]) {
          state.storiciTurni[negozioId] = {};
        }
        state.storiciTurni[negozioId][anno] = storici;
        state.loading = false;
      })
      .addCase(fetchStoriciTurni.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Export Excel
      .addCase(exportToExcel.pending, (state) => {
        state.loading = true;
      })
      .addCase(exportToExcel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportToExcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Calcola valori
      .addCase(calcolaValoriDaiTurni.fulfilled, (state, action) => {
        const { negozioId, anno, mese, valori } = action.payload;
        // Aggiorna i valori calcolati nello stato
        if (state.data[negozioId] && state.data[negozioId][anno]) {
          // Implementa la logica per aggiornare i valori specifici del mese
          // basandosi sui dati ricevuti
        }
      });
  },
});

// Export actions
export const { updateCellValue, clearTabellaData, setError } =
  tabellaCalcoloSlice.actions;

// Selectors
export const selectTabellaData = (state, negozioId, anno) =>
  state.tabellaCalcolo?.data?.[negozioId]?.[anno] || [];

export const selectStoriciTurni = (state, negozioId, anno) =>
  state.tabellaCalcolo?.storiciTurni?.[negozioId]?.[anno] || {};

export const selectTabellaLoading = (state) =>
  state.tabellaCalcolo?.loading || false;

export const selectTabellaSaving = (state) =>
  state.tabellaCalcolo?.saving || false;

export const selectTabellaError = (state) =>
  state.tabellaCalcolo?.error || null;

// Export reducer
export default tabellaCalcoloSlice.reducer;