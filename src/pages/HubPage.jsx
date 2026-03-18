import { Link } from "react-router-dom";

const hubCards = [
  {
    to: "/qr-builder",
    icon: "📱",
    title: "Build a QR",
    desc: "Create business card, website link, or Wi-Fi QR codes.",
    color: "#2563eb",
  },
  {
    to: "/admin",
    icon: "⚙️",
    title: "Admin Portal",
    desc: "Manage inquiries, appointments, customers, services & analytics.",
    color: "#7c3aed",
  },
  {
    to: "/site-editor",
    icon: "🌐",
    title: "My Sites",
    desc: "Edit and manage your website content blocks.",
    color: "#0891b2",
  },
  {
    to: "/qr-dashboard",
    icon: "📊",
    title: "QR Dashboard",
    desc: "View, preview, and edit all your saved QR codes.",
    color: "#059669",
  },
];

export default function HubPage({ user }) {
  const firstName = user?.email?.split("@")[0] || "there";

  return (
    <main className="container main-space fade-in">
      <div className="hub-welcome">
        <h1>Welcome back, {firstName}</h1>
        <p className="muted">What would you like to do today?</p>
      </div>

      <div className="hub-grid">
        {hubCards.map((card) => (
          <Link key={card.to} to={card.to} className="hub-card" style={{ "--hub-accent": card.color }}>
            <span className="hub-card-icon">{card.icon}</span>
            <div className="hub-card-body">
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
            </div>
            <span className="hub-card-arrow">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
