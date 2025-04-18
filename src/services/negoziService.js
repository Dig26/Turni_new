// services/negoziService.js
// Servizio per la gestione dei negozi

// Simulazione di un database locale per i negozi
let negozi = localStorage.getItem('negozi') 
  ? JSON.parse(localStorage.getItem('negozi')) 
  : [];

// Funzione per ottenere tutti i negozi
export const getNegozi = async () => {
  // In un'app reale, qui ci sarebbe una chiamata API
  return [...negozi];
};

// Funzione per ottenere un negozio tramite ID
export const getNegozioById = async (id) => {
  const negozio = negozi.find(negozio => negozio.id === id);
  
  if (!negozio) {
    throw new Error('Negozio non trovato');
  }
  
  return { ...negozio };
};

// Funzione per salvare un negozio (creazione o aggiornamento)
export const saveNegozio = async (negozioData, id = null) => {
  if (id) {
    // Aggiornamento
    const index = negozi.findIndex(negozio => negozio.id === id);
    
    if (index === -1) {
      throw new Error('Negozio non trovato');
    }
    
    const updatedNegozio = {
      ...negozi[index],
      ...negozioData,
      id,
      updatedAt: new Date().toISOString()
    };
    
    negozi[index] = updatedNegozio;
    localStorage.setItem('negozi', JSON.stringify(negozi));
    
    return updatedNegozio;
  } else {
    // Creazione
    const newNegozio = {
      ...negozioData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    negozi.push(newNegozio);
    localStorage.setItem('negozi', JSON.stringify(negozi));
    
    return newNegozio;
  }
};

// Funzione per eliminare un negozio
export const deleteNegozio = async (id) => {
  const index = negozi.findIndex(negozio => negozio.id === id);
  
  if (index === -1) {
    throw new Error('Negozio non trovato');
  }
  
  // Elimino anche tutti i dipendenti e i turni associati al negozio
  // Assumendo che i servizi per dipendenti e turni abbiano delle funzioni per eliminare in base al negozioId
  // In un'app reale, questo sarebbe gestito dal backend
  
  try {
    // Importo dinamicamente il servizio dipendenti per evitare dipendenze circolari
    const dipendenteModule = await import('./dipendentiService');
    await dipendenteModule.deleteDipendentiByNegozioId(id);
    
    // Elimino il negozio
    negozi.splice(index, 1);
    localStorage.setItem('negozi', JSON.stringify(negozi));
    
    return true;
  } catch (error) {
    console.error('Errore nell\'eliminazione del negozio:', error);
    throw error;
  }
};