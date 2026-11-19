import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { logout, restoreSession } from "./api.js";
import AuthForm from "./AuthForm.jsx";

export default function App() {
  // undefined = still asking the server, null = signed out, object = signed in.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    restoreSession().then(setUser);
  }, []);

  if (user === undefined) return <p className="center">Loading…</p>;

  async function handleLogout() {
    await logout().catch(() => {});
    setUser(null);
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <AuthForm mode="login" onSignedIn={setUser} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <AuthForm mode="signup" onSignedIn={setUser} />}
      />
      <Route
        path="/"
        element={user ? <Home user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// A placeholder until the map screen (checklist N.2).
function Home({ user, onLogout }) {
  return (
    <>
      <header className="header">
        <strong>Trellis</strong>
        <span>
          {user.name}
          <button className="link" onClick={onLogout}>
            Log out
          </button>
        </span>
      </header>
      <main className="center">
        <p>Signed in as {user.email}. The map comes next.</p>
      </main>
    </>
  );
}
