import { Link } from "react-router-dom";
import { useRef, useState, useEffect, useCallback } from "react";
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
  show_qr_on_card: true,
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

export default function QrPreviewPage({ session }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const autoplayRef = useRef(null);

  const slides = [
    {
      label: "Business Card",
      content: (
        <PhoneFrame className="home-phone">
          <CardPreview card={carlosCardExample} wrapperClass="qr-showcase-card-preview" />
        </PhoneFrame>
      ),
    },
    {
      label: "Website Link",
      content: (
        <PhoneFrame className="home-phone">
          <div className="mini-screen-content">
            <p className="mini-screen-title">Cielonline</p>
            <p className="muted">Landing page opened from QR scan.</p>
            <a className="btn btn-secondary" href="https://cielonline.com" target="_blank" rel="noreferrer">
              Open Website
            </a>
          </div>
        </PhoneFrame>
      ),
    },
    {
      label: "Wi-Fi Access",
      content: (
        <PhoneFrame className="home-phone">
          <div className="mini-screen-content">
            <p className="mini-screen-title">Join Network</p>
            <p className="muted">SSID: Cielonline Guest</p>
            <p className="muted">Tap connect after scanning.</p>
          </div>
        </PhoneFrame>
      ),
    },
  ];

  const totalSlides = slides.length;

  const goTo = useCallback((index) => {
    setActiveIndex(((index % totalSlides) + totalSlides) % totalSlides);
  }, [totalSlides]);

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    autoplayRef.current = setInterval(next, 8000);
    return () => clearInterval(autoplayRef.current);
  }, [next]);

  const resetAutoplay = useCallback(() => {
    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(next, 8000);
  }, [next]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (event) => {
    touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (touchDeltaX.current < -threshold) {
      goTo(activeIndex + 1);
      resetAutoplay();
    } else if (touchDeltaX.current > threshold) {
      goTo(activeIndex - 1);
      resetAutoplay();
    }
  };

  return (
    <main>
      <section className="hero-section qr-preview-hero">
        <div className="hero-inner">
          <div className="hero-badge">QR Builder Preview</div>
          <h1>
            Build stunning <span className="gradient-text">digital cards</span> in minutes
          </h1>
          <p className="hero-lead">
            Explore the QR card experience Cielonline gives your customers: clean scans, polished profiles, and simple sharing.
          </p>
          <div className="hero-actions">
            {session ? (
              <>
                <Link className="btn btn-primary btn-lg" to="/dashboard">Dashboard</Link>
                <Link className="btn btn-secondary btn-lg" to="/qr-builder">Build QR</Link>
              </>
            ) : (
              <>
                <Link className="btn btn-primary btn-lg" to="/preview">Try Card Designer</Link>
                <Link className="btn btn-secondary btn-lg" to="/login">Log in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        <section className="showcase-section">
          <div className="showcase-header">
            <h2>What you can build</h2>
            <p>Three QR types, one clean workflow. Swipe or tap to explore.</p>
          </div>

          <div
            className="showcase-carousel-wrap"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {slides.map((slide, index) => {
              let offset = index - activeIndex;
              if (offset > 1) offset -= totalSlides;
              if (offset < -1) offset += totalSlides;

              const isActive = offset === 0;
              const className = isActive ? "showcase-card-active" : offset < 0 ? "showcase-card-left" : "showcase-card-right";

              return (
                <article
                  key={slide.label}
                  className={`showcase-card ${className}`}
                  onClick={() => { if (!isActive) { goTo(index); resetAutoplay(); } }}
                >
                  <h3>{slide.label} <span className="card-badge">QR</span></h3>
                  {slide.content}
                </article>
              );
            })}
          </div>

          <div className="showcase-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.label}
                className={`showcase-dot ${index === activeIndex ? "active" : ""}`}
                onClick={() => { goTo(index); resetAutoplay(); }}
                aria-label={`Show ${slide.label}`}
              />
            ))}
          </div>

          <div className="profile-row">
            <div className="profile-row-avatar">CL</div>
            <div className="profile-row-info">
              <strong>Carlos Leon</strong>
              <span>Owner & Founder - Cielonline - /c/carlos-leon</span>
            </div>
            <Link className="btn btn-secondary" to="/preview" style={{ flexShrink: 0 }}>
              Try Designer
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
