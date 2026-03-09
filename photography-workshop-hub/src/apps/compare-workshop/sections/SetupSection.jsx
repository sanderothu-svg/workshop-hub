import NameTogglePill from '../components/NameTogglePill';

function SetupSection({
  activeTheme,
  onThemeChange,
  isAnonymousMode,
  onSetNameMode,
  onSetAnonymousMode,
  setupPageIndex,
  confirmedRoundsCount,
  onPreviousPage,
  onNextPage,
  photoCatalog,
  availablePhotosByPhotographer,
  currentPhotoIndexByPhotographer,
  onOpenFullscreen,
  onMovePhoto,
  canConfirmSetup,
  onConfirmSetupRound,
  isViewingConfirmedPage
}) {
  return (
    <section className="setup-panel">
      <div className="setup-topbar">
        <label htmlFor="setup-theme">Enter theme:</label>
        <input
          id="setup-theme"
          type="text"
          value={activeTheme}
          onChange={(event) => onThemeChange(event.target.value)}
          placeholder={`Theme ${setupPageIndex + 1}`}
        />
        <NameTogglePill
          isAnonymousMode={isAnonymousMode}
          onSetNameMode={onSetNameMode}
          onSetAnonymousMode={onSetAnonymousMode}
        />
        <div className="setup-page-nav">
          <button type="button" onClick={onPreviousPage} disabled={setupPageIndex === 0}>
            Previous page
          </button>
          <span>
            Page {setupPageIndex + 1} / {confirmedRoundsCount + 1}
          </span>
          <button type="button" onClick={onNextPage} disabled={setupPageIndex === confirmedRoundsCount}>
            Next page
          </button>
        </div>
      </div>

      <div className="setup-grid">
        {photoCatalog.map((photographer) => {
          const availablePhotos = availablePhotosByPhotographer[photographer.photographerId] ?? [];
          const currentIndex = currentPhotoIndexByPhotographer[photographer.photographerId] ?? 0;
          const currentPhoto = availablePhotos[Math.min(currentIndex, Math.max(availablePhotos.length - 1, 0))] ?? null;

          return (
            <article key={photographer.photographerId} className="setup-card">
              <h4>{photographer.photographerName}</h4>

              {currentPhoto ? (
                <>
                  <button
                    type="button"
                    className="setup-photo-button"
                    onClick={() => onOpenFullscreen(photographer.photographerId)}
                  >
                    <img src={currentPhoto.src} alt={`${photographer.photographerName} ${currentPhoto.label}`} />
                  </button>

                  <div className="setup-photo-controls">
                    <button type="button" onClick={() => onMovePhoto(photographer.photographerId, -1)}>
                      Back
                    </button>
                    <span>
                      {Math.min(currentIndex + 1, availablePhotos.length)} / {availablePhotos.length}
                    </span>
                    <button type="button" onClick={() => onMovePhoto(photographer.photographerId, 1)}>
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p className="canvas-placeholder">No photos left for this photographer.</p>
              )}
            </article>
          );
        })}
      </div>

      <button type="button" onClick={onConfirmSetupRound} disabled={!canConfirmSetup}>
        {isViewingConfirmedPage ? 'Save page changes' : 'Confirm page and go to next'}
      </button>
    </section>
  );
}

export default SetupSection;
