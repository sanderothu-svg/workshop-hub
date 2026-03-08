import NameTogglePill from '../components/NameTogglePill';

function SelectSection({
  isAnonymousMode,
  onSetNameMode,
  onSetAnonymousMode,
  selectCategoryIndex,
  categories,
  onPreviousCategory,
  onNextCategory,
  currentPhoto,
  currentIndex,
  isStarred,
  onOpenFullscreen,
  onMovePhoto,
  onToggleBestPhoto
}) {
  return (
    <section className="setup-panel">
      <div className="setup-topbar">
        <strong>Select</strong>
        <NameTogglePill
          isAnonymousMode={isAnonymousMode}
          onSetNameMode={onSetNameMode}
          onSetAnonymousMode={onSetAnonymousMode}
        />
        <div className="setup-page-nav">
          <button type="button" onClick={onPreviousCategory} disabled={selectCategoryIndex === 0 || !categories.length}>
            Previous category
          </button>
          <span>
            Category {Math.min(selectCategoryIndex + 1, categories.length)} / {categories.length}
          </span>
          <button
            type="button"
            onClick={onNextCategory}
            disabled={!categories.length || selectCategoryIndex === categories.length - 1}
          >
            Next category
          </button>
        </div>
      </div>

      {categories.length ? (
        <section className="select-round">
          <h4>{categories[selectCategoryIndex]?.theme}</h4>
          {currentPhoto ? (
            <div className="select-viewer">
              <button type="button" className="select-image-button" onClick={onOpenFullscreen}>
                <img
                  className="select-photo-large"
                  src={currentPhoto.src}
                  alt={`${currentPhoto.photographerName} ${currentPhoto.label}`}
                />
              </button>

              <div className="select-viewer-footer">
                <div className="setup-photo-controls">
                  <button type="button" onClick={() => onMovePhoto(-1)}>
                    Back
                  </button>
                  <span>
                    {currentIndex + 1} / {categories[selectCategoryIndex].photos.length}
                  </span>
                  <button type="button" onClick={() => onMovePhoto(1)}>
                    Next
                  </button>
                </div>
                <button
                  type="button"
                  className={`star-button ${isStarred ? 'star-button-active' : ''}`.trim()}
                  onClick={onToggleBestPhoto}
                >
                  ★
                </button>
              </div>

              <p className="canvas-placeholder">{isAnonymousMode ? 'Anonymous' : currentPhoto.photographerName}</p>
            </div>
          ) : (
            <p className="canvas-placeholder">No photos available in this category.</p>
          )}
        </section>
      ) : (
        <p className="canvas-placeholder">No confirmed setup pages yet.</p>
      )}
    </section>
  );
}

export default SelectSection;
