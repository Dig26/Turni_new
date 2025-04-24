// src/hooks/useTheme.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  toggleTheme, 
  setTheme, 
  updatePrimaryColor, 
  setFontSize, 
  resetTheme 
} from '../app/slices/themeSlice';

export const useTheme = () => {
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme);
  
  const toggleThemeMode = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);
  
  const setThemeMode = useCallback((mode) => {
    if (mode !== 'light' && mode !== 'dark') {
      console.error('Theme mode must be either "light" or "dark"');
      return;
    }
    dispatch(setTheme(mode));
  }, [dispatch]);
  
  const changePrimaryColor = useCallback((color) => {
    dispatch(updatePrimaryColor(color));
  }, [dispatch]);
  
  const changeFontSize = useCallback((size) => {
    if (!['small', 'medium', 'large'].includes(size)) {
      console.error('Font size must be one of: small, medium, large');
      return;
    }
    dispatch(setFontSize(size));
  }, [dispatch]);
  
  const resetToDefaults = useCallback(() => {
    dispatch(resetTheme());
  }, [dispatch]);
  
  // Applica il tema al documento
  useCallback(() => {
    // Imposta le variabili CSS basate sul tema
    document.documentElement.setAttribute('data-theme', theme.mode);
    
    // Imposta la dimensione del font
    document.documentElement.setAttribute('data-font-size', theme.fontSize);
    
    // Imposta il colore primario
    document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
    
    // Calcola e imposta il colore primario scuro (per hover, ecc.)
    const darkenColor = (hex, percent) => {
      // Implementazione semplice per scurire un colore hex
      const num = parseInt(hex.slice(1), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    };
    
    document.documentElement.style.setProperty('--primary-dark', darkenColor(theme.colors.primary, 15));
  }, [theme]);
  
  return {
    theme,
    toggleTheme: toggleThemeMode,
    setTheme: setThemeMode,
    changePrimaryColor,
    changeFontSize,
    resetTheme: resetToDefaults
  };
};