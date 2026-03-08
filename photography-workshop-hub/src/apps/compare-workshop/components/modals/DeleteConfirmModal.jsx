function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="delete-dialog-overlay">
      <div className="delete-dialog" role="dialog" aria-modal="true" tabIndex={-1}>
        <p>Delete this photographer module?</p>
        <div className="delete-dialog-actions">
          <button type="button" onClick={onConfirm}>
            Confirm
          </button>
          <button type="button" className="secondary-item" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
