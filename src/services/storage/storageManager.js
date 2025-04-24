// services/storage/storageManager.js
// Gestore centralizzato per le operazioni di storage

// Importa i servizi di storage specifici
import * as localStorage from './localStorageService';

// Variabile per tenere traccia del servizio di storage attualmente utilizzato
let currentStorage = localStorage;

// Funzione per impostare il servizio di storage da utilizzare
export const setStorageService = (storageService) => {
  currentStorage = storageService;
};

// Funzioni di base per interagire con lo storage
export const getItem = (key) => {
  return currentStorage.getItem(key);
};

export const setItem = (key, value) => {
  return currentStorage.setItem(key, value);
};

export const removeItem = (key) => {
  return currentStorage.removeItem(key);
};

export const clear = () => {
  return currentStorage.clear();
};

// Funzioni specifiche per oggetti e array
export const getObject = (key) => {
  return currentStorage.getObject(key);
};

export const setObject = (key, value) => {
  return currentStorage.setObject(key, value);
};

// Funzione per gestire la migrazione dei dati tra storage
export const migrateData = (sourceStorage, targetStorage, keys) => {
  keys.forEach(key => {
    const value = sourceStorage.getItem(key);
    if (value !== null) {
      targetStorage.setItem(key, value);
    }
  });
};

// Verifica se lo storage è disponibile
export const isStorageAvailable = () => {
  return currentStorage.isAvailable();
};

// Funzione per ottenere lo spazio utilizzato e disponibile
export const getStorageInfo = () => {
  return currentStorage.getStorageInfo();
};