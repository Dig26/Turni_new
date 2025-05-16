// src/app/slices/turniSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as turniService from "../services/turniService";
import { addNotification } from './uiSlice';

// Thunks
export const fetchTurniSalvati = createAsyncThunk(
  "turni/fetchTurniSalvati",
  async (negozioId, { rejectWithValue }) => {
    try {
      const tabelleSalvate = await turniService.getTabelleByNegozio(negozioId);
      
      // Formatta i dati per compatibilità con l'interfaccia esistente
      const formattedTabelle = tabelleSalvate.map(tabella => {
        // Estrai mese e anno
        const mese = tabella.mese;
        const anno = tabella.anno;
        
        // Nomi dei mesi in italiano
        const mesi = [
          "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
          "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
        ];
        
        return {
          id: tabella.id,
          year: anno.toString(),
          month: mese.toString(),
          monthName: mesi[parseInt(mese)],
          timestamp: tabella.aggiornato_il,
          name: tabella.nome || `${mesi[parseInt(mese)]} ${anno}`
        };
      });
      
      // Ordina per data di aggiornamento, più recenti prima
      formattedTabelle.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return {
        negozioId,
        tabelleSalvate: formattedTabelle
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTabellaById = createAsyncThunk(
  "turni/fetchTabellaById",
  async ({ negozioId, anno, mese, id = null }, { rejectWithValue }) => {
    try {
      let tabella;
      
      if (id) {
        // Se abbiamo direttamente l'ID, usa quello
        tabella = await turniService.getTabellaById(id);
      } else {
        // Altrimenti cerca per negozio, anno e mese
        tabella = await turniService.getTabellaByPeriodo(negozioId, anno, mese);
      }
      
      if (!tabella) {
        return {
          negozioId,
          anno,
          mese,
          data: null
        };
      }
      
      // Estrai i dati dal formato DB
      const datiTabella = tabella.dati_turni?.length > 0 ? 
        tabella.dati_turni[0] : null;
      
      return {
        negozioId,
        anno: tabella.anno,
        mese: tabella.mese,
        data: {
          data: datiTabella?.dati || {},
          riepilogo: datiTabella?.riepilogo || {},
          employeeVariations: datiTabella?.variazioni_orarie || {},
          timestamp: tabella.aggiornato_il
        }
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveTabellaThunk = createAsyncThunk(
  "turni/saveTabella",
  async ({ negozioId, anno, mese, data }, { rejectWithValue, dispatch }) => {
    try {
      // Prepara i dati per il salvataggio
      const nome = `Tabella ${parseInt(mese) + 1}/${anno}`;
      
      const savedTabella = await turniService.saveTabella({
        negozioId,
        anno,
        mese,
        nome,
        dati: data
      });
      
      dispatch(addNotification({
        type: 'success',
        message: 'Tabella turni salvata con successo!',
        duration: 3000
      }));
      
      // Estrai i dati nel formato atteso dallo stato Redux
      const datiTabella = savedTabella.dati_turni?.length > 0 ? 
        savedTabella.dati_turni[0] : null;
      
      return {
        negozioId,
        anno: savedTabella.anno,
        mese: savedTabella.mese,
        data: {
          data: datiTabella?.dati || {},
          riepilogo: datiTabella?.riepilogo || {},
          employeeVariations: datiTabella?.variazioni_orarie || {},
          timestamp: savedTabella.aggiornato_il
        }
      };
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nel salvataggio della tabella: ${error.message}`,
        duration: 5000
      }));
      
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTabellaThunk = createAsyncThunk(
  "turni/deleteTabella",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await turniService.deleteTabella(id);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Tabella turni eliminata con successo!',
        duration: 3000
      }));
      
      return { id };
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Errore nell'eliminazione della tabella: ${error.message}`,
        duration: 5000
      }));
      
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

        // Aggiorna la lista delle tabelle per questo negozio se esiste già
        const { negozioId, anno, mese } = action.payload;
        
        if (state.byNegozio[negozioId]) {
          // Formatta per la visualizzazione nella lista
          const mesi = [
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
          ];
          
          // Verifica se la tabella già esiste nella lista
          const existingIndex = state.byNegozio[negozioId].findIndex(
            t => t.year === anno.toString() && t.month === mese.toString()
          );

          const tabellaEntry = {
            id: action.payload.id || `tabella_${negozioId}_${anno}_${mese}`,
            year: anno.toString(),
            month: mese.toString(),
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
        }
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
        const { id } = action.payload;

        // Rimuovi la tabella da tutti i negozi (dovrebbe essere in uno solo)
        Object.keys(state.byNegozio).forEach((negozioId) => {
          state.byNegozio[negozioId] = state.byNegozio[negozioId].filter(
            (tabella) => tabella.id !== id
          );
        });

        // Se la tabella corrente è quella eliminata, svuotala
        if (
          state.currentTabella &&
          state.currentTabella.id === id
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