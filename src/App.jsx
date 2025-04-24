// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NegoziPage from './pages/NegoziPage';
import NegozioFormPage from './pages/NegozioFormPage';
import DipendentiPage from './pages/DipendentiPage';
import DipendenteFormPage from './pages/DipendenteFormPage';
import TurniListPage from './pages/TurniListPage';
import TurniEditorPage from './pages/TurniEditorPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';

// Components
import Navbar from './components/common/Navbar/Navbar';
import AuthRequired from './features/auth/AuthRequired';
import NotificationsContainer from './components/common/Notifications/NotificationsContainer';
import ConfirmationDialog from './components/common/Modal/ConfirmationDialog';
import ThemeToggle from './components/common/Layout/ThemeToggle';

// Stili
import './styles/global.css';

function App() {
  const { user, initialize } = useAuth();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  
  // Inizializza l'autenticazione
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Applica il tema all'elemento root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.mode);
    document.documentElement.setAttribute('data-font-size', theme.fontSize);
    
    // Calcola le variabili RGB per i colori (utili per rgba())
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };
    
    // Imposta il colore primario e le varianti RGB
    document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
    document.documentElement.style.setProperty('--primary-color-rgb', hexToRgb(theme.colors.primary));
    
    // Imposta i colori semantici in RGB
    document.documentElement.style.setProperty('--success-color-rgb', hexToRgb('#27ae60'));
    document.documentElement.style.setProperty('--danger-color-rgb', hexToRgb('#e74c3c'));
    document.documentElement.style.setProperty('--warning-color-rgb', hexToRgb('#f39c12'));
  }, [theme]);
  
  return (
    <div className="app">
      {user && <Navbar />}
      {!user && <ThemeToggle />}
      
      <div className="container">
        <Routes>
          {/* Rotte pubbliche */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          
          {/* Rotte protette */}
          <Route path="/dashboard" element={
            <AuthRequired>
              <DashboardPage />
            </AuthRequired>
          } />
          <Route path="/negozi" element={
            <AuthRequired>
              <NegoziPage />
            </AuthRequired>
          } />
          <Route path="/negozi/nuovo" element={
            <AuthRequired>
              <NegozioFormPage />
            </AuthRequired>
          } />
          <Route path="/negozi/:id" element={
            <AuthRequired>
              <NegozioFormPage />
            </AuthRequired>
          } />
          <Route path="/negozi/:negozioId/dipendenti" element={
            <AuthRequired>
              <DipendentiPage />
            </AuthRequired>
          } />
          <Route path="/negozi/:negozioId/dipendenti/nuovo" element={
            <AuthRequired>
              <DipendenteFormPage />
            </AuthRequired>
          } />
          <Route path="/negozi/:negozioId/dipendenti/:id" element={
            <AuthRequired>
              <DipendenteFormPage />
            </AuthRequired>
          } />
          <Route path="/negozi/:negozioId/turni" element={
            <AuthRequired>
              <TurniListPage />
            </AuthRequired>
          } />
          <Route path="/negozi/:negozioId/turni/:anno/:mese" element={
            <AuthRequired>
              <TurniEditorPage />
            </AuthRequired>
          } />
          <Route path="/settings" element={
            <AuthRequired>
              <SettingsPage />
            </AuthRequired>
          } />
          
          {/* Rotta di default e 404 */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      
      {/* Componenti globali */}
      <NotificationsContainer />
      <ConfirmationDialog />
    </div>
  );
}

export default App;