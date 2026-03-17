import { useSiteEditor } from "../../hooks/useSiteEditor";
import SiteEditorCanvas from "../SiteEditorCanvas";
import BlockPropertiesPanel from "../BlockPropertiesPanel";

export default function WebsiteTab({ siteId, site, user }) {
  const editor = useSiteEditor(user, siteId);
  const {
    blocks,
    selectedBlockId,
    selectedBlock,
    saving,
    status,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    saveBlocks,
    setSelectedBlockId,
  } = editor;

  return (
    <div className="admin-website-tab">
      {/* Header bar */}
      <div className="admin-section-header">
        <div>
          <h2>Edit Website</h2>
          <p className="muted">
            Drag, add, and edit blocks to update <strong>{site.site_name}</strong>.
            Changes go live when you click Save.
          </p>
        </div>
        <div className="website-tab-actions">
          {site.slug && (
            <a
              className="btn btn-secondary btn-sm"
              href={`/s/${site.slug}`}
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
            {saving ? "Saving..." : "💾 Save Changes"}
          </button>
        </div>
      </div>

      {status && <p className="status-banner">{status}</p>}

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
    </div>
  );
}
