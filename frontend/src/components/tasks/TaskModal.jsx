import React from 'react';

const TaskModal = ({ isOpen, onClose, task }) => {
  if (!isOpen) return null;
  return (
    <div className="task-modal-overlay">
      <div className="task-modal-content">
        <h2>Task Modal</h2>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default TaskModal;
