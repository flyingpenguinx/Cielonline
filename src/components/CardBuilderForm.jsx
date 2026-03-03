import { useState } from "react";
import { presetColors, cardStyleOptions } from "../hooks/useCardForm";
import TemplatePicker from "./TemplatePicker";

const essentialFields = [
  { key: "full_name", label: "Full name", required: true },
  { key: "slug", label: "Public card slug", required: true, placeholder: "john-smith" },
  { key: "title", label: "Job title", placeholder: "e.g. Marketing Director" },
  { key: "company", label: "Company", placeholder: "e.g. Acme Inc" },
];

const contactFields = [
  { key: "phone_1", label: "Phone #1", placeholder: "(555) 123-4567" },
  { key: "phone_2", label: "Phone #2", placeholder: "Optional second number" },
  { key: "email_1", label: "Email #1", placeholder: "you@company.com" },
  { key: "email_2", label: "Email #2", placeholder: "Optional second email" },
  { key: "website", label: "Website", placeholder: "https://yoursite.com" },
  { key: "address", label: "Address", placeholder: "City, State" },
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

const ChevronDown = () => (
  <svg className="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function FormSection({ title, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`form-section ${open ? "open" : ""}`}>
      <button type="button" className="form-section-header" onClick={() => setOpen(!open)}>
        <span className="form-section-title-row">
          {title}
          {badge && <span className="form-section-badge">{badge}</span>}
        </span>
        <ChevronDown />
      </button>
      {open && <div className="form-section-body">{children}</div>}
    </div>
  );
}

function FieldGroup({ fields, card, onChange }) {
  return (
    <div className="form-grid">
      {fields.map((field) => (
        <label key={field.key} className="field">
          <span>
            {field.icon && <span className="field-icon">{field.icon}</span>}
            {field.label}
            {field.required ? " *" : ""}
          </span>
          <input
            required={Boolean(field.required)}
            value={card[field.key] ?? ""}
            placeholder={field.placeholder ?? ""}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

export default function CardBuilderForm({ card, onChange, onSubmit, saving }) {
  return (
    <form className="builder-panel" onSubmit={onSubmit}>
      <h2>Create or update your card</h2>
      <p className="muted">Only name and slug are required. Fill in as much or as little as you want.</p>

      {/* Essential fields always visible */}
      <div className="form-grid">
        {essentialFields.map((field) => (
          <label key={field.key} className="field">
            <span>{field.label}{field.required ? " *" : ""}</span>
            <input
              required={Boolean(field.required)}
              value={card[field.key] ?? ""}
              placeholder={field.placeholder ?? ""}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      {/* Collapsible sections */}
      <FormSection title="Contact Details" defaultOpen={false} badge="optional">
        <FieldGroup fields={contactFields} card={card} onChange={onChange} />
      </FormSection>

      <FormSection title="Social Media" defaultOpen={false} badge={`${socialFields.filter(f => card[f.key]).length} linked`}>
        <FieldGroup fields={socialFields} card={card} onChange={onChange} />
      </FormSection>

      <FormSection title="Profile & Bio" defaultOpen={false}>
        <label className="field">
          <span>Profile image URL</span>
          <input
            value={card.avatar_url ?? ""}
            placeholder="https://example.com/photo.jpg"
            onChange={(event) => onChange("avatar_url", event.target.value)}
          />
        </label>
        <label className="field field-full">
          <span>Short bio</span>
          <textarea
            rows={2}
            value={card.bio ?? ""}
            placeholder="A short tagline or description..."
            onChange={(event) => onChange("bio", event.target.value)}
          />
        </label>
      </FormSection>

      <FormSection title="Template & Style" defaultOpen={false}>
        <TemplatePicker selected={card.template_key} onChange={(value) => onChange("template_key", value)} />

        {/* Card style selector */}
        <fieldset className="fieldset">
          <legend>Card style</legend>
          <div className="style-row">
            {cardStyleOptions.map((style) => (
              <button
                key={style.key}
                type="button"
                className={`style-chip ${card.card_style === style.key ? "selected" : ""}`}
                onClick={() => onChange("card_style", style.key)}
              >
                {style.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Color picker + presets */}
        <fieldset className="fieldset">
          <legend>Background color</legend>
          <div className="color-picker-row">
            <div className="color-presets">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-dot ${card.background_color === color ? "selected" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => onChange("background_color", color)}
                  aria-label={`Choose ${color}`}
                />
              ))}
            </div>
            <div className="color-custom">
              <label className="color-picker-label">
                <span>Custom</span>
                <input
                  type="color"
                  value={card.background_color || "#355dff"}
                  onChange={(event) => onChange("background_color", event.target.value)}
                  className="color-picker-input"
                />
              </label>
              <span className="color-hex-value">{card.background_color}</span>
            </div>
          </div>
        </fieldset>
      </FormSection>

      <button className="btn btn-primary btn-save-card" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save card"}
      </button>
    </form>
  );
}
