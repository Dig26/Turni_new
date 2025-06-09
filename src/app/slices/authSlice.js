// src/app/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
  loading: false,
  initialized: false
};

// Thunk per il login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux login thunk per:', email);
      const user = await authService.login(email, password);
      console.log('✅ Redux login success:', user);
      return user;
    } catch (error) {
      console.error('❌ Redux login error:', error);
      return rejectWithValue(error.message || 'Errore durante il login');
    }
  }
);

// Thunk per la registrazione
export const register = createAsyncThunk(
  'auth/register',
  async ({ nome, cognome, email, password }, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux register thunk per:', email);
      const user = await authService.register(nome, cognome, email, password);
      console.log('✅ Redux register success:', user);
      return user;
    } catch (error) {
      console.error('❌ Redux register error:', error);
      return rejectWithValue(error.message || 'Errore durante la registrazione');
    }
  }
);

// Thunk per il logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux logout thunk');
      await authService.logout();
      console.log('✅ Redux logout success');
      return true;
    } catch (error) {
      console.error('❌ Redux logout error:', error);
      // Non fare reject per il logout - meglio sempre pulire lo stato
      return true;
    }
  }
);

// Thunk per l'inizializzazione
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔄 Redux initialize auth thunk');
      
      // Aggiungi un timeout per evitare blocchi infiniti
      const initPromise = authService.getCurrentUser();
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.log('⚠️ Initialize timeout - returning null');
          resolve(null);
        }, 3000); // 3 secondi di timeout
      });
      
      const user = await Promise.race([initPromise, timeoutPromise]);
      
      if (user) {
        console.log('✅ Redux initialize success:', user);
        return user;
      } else {
        console.log('ℹ️ Redux initialize: nessun utente');
        return null;
      }
    } catch (error) {
      console.error('❌ Redux initialize error:', error);
      // Non fare reject per l'inizializzazione - meglio completare comunque
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Azioni sincrone
    setUser: (state, action) => {
      console.log('📝 Redux setUser:', action.payload);
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    clearAuth: (state) => {
      console.log('🧹 Redux clearAuth');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      state.initialized = true; // Importante: settiamo initialized a true anche quando puliamo
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state, action) => {
      state.initialized = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Anche se il logout fallisce, pulisci lo stato locale
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initialized = true;
      });

    // Initialize
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        // Non settiamo initialized a false qui per evitare loop
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        // Anche se fallisce, settiamo initialized a true
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null; // Non salvare l'errore per evitare problemi
        state.initialized = true;
      });
  }
});

export const { setUser, clearAuth, clearError, setInitialized } = authSlice.actions;

export default authSlice.reducer;