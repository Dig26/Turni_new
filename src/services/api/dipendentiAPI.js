// src/services/api/dipendentiAPI.js - Versione corretta
// Importa dal servizio esistente
import * as dipendentiService from '../dipendentiService';

// Esporta le funzioni necessarie
export const getDipendentiByNegozioId = (negozioId) => {
  return dipendentiService.getDipendentiByNegozioId(negozioId);
};

export const getDipendenteById = (id) => {
  return dipendentiService.getDipendenteById(id);
};

export const saveDipendente = (dipendente, id = null) => {
  return dipendentiService.saveDipendente(dipendente, id);
};

export const deleteDipendente = (id) => {
  return dipendentiService.deleteDipendente(id);
};

export const deleteDipendentiByNegozioId = (negozioId) => {
  return dipendentiService.deleteDipendentiByNegozioId(negozioId);
};