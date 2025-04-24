// src/app/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  sidebar: {
    isOpen: true
  },
  modal: {
    isOpen: false,
    type: null,
    props: {}
  },
  isTourActive: false,
  loadingStates: {},
  confirmationDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar(state) {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    setSidebarState(state, action) {
      state.sidebar.isOpen = action.payload;
    },
    
    // Modal
    openModal(state, action) {
      state.modal.isOpen = true;
      state.modal.type = action.payload.type;
      state.modal.props = action.payload.props || {};
    },
    closeModal(state) {
      state.modal.isOpen = false;
      state.modal.type = null;
      state.modal.props = {};
    },
    
    // Notifications
    addNotification(state, action) {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
        createdAt: new Date().toISOString()
      });
    },
    removeNotification(state, action) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications(state) {
      state.notifications = [];
    },
    
    // Tour
    startTour(state) {
      state.isTourActive = true;
    },
    endTour(state) {
      state.isTourActive = false;
    },
    
    // Loading states
    setLoading(state, action) {
      const { key, isLoading } = action.payload;
      state.loadingStates[key] = isLoading;
    },
    
    // Confirmation dialog
    openConfirmationDialog(state, action) {
      state.confirmationDialog = {
        isOpen: true,
        title: action.payload.title || 'Conferma',
        message: action.payload.message || 'Sei sicuro?',
        onConfirm: action.payload.onConfirm,
        onCancel: action.payload.onCancel
      };
    },
    closeConfirmationDialog(state) {
      state.confirmationDialog = {
        ...state.confirmationDialog,
        isOpen: false
      };
    }
  }
});

export const {
  toggleSidebar,
  setSidebarState,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearAllNotifications,
  startTour,
  endTour,
  setLoading,
  openConfirmationDialog,
  closeConfirmationDialog
} = uiSlice.actions;

export default uiSlice.reducer;