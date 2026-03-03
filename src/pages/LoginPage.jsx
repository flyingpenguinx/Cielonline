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
    <main className="login-main">
      <section className="auth-panel fade-in">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your QR codes and digital cards.</p>

        <div className="tab-row">
          <button type="button" className={`tab ${mode === "signin" ? "active" : ""}`} onClick={() => setMode("signin")}>
            Sign In
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
              <span>Email address</span>
              <input type="email" required value={email} placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">Send Magic Link</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handlePassword}>
            <label className="field">
              <span>Email address</span>
              <input type="email" required value={email} placeholder="you@example.com" onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" required minLength={6} value={password} placeholder="Min. 6 characters" onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">{mode === "signup" ? "Create Account" : "Sign In"}</button>
          </form>
        )}

        {message ? <p className="status-banner">{message}</p> : null}
      </section>
    </main>
  );
}
