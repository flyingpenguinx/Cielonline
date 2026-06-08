import { useEffect, useState } from "react";
import "../styles/mercado.css";
import storeLogo from "../features/mercado-loco/ML.jpg";

// Endpoint of the Google Apps Script Web App that emails the review to the
// store. Configure it by setting VITE_MERCADO_REVIEW_ENDPOINT in your
// environment (see MERCADO_LOCO_SETUP.txt at the repo root for full setup steps).
const REVIEW_ENDPOINT = import.meta.env.VITE_MERCADO_REVIEW_ENDPOINT || "";

// The store is fixed for this page — customers reach it by scanning the
// store's own QR code, so they never need to pick or type a store name.
const STORE_NAME = "Mercado Loco Roseville";

// All user-facing text in both languages. Spanish is the default; the
// customer can switch to English with one tap. Nothing here mentions how
// the form works behind the scenes.
const TEXT = {
  es: {
    pageTitle: "Mercado Loco Roseville · Opiniones",
    langButton: "English",
    langButtonLabel: "Cambiar a inglés",
    title: "Cuéntanos cómo lo estamos haciendo",
    subtitle: "Tu opinión nos ayuda a mejorar. Déjanos tu comentario o sugerencia.",
    nameLabel: "Nombre (opcional)",
    namePlaceholder: "Tu nombre",
    commentLabel: "Tu comentario",
    commentPlaceholder: "Escribe aquí tu comentario o sugerencia...",
    submit: "Enviar",
    submitting: "Enviando...",
    error: "No pudimos enviar tu comentario. Por favor, inténtalo de nuevo.",
    successTitle: "¡Gracias por tu comentario!",
    successBody: "Hemos recibido tu mensaje. ¡Gracias por ayudarnos a mejorar!",
    close: "Cerrar",
  },
  en: {
    pageTitle: "Mercado Loco Roseville · Reviews",
    langButton: "Español",
    langButtonLabel: "Switch to Spanish",
    title: "Tell us how we're doing",
    subtitle: "Your feedback helps us improve. Leave us your comment or suggestion.",
    nameLabel: "Name (optional)",
    namePlaceholder: "Your name",
    commentLabel: "Your comment",
    commentPlaceholder: "Write your comment or suggestion here...",
    submit: "Send",
    submitting: "Sending...",
    error: "We couldn't send your comment. Please try again.",
    successTitle: "Thank you for your submission!",
    successBody: "We've received your message. Thanks for helping us improve!",
    close: "Close",
  },
};

function SuccessCheck() {
  return (
    <svg className="mercado-check" viewBox="0 0 52 52" aria-hidden="true">
      <circle className="mercado-check-circle" cx="26" cy="26" r="24" fill="none" />
      <path className="mercado-check-mark" fill="none" d="M14 27l8 8 16-16" />
    </svg>
  );
}

export default function MercadoReviewPage() {
  const [lang, setLang] = useState("es");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error

  const t = TEXT[lang];

  // Give this standalone page its own browser-tab title (and keep the
  // Cielonline favicon) so it looks polished like a professional site.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = t.pageTitle;
    return () => {
      document.title = previousTitle;
    };
  }, [t.pageTitle]);

  const toggleLang = () => setLang((prev) => (prev === "es" ? "en" : "es"));

  const closeSuccess = () => setStatus("idle");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!comment.trim() || status === "submitting") return;

    setStatus("submitting");

    try {
      if (!REVIEW_ENDPOINT) {
        throw new Error("Review endpoint is not configured.");
      }

      const body = new URLSearchParams({
        honey: "",          // honeypot — always empty for real users; bots fill it
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

      setName("");
      setComment("");
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="mercado-page">
      <header className="mercado-topbar">
        <button
          type="button"
          className="mercado-lang"
          onClick={toggleLang}
          aria-label={t.langButtonLabel}
        >
          <span aria-hidden="true">🌐</span>
          {t.langButton}
        </button>
      </header>

      <main className="mercado-main">
        <section className="mercado-card fade-in">
          <img src={storeLogo} alt={STORE_NAME} className="mercado-store-logo" />
          <p className="mercado-eyebrow">{STORE_NAME}</p>
          <h1 className="mercado-title">{t.title}</h1>
          <p className="mercado-subtitle">{t.subtitle}</p>

          <form className="mercado-form" onSubmit={handleSubmit}>
            {/* Honeypot: off-screen, tab-skipped, autocomplete off — bots fill it, humans never see it */}
            <input
              type="text"
              name="honey"
              className="mercado-honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              readOnly
              value=""
              onChange={() => {}}
            />
            <label className="field">
              <span>{t.nameLabel}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                autoComplete="name"
              />
            </label>

            <label className="field">
              <span>{t.commentLabel}</span>
              <textarea
                rows={6}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
              />
            </label>

            {status === "error" && (
              <p className="mercado-error" role="alert">
                {t.error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary mercado-submit"
              disabled={status === "submitting" || !comment.trim()}
            >
              {status === "submitting" ? t.submitting : t.submit}
            </button>
          </form>
        </section>
      </main>

      <footer className="mercado-footer">
        <a className="mercado-powered" href="https://cielonline.com">
          <img src="/Logo.svg" alt="" aria-hidden="true" className="mercado-powered-logo" />
          <span>powered by Cielonline</span>
        </a>
      </footer>

      {status === "success" && (
        <div
          className="mercado-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mercado-success-title"
          onClick={closeSuccess}
        >
          <div className="mercado-modal pop-in" onClick={(e) => e.stopPropagation()}>
            <SuccessCheck />
            <h2 id="mercado-success-title" className="mercado-modal-title">
              {t.successTitle}
            </h2>
            <p className="mercado-modal-body">{t.successBody}</p>
            <button
              type="button"
              className="btn btn-primary mercado-modal-close"
              onClick={closeSuccess}
              autoFocus
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
