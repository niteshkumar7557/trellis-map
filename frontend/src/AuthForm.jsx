import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { login, signup } from "./api.js";

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
    <main className="auth">
      <h1>Trellis</h1>
      <p className="muted">{isSignup ? "Make an account." : "Sign in to see your map."}</p>

      <form onSubmit={handleSubmit}>
        {isSignup && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={busy}>
          {isSignup ? "Sign up" : "Log in"}
        </button>
      </form>

      {/* A plain link, not fetch: the browser itself must go to Google and back. */}
      <a className="google" href="/api/auth/google">
        Continue with Google
      </a>

      <p className="muted">
        {isSignup ? (
          <>Have an account? <Link to="/login">Log in</Link></>
        ) : (
          <>New here? <Link to="/signup">Sign up</Link></>
        )}
      </p>
    </main>
  );
}
