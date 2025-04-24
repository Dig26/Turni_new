/* src/components/common/Navbar/Navbar.jsx */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import ThemeToggle from '../Layout/ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    // La navigazione viene gestita automaticamente in App.jsx
  };
  
  const navigateTo = (path) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
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
          <ThemeToggle />
          
          <div className="profile-menu-container">
            <button 
              className="profile-button" 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="profile-avatar">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="profile-name">{user?.nome} {user?.cognome}</span>
              <i className={`fas fa-chevron-${isProfileMenuOpen ? 'up' : 'down'}`}></i>
            </button>
            
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <ul>
                  <li>
                    <button 
                      className="profile-menu-item" 
                      onClick={() => navigateTo('/settings')}
                    >
                      <i className="fas fa-cog"></i>
                      <span>Impostazioni</span>
                    </button>
                  </li>
                  <li>
                    <button className="profile-menu-item logout-button" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt"></i>
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;