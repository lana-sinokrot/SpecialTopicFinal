import React from 'react';
import '../styles/Modal.css';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, reportType }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Delete Report</h3>
        <p>Are you sure you want to delete this {reportType} incident report?</p>
        <p className="modal-warning">This action cannot be undone.</p>
        <div className="modal-actions">
          <button onClick={onClose} className="modal-button cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="modal-button delete">
            Delete Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 