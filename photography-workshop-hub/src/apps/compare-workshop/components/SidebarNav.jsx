function SidebarNav({ menuItems, activeSection, onSectionChange, onExportWsc, onImportWsc }) {
  return (
    <aside className="compare-sidebar">
      <h2>Compare Workshop</h2>

      <nav className="compare-nav" aria-label="Compare Workshop sections">
        {menuItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`sidebar-item ${activeSection === item ? 'sidebar-item-active' : ''}`.trim()}
            onClick={() => onSectionChange(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-item secondary-item" onClick={onExportWsc}>
          Export WSC
        </button>
        <button type="button" className="sidebar-item secondary-item" onClick={onImportWsc}>
          Import WSC
        </button>
      </div>
    </aside>
  );
}

export default SidebarNav;
