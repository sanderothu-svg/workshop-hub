import NameTogglePill from '../components/NameTogglePill';

function UltimateListingSection({
  isAnonymousMode,
  onSetNameMode,
  onSetAnonymousMode,
  isDownloadingPdf,
  onDownloadPdf,
  starredPhotos,
  onOpenFullscreen
}) {
  return (
    <section className="setup-panel">
      <div className="setup-topbar">
        <strong>Ultimate Listing</strong>
        <NameTogglePill
          isAnonymousMode={isAnonymousMode}
          onSetNameMode={onSetNameMode}
          onSetAnonymousMode={onSetAnonymousMode}
        />
        <button type="button" onClick={onDownloadPdf} disabled={isDownloadingPdf}>
          {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
        </button>
      </div>

      {starredPhotos.length ? (
        <div className="ultimate-grid">
          {starredPhotos.map((photo, index) => (
            <article key={`ultimate-${photo.categoryIndex}-${photo.photoId}`} className="setup-card">
              <h4>{isAnonymousMode ? photo.theme : `${photo.theme} - ${photo.photographerName}`}</h4>
              <button type="button" className="select-image-button" onClick={() => onOpenFullscreen(index)}>
                <img className="select-photo" src={photo.src} alt={`${photo.photographerName} ${photo.label}`} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="canvas-placeholder">No starred photos yet.</p>
      )}
    </section>
  );
}

export default UltimateListingSection;
