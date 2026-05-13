import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import CardPreview from "../components/CardPreview";
import PhoneFrame from "../components/PhoneFrame";
import { presetColors, templateOptions } from "../hooks/useCardForm";

const initialCard = {
  full_name: "Carlos Leon",
  slug: "carlos-leon",
  title: "Owner & Founder",
  company: "Cielonline",
  bio: "Helping businesses share contact info with branded QR experiences.",
  website: "https://cielonline.com",
  avatar_url: "",
  template_key: "template-c",
  card_style: "glass",
  background_color: "#355dff",
  phone_1: "+1 (555) 123-4500",
  phone_2: "",
  email_1: "hello@cielonline.com",
  email_2: "",
  address: "Sacramento, CA",
  instagram_url: "https://instagram.com/cielonline",
  linkedin_url: "https://linkedin.com/in/carlosleon",
  facebook_url: "",
  twitter_url: "",
  tiktok_url: "",
  youtube_url: "",
  github_url: "",
};

export default function DashboardPage() {
  const [card, setCard] = useState(initialCard);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const previewCard = useMemo(() => ({
    ...card,
    slug: (card.full_name || "cielonline-card")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "cielonline-card",
  }), [card]);

  const updateCard = (key, value) => {
    setCard((current) => ({ ...current, [key]: value }));
  };

  const qrPayload = useMemo(() => {
    const origin = typeof window === "undefined" ? "https://cielonline.com" : window.location.origin;
    return `${origin}/c/${previewCard.slug}`;
  }, [previewCard.slug]);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload, {
      width: 360,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => { if (active) setQrDataUrl(""); });

    return () => { active = false; };
  }, [qrPayload]);

  return (
    <main className="container main-space fade-in light-designer-page">
      <section className="light-designer-hero panel">
        <div>
          <p className="section-kicker">Starter card designer</p>
          <h1>Try the business card layout tool before building a QR code.</h1>
          <p className="muted">
            Adjust the essentials, choose a layout, and preview the mobile card customers can open after scanning your QR code.
          </p>
        </div>
      </section>

      <section className="light-designer-grid">
        <div className="builder-panel light-designer-controls">
          <h2>Card details</h2>
          <div className="mini-form-grid">
            <label className="field">
              <span>Name</span>
              <input value={card.full_name} onChange={(event) => updateCard("full_name", event.target.value)} />
            </label>
            <label className="field">
              <span>Title</span>
              <input value={card.title} onChange={(event) => updateCard("title", event.target.value)} />
            </label>
            <label className="field">
              <span>Company</span>
              <input value={card.company} onChange={(event) => updateCard("company", event.target.value)} />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={card.email_1} onChange={(event) => updateCard("email_1", event.target.value)} />
            </label>
            <label className="field field-wide">
              <span>Bio</span>
              <textarea rows="3" value={card.bio} onChange={(event) => updateCard("bio", event.target.value)} />
            </label>
          </div>

          <div className="designer-option-block">
            <span className="designer-label">Layout</span>
            <div className="template-grid compact-template-grid">
              {templateOptions.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className={`template-option ${card.template_key === template.key ? "selected" : ""}`}
                  onClick={() => updateCard("template_key", template.key)}
                >
                  <span className="template-label">{template.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="designer-option-block">
            <span className="designer-label">Color</span>
            <div className="color-choice-row">
              {presetColors.slice(0, 8).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-choice ${card.background_color === color ? "selected" : ""}`}
                  style={{ background: color }}
                  onClick={() => updateCard("background_color", color)}
                  aria-label={`Use ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="designer-preview-note">
            <strong>Full accounts unlock saving, QR publishing, analytics, and the complete editor.</strong>
            <Link className="btn btn-primary btn-sm" to="/login">Log in</Link>
          </div>
        </div>

        <div className="workspace-preview light-designer-preview">
          <div className="workspace-preview-inner">
            <PhoneFrame className="phone-preview-center">
              <CardPreview card={previewCard} qrDataUrl={qrDataUrl} showQr />
            </PhoneFrame>
            <div className="qr-preview-mini-card">
              {qrDataUrl && <img className="designer-qr-image" src={qrDataUrl} alt="Generated QR preview" />}
              <span>QR destination</span>
              <strong>cielonline.com/c/{previewCard.slug}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
