// services/motivazioniService.js
// Servizio per la gestione delle motivazioni personalizzate

// Motivazioni predefinite per il sistema
const defaultMotivazioni = [
  {
    id: 'ferie',
    nome: 'Ferie',
    sigla: 'FE',
    predefinita: true,
    calcolaOre: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rol',
    nome: 'ROL',
    sigla: 'RL',
    predefinita: true,
    calcolaOre: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'exfestivita',
    nome: 'EX Festività',
    sigla: 'EX',
    predefinita: true,
    calcolaOre: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'nessuna',
    nome: 'Nessuna',
    sigla: '',
    predefinita: true,
    calcolaOre: false,
    createdAt: new Date().toISOString()
  }
];

// Recupera o inizializza lo store
let motivazioniStore = localStorage.getItem('motivazioni') 
  ? JSON.parse(localStorage.getItem('motivazioni')) 
  : {};

// Funzione per ottenere le motivazioni di un negozio specifico
export const getMotivazioniByNegozio = async (negozioId) => {
  // Se non esistono motivazioni per questo negozio, usa quelle predefinite
  if (!motivazioniStore[negozioId]) {
    motivazioniStore[negozioId] = [...defaultMotivazioni];
    localStorage.setItem('motivazioni', JSON.stringify(motivazioniStore));
  }
  
  const motivazioni = motivazioniStore[negozioId] || [];
  return { negozioId, motivazioni };
};

// Funzione per salvare una motivazione (creazione o aggiornamento)
export const saveMotivazione = async (motivazioneData, negozioId, id = null) => {
  // Inizializza l'array per il negozio se non esiste
  if (!motivazioniStore[negozioId]) {
    motivazioniStore[negozioId] = [...defaultMotivazioni];
  }

  if (id) {
    // Aggiornamento
    const index = motivazioniStore[negozioId].findIndex(motivazione => motivazione.id === id);
    
    if (index === -1) {
      throw new Error('Motivazione non trovata');
    }
    
    // Se è una motivazione predefinita, preserva alcuni campi
    const isPredefinita = motivazioniStore[negozioId][index].predefinita === true;
    
    const updatedMotivazione = {
      ...motivazioniStore[negozioId][index],
      ...motivazioneData,
      id,
      predefinita: isPredefinita, // Preserva lo stato predefinito
      calcolaOre: isPredefinita ? motivazioniStore[negozioId][index].calcolaOre : motivazioneData.calcolaOre,
      updatedAt: new Date().toISOString()
    };
    
    motivazioniStore[negozioId][index] = updatedMotivazione;
    localStorage.setItem('motivazioni', JSON.stringify(motivazioniStore));
    
    return { motivazione: updatedMotivazione, negozioId };
  } else {
    // Creazione di nuova motivazione (non predefinita)
    const newMotivazione = {
      ...motivazioneData,
      id: Date.now().toString(),
      predefinita: false,
      calcolaOre: false, // Le nuove motivazioni non calcolano ore
      createdAt: new Date().toISOString()
    };
    
    motivazioniStore[negozioId].push(newMotivazione);
    localStorage.setItem('motivazioni', JSON.stringify(motivazioniStore));
    
    return { motivazione: newMotivazione, negozioId };
  }
};

// Funzione per eliminare una motivazione
export const deleteMotivazione = async (id, negozioId) => {
  if (!motivazioniStore[negozioId]) {
    throw new Error('Negozio non trovato');
  }
  
  const index = motivazioniStore[negozioId].findIndex(motivazione => motivazione.id === id);
  
  if (index === -1) {
    throw new Error('Motivazione non trovata');
  }
  
  // Non permettere l'eliminazione di motivazioni predefinite
  if (motivazioniStore[negozioId][index].predefinita) {
    throw new Error('Le motivazioni predefinite non possono essere eliminate');
  }
  
  motivazioniStore[negozioId].splice(index, 1);
  localStorage.setItem('motivazioni', JSON.stringify(motivazioniStore));
  
  return true;
};