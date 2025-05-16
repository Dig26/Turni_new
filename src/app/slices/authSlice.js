import { createSlice } from '@reduxjs/toolkit';
import * as authService from '../services/authService';

const initialState = {
  user: null,
  isAuthenticated: false,
  error: null,
  loading: false
};

// Inizializza lo stato con i dati dell'utente corrente se esiste
const initializeAuth = async (dispatch) => {
  try {
    const user = await authService.getCurrentUser();
    if (user) {
      dispatch(loginSuccess(user));
    }
  } catch (error) {
    console.error('Errore nell\'inizializzazione dell\'autenticazione:', error);
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

// Thunks
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const user = await authService.login(email, password);
    dispatch(loginSuccess(user));
    return user;
  } catch (error) {
    dispatch(loginFailure(error.message));
    throw error;
  }
};

export const register = (nome, cognome, email, password) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const user = await authService.register(nome, cognome, email, password);
    dispatch(loginSuccess(user));
    return user;
  } catch (error) {
    dispatch(loginFailure(error.message));
    throw error;
  }
};

export const logoutUser = () => async (dispatch) => {
  await authService.logout();
  dispatch(logout());
};

// Funzione per inizializzare lo stato dell'autenticazione
export const initAuth = () => (dispatch) => {
  initializeAuth(dispatch);
};

export default authSlice.reducer;