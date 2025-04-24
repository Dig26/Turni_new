// src/components/common/Notifications/Toast.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { removeNotification } from '../../../app/slices/uiSlice';
import '../../../styles/Notifications.css';

const Toast = ({ notification }) => {
  const [isExiting, setIsExiting] = useState(false);
  const dispatch = useDispatch();
  
  // Determina l'icona basata sul tipo
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-times-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
      default:
        return 'fas fa-info-circle';
    }
  };
  
  useEffect(() => {
    // Se la notifica ha una durata, imposta un timer per rimuoverla
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        
        // Rimuovi la notifica dopo l'animazione di uscita
        setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, 300); // durata dell'animazione di uscita
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);
  
  const handleClose = () => {
    setIsExiting(true);
    
    // Rimuovi la notifica dopo l'animazione di uscita
    setTimeout(() => {
      dispatch(removeNotification(notification.id));
    }, 300); // durata dell'animazione di uscita
  };
  
  return (
    <div className={`toast ${notification.type} ${isExiting ? 'exit' : ''}`}>
      <div className="toast-icon">
        <i className={getIcon(notification.type)}></i>
      </div>
      <div className="toast-content">
        {notification.title && <div className="toast-title">{notification.title}</div>}
        <div className="toast-message">{notification.message}</div>
      </div>
      <button className="toast-close" onClick={handleClose}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};
export default Toast; // Assicurati che questa riga sia presente