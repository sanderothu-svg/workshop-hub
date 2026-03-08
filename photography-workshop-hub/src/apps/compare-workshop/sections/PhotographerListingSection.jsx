function PhotographerListingSection({
  photoCatalog,
  listingPhotographerId,
  onListingPhotographerChange,
  isDownloadingPdf,
  onDownloadPdf,
  listingPhotographer,
  listingPhotos,
  onOpenFullscreen
}) {
  return (
    <section className="setup-panel">
      <div className="setup-topbar">
        <strong>Listing per photographer</strong>
        <select
          className="photographer-select"
          value={listingPhotographerId}
          onChange={(event) => onListingPhotographerChange(event.target.value)}
        >
          {photoCatalog.map((photographer) => (
            <option key={`listing-${photographer.photographerId}`} value={photographer.photographerId}>
              {photographer.photographerName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isDownloadingPdf || !listingPhotographer || !listingPhotos.length}
        >
          {isDownloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
        </button>
      </div>

      {listingPhotographer && listingPhotos.length ? (
        <div className="ultimate-grid">
          {listingPhotos.map((photo, index) => (
            <article key={`listing-photo-${photo.id}`} className="setup-card">
              <h4>{photo.theme}</h4>
              <button type="button" className="select-image-button" onClick={() => onOpenFullscreen(index)}>
                <img className="select-photo" src={photo.src} alt={`${listingPhotographer.photographerName} ${photo.label}`} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="canvas-placeholder">No category photos available for this photographer yet.</p>
      )}
    </section>
  );
}

export default PhotographerListingSection;
