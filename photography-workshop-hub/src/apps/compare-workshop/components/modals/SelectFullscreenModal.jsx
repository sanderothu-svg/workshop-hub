function SelectFullscreenModal({
  theme,
  photographerLabel,
  photo,
  currentIndex,
  total,
  isStarred,
  canGoToNextTheme,
  onBack,
  onNext,
  onNextTheme,
  onToggleStar,
  onClose
}) {
  if (!photo) {
    return null;
  }

  return (
    <div className="select-fullscreen-overlay">
      <div className="select-fullscreen-modal" role="dialog" aria-modal="true">
        <h3>{theme}</h3>
        {photographerLabel ? <p className="select-fullscreen-photographer">{photographerLabel}</p> : null}
        <div className="select-fullscreen-stage">
          <div className="select-fullscreen-topbar">
            <button
              type="button"
              className="button-inverted select-control-button"
              onClick={onNextTheme}
              disabled={!canGoToNextTheme}
            >
              Next Theme
            </button>
            <button type="button" className="button-inverted select-control-button" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="select-fullscreen-image-wrap">
            <img src={photo.src} alt={`${photo.photographerName} ${photo.label}`} />
            <button
              type="button"
              className={`star-button select-fullscreen-star ${isStarred ? 'star-button-active' : ''}`.trim()}
              onClick={onToggleStar}
              aria-label="Mark best photo"
            >
              ★
            </button>
          </div>
          <div className="select-fullscreen-controls">
            <button type="button" className="select-control-button" onClick={onBack}>
              Back
            </button>
            <span>
              {currentIndex + 1} / {total}
            </span>
            <div className="select-right-controls-col">
              <button type="button" className="select-control-button" onClick={onNext}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectFullscreenModal;
