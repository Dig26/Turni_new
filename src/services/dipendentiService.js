// Simulazione di un database locale per i dipendenti
let dipendenti = localStorage.getItem('dipendenti') 
  ? JSON.parse(localStorage.getItem('dipendenti')) 
  : [];

// Funzione per ottenere tutti i dipendenti di un negozio
export const getDipendentiByNegozioId = async (negozioId) => {
  // In un'app reale, qui ci sarebbe una chiamata API
  return dipendenti.filter(dipendente => dipendente.negozioId === negozioId);
};

// Funzione per ottenere un dipendente tramite ID
export const getDipendenteById = async (id) => {
  const dipendente = dipendenti.find(dipendente => dipendente.id === id);
  
  if (!dipendente) {
    throw new Error('Dipendente non trovato');
  }
  
  return { ...dipendente };
};

// Funzione per salvare un dipendente (creazione o aggiornamento)
export const saveDipendente = async (dipendenteData, id = null) => {
  if (id) {
    // Aggiornamento
    const index = dipendenti.findIndex(dipendente => dipendente.id === id);
    
    if (index === -1) {
      throw new Error('Dipendente non trovato');
    }
    
    const updatedDipendente = {
      ...dipendenti[index],
      ...dipendenteData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    dipendenti[index] = updatedDipendente;
    localStorage.setItem('dipendenti', JSON.stringify(dipendenti));
    
    return updatedDipendente;
  } else {
    // Creazione
    const newDipendente = {
      ...dipendenteData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    dipendenti.push(newDipendente);
    localStorage.setItem('dipendenti', JSON.stringify(dipendenti));
    
    return newDipendente;
  }
};

// Funzione per eliminare un dipendente
export const deleteDipendente = async (id) => {
  const index = dipendenti.findIndex(dipendente => dipendente.id === id);
  
  if (index === -1) {
    throw new Error('Dipendente non trovato');
  }
  
  dipendenti.splice(index, 1);
  localStorage.setItem('dipendenti', JSON.stringify(dipendenti));
  
  return true;
};

// Funzione per eliminare tutti i dipendenti di un negozio (usata quando si elimina un negozio)
export const deleteDipendentiByNegozioId = async (negozioId) => {
  dipendenti = dipendenti.filter(dipendente => dipendente.negozioId !== negozioId);
  localStorage.setItem('dipendenti', JSON.stringify(dipendenti));
  
  return true;
};