import { SITE_TEMPLATE_LIBRARY } from "../lib/siteTemplates";

function getPreviewBlockClass(blockType) {
  switch (blockType) {
    case "hero":
      return "site-template-preview-block hero";
    case "button":
      return "site-template-preview-block button";
    case "columns":
      return "site-template-preview-block columns";
    case "gallery":
      return "site-template-preview-block gallery";
    case "services_list":
      return "site-template-preview-block services";
    case "contact_form":
      return "site-template-preview-block form";
    case "heading":
      return "site-template-preview-block heading";
    case "text":
      return "site-template-preview-block text";
    case "map":
      return "site-template-preview-block map";
    default:
      return "site-template-preview-block";
  }
}

function TemplateThumbnail({ template }) {
  return (
    <div className="site-template-preview" aria-hidden="true">
      {template.blocks.slice(0, 6).map((block, index) => (
        <div
          key={`${template.key}-${block.block_type}-${index}`}
          className={getPreviewBlockClass(block.block_type)}
          style={{
            background: block.content.backgroundColor || undefined,
            color: block.content.textColor || undefined,
          }}
        >
          {block.block_type === "columns" && (
            <div className="site-template-preview-columns">
              {Array.from({ length: block.content.count || 2 }).map((_, columnIndex) => (
                <span key={`${template.key}-column-${columnIndex}`} />
              ))}
            </div>
          )}
          {block.block_type === "gallery" && (
            <div className="site-template-preview-gallery">
              <span />
              <span />
              <span />
            </div>
          )}
          {block.block_type === "services_list" && (
            <div className="site-template-preview-services">
              <span />
              <span />
              <span />
            </div>
          )}
          {block.block_type === "contact_form" && (
            <div className="site-template-preview-form-lines">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SiteTemplateLibrary({ activeTemplateKey, onApplyTemplate, hasBlocks }) {
  return (
    <section className="panel site-template-library">
      <div className="site-template-library-header">
        <div>
          <h3>Website Templates</h3>
          <p className="muted">Start from a Vivid-inspired layout, then edit text, colors, and section order inside the block editor.</p>
        </div>
      </div>

      <div className="site-template-grid">
        {SITE_TEMPLATE_LIBRARY.map((template) => (
          <article
            key={template.key}
            className={`site-template-card ${activeTemplateKey === template.key ? "active" : ""}`}
          >
            <TemplateThumbnail template={template} />
            <div className="site-template-card-top">
              <span className="site-template-icon">{template.icon}</span>
              <div>
                <h4>{template.label}</h4>
                <p>{template.description}</p>
              </div>
            </div>
            <div className="site-template-card-meta">
              <span>{template.blocks.length} sections</span>
              <span>{template.blocks.map((block) => block.block_type).slice(0, 3).join(" • ")}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (!hasBlocks || window.confirm("Apply this template and replace the current unsaved block layout?")) {
                  onApplyTemplate(template.key);
                }
              }}
            >
              {activeTemplateKey === template.key ? "Reapply template" : "Apply template"}
            </button>
          </article>
        ))}
      </div>

      <p className="muted site-template-tip">Tip: select a block to edit copy and colors, then drag the handle to reorder sections.</p>
    </section>
  );
}