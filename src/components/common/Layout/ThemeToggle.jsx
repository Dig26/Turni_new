// src/components/common/Layout/ThemeToggle.jsx
import React from 'react';
import { useTheme } from '../../../hooks/useTheme';
import '../../../styles/Theme.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      className="theme-toggle-button" 
      onClick={toggleTheme} 
      title={theme.mode === 'light' ? 'Passa alla modalità scura' : 'Passa alla modalità chiara'}
    >
      {theme.mode === 'light' ? (
        <i className="fas fa-moon"></i>
      ) : (
        <i className="fas fa-sun"></i>
      )}
    </button>
  );
};

export default ThemeToggle;