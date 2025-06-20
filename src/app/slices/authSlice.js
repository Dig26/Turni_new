// src/app/slices/authSlice.js - VERSIONE PRODUCTION-READY
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
      console.log('✅ Redux login success:', user?.email);
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
      console.log('✅ Redux register success:', user?.email);
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
      
      const user = await authService.initializeAuth();
      
      if (user) {
        console.log('✅ Redux initialize success:', user.email);
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
      console.log('📝 Redux setUser:', action.payload?.email || 'null');
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
      state.initialized = true;
    },
    clearAuth: (state) => {
      console.log('🧹 Redux clearAuth');
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
      state.initialized = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    setInitialized: (state, action) => {
      console.log('📝 Redux setInitialized:', action.payload);
      state.initialized = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        console.log('🔄 Redux login.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('✅ Redux login.fulfilled:', action.payload?.email);
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(login.rejected, (state, action) => {
        console.log('❌ Redux login.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        console.log('🔄 Redux register.pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        console.log('✅ Redux register.fulfilled:', action.payload?.email);
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(register.rejected, (state, action) => {
        console.log('❌ Redux register.rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
        state.initialized = true;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        console.log('🔄 Redux logout.pending');
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('✅ Redux logout.fulfilled');
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        console.log('⚠️ Redux logout.rejected - pulisco comunque');
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.initialized = true;
      });

    // Initialize
    builder
      .addCase(initializeAuth.pending, (state) => {
        console.log('🔄 Redux initializeAuth.pending');
        if (!state.initialized) {
          state.loading = true;
        }
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        console.log('✅ Redux initializeAuth.fulfilled:', action.payload?.email || 'null');
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
        console.log('⚠️ Redux initializeAuth.rejected - continuo comunque');
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.initialized = true;
      });
  }
});

export const { setUser, clearAuth, clearError, setInitialized } = authSlice.actions;

export default authSlice.reducer;