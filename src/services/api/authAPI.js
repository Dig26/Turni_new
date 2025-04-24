// Re-export dal servizio esistente
import * as authService from '../authService';

export const login = authService.login;
export const register = authService.register;
export const logout = authService.logout;
export const getCurrentUser = authService.getCurrentUser;
export const onAuthStateChanged = authService.onAuthStateChanged;
export const isAuthenticated = authService.isAuthenticated;