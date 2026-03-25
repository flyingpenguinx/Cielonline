import { useState, useRef, useCallback } from "react";
import { presetColors, cardStyleOptions, templateOptions } from "../hooks/useCardForm";
import TemplatePicker from "./TemplatePicker";
import ImageUploadField from "./ImageUploadField";

/* ── Section definitions (default order) ── */
const DEFAULT_SECTIONS = [
  { id: "identity", label: "Identity", icon: "👤" },
  { id: "avatar", label: "Avatar", icon: "🖼️" },
  { id: "bio", label: "Bio & Tagline", icon: "📝" },
  { id: "contact", label: "Contact Info", icon: "📞" },
  { id: "social", label: "Social Links", icon: "🔗" },
  { id: "branding", label: "Branding", icon: "🎨" },
];

const socialFields = [
  { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/you", icon: "📸" },
  { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/you", icon: "💼" },
  { key: "facebook_url", label: "Facebook", placeholder: "https://facebook.com/you", icon: "👤" },
  { key: "twitter_url", label: "X / Twitter", placeholder: "https://x.com/you", icon: "🐦" },
  { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@you", icon: "🎵" },
  { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@you", icon: "▶️" },
  { key: "github_url", label: "GitHub", placeholder: "https://github.com/you", icon: "🐙" },
];

/* ── Small icons ── */
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);
const GripIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
);

/* ── Color picker ── */
function ColorField({ label, value, onChange, presets }) {
  return (
    <div className="prop-color-field">
      <span className="prop-label">{label}</span>
      <div className="prop-color-row">
        <input type="color" value={value || "#355dff"} onChange={(e) => onChange(e.target.value)} className="prop-color-swatch" />
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className="prop-color-hex" placeholder="#000000" />
      </div>
      {presets && (
        <div className="prop-color-presets">
          {presets.map((c) => (
            <button key={c} type="button" className={`prop-color-dot ${value === c ? "active" : ""}`} style={{ background: c }} onClick={() => onChange(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   SECTION CONTENT RENDERERS
   ═══════════════════════════════════════ */

function IdentitySection({ card, onChange }) {
  return (
    <div className="section-fields">
      <label className="prop-field"><span className="prop-label">Full name *</span>
        <input required value={card.full_name ?? ""} placeholder="John Smith" onChange={(e) => onChange("full_name", e.target.value)} />
      </label>
      <label className="prop-field"><span className="prop-label">Card slug *</span>
        <input required value={card.slug ?? ""} placeholder="john-smith" onChange={(e) => onChange("slug", e.target.value)} />
      </label>
      <div className="section-fields-row">
        <label className="prop-field"><span className="prop-label">Job title</span>
          <input value={card.title ?? ""} placeholder="e.g. Marketing Director" onChange={(e) => onChange("title", e.target.value)} />
        </label>
        <label className="prop-field"><span className="prop-label">Company</span>
          <input value={card.company ?? ""} placeholder="e.g. Acme Inc" onChange={(e) => onChange("company", e.target.value)} />
        </label>
      </div>
    </div>
  );
}

function AvatarSection({ card, onChange }) {
  return (
    <div className="section-fields">
      <ImageUploadField
        value={card.avatar_url ?? ""}
        onChange={(val) => onChange("avatar_url", val)}
        label="Profile Photo"
        placeholder="https://example.com/photo.jpg"
      />
    </div>
  );
}

function BioSection({ card, onChange }) {
  return (
    <div className="section-fields">
      <label className="prop-field"><span className="prop-label">Short bio</span>
        <textarea rows={3} value={card.bio ?? ""} placeholder="A short description about you..." onChange={(e) => onChange("bio", e.target.value)} />
      </label>
      <label className="prop-field"><span className="prop-label">Tagline / Motto</span>
        <input value={card.tagline ?? ""} placeholder="e.g. Quality work, every time." onChange={(e) => onChange("tagline", e.target.value)} />
      </label>
    </div>
  );
}

function ContactSection({ card, onChange }) {
  const fields = [
    { key: "phone_1", label: "Phone #1", placeholder: "(555) 123-4567" },
    { key: "phone_2", label: "Phone #2", placeholder: "Optional second number" },
    { key: "email_1", label: "Email #1", placeholder: "you@company.com" },
    { key: "email_2", label: "Email #2", placeholder: "Optional second email" },
    { key: "website", label: "Website", placeholder: "https://yoursite.com" },
    { key: "address", label: "Address", placeholder: "City, State" },
  ];
  return (
    <div className="section-fields">
      <div className="section-fields-grid">
        {fields.map((f) => (
          <label key={f.key} className="prop-field"><span className="prop-label">{f.label}</span>
            <input value={card[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
          </label>
        ))}
      </div>
    </div>
  );
}

function SocialSection({ card, onChange }) {
  const linked = socialFields.filter((f) => card[f.key]).length;
  return (
    <div className="section-fields">
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>{linked} linked</p>
      <div className="section-fields-grid">
        {socialFields.map((f) => (
          <label key={f.key} className="prop-field"><span className="prop-label">{f.icon} {f.label}</span>
            <input value={card[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
          </label>
        ))}
      </div>
    </div>
  );
}

function BrandingSection({ card, onChange }) {
  return (
    <div className="section-fields">
      <label className="prop-checkbox"><input type="checkbox" checked={card.show_logo || false} onChange={(e) => onChange("show_logo", e.target.checked)} /><span>Show company logo</span></label>
      {card.show_logo && (
        <ImageUploadField
          value={card.logo_url ?? ""}
          onChange={(val) => onChange("logo_url", val)}
          label="Logo"
          placeholder="https://example.com/logo.png"
          compact
        />
      )}
      <label className="prop-checkbox"><input type="checkbox" checked={card.show_qr_on_card || false} onChange={(e) => onChange("show_qr_on_card", e.target.checked)} /><span>Show QR code on card</span></label>
    </div>
  );
}

function renderSection(id, card, onChange) {
  switch (id) {
    case "identity": return <IdentitySection card={card} onChange={onChange} />;
    case "avatar": return <AvatarSection card={card} onChange={onChange} />;
    case "bio": return <BioSection card={card} onChange={onChange} />;
    case "contact": return <ContactSection card={card} onChange={onChange} />;
    case "social": return <SocialSection card={card} onChange={onChange} />;
    case "branding": return <BrandingSection card={card} onChange={onChange} />;
    default: return null;
  }
}

/* ═══════════════════════════════════════
   ACCORDION BLOCK (with drag handle)
   ═══════════════════════════════════════ */
function AccordionBlock({ section, open, onToggle, card, onChange, onDragStart, onDragOver, onDrop, onDragEnd }) {
  return (
    <div
      className={`cb-accordion ${open ? "open" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <button type="button" className="cb-accordion-header" onClick={onToggle}>
        <span className="cb-grip" onMouseDown={(e) => e.stopPropagation()} title="Drag to reorder"><GripIcon /></span>
        <span className="cb-accordion-icon">{section.icon}</span>
        <span className="cb-accordion-label">{section.label}</span>
        <span className={`cb-accordion-chevron ${open ? "rotated" : ""}`}><ChevronDown /></span>
      </button>
      {open && (
        <div className="cb-accordion-body">
          {renderSection(section.id, card, onChange)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN FORM COMPONENT
   ═══════════════════════════════════════ */
export default function CardBuilderForm({ card, onChange, onSubmit, saving }) {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [openSections, setOpenSections] = useState({ identity: true });
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  /* ── Drag reorder ── */
  const handleDragStart = useCallback((idx) => { dragItem.current = idx; }, []);

  const handleDragOver = useCallback((e, idx) => {
    e.preventDefault();
    dragOverItem.current = idx;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === to) return;
    setSections((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  return (
    <form className="cb-form" onSubmit={onSubmit}>
      {/* ─── Quick-access style toolbar ─── */}
      <div className="cb-style-bar">
        <div className="cb-style-section">
          <span className="cb-style-label">Template</span>
          <div className="cb-style-chips">
            {templateOptions.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`cb-mini-chip ${card.template_key === t.key ? "active" : ""}`}
                onClick={() => onChange("template_key", t.key)}
                title={t.label}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-style-divider" />

        <div className="cb-style-section">
          <span className="cb-style-label">Style</span>
          <div className="cb-style-chips">
            {cardStyleOptions.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`cb-mini-chip ${card.card_style === s.key ? "active" : ""}`}
                onClick={() => onChange("card_style", s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-style-divider" />

        <div className="cb-style-section">
          <span className="cb-style-label">Color</span>
          <div className="cb-color-dots">
            {presetColors.slice(0, 8).map((c) => (
              <button
                key={c}
                type="button"
                className={`cb-color-dot ${card.background_color === c ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => onChange("background_color", c)}
              />
            ))}
            <input
              type="color"
              className="cb-color-picker"
              value={card.background_color || "#355dff"}
              onChange={(e) => onChange("background_color", e.target.value)}
              title="Custom color"
            />
          </div>
        </div>
      </div>

      {/* ─── Accordion sections ─── */}
      <div className="cb-sections">
        {sections.map((section, idx) => (
          <AccordionBlock
            key={section.id}
            section={section}
            open={!!openSections[section.id]}
            onToggle={() => toggleSection(section.id)}
            card={card}
            onChange={onChange}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* ─── Advanced style (collapsible) ─── */}
      <details className="cb-advanced">
        <summary className="cb-advanced-summary">🎭 Advanced Style Options</summary>
        <div className="cb-advanced-body">
          <ColorField label="Background" value={card.background_color} onChange={(v) => onChange("background_color", v)} presets={presetColors} />
          <ColorField label="Text color" value={card.text_color || "#0f172a"} onChange={(v) => onChange("text_color", v)} />

          <div className="cb-style-section">
            <span className="cb-style-label">Font</span>
            <div className="cb-style-chips">
              {[{ key: "default", label: "Default" }, { key: "serif", label: "Serif" }, { key: "mono", label: "Mono" }, { key: "rounded", label: "Rounded" }].map((f) => (
                <button key={f.key} type="button" className={`cb-mini-chip ${(card.font_style || "default") === f.key ? "active" : ""}`} onClick={() => onChange("font_style", f.key)}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="cb-style-section">
            <span className="cb-style-label">Corners</span>
            <div className="cb-style-chips">
              {[{ key: "sharp", label: "Sharp" }, { key: "rounded", label: "Rounded" }, { key: "pill", label: "Pill" }].map((r) => (
                <button key={r.key} type="button" className={`cb-mini-chip ${(card.border_radius || "rounded") === r.key ? "active" : ""}`} onClick={() => onChange("border_radius", r.key)}>{r.label}</button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* ─── Save button ─── */}
      <button className="btn btn-primary cb-save-btn" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Card"}
      </button>
    </form>
  );
}
