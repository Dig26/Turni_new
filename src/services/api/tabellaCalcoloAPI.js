// src/services/api/tabellaCalcoloAPI.js
// Wrapper che reindirizza le chiamate al servizio

import * as tabellaCalcoloService from '../tabellaCalcoloService';

// Reindirizza tutte le funzioni al servizio
export const fetchTabellaCalcoloData = tabellaCalcoloService.fetchTabellaCalcoloData;
export const saveTabellaCalcoloData = tabellaCalcoloService.saveTabellaCalcoloData;
export const fetchStoriciTurni = tabellaCalcoloService.fetchStoriciTurni;
export const exportToExcel = tabellaCalcoloService.exportToExcel;
export const calcolaValoriDaiTurni = tabellaCalcoloService.calcolaValoriDaiTurni;
export const fetchVariazioniOrarie = tabellaCalcoloService.fetchVariazioniOrarie;

// Export default del servizio completo
export default tabellaCalcoloService;