import { Suspense, lazy } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import PublicCardPage from "./pages/PublicCardPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));

function AppHeader({ session, signOut }) {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        Cielonline QR Studio
      </Link>
      <nav className="app-nav">
        <Link to="/">Home</Link>
        <Link to="/preview">Preview Builder</Link>
        {session ? <Link to="/dashboard">Dashboard</Link> : <Link to="/login">Log in</Link>}
        {session ? (
          <button className="btn btn-secondary" onClick={signOut}>
            Sign out
          </button>
        ) : null}
      </nav>
    </header>
  );
}

export default function App() {
  const { loading, session, signInWithEmail, signInWithPassword, signUpWithPassword, signOut } = useAuth();

  if (loading) {
    return <div className="loading-state">Loading...</div>;
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
            <Suspense fallback={<div className="loading-state">Loading preview...</div>}>
              <DashboardPage previewOnly />
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
          element={
            session ? (
              <Suspense fallback={<div className="loading-state">Loading dashboard...</div>}>
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
