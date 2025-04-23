export const getMotivazioni = async () => {
    // Ottieni le motivazioni dal localStorage
    const motivazioniData = localStorage.getItem('motivazioni');
    if (motivazioniData) {
      return JSON.parse(motivazioniData);
    } else {
      // Motivazioni predefinite se non ce ne sono nel localStorage
      const defaultMotivazioni = [
        { id: '1', nome: "Ferie", descrizione: "Assenza per ferie pianificate", sigla: "FE" },
        { id: '2', nome: "EX Festività", descrizione: "Giornate di ex festività", sigla: "EX" },
        { id: '3', nome: "ROL", descrizione: "Riduzione Orario di Lavoro", sigla: "RL" }
      ];
      localStorage.setItem('motivazioni', JSON.stringify(defaultMotivazioni));
      return defaultMotivazioni;
    }
  };
  
  export const saveMotivazione = async (motivazione) => {
    // Assicurati che la motivazione abbia un ID
    if (!motivazione.id) {
      motivazione.id = Date.now().toString();
    }
    
    // Ottieni la lista esistente
    const motivazioniList = await getMotivazioni();
    
    // Controlla se è un aggiornamento o un nuovo elemento
    const index = motivazioniList.findIndex(m => m.id === motivazione.id);
    
    if (index !== -1) {
      // Aggiorna l'elemento esistente
      motivazioniList[index] = motivazione;
    } else {
      // Aggiungi una nuova motivazione
      motivazioniList.push(motivazione);
    }
    
    // Salva nel localStorage
    localStorage.setItem('motivazioni', JSON.stringify(motivazioniList));
    
    return motivazione;
  };
  
  export const deleteMotivazione = async (id) => {
    // Ottieni la lista esistente
    const motivazioniList = await getMotivazioni();
    
    // Filtra l'elemento da eliminare
    const updatedList = motivazioniList.filter(m => m.id !== id);
    
    // Salva nel localStorage
    localStorage.setItem('motivazioni', JSON.stringify(updatedList));
    
    return true;
  };