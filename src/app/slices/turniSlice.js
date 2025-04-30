// src/app/slices/turniSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Funzione di utilità per gestire il localStorage
const getStorageKey = (negozioId, anno, mese) =>
  `tabella_turni_${negozioId}_${anno}_${mese}`;

// Thunks
export const fetchTurniSalvati = createAsyncThunk(
  "turni/fetchTurniSalvati",
  async (negozioId, { rejectWithValue }) => {
    try {
      const tabelleSalvate = [];

      // Cerca tutte le chiavi nel localStorage che iniziano con il prefisso per questo negozio
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`tabella_turni_${negozioId}_`)) {
          try {
            const savedData = JSON.parse(localStorage.getItem(key));
            if (savedData && savedData.timestamp) {
              // Estrai anno e mese dalla chiave
              const keyParts = key.split("_");
              const year = keyParts[3];
              const month = keyParts[4];

              // Nome del mese
              const mesi = [
                "Gennaio",
                "Febbraio",
                "Marzo",
                "Aprile",
                "Maggio",
                "Giugno",
                "Luglio",
                "Agosto",
                "Settembre",
                "Ottobre",
                "Novembre",
                "Dicembre",
              ];
              const monthName = mesi[parseInt(month)];

              tabelleSalvate.push({
                id: key,
                year: year,
                month: month,
                monthName: monthName,
                timestamp: savedData.timestamp,
                name: `${monthName} ${year}`,
              });
            }
          } catch (e) {
            console.error("Errore nella lettura della tabella salvata:", e);
          }
        }
      }

      // MODIFICATO: Ordina per data di modifica (timestamp), più recenti prima
      // Questo garantisce che le tabelle vengano ordinate per data di modifica
      tabelleSalvate.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      return {
        negozioId,
        tabelleSalvate,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTabellaById = createAsyncThunk(
  "turni/fetchTabellaById",
  async ({ negozioId, anno, mese }, { rejectWithValue }) => {
    try {
      const storageKey = getStorageKey(negozioId, anno, mese);
      const savedTabella = localStorage.getItem(storageKey);

      if (!savedTabella) {
        return {
          negozioId,
          anno,
          mese,
          data: null,
        };
      }

      return {
        negozioId,
        anno,
        mese,
        data: JSON.parse(savedTabella),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveTabellaThunk = createAsyncThunk(
  "turni/saveTabella",
  async ({ negozioId, anno, mese, data }, { rejectWithValue }) => {
    try {
      const storageKey = getStorageKey(negozioId, anno, mese);

      // Prepara i dati da salvare
      const dataToSave = {
        data,
        timestamp: new Date().toISOString(),
        negozioId,
      };

      // Salva nel localStorage
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));

      return {
        negozioId,
        anno,
        mese,
        data: dataToSave,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTabellaThunk = createAsyncThunk(
  "turni/deleteTabella",
  async (tableId, { rejectWithValue }) => {
    try {
      localStorage.removeItem(tableId);

      return { tableId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  byNegozio: {}, // Tabelle salvate per ogni negozio
  currentTabella: null, // Tabella correntemente visualizzata
  loading: false,
  error: null,
  saveMessage: "",
};

const turniSlice = createSlice({
  name: "turni",
  initialState,
  reducers: {
    setCurrentTabella(state, action) {
      state.currentTabella = action.payload;
    },
    clearSaveMessage(state) {
      state.saveMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTurniSalvati
      .addCase(fetchTurniSalvati.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTurniSalvati.fulfilled, (state, action) => {
        state.loading = false;
        const { negozioId, tabelleSalvate } = action.payload;
        state.byNegozio[negozioId] = tabelleSalvate;
      })
      .addCase(fetchTurniSalvati.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchTabellaById
      .addCase(fetchTabellaById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTabellaById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTabella = action.payload;
      })
      .addCase(fetchTabellaById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // saveTabella
      .addCase(saveTabellaThunk.pending, (state) => {
        state.loading = true;
        state.saveMessage = "Salvataggio in corso...";
        state.error = null;
      })
      .addCase(saveTabellaThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTabella = action.payload;
        state.saveMessage = "Tabella salvata con successo!";

        // Aggiorna la lista delle tabelle per questo negozio
        const { negozioId, anno, mese } = action.payload;
        const mesi = [
          "Gennaio",
          "Febbraio",
          "Marzo",
          "Aprile",
          "Maggio",
          "Giugno",
          "Luglio",
          "Agosto",
          "Settembre",
          "Ottobre",
          "Novembre",
          "Dicembre",
        ];

        // Verifica che byNegozio[negozioId] esista
        if (!state.byNegozio[negozioId]) {
          state.byNegozio[negozioId] = [];
        }

        // Crea o aggiorna l'entry per questa tabella
        const storageKey = getStorageKey(negozioId, anno, mese);
        const existingIndex = state.byNegozio[negozioId].findIndex(
          (t) => t.id === storageKey
        );

        const tabellaEntry = {
          id: storageKey,
          year: anno,
          month: mese,
          monthName: mesi[parseInt(mese)],
          timestamp: new Date().toISOString(),
          name: `${mesi[parseInt(mese)]} ${anno}`,
        };

        if (existingIndex !== -1) {
          state.byNegozio[negozioId][existingIndex] = tabellaEntry;
        } else {
          state.byNegozio[negozioId].push(tabellaEntry);
        }

        // Riordina per data più recente
        state.byNegozio[negozioId].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      })
      .addCase(saveTabellaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.saveMessage = `Errore: ${action.payload}`;
      })

      // deleteTabella
      .addCase(deleteTabellaThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTabellaThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { tableId } = action.payload;

        // Rimuovi la tabella da tutti i negozi (dovrebbe essere in uno solo)
        Object.keys(state.byNegozio).forEach((negozioId) => {
          state.byNegozio[negozioId] = state.byNegozio[negozioId].filter(
            (tabella) => tabella.id !== tableId
          );
        });

        // Se la tabella corrente è quella eliminata, svuotala
        if (
          state.currentTabella &&
          tableId.includes(state.currentTabella.negozioId)
        ) {
          state.currentTabella = null;
        }
      })
      .addCase(deleteTabellaThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentTabella, clearSaveMessage } = turniSlice.actions;
export default turniSlice.reducer;
