function UploadSection({
  photographerModules,
  onDelete,
  onNameChange,
  setFileInputRef,
  onFilesSelected,
  onOpenPicker,
  uploadStatusByPhotographer,
  uploadedPhotosByPhotographer,
  onAddPhotographer
}) {
  return (
    <section className="upload-panel">
      <h3>Upload</h3>
      {photographerModules.map((module, index) => (
        <article key={module.id} className="photographer-module">
          <button type="button" className="module-delete-button" onClick={() => onDelete(module.id)}>
            Delete
          </button>
          <label className="photographer-label" htmlFor={`photographer-name-${module.id}`}>
            Photographer Name:
          </label>
          <input
            id={`photographer-name-${module.id}`}
            className="photographer-input"
            type="text"
            value={module.name}
            onChange={(event) => onNameChange(module.id, event.target.value)}
            placeholder={`Photographer ${index + 1}`}
          />

          <input
            ref={(node) => setFileInputRef(module.id, node)}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              onFilesSelected(module.id, event.target.files);
              event.target.value = '';
            }}
          />
          <button type="button" onClick={() => onOpenPicker(module.id)}>
            Upload Photos
          </button>
          <div
            className="drop-zone"
            role="button"
            tabIndex={0}
            aria-label="Drag and drop area"
            onClick={() => onOpenPicker(module.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              onFilesSelected(module.id, event.dataTransfer.files);
            }}
          >
            <p>Drag and drop photos here</p>
            <p className="drop-zone-note">or click to choose files</p>
          </div>
          <p className="upload-status">
            {uploadStatusByPhotographer[module.id] ??
              `${uploadedPhotosByPhotographer[module.id]?.length ?? 0} uploaded photo(s).`}
          </p>
        </article>
      ))}
      <button type="button" onClick={onAddPhotographer}>
        Add photographer
      </button>
    </section>
  );
}

export default UploadSection;
