import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import negoziReducer from './slices/negoziSlice';
import dipendentiReducer from './slices/dipendentiSlice';
import turniReducer from './slices/turniSlice';
import uiReducer from './slices/uiSlice';
import themeReducer from './slices/themeSlice';
import particolaritaReducer from './slices/particolaritaSlice';
import motivazioniReducer from './slices/motivazioniSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  negozi: negoziReducer,
  dipendenti: dipendentiReducer,
  turni: turniReducer,
  ui: uiReducer,
  theme: themeReducer,
  particolarita: particolaritaReducer,
  motivazioni: motivazioniReducer
});

export default rootReducer;