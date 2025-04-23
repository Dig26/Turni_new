// App.js - Componente principale dell'applicazione
import React, { useState, useEffect } from "react";
import "./App.css";

// Import dei componenti
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import NegoziosList from "./components/NegoziosList";
import NegozioForm from "./components/NegozioForm";
import DipendentiList from "./components/DipendentiList";
import DipendenteForm from "./components/DipendenteForm";
import TabellaTurni from "./components/TabellaTurni";
import Navbar from "./components/Navbar";
import ParticolaritaManager from "./components/ParticolaritaManager";
import MotivazioniManager from "./components/MotivazioniManager";

// Servizio di autenticazione
import {
  getCurrentUser,
  isAuthenticated,
  onAuthStateChanged,
} from "./services/authService";

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [params, setParams] = useState({});

  useEffect(() => {
    // Recupera l'utente al caricamento dell'app
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // Se c'è un utente autenticato, vai alla dashboard
    if (currentUser) {
      setCurrentPage("dashboard");
    }

    // Listener per i cambiamenti di autenticazione
    const unsubscribe = onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        setCurrentPage("login");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Funzione per navigare tra le pagine
  const navigate = (page, parameters = {}) => {
    // Se la pagina richiede autenticazione ma l'utente non è autenticato, vai alla pagina di login
    const protectedPages = [
      "dashboard",
      "negozi",
      "negozioForm",
      "dipendenti",
      "dipendenteForm",
      "turni",
    ];

    if (protectedPages.includes(page) && !isAuthenticated()) {
      setCurrentPage("login");
      return;
    }

    setCurrentPage(page);
    setParams(parameters);
  };

  // Funzione per renderizzare la pagina corrente
  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onNavigate={navigate} />;
      case "register":
        return <Register onNavigate={navigate} />;
      case "dashboard":
        return <Dashboard onNavigate={navigate} />;
      case "negozi":
        return <NegoziosList onNavigate={navigate} />;
      case "negozioForm":
        return (
          <NegozioForm onNavigate={navigate} negozioId={params.negozioId} />
        );
      case "dipendenti":
        return (
          <DipendentiList onNavigate={navigate} negozioId={params.negozioId} />
        );
      case "dipendenteForm":
        return (
          <DipendenteForm
            onNavigate={navigate}
            negozioId={params.negozioId}
            dipendenteId={params.dipendenteId}
          />
        );
      case "turni":
        return (
          <TabellaTurni onNavigate={navigate} negozioId={params.negozioId} />
        );
      case "particolarita":
        return <ParticolaritaManager onNavigate={navigate} />;
      case "motivazioni":
        return <MotivazioniManager onNavigate={navigate} />;
      default:
        return <Login onNavigate={navigate} />;
    }
  };

  return (
    <div className="app">
      {user && <Navbar user={user} onNavigate={navigate} />}
      <div className="container">{renderPage()}</div>
    </div>
  );
}

export default App;
