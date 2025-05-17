// src/services/api/negoziAPI.js
// Wrapper che reindirizza le chiamate al nuovo servizio

import * as negoziService from '../negoziService';

// Reindirizza tutte le funzioni al nuovo servizio
export const getNegozi = negoziService.getNegozi;
export const getNegozioById = negoziService.getNegozioById;
export const saveNegozio = negoziService.saveNegozio;
export const deleteNegozio = negoziService.deleteNegozio;