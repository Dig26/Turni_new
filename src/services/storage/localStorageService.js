// services/storage/localStorageService.js
// Servizio per interagire con il localStorage del browser

// Verifica se localStorage è disponibile
export const isAvailable = () => {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Funzioni base
  export const getItem = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  };
  
  export const setItem = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
      return false;
    }
  };
  
  export const removeItem = (key) => {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
      return false;
    }
  };
  
  export const clear = () => {
    try {
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  };
  
  // Funzioni per oggetti (serializzazione/deserializzazione automatica)
  export const getObject = (key) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing object from localStorage key "${key}":`, error);
      return null;
    }
  };
  
  export const setObject = (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error storing object in localStorage key "${key}":`, error);
      return false;
    }
  };
  
  // Funzione per stimare lo spazio usato e quello disponibile
  export const getStorageInfo = () => {
    try {
      let totalSize = 0;
      const items = { ...localStorage };
      
      for (let key in items) {
        if (items.hasOwnProperty(key)) {
          totalSize += (key.length + items[key].length) * 2; // Approssimazione in byte (2 byte per carattere UTF-16)
        }
      }
      
      // La maggior parte dei browser ha circa 5MB di localStorage per dominio
      const estimatedLimit = 5 * 1024 * 1024; // 5MB in byte
      const availableSpace = estimatedLimit - totalSize;
      
      return {
        used: totalSize,
        available: availableSpace,
        usedPercent: (totalSize / estimatedLimit) * 100,
        availablePercent: (availableSpace / estimatedLimit) * 100
      };
    } catch (error) {
      console.error('Error calculating storage info:', error);
      return null;
    }
  };
  
  // Funzione per monitorare lo spazio disponibile
  export const monitorStorage = (threshold = 90, callback) => {
    const info = getStorageInfo();
    if (info && info.usedPercent >= threshold) {
      callback(info);
    }
  };