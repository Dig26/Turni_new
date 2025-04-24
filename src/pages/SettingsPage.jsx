// src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useDispatch } from 'react-redux';
import { addNotification } from '../app/slices/uiSlice';
import '../styles/Settings.css';

const SettingsPage = () => {
  const { theme, setTheme, changePrimaryColor, changeFontSize, resetTheme } = useTheme();
  const dispatch = useDispatch();
  
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary);
  
  const handleColorChange = (e) => {
    setPrimaryColor(e.target.value);
  };
  
  const handleSaveColor = () => {
    changePrimaryColor(primaryColor);
    dispatch(addNotification({
      type: 'success',
      message: 'Colore primario aggiornato',
      duration: 3000
    }));
  };
  
  const handleThemeChange = (mode) => {
    setTheme(mode);
    dispatch(addNotification({
      type: 'success',
      message: `Tema ${mode === 'light' ? 'chiaro' : 'scuro'} applicato`,
      duration: 3000
    }));
  };
  
  const handleFontSizeChange = (size) => {
    changeFontSize(size);
    dispatch(addNotification({
      type: 'success',
      message: `Dimensione del testo impostata a ${size}`,
      duration: 3000
    }));
  };
  
  const handleReset = () => {
    resetTheme();
    setPrimaryColor('#3498db');
    dispatch(addNotification({
      type: 'info',
      message: 'Impostazioni del tema ripristinate',
      duration: 3000
    }));
  };
  
  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Impostazioni</h1>
        <p>Personalizza l'aspetto dell'applicazione secondo le tue preferenze</p>
      </div>
      
      <div className="settings-container">
        <div className="settings-section">
          <h2>Tema</h2>
          <div className="settings-options">
            <div className="theme-option">
              <button 
                className={`theme-button light ${theme.mode === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <i className="fas fa-sun"></i>
                <span>Tema Chiaro</span>
              </button>
            </div>
            
            <div className="theme-option">
              <button 
                className={`theme-button dark ${theme.mode === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <i className="fas fa-moon"></i>
                <span>Tema Scuro</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Colore Primario</h2>
          <div className="color-picker-container">
            <div className="color-preview" style={{ backgroundColor: primaryColor }}></div>
            <input 
              type="color" 
              value={primaryColor} 
              onChange={handleColorChange}
              className="color-picker"
            />
            <button 
              className="btn-primary"
              onClick={handleSaveColor}
            >
              Applica Colore
            </button>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Dimensione Testo</h2>
          <div className="font-size-options">
            <button 
              className={`font-size-button ${theme.fontSize === 'small' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('small')}
            >
              <i className="fas fa-font" style={{ fontSize: '14px' }}></i>
              <span>Piccolo</span>
            </button>
            
            <button 
              className={`font-size-button ${theme.fontSize === 'medium' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('medium')}
            >
              <i className="fas fa-font" style={{ fontSize: '16px' }}></i>
              <span>Medio</span>
            </button>
            
            <button 
              className={`font-size-button ${theme.fontSize === 'large' ? 'active' : ''}`}
              onClick={() => handleFontSizeChange('large')}
            >
              <i className="fas fa-font" style={{ fontSize: '18px' }}></i>
              <span>Grande</span>
            </button>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Ripristino Impostazioni</h2>
          <p>Ripristina tutte le impostazioni di tema ai valori predefiniti.</p>
          <button 
            className="btn-danger"
            onClick={handleReset}
          >
            <i className="fas fa-undo"></i> Ripristina Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;