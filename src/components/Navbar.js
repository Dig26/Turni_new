// components/Navbar.js
import React, { useState } from "react";
import { logout } from "../services/authService";
import "../styles/Navbar.css";

function Navbar({ user, onNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    // La navigazione avverrà automaticamente grazie al listener in App.js
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={() => onNavigate("dashboard")}>
          <i className="fas fa-calendar-alt"></i>
          <span>Gestione Turni</span>
        </div>

        <div className="navbar-mobile-toggle" onClick={toggleMenu}>
          <i className={isMenuOpen ? "fas fa-times" : "fas fa-bars"}></i>
        </div>

        <ul className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <li>
            <button
              className="navbar-item"
              onClick={() => {
                onNavigate("dashboard");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-home"></i>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              className="navbar-item"
              onClick={() => {
                onNavigate("negozi");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-store"></i>
              <span>I miei Negozi</span>
            </button>
          </li>
          <li>
            <button
              className="navbar-item"
              onClick={() => {
                onNavigate("particolarita");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-tags"></i>
              <span>Particolarità</span>
            </button>
          </li>
          <li>
            <button
              className="navbar-item"
              onClick={() => {
                onNavigate("motivazioni");
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-calendar-times"></i>
              <span>Motivazioni Assenze</span>
            </button>
          </li>
        </ul>

        <div className={`navbar-user ${isMenuOpen ? "active" : ""}`}>
          <div className="user-info">
            <span>
              {user.nome} {user.cognome}
            </span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
