import { Suspense, lazy, useState, useCallback, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PublicCardPage from "./pages/PublicCardPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

function AppHeader({ session, signOut }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggle = useCallback(() => setMobileOpen((v) => !v), []);
  const close = useCallback(() => setMobileOpen(false), []);

  const navLinks = (
    <>
      <Link to="/" onClick={close}>Home</Link>
      <Link to="/preview" onClick={close}>Preview Builder</Link>
      {session ? <Link to="/dashboard" onClick={close}>Dashboard</Link> : <Link to="/login" onClick={close}>Log in</Link>}
      {session ? (
        <button className="btn btn-secondary" onClick={() => { signOut(); close(); }}>
          Sign out
        </button>
      ) : null}
    </>
  );

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Go to home page">
          <img className="brand-logo" src="/Logo.svg" alt="Cielonline" />
          <span className="brand-text">Cielonline</span>
        </Link>

        {/* Desktop nav */}
        <nav className="app-nav">{navLinks}</nav>

        {/* Mobile hamburger */}
        <button className="hamburger-btn" onClick={toggle} aria-label="Toggle menu">
          <MenuIcon />
        </button>

        {/* Mobile drawer */}
        <div className={`mobile-nav-overlay ${mobileOpen ? "open" : ""}`} onClick={close}>
          <nav className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-nav-close" onClick={close} aria-label="Close menu">&times;</button>
            {navLinks}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { loading, session, signInWithEmail, signInWithPassword, signUpWithPassword, signOut } = useAuth();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader session={session} signOut={signOut} />
      <Routes>
        <Route path="/" element={<HomePage session={session} />} />
        <Route
          path="/login"
          element={
            session ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage
                onMagicLink={signInWithEmail}
                onSignInWithPassword={signInWithPassword}
                onSignUpWithPassword={signUpWithPassword}
              />
            )
          }
        />
        <Route
          path="/preview"
          element={
            <Suspense fallback={<div className="loading-state"><div className="loading-spinner" /><span>Loading preview...</span></div>}>
              <DashboardPage previewOnly />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            session ? (
              <Suspense fallback={<div className="loading-state"><div className="loading-spinner" /><span>Loading dashboard...</span></div>}>
                <DashboardPage user={session.user} />
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/c/:slug" element={<PublicCardPage />} />
      </Routes>
    </div>
  );
}
