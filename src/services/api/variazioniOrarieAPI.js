// src/services/api/variazioniOrarieAPI.js
// Wrapper che reindirizza le chiamate al servizio

import * as variazioniOrarieService from '../variazioniOrarieService';

// Reindirizza tutte le funzioni al servizio
export const fetchVariazioniByDipendente = variazioniOrarieService.fetchVariazioniByDipendente;
export const createVariazione = variazioniOrarieService.createVariazione;
export const updateVariazione = variazioniOrarieService.updateVariazione;
export const deleteVariazione = variazioniOrarieService.deleteVariazione;
export const saveVariazioniDipendente = variazioniOrarieService.saveVariazioniDipendente;
export const fetchVariazioniByNegozio = variazioniOrarieService.fetchVariazioniByNegozio;
export const validateVariazioni = variazioniOrarieService.validateVariazioni;
export const calcolaOreEffettive = variazioniOrarieService.calcolaOreEffettive;

// Export default del servizio completo
export default variazioniOrarieService;