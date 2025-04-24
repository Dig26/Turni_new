import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout, login as loginAction, register as registerAction, logoutUser } from '../app/slices/authSlice';
import * as authService from '../services/api/authAPI';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, error, loading } = useSelector(state => state.auth);

  const initialize = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      dispatch(loginSuccess(currentUser));
    }
  }, [dispatch]);

  const login = useCallback((email, password) => {
    return dispatch(loginAction(email, password));
  }, [dispatch]);

  const register = useCallback((nome, cognome, email, password) => {
    return dispatch(registerAction(nome, cognome, email, password));
  }, [dispatch]);

  const logoutFn = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  // Listener per cambiamenti di autenticazione
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (user) {
        dispatch(loginSuccess(user));
      } else {
        dispatch(logout());
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    error,
    loading,
    login,
    register,
    logout: logoutFn,
    initialize
  };
};