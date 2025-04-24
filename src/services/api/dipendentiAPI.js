// Importa dal servizio esistente
import * as dipendentiService from '../dipendentiService';

export const getDipendentiByNegozioId = dipendentiService.getDipendentiByNegozioId;
export const getDipendenteById = dipendentiService.getDipendenteById;
export const saveDipendente = dipendentiService.saveDipendente;
export const deleteDipendente = dipendentiService.deleteDipendente;
export const deleteDipendentiByNegozioId = dipendentiService.deleteDipendentiByNegozioId;