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
  card_style: "glossy",
  background_color: "#355dff",
  phone_1: "(916) 616-3269",
  phone_2: "",
  email_1: "carloslmgustavo@gmail.com",
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

export default function HomePage({ session }) {
  return (
    <main>
      {/* ── Dark Hero ── */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-badge">Professional QR Experiences</div>
          <h1>
            Build stunning{" "}
            <span className="gradient-text">digital cards</span>{" "}
            in minutes
          </h1>
          <p className="hero-lead">
            Design once, preview instantly, and publish a clean mobile-first business card, website link, or Wi-Fi QR code.
          </p>
          <div className="hero-actions">
            {session ? (
              <Link className="btn btn-primary btn-lg" to="/dashboard">
                Open Dashboard
              </Link>
            ) : (
              <Link className="btn btn-primary btn-lg" to="/login">
                Get Started
              </Link>
            )}
            <Link className="btn btn-secondary btn-lg" to="/preview">
              Try the Builder
            </Link>
          </div>
        </div>
      </section>

      {/* ── Showcase — horizontal scroll = no excessive vertical space ── */}
      <div className="container">
        <section className="showcase-section">
          <div className="showcase-header">
            <h2>What you can build</h2>
            <p>Three QR types, one dashboard. Swipe to explore.</p>
          </div>

          <div className="showcase-carousel">
            <article className="showcase-card">
              <h3>Business Card <span className="card-badge">QR</span></h3>
              <PhoneFrame className="home-phone">
                <CardPreview card={carlosCardExample} />
              </PhoneFrame>
            </article>

            <article className="showcase-card">
              <h3>Website Link <span className="card-badge">QR</span></h3>
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

            <article className="showcase-card">
              <h3>Wi-Fi Access <span className="card-badge">QR</span></h3>
              <PhoneFrame className="home-phone">
                <div className="mini-screen-content">
                  <p className="mini-screen-title">Join Network</p>
                  <p className="muted">SSID: Cielonline Guest</p>
                  <p className="muted">Tap connect after scanning.</p>
                </div>
              </PhoneFrame>
            </article>
          </div>

          {/* Compact profile row instead of full card block */}
          <div className="profile-row">
            <div className="profile-row-avatar">CL</div>
            <div className="profile-row-info">
              <strong>Carlos Leon</strong>
              <span>Owner & Founder · Cielonline · /c/carlos-leon</span>
            </div>
            <Link className="btn btn-secondary" to="/preview" style={{ flexShrink: 0 }}>
              View
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}