import { templateOptions } from "../hooks/useCardForm";

export default function TemplatePicker({ selected, onChange }) {
  return (
    <fieldset className="fieldset">
      <legend>Template (5 options)</legend>
      <div className="template-grid">
        {templateOptions.map((template) => (
          <label key={template} className="template-option">
            <input
              type="radio"
              name="template"
              value={template}
              checked={selected === template}
              onChange={(event) => onChange(event.target.value)}
            />
            <span>{template.replace("template-", "Template ").toUpperCase()}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
