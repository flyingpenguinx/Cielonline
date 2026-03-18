import { useState } from "react";
import CardPreview from "../components/CardPreview";
import PhoneFrame from "../components/PhoneFrame";
import { useCardForm } from "../hooks/useCardForm";

const previewCard = {
  full_name: "Carlos Leon",
  slug: "carlos-leon",
  title: "Owner & Founder",
  company: "Cielonline",
  bio: "Helping businesses share contact info with branded QR experiences.",
  website: "https://cielonline.com",
  avatar_url: "",
  template_key: "template-c",
  card_style: "flat",
  background_color: "#355dff",
  phone_1: "+1 (555) 123-4500",
  phone_2: "",
  email_1: "alex@cielonline.com",
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

export default function DashboardPage({ previewOnly = false }) {
  const { card } = useCardForm(previewCard);
  const [activeTemplate, setActiveTemplate] = useState("template-c");

  const templates = [
    { key: "template-a", label: "Classic" },
    { key: "template-b", label: "Split" },
    { key: "template-c", label: "Sidebar" },
    { key: "template-d", label: "Centered" },
    { key: "template-e", label: "Glass" },
  ];

  const previewCardWithTemplate = { ...card, template_key: activeTemplate };

  return (
    <main className="container main-space fade-in">
      <section className="panel" style={{ maxWidth: 700, margin: "0 auto" }}>
        <h2>Preview the Builder</h2>
        <p className="muted">
          This is a read-only preview of how the QR card builder works.
          Sign up or log in to create and save your own cards and QR codes.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {templates.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`style-chip ${activeTemplate === t.key ? "selected" : ""}`}
              onClick={() => setActiveTemplate(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <PhoneFrame className="phone-preview-center">
          <CardPreview card={previewCardWithTemplate} />
        </PhoneFrame>

        <p className="muted text-center" style={{ fontSize: 13, marginTop: 8 }}>
          Showing sample card for <strong>Carlos Leon</strong>. Log in to build your own.
        </p>
      </section>
    </main>
  );
}
