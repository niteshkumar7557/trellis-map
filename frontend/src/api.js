// Every request to the backend goes through here.

// The access token lives only in this variable, never in localStorage, so a script
// injected into the page can't read it from storage. It is gone on reload; the refresh
// cookie (httpOnly, which this code can't see) gets a new one.
let accessToken = null;

// One refresh at a time. Each refresh token works once (rotation), so two refreshes
// sent together would make the second one fail and sign the user out. Callers that
// arrive while one is running wait for that same one.
let refreshing = null;

function refresh() {
  if (!refreshing) {
    refreshing = fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          accessToken = null;
          return null;
        }
        const data = await res.json();
        accessToken = data.accessToken;
        return data.user;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

function send(path, { body, headers, ...options }) {
  return fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// apiFetch("/api/me") or apiFetch("/api/progress/3", { method: "PUT", body: { status } }).
// Returns the parsed JSON, or throws an Error with the server's error.message.
export async function apiFetch(path, options = {}) {
  let res = await send(path, options);

  // The access token has probably expired: get a new one once and try again. Not for
  // the auth routes, where a 401 means "wrong password", not "token expired".
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    if (await refresh()) res = await send(path, options);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error?.message || "Something went wrong. Try again.");
    error.status = res.status;
    throw error;
  }
  return data;
}

// On load: is someone signed in? Returns the user, or null.
export const restoreSession = () => refresh();

export async function login(email, password) {
  const data = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
  accessToken = data.accessToken;
  return data.user;
}

export async function signup(name, email, password) {
  const data = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: { name, email, password },
  });
  accessToken = data.accessToken;
  return data.user;
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } finally {
    // Forget the token even if the request failed, so the page is signed out.
    accessToken = null;
  }
}
