import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CardPreview from "../components/CardPreview";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { downloadVCard } from "../utils/vcard";

export default function PublicCardPage() {
  const { slug } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase is not configured yet. This page will load real cards after setup.");
        setLoading(false);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("cards")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (queryError) {
        setError("Card not found.");
        setLoading(false);
        return;
      }

      setCard(data);
      setLoading(false);
    };

    load();
  }, [slug]);

  if (loading) {
    return <main className="container main-space">Loading card...</main>;
  }

  if (error || !card) {
    return <main className="container main-space">{error || "Card not found."}</main>;
  }

  return (
    <main className="container main-space">
      <section className="panel">
        <CardPreview card={card} />
        <div className="public-actions">
          {card.phone_1 ? (
            <a className="btn btn-secondary" href={`tel:${card.phone_1}`}>
              Call
            </a>
          ) : null}
          {card.email_1 ? (
            <a className="btn btn-secondary" href={`mailto:${card.email_1}`}>
              Email
            </a>
          ) : null}
          <button className="btn btn-primary" onClick={() => downloadVCard(card)}>
            Add to Contacts (vCard)
          </button>
        </div>
      </section>
    </main>
  );
}
