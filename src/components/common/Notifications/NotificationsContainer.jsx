// src/components/common/Notifications/NotificationsContainer.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import Toast from './Toast';
import '../../../styles/Notifications.css';

const NotificationsContainer = () => {
  const notifications = useSelector(state => state.ui.notifications);
  
  // Se non ci sono notifiche, non renderizzare nulla
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default NotificationsContainer;