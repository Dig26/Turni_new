// services/particolaritaService.js
// Servizio per la gestione delle particolarità personalizzate

// Simulazione di un database locale per le particolarità
let particolaritaStore = localStorage.getItem('particolarita') 
  ? JSON.parse(localStorage.getItem('particolarita')) 
  : {};

// Funzione per ottenere le particolarità di un negozio specifico
export const getParticolaritaByNegozio = async (negozioId) => {
  // In un'app reale, qui ci sarebbe una chiamata API
  const particolarita = particolaritaStore[negozioId] || [];
  return { negozioId, particolarita };
};

// Funzione per salvare una particolarità (creazione o aggiornamento)
export const saveParticolarita = async (particolaritaData, negozioId, id = null) => {
  // Inizializza l'array per il negozio se non esiste
  if (!particolaritaStore[negozioId]) {
    particolaritaStore[negozioId] = [];
  }

  if (id) {
    // Aggiornamento
    const index = particolaritaStore[negozioId].findIndex(particolarita => particolarita.id === id);
    
    if (index === -1) {
      throw new Error('Particolarità non trovata');
    }
    
    const updatedParticolarita = {
      ...particolaritaStore[negozioId][index],
      ...particolaritaData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    particolaritaStore[negozioId][index] = updatedParticolarita;
    localStorage.setItem('particolarita', JSON.stringify(particolaritaStore));
    
    return { particolarita: updatedParticolarita, negozioId };
  } else {
    // Creazione
    const newParticolarita = {
      ...particolaritaData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    particolaritaStore[negozioId].push(newParticolarita);
    localStorage.setItem('particolarita', JSON.stringify(particolaritaStore));
    
    return { particolarita: newParticolarita, negozioId };
  }
};

// Funzione per eliminare una particolarità
export const deleteParticolarita = async (id, negozioId) => {
  if (!particolaritaStore[negozioId]) {
    throw new Error('Negozio non trovato');
  }
  
  const index = particolaritaStore[negozioId].findIndex(particolarita => particolarita.id === id);
  
  if (index === -1) {
    throw new Error('Particolarità non trovata');
  }
  
  particolaritaStore[negozioId].splice(index, 1);
  localStorage.setItem('particolarita', JSON.stringify(particolaritaStore));
  
  return true;
};