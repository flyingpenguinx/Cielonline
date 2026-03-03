import { useState } from "react";
import { colorOptions } from "../hooks/useCardForm";
import TemplatePicker from "./TemplatePicker";

const essentialFields = [
  { key: "full_name", label: "Full name", required: true },
  { key: "slug", label: "Public card slug", required: true, placeholder: "john-smith" },
  { key: "title", label: "Job title" },
  { key: "company", label: "Company" },
];

const contactFields = [
  { key: "phone_1", label: "Phone #1" },
  { key: "phone_2", label: "Phone #2" },
  { key: "email_1", label: "Email #1" },
  { key: "email_2", label: "Email #2" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
];

const socialFields = [
  { key: "avatar_url", label: "Profile image URL" },
  { key: "instagram_url", label: "Instagram URL" },
  { key: "linkedin_url", label: "LinkedIn URL" },
];

const ChevronDown = () => (
  <svg className="form-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function FormSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`form-section ${open ? "open" : ""}`}>
      <button type="button" className="form-section-header" onClick={() => setOpen(!open)}>
        {title}
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
  );
}

export default function CardBuilderForm({ card, onChange, onSubmit, saving }) {
  return (
    <form className="builder-panel" onSubmit={onSubmit}>
      <h2>Create or update your card</h2>
      <p className="muted">Fields marked * are required. Users can save directly to Contacts via vCard.</p>

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

      {/* Collapsible sections to reduce scrolling */}
      <FormSection title="Contact Details" defaultOpen={false}>
        <FieldGroup fields={contactFields} card={card} onChange={onChange} />
      </FormSection>

      <FormSection title="Social & Media" defaultOpen={false}>
        <FieldGroup fields={socialFields} card={card} onChange={onChange} />
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

      <FormSection title="Template & Color" defaultOpen={false}>
        <TemplatePicker selected={card.template_key} onChange={(value) => onChange("template_key", value)} />
        <fieldset className="fieldset">
          <legend>Background color</legend>
          <div className="color-row">
            {colorOptions.map((color) => (
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
        </fieldset>
      </FormSection>

      <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: 4 }}>
        {saving ? "Saving..." : "Save card"}
      </button>
    </form>
  );
}
