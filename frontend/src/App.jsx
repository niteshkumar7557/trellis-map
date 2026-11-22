import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { logout, restoreSession } from "./api.js";
import AuthForm from "./AuthForm.jsx";
import MapPage from "./MapPage.jsx";
import AdminPage from "./AdminPage.jsx";
import { Brand, ThemeToggle } from "./ui.jsx";

export default function App() {
  // undefined = still asking the server, null = signed out, object = signed in.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    restoreSession().then(setUser);
  }, []);

  if (user === undefined) return <p className="center muted">Loading…</p>;

  async function handleLogout() {
    await logout().catch(() => {});
    setUser(null);
  }

  const signedIn = (page) =>
    user ? <SignedIn user={user} onLogout={handleLogout}>{page}</SignedIn> : <Navigate to="/login" />;

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
      <Route path="/" element={signedIn(<MapPage user={user} />)} />
      <Route
        path="/admin"
        element={signedIn(user?.role === "ADMIN" ? <AdminPage /> : <Navigate to="/" />)}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// The frame every signed-in screen shares: a header on the tinted frame, and the
// screen itself on a white sheet.
function SignedIn({ user, onLogout, children }) {
  return (
    <div className="shell">
      <header className="header">
        <Brand />
        <nav className="header-nav" aria-label="Main">
          <NavLink to="/" end className="nav-link">
            Map
          </NavLink>
          {user.role === "ADMIN" && (
            <NavLink to="/admin" className="nav-link">
              Edit topics
            </NavLink>
          )}
        </nav>
        <div className="header-end">
          <ThemeToggle />
          <span className="header-user">{user.name}</span>
          <button className="btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <div className="sheet">{children}</div>
    </div>
  );
}
