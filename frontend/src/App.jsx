import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { logout, restoreSession } from "./api.js";
import AuthForm from "./AuthForm.jsx";
import MapPage from "./MapPage.jsx";
import AdminPage from "./AdminPage.jsx";

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
      <Route path="/" element={signedIn(<MapPage />)} />
      <Route
        path="/admin"
        element={signedIn(user?.role === "ADMIN" ? <AdminPage /> : <Navigate to="/" />)}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// The header every signed-in screen shares.
function SignedIn({ user, onLogout, children }) {
  return (
    <>
      <header className="header">
        <Link to="/" className="brand">
          Trellis
        </Link>
        <nav>
          <span>{user.name}</span>
          {user.role === "ADMIN" && <Link to="/admin">Edit topics</Link>}
          <button className="link" onClick={onLogout}>
            Log out
          </button>
        </nav>
      </header>
      {children}
    </>
  );
}
