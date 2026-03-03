import { colorOptions } from "../hooks/useCardForm";
import TemplatePicker from "./TemplatePicker";

const fields = [
  { key: "full_name", label: "Full name", required: true },
  { key: "slug", label: "Public card slug", required: true, placeholder: "john-smith" },
  { key: "title", label: "Job title" },
  { key: "company", label: "Company" },
  { key: "website", label: "Website" },
  { key: "avatar_url", label: "Profile image URL (optional)" },
  { key: "phone_1", label: "Phone #1 (optional)" },
  { key: "phone_2", label: "Phone #2 (optional)" },
  { key: "email_1", label: "Email #1 (optional)" },
  { key: "email_2", label: "Email #2 (optional)" },
  { key: "address", label: "Address (optional)" },
  { key: "instagram_url", label: "Instagram URL (optional)" },
  { key: "linkedin_url", label: "LinkedIn URL (optional)" }
];

export default function CardBuilderForm({ card, onChange, onSubmit, saving }) {
  return (
    <form className="builder-panel" onSubmit={onSubmit}>
      <h2>Create or update your card</h2>
      <p className="muted">Fields are optional unless marked. Users can save directly to Contacts on iPhone or Android via vCard.</p>

      <div className="form-grid">
        {fields.map((field) => (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <input
              required={Boolean(field.required)}
              value={card[field.key] ?? ""}
              placeholder={field.placeholder ?? ""}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </label>
        ))}

        <label className="field field-full">
          <span>Short bio (optional)</span>
          <textarea
            rows={3}
            value={card.bio ?? ""}
            onChange={(event) => onChange("bio", event.target.value)}
          />
        </label>
      </div>

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

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save card"}
      </button>
    </form>
  );
}
