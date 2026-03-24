import { useSiteEditor } from "../hooks/useSiteEditor";
import SiteEditorCanvas from "../components/SiteEditorCanvas";
import BlockPropertiesPanel from "../components/BlockPropertiesPanel";
import { isSupabaseConfigured } from "../lib/supabaseClient";

export default function SiteEditorPage({ user }) {
  const {
    sites,
    activeSite,
    blocks,
    selectedBlockId,
    selectedBlock,
    saving,
    loading,
    status,
    openSite,
    closeSite,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    reorderBlocks,
    saveBlocks,
    setSelectedBlockId,
  } = useSiteEditor(user);

  if (loading) {
    return (
      <main className="container main-space fade-in">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Loading sites...</span>
        </div>
      </main>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="container main-space fade-in">
        <section className="panel" style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2>Administration Portal</h2>
          <p className="muted">
            Supabase is not configured yet. Follow the setup guide to enable login and the client portal.
          </p>
        </section>
      </main>
    );
  }

  // Site list view
  if (!activeSite) {
    return (
      <main className="container main-space fade-in">
        <section className="panel site-list-panel">
          <h2>🌐 Your Websites</h2>
          <p className="muted">Select a website to open the editor and manage its content.</p>

          {sites.length === 0 ? (
            <div className="canvas-empty">
              <p className="canvas-empty-icon">📂</p>
              <h3>No sites assigned yet</h3>
              <p className="muted">
                When a site is created for your account, it will appear here.
                You can then edit its content, layout, and images.
              </p>
            </div>
          ) : (
            <div className="site-list-grid">
              {sites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  className="site-list-card"
                  onClick={() => openSite(site)}
                >
                  <div className="site-list-card-inner">
                    <span className="site-list-card-icon">🌐</span>
                    <div className="site-list-card-info">
                      <strong>{site.site_name}</strong>
                      {site.description && <span className="muted">{site.description}</span>}
                      {site.site_url && <span className="muted site-url-text">{site.site_url}</span>}
                    </div>
                  </div>
                  <span className="site-list-card-arrow">→</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {status && <p className="status-banner" style={{ marginTop: 16 }}>{status}</p>}
      </main>
    );
  }

  // Editor view
  return (
    <main className="container main-space fade-in">
      {/* Editor header */}
      <div className="site-editor-header">
        <div className="site-editor-header-left">
          <button type="button" className="btn btn-secondary btn-sm" onClick={closeSite}>
            ← Back
          </button>
          <div>
            <h2 className="site-editor-title">{activeSite.site_name}</h2>
            {activeSite.site_url && (
              <a
                className="site-editor-url muted"
                href={activeSite.site_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {activeSite.site_url} ↗
              </a>
            )}
          </div>
        </div>
        <div className="site-editor-header-right">
          {activeSite.slug && (
            <a
              className="btn btn-secondary btn-sm"
              href={`/s/${activeSite.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview Live ↗
            </a>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveBlocks}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Editor layout */}
      <div className="site-editor-grid">
        <div className="site-editor-main">
          <SiteEditorCanvas
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
            onMoveBlock={moveBlock}
            onReorderBlocks={reorderBlocks}
            onAddBlock={addBlock}
          />
        </div>
        <div className="site-editor-sidebar">
          <BlockPropertiesPanel
            block={selectedBlock}
            onChange={updateBlock}
          />
        </div>
      </div>

      {status && <p className="status-banner" style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}
