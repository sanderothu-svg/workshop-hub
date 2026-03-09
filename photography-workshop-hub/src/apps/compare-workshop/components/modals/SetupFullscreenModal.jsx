function SetupFullscreenModal({ photographerName, photo, onBack, onNext, onClose }) {
  if (!photo || !photographerName) {
    return null;
  }

  return (
    <div className="delete-dialog-overlay">
      <div className="fullscreen-photo-modal" role="dialog" aria-modal="true">
        <h3>{photographerName}</h3>
        <img src={photo.src} alt={`${photographerName} ${photo.label}`} />
        <div className="setup-photo-controls">
          <button type="button" onClick={onBack}>
            Back
          </button>
          <button type="button" onClick={onNext}>
            Next
          </button>
          <button type="button" className="secondary-item" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetupFullscreenModal;
