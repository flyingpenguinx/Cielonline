import { useState } from "react";

export default function LoginPage({ onMagicLink, onSignInWithPassword, onSignUpWithPassword }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleMagicLink = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await onMagicLink(email);
      setMessage("Magic link sent. Check your inbox.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      if (mode === "signup") {
        await onSignUpWithPassword(email, password);
        setMessage("Account created. If email confirmation is enabled, confirm your email first.");
      } else {
        await onSignInWithPassword(email, password);
        setMessage("Signed in.");
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="container main-space login-main">
      <section className="panel auth-panel">
        <h1>Log in to Cielonline</h1>
        <p className="muted">Use password login or magic link. Once logged in, you can create and manage QR codes.</p>

        <div className="tab-row">
          <button type="button" className={`tab ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>
            Password Sign In
          </button>
          <button type="button" className={`tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>
            Create Account
          </button>
          <button type="button" className={`tab ${mode === "magic" ? "active" : ""}`} onClick={() => setMode("magic")}>
            Magic Link
          </button>
        </div>

        {mode === "magic" ? (
          <form className="auth-form" onSubmit={handleMagicLink}>
            <label className="field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">Send Magic Link</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handlePassword}>
            <label className="field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">{mode === "signup" ? "Create Account" : "Sign In"}</button>
          </form>
        )}

        {message ? <p className="status-banner">{message}</p> : null}
      </section>
    </main>
  );
}
