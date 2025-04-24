// src/app/slices/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Prova a caricare il tema salvato in localStorage
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const initialState = {
  mode: savedTheme || (systemPrefersDark ? 'dark' : 'light'),
  colors: {
    primary: '#3498db',
    secondary: '#f1f2f6',
    success: '#27ae60',
    danger: '#e74c3c',
    warning: '#f39c12',
    // Altri colori verranno calcolati in base al mode
  },
  fontSize: localStorage.getItem('fontSize') || 'medium'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
    setTheme(state, action) {
      state.mode = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    updatePrimaryColor(state, action) {
      state.colors.primary = action.payload;
      localStorage.setItem('primaryColor', action.payload);
    },
    setFontSize(state, action) {
      state.fontSize = action.payload;
      localStorage.setItem('fontSize', action.payload);
    },
    resetTheme(state) {
      state.mode = systemPrefersDark ? 'dark' : 'light';
      state.colors.primary = '#3498db';
      state.fontSize = 'medium';
      localStorage.setItem('theme', state.mode);
      localStorage.removeItem('primaryColor');
      localStorage.removeItem('fontSize');
    }
  }
});

export const { toggleTheme, setTheme, updatePrimaryColor, setFontSize, resetTheme } = themeSlice.actions;
export default themeSlice.reducer;