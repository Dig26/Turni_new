export const getParticolarita = async () => {
    // Ottieni le particolarità dal localStorage
    const particolaritaData = localStorage.getItem('particolarita');
    if (particolaritaData) {
      return JSON.parse(particolaritaData);
    } else {
      // Particolarità predefinite se non ce ne sono nel localStorage
      const defaultParticolarita = [
        { id: '1', nome: "Turno notturno", descrizione: "Lavoro svolto durante le ore notturne", sigla: "TN" },
        { id: '2', nome: "Straordinario", descrizione: "Ore di lavoro eccedenti l'orario normale", sigla: "STR" },
        { id: '3', nome: "Festivo", descrizione: "Lavoro svolto durante un giorno festivo", sigla: "FES" }
      ];
      localStorage.setItem('particolarita', JSON.stringify(defaultParticolarita));
      return defaultParticolarita;
    }
  };
  
  export const saveParticolarita = async (particolarita) => {
    // Assicurati che la particolarità abbia un ID
    if (!particolarita.id) {
      particolarita.id = Date.now().toString();
    }
    
    // Ottieni la lista esistente
    const particolaritaList = await getParticolarita();
    
    // Controlla se è un aggiornamento o un nuovo elemento
    const index = particolaritaList.findIndex(p => p.id === particolarita.id);
    
    if (index !== -1) {
      // Aggiorna l'elemento esistente
      particolaritaList[index] = particolarita;
    } else {
      // Aggiungi una nuova particolarità
      particolaritaList.push(particolarita);
    }
    
    // Salva nel localStorage
    localStorage.setItem('particolarita', JSON.stringify(particolaritaList));
    
    return particolarita;
  };
  
  export const deleteParticolarita = async (id) => {
    // Ottieni la lista esistente
    const particolaritaList = await getParticolarita();
    
    // Filtra l'elemento da eliminare
    const updatedList = particolaritaList.filter(p => p.id !== id);
    
    // Salva nel localStorage
    localStorage.setItem('particolarita', JSON.stringify(updatedList));
    
    return true;
  };