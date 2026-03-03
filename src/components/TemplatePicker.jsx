import { templateOptions } from "../hooks/useCardForm";

export default function TemplatePicker({ selected, onChange }) {
  return (
    <fieldset className="fieldset">
      <legend>Template layout</legend>
      <div className="template-grid">
        {templateOptions.map((t) => (
          <label key={t.key} className={`template-option ${selected === t.key ? "selected" : ""}`}>
            <input
              type="radio"
              name="template"
              value={t.key}
              checked={selected === t.key}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="template-icon">{t.icon}</span>
            <span className="template-label">{t.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
