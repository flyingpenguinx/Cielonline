import { useState } from "react";
import { presetColors, cardStyleOptions } from "../hooks/useCardForm";
import TemplatePicker from "./TemplatePicker";

/* ── Layer definitions ── */
const CARD_LAYERS = [
  { id: "identity", label: "Identity", icon: "👤", help: "Name, job title, company — the core header of your card." },
  { id: "avatar", label: "Avatar", icon: "🖼️", help: "Profile photo or initials circle shown on the card." },
  { id: "bio", label: "Bio & Tagline", icon: "📝", help: "Short bio paragraph and tagline / motto text." },
  { id: "contact", label: "Contact Info", icon: "📞", help: "Phone numbers, emails, website, and address." },
  { id: "social", label: "Social Links", icon: "🔗", help: "Instagram, LinkedIn, Facebook, X, TikTok, YouTube, GitHub." },
  { id: "branding", label: "Branding", icon: "🎨", help: "Logo display, QR code on card, and brand toggles." },
  { id: "template", label: "Template", icon: "📐", help: "Choose a layout template for your card." },
  { id: "style", label: "Style & Colors", icon: "🎭", help: "Card style, background/text colors, font, corners." },
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

/* ── Shared small components ── */
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
);

function HelpTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="help-tip-wrap" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="help-tip-icon">?</span>
      {show && <span className="help-tip-bubble">{text}</span>}
    </span>
  );
}

function PropSection({ title, defaultOpen = true, help, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`prop-section ${open ? "open" : ""}`}>
      <button type="button" className="prop-section-header" onClick={() => setOpen(!open)}>
        <span className="prop-section-title">{title}{help && <HelpTip text={help} />}</span>
        <ChevronDown />
      </button>
      {open && <div className="prop-section-body">{children}</div>}
    </div>
  );
}

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

/* ── Per-layer property panels ── */
function IdentityProps({ card, onChange }) {
  return (
    <>
      <PropSection title="Name & Title" help="These fields appear in the card header.">
        <label className="prop-field"><span className="prop-label">Full name *</span>
          <input required value={card.full_name ?? ""} placeholder="John Smith" onChange={(e) => onChange("full_name", e.target.value)} />
        </label>
        <label className="prop-field"><span className="prop-label">Card slug *</span>
          <input required value={card.slug ?? ""} placeholder="john-smith" onChange={(e) => onChange("slug", e.target.value)} />
        </label>
        <label className="prop-field"><span className="prop-label">Job title</span>
          <input value={card.title ?? ""} placeholder="e.g. Marketing Director" onChange={(e) => onChange("title", e.target.value)} />
        </label>
        <label className="prop-field"><span className="prop-label">Company</span>
          <input value={card.company ?? ""} placeholder="e.g. Acme Inc" onChange={(e) => onChange("company", e.target.value)} />
        </label>
      </PropSection>
    </>
  );
}

function AvatarProps({ card, onChange }) {
  return (
    <PropSection title="Profile Image" help="URL to a photo. If empty, initials are shown instead.">
      <label className="prop-field"><span className="prop-label">Avatar URL</span>
        <input value={card.avatar_url ?? ""} placeholder="https://example.com/photo.jpg" onChange={(e) => onChange("avatar_url", e.target.value)} />
      </label>
      {card.avatar_url && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <img src={card.avatar_url} alt="preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)" }} />
        </div>
      )}
    </PropSection>
  );
}

function BioProps({ card, onChange }) {
  return (
    <>
      <PropSection title="Bio" help="A short paragraph describing you or your business.">
        <label className="prop-field"><span className="prop-label">Short bio</span>
          <textarea rows={3} value={card.bio ?? ""} placeholder="A short description about you..." onChange={(e) => onChange("bio", e.target.value)} />
        </label>
      </PropSection>
      <PropSection title="Tagline" help="A catchy single-line motto displayed on the card.">
        <label className="prop-field"><span className="prop-label">Tagline / Motto</span>
          <input value={card.tagline ?? ""} placeholder="e.g. Quality work, every time." onChange={(e) => onChange("tagline", e.target.value)} />
        </label>
      </PropSection>
    </>
  );
}

function ContactProps({ card, onChange }) {
  const fields = [
    { key: "phone_1", label: "Phone #1", placeholder: "(555) 123-4567" },
    { key: "phone_2", label: "Phone #2", placeholder: "Optional second number" },
    { key: "email_1", label: "Email #1", placeholder: "you@company.com" },
    { key: "email_2", label: "Email #2", placeholder: "Optional second email" },
    { key: "website", label: "Website", placeholder: "https://yoursite.com" },
    { key: "address", label: "Address", placeholder: "City, State" },
  ];
  return (
    <PropSection title="Contact Details" help="Phone numbers, emails, website, and address shown on the card.">
      {fields.map((f) => (
        <label key={f.key} className="prop-field"><span className="prop-label">{f.label}</span>
          <input value={card[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
        </label>
      ))}
    </PropSection>
  );
}

function SocialProps({ card, onChange }) {
  const linked = socialFields.filter((f) => card[f.key]).length;
  return (
    <PropSection title={`Social Media (${linked} linked)`} help="Add your social media profile URLs.">
      {socialFields.map((f) => (
        <label key={f.key} className="prop-field"><span className="prop-label">{f.icon} {f.label}</span>
          <input value={card[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} />
        </label>
      ))}
    </PropSection>
  );
}

function BrandingProps({ card, onChange }) {
  return (
    <PropSection title="Branding" help="Logo and QR code display options.">
      <label className="prop-checkbox"><input type="checkbox" checked={card.show_logo || false} onChange={(e) => onChange("show_logo", e.target.checked)} /><span>Show company logo</span></label>
      {card.show_logo && (
        <label className="prop-field"><span className="prop-label">Logo URL</span>
          <input value={card.logo_url ?? ""} placeholder="https://example.com/logo.png" onChange={(e) => onChange("logo_url", e.target.value)} />
        </label>
      )}
      <label className="prop-checkbox"><input type="checkbox" checked={card.show_qr_on_card || false} onChange={(e) => onChange("show_qr_on_card", e.target.checked)} /><span>Show QR code on card</span></label>
    </PropSection>
  );
}

function TemplateProps({ card, onChange }) {
  return (
    <PropSection title="Card Template" help="Choose the overall layout of your card.">
      <TemplatePicker selected={card.template_key} onChange={(v) => onChange("template_key", v)} />
    </PropSection>
  );
}

function StyleProps({ card, onChange }) {
  return (
    <>
      <PropSection title="Card Style" help="Visual treatment applied to the card surface.">
        <div className="prop-chip-row">
          {cardStyleOptions.map((s) => (
            <button key={s.key} type="button" className={`prop-chip ${card.card_style === s.key ? "active" : ""}`} onClick={() => onChange("card_style", s.key)}>{s.label}</button>
          ))}
        </div>
      </PropSection>

      <PropSection title="Colors" help="Background and text colors for the card.">
        <ColorField label="Background" value={card.background_color} onChange={(v) => onChange("background_color", v)} presets={presetColors} />
        <ColorField label="Text color" value={card.text_color || "#0f172a"} onChange={(v) => onChange("text_color", v)} />
      </PropSection>

      <PropSection title="Typography" help="Font family used across the card text.">
        <div className="prop-chip-row">
          {[{ key: "default", label: "Default" }, { key: "serif", label: "Serif" }, { key: "mono", label: "Mono" }, { key: "rounded", label: "Rounded" }].map((f) => (
            <button key={f.key} type="button" className={`prop-chip ${(card.font_style || "default") === f.key ? "active" : ""}`} onClick={() => onChange("font_style", f.key)}>{f.label}</button>
          ))}
        </div>
      </PropSection>

      <PropSection title="Corners" help="Controls the border-radius of the card and inner elements.">
        <div className="prop-chip-row">
          {[{ key: "sharp", label: "Sharp" }, { key: "rounded", label: "Rounded" }, { key: "pill", label: "Pill" }].map((r) => (
            <button key={r.key} type="button" className={`prop-chip ${(card.border_radius || "rounded") === r.key ? "active" : ""}`} onClick={() => onChange("border_radius", r.key)}>{r.label}</button>
          ))}
        </div>
      </PropSection>
    </>
  );
}

/* ── Layer property router ── */
function LayerProperties({ layerId, card, onChange }) {
  switch (layerId) {
    case "identity": return <IdentityProps card={card} onChange={onChange} />;
    case "avatar": return <AvatarProps card={card} onChange={onChange} />;
    case "bio": return <BioProps card={card} onChange={onChange} />;
    case "contact": return <ContactProps card={card} onChange={onChange} />;
    case "social": return <SocialProps card={card} onChange={onChange} />;
    case "branding": return <BrandingProps card={card} onChange={onChange} />;
    case "template": return <TemplateProps card={card} onChange={onChange} />;
    case "style": return <StyleProps card={card} onChange={onChange} />;
    default: return <p className="muted" style={{ padding: 12 }}>Select a layer to edit its properties.</p>;
  }
}

/* ── Main component ── */
export default function CardBuilderForm({ card, onChange, onSubmit, saving }) {
  const [activeLayer, setActiveLayer] = useState("identity");

  return (
    <form className="card-builder-layout" onSubmit={onSubmit}>
      {/* ─── Layer list (left) ─── */}
      <div className="card-layer-sidebar">
        <div className="card-layer-header">
          <h3>Layers</h3>
          <p className="muted">Select a layer to edit</p>
        </div>
        <div className="card-layer-list">
          {CARD_LAYERS.map((layer) => (
            <button
              key={layer.id}
              type="button"
              className={`card-layer-item ${activeLayer === layer.id ? "active" : ""}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <span className="card-layer-icon">{layer.icon}</span>
              <span className="card-layer-label">{layer.label}</span>
              <HelpTip text={layer.help} />
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-save-card" type="submit" disabled={saving} style={{ marginTop: "auto" }}>
          {saving ? "Saving..." : "Save card"}
        </button>
      </div>

      {/* ─── Properties panel (right) ─── */}
      <div className="card-props-panel">
        <div className="card-props-header">
          <h3>{CARD_LAYERS.find((l) => l.id === activeLayer)?.icon} {CARD_LAYERS.find((l) => l.id === activeLayer)?.label}</h3>
        </div>
        <div className="card-props-body">
          <LayerProperties layerId={activeLayer} card={card} onChange={onChange} />
        </div>
      </div>
    </form>
  );
}
