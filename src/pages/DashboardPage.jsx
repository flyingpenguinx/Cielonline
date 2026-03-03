import { useEffect, useState } from "react";
import CardBuilderForm from "../components/CardBuilderForm";
import CardPreview from "../components/CardPreview";
import PhoneFrame from "../components/PhoneFrame";
import QrBuilder from "../components/QrBuilder";
import { useCardForm } from "../hooks/useCardForm";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const previewCard = {
  full_name: "Carlos Leon",
  slug: "carlos-leon",
  title: "Owner & Founder",
  company: "Cielonline",
  bio: "Helping businesses share contact info with branded QR experiences.",
  website: "https://cielonline.com",
  avatar_url: "",
  template_key: "template-c",
  background_color: "#355dff",
  phone_1: "+1 (555) 123-4500",
  phone_2: "",
  email_1: "alex@cielonline.com",
  email_2: "",
  address: "Sacramento, CA",
  instagram_url: "",
  linkedin_url: ""
};

const previewSavedCards = [
  { id: "preview-1", full_name: "Carlos Leon", slug: "carlos-leon" }
];

export default function DashboardPage({ user, previewOnly = false }) {
  const { card, updateCard, resetCard, sanitized } = useCardForm(previewOnly ? previewCard : undefined);
  const [cards, setCards] = useState([]);
  const [savingCard, setSavingCard] = useState(false);
  const [status, setStatus] = useState("");

  const loadCards = async () => {
    if (previewOnly) {
      setCards(previewSavedCards);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setCards([]);
      return;
    }

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(error.message);
      return;
    }

    setCards(data ?? []);
  };

  useEffect(() => {
    loadCards();
  }, []);

  const saveCard = async (event) => {
    event.preventDefault();

    if (previewOnly) {
      setStatus("Preview mode: this is how the saved flow looks. Use /login + Supabase setup to save for real.");
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus("Preview mode: configure Supabase to save cards.");
      return;
    }

    setSavingCard(true);
    setStatus("");

    const payload = {
      ...sanitized,
      owner_id: user.id,
      social: {
        instagram_url: sanitized.instagram_url || null,
        linkedin_url: sanitized.linkedin_url || null
      }
    };

    const { error } = await supabase.from("cards").upsert(payload, { onConflict: "slug" });

    if (error) {
      setStatus(error.message);
      setSavingCard(false);
      return;
    }

    setStatus("Card saved.");
    setSavingCard(false);
    loadCards();
  };

  const saveQr = async (type, values, payload) => {
    if (previewOnly) {
      setStatus(`Preview mode: QR payload generated for ${type.toUpperCase()} and ready to save in live mode.`);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setStatus("Preview mode: configure Supabase to save QR records.");
      return;
    }

    setStatus("");
    const selectedCard = cards.find((item) => item.slug === values.cardSlug);

    const row = {
      owner_id: user.id,
      slug: values.qrSlug,
      type,
      card_id: type === "card" ? selectedCard?.id ?? null : null,
      target_url: type === "url" ? values.targetUrl : null,
      wifi_ssid: type === "wifi" ? values.ssid : null,
      wifi_password: type === "wifi" ? values.password : null,
      wifi_encryption: type === "wifi" ? values.encryption : null,
      wifi_hidden: type === "wifi" ? Boolean(values.hidden) : false,
      qr_payload: payload
    };

    const { error } = await supabase.from("qr_codes").upsert(row, { onConflict: "slug" });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("QR configuration saved.");
  };

  return (
    <main className="container main-space">
      <div className="dashboard-grid">
        <CardBuilderForm card={card} onChange={updateCard} onSubmit={saveCard} saving={savingCard} />
        <section className="panel">
          <h2>Live card preview</h2>
          <PhoneFrame className="phone-preview-center">
            <CardPreview card={card} />
          </PhoneFrame>
          <div className="row-gap">
            <button type="button" className="btn btn-secondary" onClick={resetCard}>
              Clear form
            </button>
          </div>
        </section>
      </div>

      <div className="dashboard-bottom-grid">
        <QrBuilder cards={cards} onSaveQr={saveQr} />

        <section className="panel">
          <h2>Your saved cards</h2>
          {previewOnly ? (
            <p className="muted">Preview mode active. This section mirrors what logged-in users will see.</p>
          ) : null}
          {!isSupabaseConfigured ? (
            <p className="muted">Preview mode active. Add Supabase env values to enable login and persistence.</p>
          ) : null}
          {cards.length === 0 ? (
            <p className="muted">No saved cards yet.</p>
          ) : (
            <div className="saved-cards compact">
              {cards.map((savedCard) => (
                <article key={savedCard.id} className="saved-card-item">
                  <p>
                    <strong>{savedCard.full_name}</strong>
                  </p>
                  <p>/c/{savedCard.slug}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {status ? <p className="status-banner">{status}</p> : null}
    </main>
  );
}
