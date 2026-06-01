import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./mercado.css";

// Endpoint of the Google Apps Script Web App that emails the review to the
// store. Configure it by setting VITE_MERCADO_REVIEW_ENDPOINT in your
// environment (see GOOGLE_APPS_SCRIPT_INSTRUCTIONS.txt for full setup steps).
const REVIEW_ENDPOINT = import.meta.env.VITE_MERCADO_REVIEW_ENDPOINT || "";

const STORE_NAME = "Mercado Loco";
const PAGE_TITLE = "Mercado Loco · Opiniones";

export default function MercadoReviewPage() {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  // Give this standalone page its own browser-tab title (and keep the
  // Cielonline favicon) so it looks polished like a professional site.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!comment.trim() || status === "submitting") return;

    setStatus("submitting");

    try {
      if (!REVIEW_ENDPOINT) {
        throw new Error("Review endpoint is not configured.");
      }

      const body = new URLSearchParams({
        store: STORE_NAME,
        name: name.trim(),
        comment: comment.trim(),
      });

      // Apps Script Web Apps do not return CORS headers, so we send the
      // request in no-cors mode. We cannot read the response, but the email
      // is still delivered, so we optimistically show the success state.
      await fetch(REVIEW_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      setStatus("success");
      setName("");
      setComment("");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="mercado-page">
      <header className="mercado-topbar">
        <Link to="/" className="mercado-brand" aria-label="Ir a Cielonline">
          <img src="/Logo.svg" alt="Cielonline" className="mercado-brand-logo" />
        </Link>
      </header>

      <main className="mercado-main">
        <section className="mercado-card fade-in">
          <p className="mercado-eyebrow">{STORE_NAME}</p>
          <h1 className="mercado-title">Cuéntanos cómo lo estamos haciendo</h1>
          <p className="mercado-subtitle">
            Tu opinión nos ayuda a mejorar. Déjanos tu comentario, sugerencia o queja.
          </p>

          {status === "success" ? (
            <div className="mercado-success" role="status">
              <h2>¡Gracias por tu comentario!</h2>
              <p>Hemos recibido tu mensaje y lo tendremos muy en cuenta.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStatus("idle")}
              >
                Enviar otro comentario
              </button>
            </div>
          ) : (
            <form className="mercado-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Nombre (opcional)</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span>Tu comentario</span>
                <textarea
                  rows={6}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escribe aquí tu comentario o sugerencia..."
                />
              </label>

              {status === "error" && (
                <p className="mercado-error" role="alert">
                  No pudimos enviar tu comentario en este momento. Por favor, inténtalo de nuevo.
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary mercado-submit"
                disabled={status === "submitting" || !comment.trim()}
              >
                {status === "submitting" ? "Enviando..." : "Enviar"}
              </button>
            </form>
          )}
        </section>
      </main>

      <footer className="mercado-footer">
        <Link className="mercado-powered" to="/">
          <img src="/Logo.svg" alt="" aria-hidden="true" className="mercado-powered-logo" />
          <span>powered by Cielonline</span>
        </Link>
      </footer>
    </div>
  );
}
