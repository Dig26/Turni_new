// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignora alcuni path per evitare warning con date nella tabella calcolo
        ignoredActions: ['tabellaCalcolo/fetchData/fulfilled'],
        ignoredPaths: ['tabellaCalcolo.lastUpdate']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production',
});