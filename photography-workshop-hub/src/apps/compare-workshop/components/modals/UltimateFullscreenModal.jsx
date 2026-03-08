function UltimateFullscreenModal({ title, photo, currentIndex, total, onBack, onNext, onClose }) {
  if (!photo) {
    return null;
  }

  return (
    <div className="delete-dialog-overlay">
      <div className="fullscreen-photo-modal" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <img src={photo.src} alt={`${photo.photographerName} ${photo.label}`} />
        <div className="setup-photo-controls">
          <button type="button" onClick={onBack}>
            Back
          </button>
          <span>
            {currentIndex + 1} / {total}
          </span>
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

export default UltimateFullscreenModal;
