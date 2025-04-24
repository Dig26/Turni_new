// services/storage/indexedDBService.js
// Servizio per interagire con IndexedDB

// Nome del database e versione
const DB_NAME = 'turni_app_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

// Inizializza il database
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB non è supportato da questo browser.');
      return;
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(`Errore nell'apertura del database: ${event.target.error}`);
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Crea l'object store se non esiste
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });
};

// Verifica se IndexedDB è disponibile
export const isAvailable = async () => {
  try {
    await initDB();
    return true;
  } catch (error) {
    console.error('IndexedDB non è disponibile:', error);
    return false;
  }
};

// Funzioni base
export const getItem = async (key) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        const result = event.target.result;
        resolve(result ? result.value : null);
      };
      
      request.onerror = (event) => {
        reject(`Errore nel recupero dell'elemento: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error(`Errore nel recupero dell'elemento "${key}":`, error);
    return null;
  }
};

export const setItem = async (key, value) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, value });
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(`Errore nel salvataggio dell'elemento: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error(`Errore nel salvataggio dell'elemento "${key}":`, error);
    return false;
  }
};

export const removeItem = async (key) => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(`Errore nella rimozione dell'elemento: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error(`Errore nella rimozione dell'elemento "${key}":`, error);
    return false;
  }
};

export const clear = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(`Errore nella pulizia del database: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Errore nella pulizia del database:', error);
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
    return typeof result === 'string' ? JSON.parse(result) : result;
  } catch (error) {
    console.error(`Errore nel parsing dell'oggetto "${key}":`, error);
    return null;
  }
};

export const setObject = async (key, value) => {
  let valueToStore;
  
  try {
    valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
  } catch (error) {
    console.error(`Errore nella serializzazione dell'oggetto "${key}":`, error);
    return false;
  }
  
  return await setItem(key, valueToStore);
};

// Funzione per ottenere lo stato del database
export const getStorageInfo = async () => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      
      request.onsuccess = async (event) => {
        const keys = event.target.result;
        let totalSize = 0;
        
        for (const key of keys) {
          const item = await getItem(key);
          if (item) {
            // Approssimazione della dimensione in byte
            totalSize += (key.length + (typeof item === 'string' ? item.length : JSON.stringify(item).length));
          }
        }
        
        resolve({
          keys: keys.length,
          used: totalSize,
          // IndexedDB generalmente ha un limite più alto rispetto a localStorage, ma varia per browser
          available: 'Sconosciuto', // Non è facile stimare lo spazio disponibile in IndexedDB
          usedPercent: 'N/A'
        });
      };
      
      request.onerror = (event) => {
        reject(`Errore nel recupero delle informazioni di storage: ${event.target.error}`);
      };
    });
  } catch (error) {
    console.error('Errore nel calcolo delle informazioni di storage:', error);
    return null;
  }
};