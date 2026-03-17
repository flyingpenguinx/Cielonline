import { Suspense, lazy, useState, useCallback, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PublicCardPage from "./pages/PublicCardPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const SiteEditorPage = lazy(() => import("./pages/SiteEditorPage"));
const PublicSitePage = lazy(() => import("./pages/PublicSitePage"));

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function AppHeader({ session, signOut }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggle = useCallback(() => setMobileOpen((v) => !v), []);
  const close = useCallback(() => setMobileOpen(false), []);

  const navLinks = (
    <>
      <Link to="/" onClick={close}>Home</Link>
      <Link to="/preview" onClick={close}>Preview Builder</Link>
      {session ? <Link to="/admin" onClick={close}>Admin Portal</Link> : null}
      {session ? <Link to="/site-editor" onClick={close}>My Sites</Link> : null}
      {session ? <Link to="/dashboard" onClick={close}>QR Dashboard</Link> : <Link to="/login" onClick={close}>Log in</Link>}
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

        <nav className="app-nav">{navLinks}</nav>

        <button className="hamburger-btn" onClick={toggle} aria-label="Toggle menu">
          <MenuIcon />
        </button>

        <div className={`mobile-nav-overlay ${mobileOpen ? "open" : ""}`} onClick={close}>
          <nav className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-nav-close" onClick={close} aria-label="Close menu">
              <CloseIcon />
            </button>
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
        <Route
          path="/admin"
          element={
            session ? (
              <Suspense fallback={<div className="loading-state"><div className="loading-spinner" /><span>Loading admin...</span></div>}>
                <AdminDashboardPage user={session.user} />
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/site-editor"
          element={
            session ? (
              <Suspense fallback={<div className="loading-state"><div className="loading-spinner" /><span>Loading editor...</span></div>}>
                <SiteEditorPage user={session.user} />
              </Suspense>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/s/:slug"
          element={
            <Suspense fallback={<div className="loading-state"><div className="loading-spinner" /><span>Loading site...</span></div>}>
              <PublicSitePage />
            </Suspense>
          }
        />
        <Route path="/c/:slug" element={<PublicCardPage />} />
      </Routes>
    </div>
  );
}
