import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  // Altri reducer verranno aggiunti in seguito
});

export default rootReducer;