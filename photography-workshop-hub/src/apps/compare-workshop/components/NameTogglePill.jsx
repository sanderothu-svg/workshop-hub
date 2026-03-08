function NameTogglePill({ isAnonymousMode, onSetNameMode, onSetAnonymousMode }) {
  return (
    <div className="name-toggle-pill" role="group" aria-label="Photographer name visibility">
      <button
        type="button"
        className={`name-toggle-item ${!isAnonymousMode ? 'name-toggle-item-active' : ''}`.trim()}
        onClick={onSetNameMode}
      >
        Name
      </button>
      <button
        type="button"
        className={`name-toggle-item ${isAnonymousMode ? 'name-toggle-item-active' : ''}`.trim()}
        onClick={onSetAnonymousMode}
      >
        Anonymous
      </button>
    </div>
  );
}

export default NameTogglePill;
