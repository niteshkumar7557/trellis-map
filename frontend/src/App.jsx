import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { apiFetch, logout, restoreSession } from "./api.js";
import AuthForm from "./AuthForm.jsx";
import MapPage from "./MapPage.jsx";
import AdminPage from "./AdminPage.jsx";
import { Brand, ThemeToggle } from "./ui.jsx";

export default function App() {
  // undefined = still asking the server, null = signed out, object = signed in.
  const [user, setUser] = useState(undefined);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    const saved = localStorage.getItem("trellis-subject-id");
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    restoreSession().then(setUser);
  }, []);

  // Load subject list once user is signed in
  useEffect(() => {
    if (!user) return;
    apiFetch("/api/subjects")
      .then(({ subjects: list }) => {
        if (!list.length) return;
        setSubjects(list);
        const params = new URLSearchParams(window.location.search);
        const slugParam = params.get("subject");
        if (slugParam) {
          const matched = list.find((s) => s.slug === slugParam.toLowerCase());
          if (matched) {
            setSelectedSubjectId(matched.id);
            localStorage.setItem("trellis-subject-id", String(matched.id));
            return;
          }
        }
        // Use saved subject if valid, else default to first
        setSelectedSubjectId((prev) => {
          const valid = list.some((s) => s.id === prev);
          return valid ? prev : list[0].id;
        });
      })
      .catch(() => {});
  }, [user]);

  function handleSelectSubject(id) {
    setSelectedSubjectId(id);
    localStorage.setItem("trellis-subject-id", String(id));
    const target = subjects.find((s) => s.id === id);
    if (target) {
      const url = new URL(window.location);
      url.searchParams.set("subject", target.slug);
      window.history.replaceState({}, "", url);
    }
  }

  if (user === undefined) return <p className="center muted">Loading…</p>;

  async function handleLogout() {
    await logout().catch(() => {});
    setUser(null);
  }

  const signedIn = (page) =>
    user ? (
      <SignedIn
        user={user}
        onLogout={handleLogout}
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={handleSelectSubject}
      >
        {page}
      </SignedIn>
    ) : (
      <Navigate to="/login" />
    );

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
      <Route path="/" element={signedIn(<MapPage user={user} selectedSubjectId={selectedSubjectId} />)} />
      <Route
        path="/admin"
        element={signedIn(user?.role === "ADMIN" ? <AdminPage initialSubjectId={selectedSubjectId} /> : <Navigate to="/" />)}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// The frame every signed-in screen shares.
function SignedIn({ user, onLogout, subjects, selectedSubjectId, onSelectSubject, children }) {
  return (
    <div className="shell">
      <header className="header">
        <Brand />
        <nav className="header-nav" aria-label="Main">
          <NavLink to="/" end className="nav-link">
            Map
          </NavLink>
          {/* Subject tabs — appear next to Map when more than one subject exists */}
          {subjects.length > 1 && (
            <div className="header-subject-tabs" role="tablist" aria-label="Subject">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  data-subject={s.slug}
                  aria-selected={s.id === selectedSubjectId}
                  className={s.id === selectedSubjectId ? "nav-link active" : "nav-link"}
                  onClick={() => onSelectSubject(s.id)}
                  title={s.description}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
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
