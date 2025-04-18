// services/authService.js
// Servizio per la gestione dell'autenticazione degli utenti

// Simulazione di un database locale per gli utenti
let users = localStorage.getItem('users') 
  ? JSON.parse(localStorage.getItem('users')) 
  : [];

// Utente corrente
let currentUser = localStorage.getItem('currentUser') 
  ? JSON.parse(localStorage.getItem('currentUser')) 
  : null;

// Lista di funzioni da eseguire quando cambia lo stato di autenticazione
let authStateListeners = [];

// Funzione per registrare un nuovo utente
export const register = async (nome, cognome, email, password) => {
  // Controllo se l'email è già in uso
  if (users.some(user => user.email === email)) {
    throw new Error('Email già in uso');
  }
  
  // Creo un nuovo utente
  const newUser = {
    id: Date.now().toString(),
    nome,
    cognome,
    email,
    password, // Nota: in un'applicazione reale, la password dovrebbe essere criptata
    createdAt: new Date().toISOString()
  };
  
  // Aggiungo l'utente al database
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // Eseguo il login con il nuovo utente
  await login(email, password);
  
  return newUser;
};

// Funzione per il login
export const login = async (email, password) => {
  // Cerco l'utente nel database
  const user = users.find(user => user.email === email && user.password === password);
  
  if (!user) {
    throw new Error('Credenziali non valide');
  }
  
  // Creo una versione dell'utente senza la password
  const userToStore = { ...user };
  delete userToStore.password;
  
  // Salvo l'utente corrente
  currentUser = userToStore;
  localStorage.setItem('currentUser', JSON.stringify(userToStore));
  
  // Notifico i listener
  authStateListeners.forEach(listener => listener(userToStore));
  
  return userToStore;
};

// Funzione per il logout
export const logout = () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
  
  // Notifico i listener
  authStateListeners.forEach(listener => listener(null));
};

// Funzione per ottenere l'utente corrente
export const getCurrentUser = () => {
  return currentUser;
};

// Funzione per verificare se l'utente è autenticato
export const isAuthenticated = () => {
  return !!currentUser;
};

// Funzione per registrare un listener per i cambiamenti di autenticazione
export const onAuthStateChanged = (callback) => {
  authStateListeners.push(callback);
  
  // Restituisco una funzione per rimuovere il listener
  return () => {
    authStateListeners = authStateListeners.filter(listener => listener !== callback);
  };
};