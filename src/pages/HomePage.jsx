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
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const autoplayRef = useRef(null);

  const slides = [
    {
      label: "Business Card",
      content: (
        <PhoneFrame className="home-phone">
          <CardPreview card={carlosCardExample} />
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

  // Auto-advance every 8 seconds
  useEffect(() => {
    autoplayRef.current = setInterval(next, 8000);
    return () => clearInterval(autoplayRef.current);
  }, [next]);

  const resetAutoplay = useCallback(() => {
    clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(next, 8000);
  }, [next]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
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
              <>
                <Link className="btn btn-primary btn-lg" to="/dashboard">
                  Dashboard
                </Link>
                <Link className="btn btn-secondary btn-lg" to="/admin">
                  Admin Portal
                </Link>
              </>
            ) : (
              <>
                <Link className="btn btn-primary btn-lg" to="/login">
                  Get Started
                </Link>
                <Link className="btn btn-secondary btn-lg" to="/preview">
                  Try the Builder
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Showcase — infinite swipe carousel ── */}
      <div className="container">
        <section className="showcase-section">
          <div className="showcase-header">
            <h2>What you can build</h2>
            <p>Three QR types, one dashboard. Swipe to explore.</p>
          </div>

          <div
            className="showcase-carousel-wrap"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {slides.map((slide, i) => (
              <article
                key={slide.label}
                className={`showcase-card ${i === activeIndex ? "showcase-card-active" : "showcase-card-inactive"}`}
                style={{
                  transform: `translateX(${(i - activeIndex) * 100}%)`,
                  opacity: i === activeIndex ? 1 : 0,
                  position: i === activeIndex ? "relative" : "absolute",
                  pointerEvents: i === activeIndex ? "auto" : "none",
                }}
              >
                <h3>{slide.label} <span className="card-badge">QR</span></h3>
                {slide.content}
              </article>
            ))}
          </div>

          <div className="showcase-dots">
            {slides.map((slide, i) => (
              <button
                key={slide.label}
                className={`showcase-dot ${i === activeIndex ? "active" : ""}`}
                onClick={() => { goTo(i); resetAutoplay(); }}
                aria-label={`Show ${slide.label}`}
              />
            ))}
          </div>

          {/* Compact profile row */}
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