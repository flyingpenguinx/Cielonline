import { useState } from "react";
import ImageUploadField from "./ImageUploadField";

/* ── Tooltip helper ── */
function HelpTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="help-tip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="help-tip-icon">?</span>
      {show && <span className="help-tip-bubble">{text}</span>}
    </span>
  );
}

/* ── Collapsible section ── */
function PropSection({ title, helpText, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`prop-section ${open ? "open" : ""}`}>
      <button type="button" className="prop-section-header" onClick={() => setOpen(!open)}>
        <span className="prop-section-title">{title}</span>
        {helpText && <HelpTip text={helpText} />}
        <span className="prop-section-chevron">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="prop-section-body">{children}</div>}
    </div>
  );
}

const BLOCK_LABELS = {
  hero: "Hero Banner",
  heading: "Heading",
  text: "Text Block",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  columns: "Columns",
  gallery: "Gallery",
  services_list: "Services / Prices",
  contact_form: "Contact Form",
  video: "Video Embed",
  map: "Map Embed",
};

const BLOCK_ICONS = {
  hero: "🖼️", heading: "📝", text: "📄", image: "🖼", button: "🔘",
  divider: "—", spacer: "↕", columns: "▥", gallery: "🖼️",
  services_list: "💰", contact_form: "📬", video: "🎬", map: "📍",
};

export default function BlockPropertiesPanel({ block, onChange }) {
  if (!block) {
    return (
      <div className="panel block-props-panel">
        <div className="props-empty-state">
          <span className="props-empty-icon">🎨</span>
          <h3>Properties</h3>
          <p className="muted">Select a block from the layer list or click on one in the preview to edit its properties here.</p>
        </div>
      </div>
    );
  }

  const { block_type: type, content } = block;
  const update = (partial) => onChange(block.id, partial);

  const renderColorField = (label, field, fallback, helpText) => (
    <div className="prop-color-field">
      <div className="prop-color-label-row">
        <span>{label}</span>
        {helpText && <HelpTip text={helpText} />}
      </div>
      <div className="prop-color-row">
        <input
          type="color"
          value={content[field] || fallback}
          onChange={(e) => update({ [field]: e.target.value })}
          className="color-picker-input"
        />
        <input
          type="text"
          className="prop-color-hex"
          value={content[field] || fallback}
          onChange={(e) => {
            const val = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(val)) update({ [field]: val });
          }}
          placeholder="#000000"
        />
      </div>
    </div>
  );

  const renderRangeField = (label, field, min, max, fallback, unit = "px", helpText) => (
    <div className="prop-range-field">
      <div className="prop-range-label-row">
        <span>{label}</span>
        {helpText && <HelpTip text={helpText} />}
        <span className="prop-range-value">{content[field] || fallback}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={content[field] || fallback}
        onChange={(e) => update({ [field]: Number(e.target.value) })}
        className="prop-range-input"
      />
    </div>
  );

  const renderTextField = (label, field, placeholder, helpText, multiline = false) => (
    <label className="field prop-text-field">
      <div className="prop-text-label-row">
        <span>{label}</span>
        {helpText && <HelpTip text={helpText} />}
      </div>
      {multiline ? (
        <textarea
          rows={3}
          value={content[field] || ""}
          placeholder={placeholder}
          onChange={(e) => update({ [field]: e.target.value })}
        />
      ) : (
        <input
          type="text"
          value={content[field] || ""}
          placeholder={placeholder}
          onChange={(e) => update({ [field]: e.target.value })}
        />
      )}
    </label>
  );

  const renderCheckbox = (label, field, helpText, defaultVal = true) => (
    <label className="checkbox-field prop-checkbox">
      <input
        type="checkbox"
        checked={content[field] !== undefined ? content[field] : defaultVal}
        onChange={(e) => update({ [field]: e.target.checked })}
      />
      <span>{label}</span>
      {helpText && <HelpTip text={helpText} />}
    </label>
  );

  const renderAlignmentField = (helpText) => (
    <div className="prop-alignment-field">
      <div className="prop-alignment-label-row">
        <span>Alignment</span>
        {helpText && <HelpTip text={helpText} />}
      </div>
      <div className="prop-alignment-btns">
        {["left", "center", "right"].map((a) => (
          <button
            key={a}
            type="button"
            className={`prop-align-btn ${(content.align || "center") === a ? "active" : ""}`}
            onClick={() => update({ align: a })}
            title={`Align ${a}`}
          >
            {a === "left" ? "◧" : a === "center" ? "◫" : "◨"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="panel block-props-panel">
      {/* Block header */}
      <div className="props-block-header">
        <span className="props-block-icon">{BLOCK_ICONS[type] || "▢"}</span>
        <div>
          <h3>{BLOCK_LABELS[type] || type}</h3>
          <span className="muted props-block-id">Block ID: {block.id?.slice(0, 8)}…</span>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      {type === "hero" && (
        <>
          <PropSection title="Content" helpText="Edit the main hero text that visitors see first.">
            {renderTextField("Title", "title", "Hero Title", "The main headline text.")}
            {renderTextField("Subtitle", "subtitle", "Subtitle text", "Supporting text below the headline.")}
          </PropSection>
          <PropSection title="Layout" helpText="Control how the hero section is arranged.">
            {renderAlignmentField("Controls text alignment within the hero.")}
            {renderRangeField("Padding", "padding", 16, 120, 48, "px", "Inner spacing around the hero content.")}
          </PropSection>
          <PropSection title="Colors" helpText="Customize the hero color scheme.">
            {renderColorField("Background", "backgroundColor", "#1e293b", "Hero section background.")}
            {renderColorField("Text Color", "textColor", "#ffffff", "Color of all text in the hero.")}
          </PropSection>
          <PropSection title="Background Image" helpText="Add a background image behind the hero text." defaultOpen={false}>
            <ImageUploadField
              value={content.backgroundImage || ""}
              onChange={(val) => update({ backgroundImage: val })}
              label="Background Image"
              placeholder="https://example.com/hero.jpg"
            />
            {renderRangeField("Overlay Opacity", "overlayOpacity", 0, 100, 50, "%", "Darken the image so text stays readable.")}
          </PropSection>
        </>
      )}

      {/* ═══ HEADING ═══ */}
      {type === "heading" && (
        <>
          <PropSection title="Content">
            {renderTextField("Text", "text", "Heading text", "The heading content.")}
          </PropSection>
          <PropSection title="Style" helpText="Control the heading level and appearance.">
            <div className="field">
              <div className="prop-text-label-row">
                <span>Heading Level</span>
                <HelpTip text="H1 is the largest, H4 is the smallest. Use H1 sparingly." />
              </div>
              <div className="style-row">
                {[1, 2, 3, 4].map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`style-chip ${(content.level || 2) === l ? "selected" : ""}`}
                    onClick={() => update({ level: l })}
                  >
                    H{l}
                  </button>
                ))}
              </div>
            </div>
            {renderAlignmentField("Controls the heading text alignment.")}
            {renderColorField("Text Color", "textColor", "#0f172a")}
            {renderRangeField("Font Size", "fontSize", 14, 80, 0, "px", "Override the default heading font size. Set to 0 for automatic.")}
            {renderRangeField("Letter Spacing", "letterSpacing", -5, 10, 0, "px", "Adjust spacing between letters.")}
          </PropSection>
          <PropSection title="Spacing" helpText="Control margins and padding around the heading." defaultOpen={false}>
            {renderRangeField("Top Margin", "marginTop", 0, 80, 0, "px")}
            {renderRangeField("Bottom Margin", "marginBottom", 0, 80, 0, "px")}
          </PropSection>
        </>
      )}

      {/* ═══ TEXT ═══ */}
      {type === "text" && (
        <>
          <PropSection title="Content">
            {renderTextField("Text", "text", "Your text content...", "The body text content.", true)}
          </PropSection>
          <PropSection title="Style">
            {renderAlignmentField("Controls text alignment.")}
            {renderColorField("Text Color", "textColor", "#334155")}
            {renderRangeField("Font Size", "fontSize", 12, 32, 15, "px", "Body text font size.")}
            {renderRangeField("Line Height", "lineHeight", 100, 250, 160, "%", "Space between lines of text.")}
          </PropSection>
          <PropSection title="Spacing" defaultOpen={false}>
            {renderRangeField("Top Margin", "marginTop", 0, 80, 0, "px")}
            {renderRangeField("Bottom Margin", "marginBottom", 0, 80, 0, "px")}
            {renderRangeField("Max Width", "maxWidth", 200, 1200, 0, "px", "Limit the text width. Set to 0 for full width.")}
          </PropSection>
        </>
      )}

      {/* ═══ IMAGE ═══ */}
      {type === "image" && (
        <>
          <PropSection title="Image Source" helpText="Upload an image or paste a URL. Alt text helps accessibility.">
            <ImageUploadField
              value={content.src || ""}
              onChange={(val) => update({ src: val })}
              label="Image"
              placeholder="https://example.com/image.jpg"
            />
            {renderTextField("Alt Text", "alt", "Describe the image", "Accessibility description — helps screen readers and SEO.")}
            {renderTextField("Caption", "caption", "Optional caption", "Text displayed below the image.")}
          </PropSection>
          <PropSection title="Size & Layout" helpText="Control how large the image appears.">
            <div className="field">
              <div className="prop-text-label-row">
                <span>Width</span>
                <HelpTip text="Set the image width as a percentage of its container." />
              </div>
              <div className="style-row">
                {["25%", "50%", "75%", "100%"].map((w) => (
                  <button
                    key={w}
                    type="button"
                    className={`style-chip ${(content.width || "100%") === w ? "selected" : ""}`}
                    onClick={() => update({ width: w })}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
            {renderAlignmentField("Controls image alignment.")}
            {renderRangeField("Border Radius", "borderRadius", 0, 50, 0, "px", "Round the corners of the image.")}
          </PropSection>
          <PropSection title="Effects" defaultOpen={false} helpText="Add visual effects to the image.">
            {renderRangeField("Shadow Intensity", "shadowIntensity", 0, 100, 0, "%", "Add a drop shadow behind the image.")}
            {renderRangeField("Opacity", "opacity", 10, 100, 100, "%", "Make the image partially transparent.")}
          </PropSection>
        </>
      )}

      {/* ═══ BUTTON ═══ */}
      {type === "button" && (
        <>
          <PropSection title="Content" helpText="Set the button text and where it links to.">
            {renderTextField("Button Text", "text", "Click Me", "The label displayed on the button.")}
            {renderTextField("Link URL", "url", "https://example.com", "Where the button links to.")}
          </PropSection>
          <PropSection title="Style" helpText="Customize the button appearance.">
            <div className="field">
              <div className="prop-text-label-row">
                <span>Variant</span>
                <HelpTip text="Primary buttons stand out more. Secondary buttons are more subtle." />
              </div>
              <div className="style-row">
                {["primary", "secondary", "outline", "ghost"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`style-chip ${(content.variant || "primary") === v ? "selected" : ""}`}
                    onClick={() => update({ variant: v })}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {renderAlignmentField("Controls button position.")}
            {renderColorField("Button Color", "backgroundColor", "#355dff", "The button background color.")}
            {renderColorField("Text Color", "textColor", "#ffffff", "Color of the button text.")}
            {renderRangeField("Border Radius", "borderRadius", 0, 50, 8, "px", "Round the button corners.")}
            {renderRangeField("Padding X", "paddingX", 8, 60, 28, "px", "Horizontal padding inside the button.")}
            {renderRangeField("Padding Y", "paddingY", 4, 30, 12, "px", "Vertical padding inside the button.")}
            {renderRangeField("Font Size", "fontSize", 12, 28, 15, "px", "Button text size.")}
          </PropSection>
          <PropSection title="Advanced" defaultOpen={false}>
            {renderCheckbox("Open in new tab", "openNewTab", "If enabled, the link opens in a new browser tab.", false)}
            {renderCheckbox("Full width", "fullWidth", "Make the button stretch to fill its container.", false)}
          </PropSection>
        </>
      )}

      {/* ═══ DIVIDER ═══ */}
      {type === "divider" && (
        <PropSection title="Divider Style" helpText="Customize the horizontal divider line.">
          <div className="field">
            <span>Line Style</span>
            <div className="style-row">
              {["solid", "dashed", "dotted", "double"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`style-chip ${(content.style || "solid") === s ? "selected" : ""}`}
                  onClick={() => update({ style: s })}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {renderColorField("Line Color", "color", "#e2e8f0", "Color of the divider line.")}
          {renderRangeField("Thickness", "thickness", 1, 8, 1, "px", "Line thickness.")}
          {renderRangeField("Width", "widthPercent", 10, 100, 100, "%", "How much of the container the line spans.")}
          {renderRangeField("Margin Y", "marginY", 0, 60, 8, "px", "Vertical spacing above and below.")}
        </PropSection>
      )}

      {/* ═══ SPACER ═══ */}
      {type === "spacer" && (
        <PropSection title="Spacer Size" helpText="A spacer adds empty vertical space between blocks.">
          {renderRangeField("Height", "height", 4, 200, 40, "px", "Amount of vertical empty space.")}
        </PropSection>
      )}

      {/* ═══ COLUMNS ═══ */}
      {type === "columns" && (
        <>
          <PropSection title="Layout" helpText="Control the number and arrangement of columns.">
            <div className="field">
              <div className="prop-text-label-row">
                <span>Column Count</span>
                <HelpTip text="How many columns to display side by side." />
              </div>
              <div className="style-row">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`style-chip ${(content.count || 2) === n ? "selected" : ""}`}
                    onClick={() => {
                      const items = [...(content.items || [])];
                      while (items.length < n) items.push({ heading: `Column ${items.length + 1}`, text: "Content" });
                      update({ count: n, items: items.slice(0, n) });
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {renderRangeField("Gap", "gap", 0, 48, 16, "px", "Space between columns.")}
            {renderRangeField("Padding", "padding", 0, 60, 16, "px", "Inner padding inside each column.")}
          </PropSection>
          <PropSection title="Column Content" helpText="Edit the heading and text for each column.">
            {(content.items || []).map((col, i) => (
              <div key={i} className="prop-column-item">
                <span className="prop-column-label">Column {i + 1}</span>
                <input
                  type="text"
                  value={col.heading || ""}
                  onChange={(e) => {
                    const next = [...(content.items || [])];
                    next[i] = { ...next[i], heading: e.target.value };
                    update({ items: next });
                  }}
                  placeholder="Column heading"
                  className="prop-column-input"
                />
                <textarea
                  rows={2}
                  value={col.text || ""}
                  onChange={(e) => {
                    const next = [...(content.items || [])];
                    next[i] = { ...next[i], text: e.target.value };
                    update({ items: next });
                  }}
                  placeholder="Column text"
                  className="prop-column-input"
                />
              </div>
            ))}
          </PropSection>
          <PropSection title="Colors" defaultOpen={false}>
            {renderColorField("Section Background", "backgroundColor", "#ffffff")}
            {renderColorField("Text Color", "textColor", "#0f172a")}
          </PropSection>
        </>
      )}

      {/* ═══ GALLERY ═══ */}
      {type === "gallery" && (
        <>
          <PropSection title="Grid Layout" helpText="Control how images are arranged in the gallery grid.">
            <div className="field">
              <div className="prop-text-label-row">
                <span>Columns</span>
                <HelpTip text="Number of images per row in the gallery grid." />
              </div>
              <div className="style-row">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`style-chip ${(content.columns || 3) === n ? "selected" : ""}`}
                    onClick={() => update({ columns: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {renderRangeField("Gap", "gap", 0, 24, 8, "px", "Space between images.")}
            {renderRangeField("Border Radius", "imageRadius", 0, 24, 0, "px", "Round the corners of gallery images.")}
          </PropSection>
          <PropSection title="Images" helpText="Upload images or paste URLs. Drag and drop supported.">
            {(content.images || []).map((img, i) => (
              <div key={i} className="prop-gallery-item">
                <div className="prop-gallery-item-header">
                  <span>Image {i + 1}</span>
                  <button
                    type="button"
                    className="prop-gallery-remove"
                    onClick={() => update({ images: (content.images || []).filter((_, idx) => idx !== i) })}
                  >✕</button>
                </div>
                <ImageUploadField
                  value={img.src || ""}
                  onChange={(val) => {
                    const next = [...(content.images || [])];
                    next[i] = { ...next[i], src: val };
                    update({ images: next });
                  }}
                  label=""
                  placeholder="Image URL"
                  compact
                />
                <input
                  type="text"
                  value={img.caption || ""}
                  onChange={(e) => {
                    const next = [...(content.images || [])];
                    next[i] = { ...next[i], caption: e.target.value };
                    update({ images: next });
                  }}
                  placeholder="Caption (optional)"
                  className="prop-column-input"
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => update({ images: [...(content.images || []), { src: "", alt: "", caption: "" }] })}
              style={{ marginTop: 4 }}
            >
              + Add Image
            </button>
          </PropSection>
        </>
      )}

      {/* ═══ SERVICES LIST ═══ */}
      {type === "services_list" && (
        <>
          <PropSection title="Content" helpText="Edit the heading and control what info is shown for each service.">
            {renderTextField("Section Heading", "heading", "Our Services", "The heading above the service list.")}
          </PropSection>
          <PropSection title="Display Options" helpText="Choose which service details to show on the page.">
            <div className="field">
              <div className="prop-text-label-row">
                <span>Display Columns</span>
                <HelpTip text="How many service cards per row." />
              </div>
              <div className="style-row">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`style-chip ${(content.columns || 2) === n ? "selected" : ""}`}
                    onClick={() => update({ columns: n })}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            {renderCheckbox("Show Prices", "show_price", "Display the service price on each card.", true)}
            {renderCheckbox("Show Duration", "show_duration", "Display how long the service takes.", true)}
            {renderCheckbox("Show Description", "show_description", "Display the service description text.", true)}
            {renderCheckbox("Show Book Button", "show_book_button", "Add a booking button to each service card.", false)}
          </PropSection>
          <PropSection title="Colors" helpText="Customize the section color scheme.">
            {renderColorField("Section Background", "backgroundColor", "#ffffff", "Background behind all service cards.")}
            {renderColorField("Text Color", "textColor", "#0f172a", "Color of all text in this section.")}
            {renderColorField("Card Background", "cardBackground", "#f8fafc", "Background of individual service cards.")}
          </PropSection>
          <PropSection title="Card Style" defaultOpen={false}>
            {renderRangeField("Border Radius", "cardRadius", 0, 24, 8, "px", "Round the corners of service cards.")}
            {renderRangeField("Card Padding", "cardPadding", 8, 40, 16, "px", "Inner spacing inside each card.")}
          </PropSection>
        </>
      )}

      {/* ═══ CONTACT FORM ═══ */}
      {type === "contact_form" && (
        <>
          <PropSection title="Content" helpText="Set the form heading, subtitle, and button text.">
            {renderTextField("Heading", "heading", "Get in Touch", "The heading above the form.")}
            {renderTextField("Subtitle", "subtitle", "Fill out the form...", "Supporting text below the heading.")}
            {renderTextField("Button Text", "button_text", "Send Message", "Text on the submit button.")}
            {renderTextField("Success Message", "success_message", "Thank you!", "Shown after the form is submitted.")}
          </PropSection>
          <PropSection title="Form Fields" helpText="Toggle which fields appear in the contact form.">
            {renderCheckbox("Service Picker", "show_service_picker", "Let users pick a service from a dropdown.", true)}
            {renderCheckbox("Vehicle Info Field", "show_vehicle_field", "Ask for vehicle make, model, and year.", true)}
            {renderCheckbox("Preferred Date", "show_preferred_date", "Let users pick their preferred appointment date.", true)}
            {renderCheckbox("Phone Field", "show_phone", "Show a phone number input.", true)}
            {renderCheckbox("File Upload", "show_file_upload", "Allow users to attach photos (e.g. for quotes).", false)}
          </PropSection>
          <PropSection title="Colors" defaultOpen={false}>
            {renderColorField("Section Background", "backgroundColor", "#ffffff")}
            {renderColorField("Text Color", "textColor", "#0f172a")}
            {renderColorField("Button Color", "buttonColor", "#355dff", "Submit button background color.")}
          </PropSection>
        </>
      )}

      {/* ═══ VIDEO ═══ */}
      {type === "video" && (
        <>
          <PropSection title="Video Source" helpText="Paste a YouTube or Vimeo URL to embed a video.">
            {renderTextField("Video URL", "url", "https://youtube.com/watch?v=...", "Supports YouTube and Vimeo links.")}
            {renderTextField("Caption", "caption", "Optional caption", "Text displayed below the video.")}
          </PropSection>
          <PropSection title="Player Options" defaultOpen={false}>
            {renderCheckbox("Autoplay", "autoplay", "Automatically start playing when visible.", false)}
            {renderCheckbox("Loop", "loop", "Restart the video when it ends.", false)}
            {renderCheckbox("Muted", "muted", "Start with sound muted (required for autoplay).", false)}
            {renderRangeField("Aspect Ratio Height", "aspectHeight", 40, 80, 56, "%", "Controls the video player height ratio.")}
          </PropSection>
        </>
      )}

      {/* ═══ MAP ═══ */}
      {type === "map" && (
        <PropSection title="Map Settings" helpText="Embed a Google Maps location. Get your embed URL from Google Maps → Share → Embed.">
          {renderTextField("Embed URL", "embed_url", "https://www.google.com/maps/embed?...", "Paste the iframe src URL from Google Maps.")}
          {renderRangeField("Height", "height", 150, 800, 400, "px", "How tall the map should be.")}
          {renderRangeField("Border Radius", "borderRadius", 0, 24, 0, "px", "Round the map corners.")}
        </PropSection>
      )}
    </div>
  );
}
