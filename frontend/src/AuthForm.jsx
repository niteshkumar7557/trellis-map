import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { login, signup } from "./api.js";
import { Brand, ThemeToggle } from "./ui.jsx";

// The Login and Sign up screens. They differ only in the name field and the wording.
export default function AuthForm({ mode, onSignedIn }) {
  const isSignup = mode === "signup";
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // The backend sends people back to /login?error=google when Google sign-in fails.
  const [error, setError] = useState(
    searchParams.get("error") === "google" ? "Google sign-in didn't work. Try again." : "",
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = isSignup ? await signup(name, email, password) : await login(email, password);
      onSignedIn(user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-top">
        <Brand to={isSignup ? "/signup" : "/login"} />
        <ThemeToggle />
      </header>

      <main className="auth">
        <section className="auth-intro" aria-label="What Trellis does">
          <h1 className="greeting">{isSignup ? "Make your study map." : "Back to your map."}</h1>
          <p className="auth-lede">
            Trellis lays out JavaScript fundamentals in learning order, so you always know
            the next topic.
          </p>
          <ul className="auth-points">
            <li>
              <span className="dot status-DONE" aria-hidden="true" />
              Fifteen topics in six steps, each building on the last.
            </li>
            <li>
              <span className="dot status-STUCK" aria-hidden="true" />
              Stuck on one? It points to the earlier topic that may be the cause.
            </li>
            <li>
              <span className="dot status-LEARNING" aria-hidden="true" />
              A ready prompt for your own AI, written from your progress and notes.
            </li>
          </ul>
        </section>

        <section className="auth-panel" aria-labelledby="auth-title">
          <h2 id="auth-title">{isSignup ? "Sign up" : "Log in"}</h2>

          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && (
              <label className="field">
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
            )}
            <label className="field">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : undefined}
                aria-describedby={isSignup ? "password-hint" : undefined}
                required
              />
              {isSignup && (
                <span className="field-hint" id="password-hint">
                  At least 8 characters.
                </span>
              )}
            </label>

            {error && (
              <p className="notice error-notice" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn" disabled={busy}>
              {busy ? "One moment…" : isSignup ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="auth-or" aria-hidden="true">or</p>

          {/* A plain link, not fetch: the browser itself must go to Google and back. */}
          <a className="btn-secondary auth-google" href="/api/auth/google">
            Continue with Google
          </a>

          <p className="auth-switch muted">
            {isSignup ? (
              <>Have an account? <Link to="/login">Log in</Link></>
            ) : (
              <>New here? <Link to="/signup">Sign up</Link></>
            )}
          </p>
        </section>
      </main>
    </div>
  );
}
