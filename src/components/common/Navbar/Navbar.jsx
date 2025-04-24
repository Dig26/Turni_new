import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './Navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    // La navigazione viene gestita automaticamente in App.jsx
  };
  
  const navigateTo = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => navigateTo('/dashboard')}>
          <i className="fas fa-calendar-alt"></i>
          <span>Gestione Turni</span>
        </div>
        
        <div className="navbar-mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>
        
        <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <li>
            <button 
              className="navbar-item" 
              onClick={() => navigateTo('/dashboard')}
            >
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button 
              className="navbar-item" 
              onClick={() => navigateTo('/negozi')}
            >
              <i className="fas fa-store"></i>
              <span>I miei Negozi</span>
            </button>
          </li>
        </ul>
        
        <div className={`navbar-user ${isMenuOpen ? 'active' : ''}`}>
          <div className="user-info">
            {user && <span>{user.nome} {user.cognome}</span>}
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;