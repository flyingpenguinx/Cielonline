import { Link } from "react-router-dom";
import CardPreview from "../components/CardPreview";
import PhoneFrame from "../components/PhoneFrame";

const carlosCardExample = {
  full_name: "Carlos Leon",
  slug: "carlos-leon",
  title: "Owner & Founder",
  company: "Cielonline",
  bio: "QR codes made for you.",
  website: "https://cielonline.com",
  avatar_url: "",
  template_key: "template-c",
  background_color: "#355dff",
  phone_1: "(916) 616-3269",
  phone_2: "",
  email_1: "carloslmgustavo@gmail.com",
  email_2: "",
  address: "Sacramento, CA",
  instagram_url: "",
  linkedin_url: ""
};

export default function HomePage({ session }) {

  return (
    <main className="container main-space">
      <section className="hero-panel panel">
        <h1>Cielonline QR Studio</h1>
        <p className="hero-lead">
          Professional QR experiences for digital business cards, website links, and Wi-Fi access.
        </p>
        <p className="muted">
          Design once, preview instantly, and publish a clean mobile-first card with one dashboard.
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

      <div className="home-grid">
        <section className="panel">
          <h2>What you can build (examples)</h2>
          <div className="phone-example-grid">
            <article className="feature-item">
              <h3>Business Card QR</h3>
              <PhoneFrame className="home-phone">
                <CardPreview card={carlosCardExample} />
              </PhoneFrame>
            </article>

            <article className="feature-item">
              <h3>Website QR</h3>
              <PhoneFrame className="home-phone">
                <div className="mini-screen-content">
                  <p className="mini-screen-title">Cielonline</p>
                  <p className="muted">Landing page opened from QR scan.</p>
                  <a className="btn btn-secondary" href="https://cielonline.com" target="_blank" rel="noreferrer">
                    Open Website
                  </a>
                </div>
              </PhoneFrame>
            </article>

            <article className="feature-item">
              <h3>Wi-Fi QR</h3>
              <PhoneFrame className="home-phone">
                <div className="mini-screen-content">
                  <p className="mini-screen-title">Join Network</p>
                  <p className="muted">SSID: Cielonline Guest</p>
                  <p className="muted">Tap connect after scanning.</p>
                </div>
              </PhoneFrame>
            </article>
          </div>
        </section>

        <section className="panel">
          <h2>Example profile</h2>
          <article className="saved-card-item">
            <p><strong>Carlos Leon</strong></p>
            <p className="muted">Owner & Founder · Cielonline</p>
            <p className="muted">/c/carlos-leon</p>
          </article>
        </section>
      </div>
    </main>
  );
}
