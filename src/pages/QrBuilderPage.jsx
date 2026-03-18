import { useEffect, useState } from "react";
import CardBuilderForm from "../components/CardBuilderForm";
import CardPreview from "../components/CardPreview";
import PhoneFrame from "../components/PhoneFrame";
import QrBuilder from "../components/QrBuilder";
import { useCardForm } from "../hooks/useCardForm";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export default function QrBuilderPage({ user }) {
  const { card, updateCard, resetCard, sanitized } = useCardForm();
  const [cards, setCards] = useState([]);
  const [savingCard, setSavingCard] = useState(false);
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("builder");

  const loadCards = async () => {
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

    if (!isSupabaseConfigured || !supabase) {
      setStatus("Configure Supabase to save cards.");
      return;
    }

    setSavingCard(true);
    setStatus("");

    const payload = {
      ...sanitized,
      owner_id: user.id,
      social: {
        instagram_url: sanitized.instagram_url || null,
        linkedin_url: sanitized.linkedin_url || null,
        facebook_url: sanitized.facebook_url || null,
        twitter_url: sanitized.twitter_url || null,
        tiktok_url: sanitized.tiktok_url || null,
        youtube_url: sanitized.youtube_url || null,
        github_url: sanitized.github_url || null,
      },
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
    if (!isSupabaseConfigured || !supabase) {
      setStatus("Configure Supabase to save QR records.");
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
      qr_payload: payload,
    };

    const { error } = await supabase.from("qr_codes").upsert(row, { onConflict: "slug" });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("QR configuration saved.");
  };

  const loadCardForEdit = (savedCard) => {
    Object.entries(savedCard).forEach(([key, value]) => {
      if (key === "social" && value) {
        Object.entries(value).forEach(([sk, sv]) => updateCard(sk, sv || ""));
      } else if (key !== "id" && key !== "owner_id" && key !== "created_at" && key !== "updated_at" && key !== "is_published") {
        updateCard(key, value ?? "");
      }
    });
    setActiveTab("builder");
  };

  return (
    <main className="container main-space fade-in">
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dashboard-tab ${activeTab === "builder" ? "active" : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          <span className="tab-icon">🃏</span> Card Builder
        </button>
        <button
          type="button"
          className={`dashboard-tab ${activeTab === "qr" ? "active" : ""}`}
          onClick={() => setActiveTab("qr")}
        >
          <span className="tab-icon">📱</span> QR Workshop
        </button>
        <button
          type="button"
          className={`dashboard-tab ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          <span className="tab-icon">💾</span> Saved Cards
        </button>
      </div>

      {activeTab === "builder" && (
        <div className="dashboard-grid">
          <CardBuilderForm card={card} onChange={updateCard} onSubmit={saveCard} saving={savingCard} />
          <div className="preview-panel">
            <section className="panel">
              <h2>Live Preview</h2>
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
        </div>
      )}

      {activeTab === "qr" && <QrBuilder cards={cards} onSaveQr={saveQr} />}

      {activeTab === "saved" && (
        <section className="panel">
          <h2>Your saved cards</h2>
          {cards.length === 0 ? (
            <p className="muted">No saved cards yet. Switch to "Card Builder" to create your first card.</p>
          ) : (
            <div className="saved-cards compact">
              {cards.map((savedCard) => (
                <article key={savedCard.id} className="saved-card-item">
                  <div className="saved-card-row">
                    <div>
                      <p><strong>{savedCard.full_name}</strong></p>
                      <p className="muted">/c/{savedCard.slug}</p>
                    </div>
                    <div className="row-gap">
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => loadCardForEdit(savedCard)}>
                        Edit
                      </button>
                      <a href={`/c/${savedCard.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                        View
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {status && <p className="status-banner" style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}
