// src/components/common/Modal/ConfirmationDialog.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeConfirmationDialog } from '../../../app/slices/uiSlice';
import '../../../styles/Modal.css';

const ConfirmationDialog = () => {
  const dispatch = useDispatch();
  const { isOpen, title, message, onConfirm, onCancel } = useSelector(state => state.ui.confirmationDialog);
  
  // Se non è aperto, non renderizzare nulla
  if (!isOpen) {
    return null;
  }
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    dispatch(closeConfirmationDialog());
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    dispatch(closeConfirmationDialog());
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content confirmation-dialog">
        <div className="modal-header">
          <h3>{title || 'Conferma'}</h3>
        </div>
        <div className="modal-body">
          <p>{message || 'Sei sicuro di voler procedere?'}</p>
        </div>
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={handleCancel}
          >
            Annulla
          </button>
          <button 
            className="btn-danger" 
            onClick={handleConfirm}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;