// services/storage/cloudStorageService.js
// Servizio per simulare uno storage cloud
// In un'app reale, questo verrebbe sostituito con una vera API cloud (Firebase, AWS, ecc.)

// Cache locale per migliorare le prestazioni
const localCache = new Map();

// Simulazione di ritardo di rete
const simulateNetworkDelay = async () => {
  const delay = Math.floor(Math.random() * 300) + 100; // Ritardo tra 100ms e 400ms
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Verifica se il servizio è disponibile
export const isAvailable = async () => {
  try {
    // Simuliamo una richiesta di disponibilità
    await simulateNetworkDelay();
    return true; // In un caso reale, qui controlleremmo la connessione al servizio cloud
  } catch (error) {
    console.error('Errore di connessione al cloud storage:', error);
    return false;
  }
};

// Funzioni base
export const getItem = async (key) => {
  try {
    // Prima controlla nella cache locale
    if (localCache.has(key)) {
      return localCache.get(key);
    }
    
    // Simula una richiesta API
    await simulateNetworkDelay();
    
    // Fallback al localStorage per simulare il comportamento
    const value = localStorage.getItem(`cloud_${key}`);
    
    // Aggiorna la cache locale
    if (value !== null) {
      localCache.set(key, value);
    }
    
    return value;
  } catch (error) {
    console.error(`Errore nel recupero dell'elemento dal cloud "${key}":`, error);
    return null;
  }
};

export const setItem = async (key, value) => {
  try {
    // Aggiorna la cache locale
    localCache.set(key, value);
    
    // Simula una richiesta API
    await simulateNetworkDelay();
    
    // Fallback al localStorage per simulare il comportamento
    localStorage.setItem(`cloud_${key}`, value);
    
    return true;
  } catch (error) {
    console.error(`Errore nel salvataggio dell'elemento nel cloud "${key}":`, error);
    return false;
  }
};

export const removeItem = async (key) => {
  try {
    // Rimuovi dalla cache locale
    localCache.delete(key);
    
    // Simula una richiesta API
    await simulateNetworkDelay();
    
    // Fallback al localStorage per simulare il comportamento
    localStorage.removeItem(`cloud_${key}`);
    
    return true;
  } catch (error) {
    console.error(`Errore nella rimozione dell'elemento dal cloud "${key}":`, error);
    return false;
  }
};

export const clear = async () => {
  try {
    // Svuota la cache locale
    localCache.clear();
    
    // Simula una richiesta API
    await simulateNetworkDelay();
    
    // Rimuovi tutti gli elementi del cloud dal localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cloud_')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Errore nella pulizia del cloud storage:', error);
    return false;
  }
};

// Funzioni per oggetti
export const getObject = async (key) => {
  const result = await getItem(key);
  
  if (result === null) {
    return null;
  }
  
  try {
    return JSON.parse(result);
  } catch (error) {
    console.error(`Errore nel parsing dell'oggetto dal cloud "${key}":`, error);
    return null;
  }
};

export const setObject = async (key, value) => {
  try {
    const serialized = JSON.stringify(value);
    return await setItem(key, serialized);
  } catch (error) {
    console.error(`Errore nella serializzazione dell'oggetto per il cloud "${key}":`, error);
    return false;
  }
};

// Statistiche di utilizzo
export const getStorageInfo = async () => {
  try {
    // Simula una richiesta API
    await simulateNetworkDelay();
    
    let totalSize = 0;
    let itemCount = 0;
    
    // Calcola la dimensione totale degli elementi cloud
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cloud_')) {
        const value = localStorage.getItem(key);
        totalSize += (key.length - 6) + (value ? value.length : 0); // -6 per rimuovere "cloud_"
        itemCount++;
      }
    });
    
    // In un'app reale, otterremmo questi dati dall'API del cloud
    return {
      items: itemCount,
      used: totalSize,
      available: '10GB', // Esempio di quota
      usedPercent: (totalSize / (10 * 1024 * 1024 * 1024)) * 100 // Percentuale di 10GB
    };
  } catch (error) {
    console.error('Errore nel calcolo delle informazioni del cloud storage:', error);
    return {
      items: 0,
      used: 0,
      available: 'Sconosciuto',
      usedPercent: 0
    };
  }
};

// Funzioni specifiche del cloud
export const syncData = async () => {
  try {
    await simulateNetworkDelay();
    console.log('Dati sincronizzati con il cloud');
    return true;
  } catch (error) {
    console.error('Errore durante la sincronizzazione con il cloud:', error);
    return false;
  }
};

export const getUserStorage = async (userId) => {
  try {
    await simulateNetworkDelay();
    // In un'app reale, faremmo una richiesta specifica per l'utente
    return {
      id: userId,
      quota: '10GB',
      used: '1.2GB',
      lastSync: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Errore nel recupero dello storage dell'utente "${userId}":`, error);
    return null;
  }
};