// services/motivazioniService.js
// Servizio per la gestione delle motivazioni personalizzate

// Motivazioni predefinite per il sistema
const defaultMotivazioni = [
  {
    id: 'nessuna',
    nome: 'Nessuna',
    sigla: '',
    predefinita: true,
    calcolaOre: false,
    ordine: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ferie',
    nome: 'Ferie',
    sigla: 'FE',
    predefinita: true,
    calcolaOre: true,
    ordine: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'exfestivita',
    nome: 'EX Festività',
    sigla: 'EX',
    predefinita: true,
    calcolaOre: true,
    ordine: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'rol',
    nome: 'ROL',
    sigla: 'RL',
    predefinita: true,
    calcolaOre: true,
    ordine: 3,
    createdAt: new Date().toISOString()
  }
];

// Non utilizzare una variabile globale per lo store
// Ogni funzione deve leggere direttamente da localStorage per avere i dati più aggiornati

// Funzione per inizializzare il database di motivazioni
const initializeMotivazioni = () => {
  try {
    const motivazioniStorage = localStorage.getItem('motivazioni');
    if (!motivazioniStorage) {
      // Prima inizializzazione del database
      console.log("Inizializzazione database motivazioni");
      localStorage.setItem('motivazioni', JSON.stringify({}));
      return {};
    }
    
    return JSON.parse(motivazioniStorage);
  } catch (error) {
    console.error("Errore durante l'inizializzazione del database:", error);
    return {};
  }
};

// Funzione per ottenere le motivazioni di un negozio specifico
export const getMotivazioniByNegozio = async (negozioId, timestamp = null) => {
  console.log(`getMotivazioniByNegozio chiamato con timestamp: ${timestamp}`); // Per evitare la cache
  try {
    console.log(`getMotivazioniByNegozio chiamato per negozioId: ${negozioId}`);
    
    // Inizializza o ricarica il database di motivazioni
    const motivazioniDB = initializeMotivazioni();
    
    console.log("Stato iniziale del database motivazioni:", motivazioniDB);
      
    // Se il negozio non esiste nel database, inizializzalo con i valori predefiniti
    if (!motivazioniDB[negozioId]) {
      console.log(`Inizializzazione negozio ${negozioId} con motivazioni predefinite`);
      motivazioniDB[negozioId] = [...defaultMotivazioni];
      localStorage.setItem('motivazioni', JSON.stringify(motivazioniDB));
    }
    
    // Assicuriamoci che sia un array e che contenga almeno le motivazioni predefinite
    let motivazioni = Array.isArray(motivazioniDB[negozioId]) 
      ? [...motivazioniDB[negozioId]] 
      : [];
    
    // Verifica che tutte le motivazioni predefinite siano presenti
    // e che abbiano i valori corretti per "predefinita", "ordine", e "calcolaOre"
    const existingIds = motivazioni.map(m => m.id);
    
    for (const defaultMotiv of defaultMotivazioni) {
      const index = motivazioni.findIndex(m => m.id === defaultMotiv.id);
      
      if (index === -1) {
        // Aggiungi la motivazione predefinita mancante
        console.log(`Aggiunta motivazione predefinita mancante: ${defaultMotiv.id}`);
        motivazioni.push({...defaultMotiv});
      } else {
        // Aggiorna i campi critici della motivazione predefinita
        motivazioni[index].predefinita = true;
        motivazioni[index].ordine = defaultMotiv.ordine;
        motivazioni[index].calcolaOre = defaultMotiv.calcolaOre;
      }
    }
    
    // Aggiorna il database se ci sono state modifiche alle motivazioni predefinite
    if (JSON.stringify(motivazioniDB[negozioId]) !== JSON.stringify(motivazioni)) {
      console.log(`Aggiornamento motivazioni per negozioId ${negozioId} con valori predefiniti corretti`);
      motivazioniDB[negozioId] = motivazioni;
      localStorage.setItem('motivazioni', JSON.stringify(motivazioniDB));
    }
    
    // Ora assicurati che le motivazioni siano ordinate correttamente
    motivazioni.sort((a, b) => {
      // Ordina per la proprietà 'ordine'
      if (a.ordine !== undefined && b.ordine !== undefined) {
        return a.ordine - b.ordine;
      }
      
      // Se solo uno ha la proprietà 'ordine' definita, quello viene prima
      if (a.ordine !== undefined) return -1;
      if (b.ordine !== undefined) return 1;
      
      // Predefinite prima delle altre
      if (a.predefinita && !b.predefinita) return -1;
      if (!a.predefinita && b.predefinita) return 1;
      
      // Poi per createdAt (data di creazione)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
      
    console.log(`Motivazioni restituite per negozioId ${negozioId}:`, motivazioni);
    return { negozioId, motivazioni };
  } catch (error) {
    console.error("Errore durante il recupero delle motivazioni:", error);
    // In caso di errore, restituisci comunque le motivazioni predefinite
    return { negozioId, motivazioni: [...defaultMotivazioni] };
  }
};

// Funzione per salvare una motivazione (creazione o aggiornamento)
export const saveMotivazione = async (motivazioneData, negozioId, id = null) => {
  try {
    console.log(`saveMotivazione chiamato con:`, { motivazioneData, negozioId, id });
    
    // Recupera il database corrente
    const motivazioniDB = localStorage.getItem('motivazioni') 
      ? JSON.parse(localStorage.getItem('motivazioni')) 
      : {};
      
    console.log("Database motivazioni all'inizio:", motivazioniDB);
      
    // Inizializza l'array per il negozio se non esiste
    if (!motivazioniDB[negozioId] || !Array.isArray(motivazioniDB[negozioId])) {
      console.log(`Inizializzazione array motivazioni per negozioId: ${negozioId}`);
      // Assicuriamoci che ci siano tutte le motivazioni predefinite
      motivazioniDB[negozioId] = [...defaultMotivazioni];
    }

    // Assicuriamoci che il negozioId esista come chiave
    if (!motivazioniDB[negozioId]) {
      motivazioniDB[negozioId] = [];
    }

    if (id) {
      // Aggiornamento di una motivazione esistente
      const index = motivazioniDB[negozioId].findIndex(motivazione => motivazione.id === id);
      
      if (index === -1) {
        throw new Error('Motivazione non trovata');
      }
      
      // Se è una motivazione predefinita, preserva alcuni campi
      const isPredefinita = motivazioniDB[negozioId][index].predefinita === true;
      const originalOrdine = motivazioniDB[negozioId][index].ordine;
      const originalCalcolaOre = motivazioniDB[negozioId][index].calcolaOre;
      
      // Mantiene i campi critici se è una motivazione predefinita
      const updatedMotivazione = {
        ...motivazioniDB[negozioId][index],
        ...motivazioneData,
        id,
        predefinita: isPredefinita,
        ordine: isPredefinita ? originalOrdine : (motivazioneData.ordine || originalOrdine),
        calcolaOre: isPredefinita ? originalCalcolaOre : (motivazioneData.calcolaOre || false),
        updatedAt: new Date().toISOString()
      };
      
      // Aggiorna la motivazione nell'array
      motivazioniDB[negozioId][index] = updatedMotivazione;
      
      // Salva nel localStorage
      localStorage.setItem('motivazioni', JSON.stringify(motivazioniDB));
      
      console.log(`Motivazione aggiornata:`, updatedMotivazione);
      console.log(`Stato finale database per negozioId ${negozioId}:`, motivazioniDB[negozioId]);
      
      return { motivazione: updatedMotivazione, negozioId };
    } else {
      // Creazione di nuova motivazione (non predefinita)
      // Trova l'ordine massimo esistente per assegnare un ordine progressivo
      const maxOrdine = motivazioniDB[negozioId].reduce((max, item) => 
        (item.ordine !== undefined && item.ordine > max) ? item.ordine : max, 
        motivazioniDB[negozioId].length > 0 ? 
          Math.max(...motivazioniDB[negozioId]
            .filter(m => m.ordine !== undefined)
            .map(m => m.ordine), 0) : 
          defaultMotivazioni.length - 1);
        
      // Crea la nuova motivazione
      const newMotivazione = {
        ...motivazioneData,
        id: 'custom_' + Date.now().toString(),  // Prefisso per distinguere dalle predefinite
        predefinita: false,
        calcolaOre: false, // Le nuove motivazioni non calcolano ore
        ordine: maxOrdine + 1, // Assegna ordine incrementale
        createdAt: new Date().toISOString()
      };
      
      console.log(`Nuova motivazione creata:`, newMotivazione);
      
      // Aggiungi la nuova motivazione all'array
      motivazioniDB[negozioId].push(newMotivazione);
      
      // Salva nel localStorage
      localStorage.setItem('motivazioni', JSON.stringify(motivazioniDB));
      
      console.log(`Stato finale database per negozioId ${negozioId}:`, motivazioniDB[negozioId]);
      return { motivazione: newMotivazione, negozioId };
    }
  } catch (error) {
    console.error("Errore durante il salvataggio della motivazione:", error);
    throw error;
  }
};

// Funzione per eliminare una motivazione
export const deleteMotivazione = async (id, negozioId) => {
  try {
    console.log(`deleteMotivazione chiamato per id: ${id}, negozioId: ${negozioId}`);
    
    // Recupera il database corrente
    const motivazioniDB = localStorage.getItem('motivazioni') 
      ? JSON.parse(localStorage.getItem('motivazioni')) 
      : {};
      
    console.log("Database motivazioni all'inizio:", motivazioniDB);
      
    // Verifica che il negozio esista nel database
    if (!motivazioniDB[negozioId] || !Array.isArray(motivazioniDB[negozioId])) {
      throw new Error('Negozio non trovato o formato dati non valido');
    }
    
    // Trova la motivazione da eliminare
    const index = motivazioniDB[negozioId].findIndex(motivazione => motivazione.id === id);
    
    if (index === -1) {
      throw new Error('Motivazione non trovata');
    }
    
    // Non permettere l'eliminazione di motivazioni predefinite
    if (motivazioniDB[negozioId][index].predefinita) {
      throw new Error('Le motivazioni predefinite non possono essere eliminate');
    }
    
    const motivazioneToDelete = motivazioniDB[negozioId][index];
    console.log(`Motivazione da eliminare:`, motivazioneToDelete);
    
    // Filtra e rimuovi la motivazione dall'array
    motivazioniDB[negozioId] = motivazioniDB[negozioId].filter(motivazione => motivazione.id !== id);
    
    // Salva nel localStorage
    localStorage.setItem('motivazioni', JSON.stringify(motivazioniDB));
    
    console.log(`Motivazione eliminata con successo. Stato finale database per negozioId ${negozioId}:`, motivazioniDB[negozioId]);
    return true;
  } catch (error) {
    console.error("Errore durante l'eliminazione della motivazione:", error);
    throw error;
  }
};