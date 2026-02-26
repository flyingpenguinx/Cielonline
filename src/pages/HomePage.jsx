import { Link } from "react-router-dom";

export default function HomePage({ session }) {

  return (
    <main className="container main-space">
      <section className="hero-panel panel">
        <h1>Cielonline QR Studio</h1>
        <p>
          Create professional QR experiences for digital business cards, website links, and Wi-Fi access.
          Build your card with custom templates, colors, profile photo (or initials fallback), and mobile-ready vCard download.
        </p>
        <div className="hero-actions">
          {session ? (
            <Link className="btn btn-primary" to="/dashboard">
              Open Dashboard
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/login">
              Log in
            </Link>
          )}
          <Link className="btn btn-secondary" to="/preview">
            Preview Builder
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>What the system does</h2>
        <div className="saved-cards">
          <article className="saved-card-item">
            <p><strong>Business Card QR</strong></p>
            <p>Hosted digital card with 5 unique templates and custom background colors.</p>
          </article>
          <article className="saved-card-item">
            <p><strong>Website QR</strong></p>
            <p>Point any QR code to a target URL and keep everything managed in one dashboard.</p>
          </article>
          <article className="saved-card-item">
            <p><strong>Wi-Fi QR</strong></p>
            <p>Generate scan-to-connect Wi-Fi payloads for events, offices, and storefronts.</p>
          </article>
          <article className="saved-card-item">
            <p><strong>Mobile Contact Save</strong></p>
            <p>Visitors can tap “Add to Contacts (vCard)” on iPhone and Android.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
