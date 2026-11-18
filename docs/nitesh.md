# Nitesh: repo setup, Part 3 (sessions and Google), and the frontend

Three jobs:

1. **Before the session:** set up the repo and the shared tools, so nobody waits.
2. **Part 3:** refresh tokens with rotation, logout, and Google sign-in through Passport.
3. **The frontend:** React + Vite, built with AI against the API in `design.md` §7. It isn't
   part of the viva; if asked, say plainly that it was built with AI.

Read all of `docs/design.md` first, especially §6.

## 1. Before the session

- [ ] Create the GitHub repo `trellis-map`, add the three teammates as collaborators, and
  push these docs.
- [ ] Add a root `.gitignore`: `node_modules/`, `.env`, `dist/`, `coverage/`.
- [ ] Add `docker-compose.yml`:

  ```yaml
  services:
    db:
      image: postgres:16
      environment:
        POSTGRES_USER: trellis
        POSTGRES_PASSWORD: trellis
        POSTGRES_DB: trellis
      ports:
        - "5433:5432"     # 5433 on the laptop, so it never clashes with another Postgres
      volumes:
        - trellis-db:/var/lib/postgresql/data
  volumes:
    trellis-db:
  ```

  Everyone runs `docker compose up -d`. Anyone without Docker makes a free Neon database
  and puts its URL in `DATABASE_URL`.
- [ ] **Google credentials** (Google Cloud Console → APIs & Services):
  1. Set up the **OAuth consent screen**: External, app name "Trellis", in **Testing**
     mode. Add as **test users** the team's Google accounts and any account you'll demo
     with. In Testing mode, only listed test users can sign in, so add them, or the demo
     fails.
  2. Under **Credentials**, create an **OAuth client ID** of type "Web application".
  3. Authorized redirect URI: `http://localhost:5173/api/auth/google/callback`. It must
     match exactly, port and path included.
  4. Copy the client ID and secret.
- [ ] Create a **Groq API key** at console.groq.com.
- [ ] Send the secrets to the team **privately** (not in the repo, not in a group chat that
  might be shared): the Google ID and secret, the Groq key, and a `JWT_ACCESS_SECRET`.
  Make the secret with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- [ ] Check that every teammate has Node 20+, Docker (or Neon) and git with their own
  `user.name` and `user.email`.

## 2. Part 3: sessions and Google

Start once Riya's `User` model and `tokens.js` are merged.

```bash
npm install passport passport-google-oauth20
```

### What you own

| File | What it does |
|---|---|
| `backend/prisma/schema.prisma` | The `RefreshToken` model, plus `googleId` and `refreshTokens` on `User` |
| `backend/src/sessions/refreshTokens.js` | `newRefreshToken()`, `hashToken()`, `checkRefreshToken()` |
| `backend/src/sessions/startSession.js` | `startSession(res, user)`: the one place a session begins |
| `backend/src/sessions/google.js` | The Passport Google strategy and `findOrCreateGoogleUser(db, profile)` |
| `backend/src/sessions/sessions.routes.js`, `sessions.controller.js` | refresh, logout, the two Google routes |
| `backend/src/sessions/*.test.js` | Your tests |

### Step 1: the model

- Add `RefreshToken`, and the `googleId` and `refreshTokens` lines on `User`, from
  `design.md` §5.
- Run `npx prisma migrate dev --name sessions`.

### Step 2: `refreshTokens.js`, plain functions

```js
import crypto from "node:crypto";

export const REFRESH_DAYS = 7;

// A random string, not a JWT. Its only job is to be unguessable and to be looked up
// in the database, so it needs nothing inside it.
export const newRefreshToken = () => crypto.randomBytes(48).toString("base64url");

// We store only the hash. If the database leaks, the hashes can't be used as cookies.
// SHA-256 is enough here (unlike passwords): the token is already long and random,
// so there's nothing to guess.
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Returns null when the row may be used, or the reason it can't be.
export function checkRefreshToken(row, now = new Date()) {
  if (!row) return "unknown";
  if (row.usedAt) return "used";
  if (row.expiresAt <= now) return "expired";
  return null;
}
```

### Step 3: `startSession(res, user)`

1. Make a token and save `{ tokenHash, userId, expiresAt: now + 7 days }`.
2. Set the cookie:

   ```js
   res.cookie("refreshToken", token, {
     httpOnly: true,        // page JavaScript can't read it, so XSS can't steal it
     sameSite: "lax",       // not sent on requests other sites start, except plain links
     secure: process.env.NODE_ENV === "production", // HTTPS only, once we have HTTPS
     path: "/api/auth",     // only sent to the auth routes, nowhere else
     maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
   });
   ```

3. Return `{ accessToken: signAccessToken(user), user: publicUser(user) }`.

Then, with Riya, swap the line in her signup and login controllers for
`res.json(await startSession(res, user))` (status 201 for signup). One commit of yours,
clearly named: `feat(sessions): start a session with a refresh cookie on login and signup`.

### Step 4: the routes

Mount them in `app.js`: `app.use("/api/auth", sessionsRouter)`.

**`POST /api/auth/refresh`**

1. Read `req.cookies.refreshToken`. If there's none, throw 401.
2. Find the row by `hashToken(token)`. If `checkRefreshToken(row)` gives a reason, clear
   the cookie and throw 401 "Please sign in again".
3. **Use it up atomically:**
   `prisma.refreshToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } })`.
   If `count` is 0, another request used it a moment ago, so throw 401.
4. Load the user and return `startSession(res, user)`: a new cookie and a new access token.

**Why `updateMany` with `usedAt: null`:** "check it's unused" and "mark it used" happen in
one SQL statement. Two requests racing with the same token can't both succeed.

**`POST /api/auth/logout`**

- `deleteMany` the row matching the cookie's hash.
- Clear the cookie with the same `path`.
- Return 204.
- Logout works even if the cookie is already gone: logging out twice isn't an error.

**`GET /api/auth/google`**

```js
passport.authenticate("google", { scope: ["profile", "email"], session: false })
```

**`GET /api/auth/google/callback`**

1. Run `passport.authenticate("google", { session: false, failureRedirect:
   FRONTEND_URL + "/login?error=google" })`.
2. Then `await startSession(res, req.user)` and `res.redirect(FRONTEND_URL)`.
3. The frontend then calls `/api/auth/refresh` to get its access token.

`session: false` is there because we use tokens, not server sessions.

### Step 5: `google.js`

```js
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try { done(null, await findOrCreateGoogleUser(prisma, profile)); }
    catch (err) { done(err); }
  },
));
```

Also add `app.use(passport.initialize())` in `app.js`, and import `google.js` there so the
strategy is registered.

`findOrCreateGoogleUser(db, profile)` takes the database as an argument, so tests can pass
a fake one:

1. Find the user by `googleId: profile.id`. If found, return them.
2. Take `profile.emails[0]`. If its `verified` is true and a user has that email, set their
   `googleId` and return them. This links Google to an existing email account.
3. Otherwise create `{ email, name: profile.displayName, googleId: profile.id }`. There's
   no password; Riya's login refuses password login for this account.

**Why only a verified email may link:** otherwise someone could make a Google account with
your email address and take over your Trellis account.

### Step 6: your tests

`refreshTokens.test.js`:

- `checkRefreshToken` gives `null` for a fresh row, `"used"` when `usedAt` is set,
  `"expired"` when `expiresAt` has passed, and `"unknown"` for `null`;
- `hashToken` gives the same hash for the same token, and a different one for a different
  token;
- two `newRefreshToken()` calls are never equal.

`google.test.js`. Use a fake `db`, built from `vi.fn()`:

```js
{ user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() } }
```

- an existing Google user is returned and nothing is created;
- an existing verified email gets `googleId` set (`update` called) and is returned;
- an unverified email is **not** linked;
- a brand-new person makes `create` get called with the right email, name and `googleId`.

### Suggested commits

1. `feat(sessions): add refresh token model`
2. `feat(sessions): create, hash and check refresh tokens`
3. `feat(sessions): start a session with a refresh cookie on login and signup`
4. `feat(sessions): refresh with rotation, and logout`
5. `feat(sessions): sign in with Google through passport`
6. `test(sessions): refresh tokens and Google find-or-create`

### Viva questions to be ready for

- **Why two tokens?**
  - The access token is checked without the database (fast) but can't be cancelled, so it
    lives 15 minutes.
  - The refresh token is checked against the database, so it *can* be cancelled (logout),
    and it lives 7 days.
- **Why is the refresh token in an httpOnly cookie, and the access token in memory?** Page
  JavaScript can't read an httpOnly cookie, so an XSS bug can't steal the long-lived token.
  The short-lived one is held in memory and is gone on reload. That's why the page calls
  `/refresh` on load.
- **What is rotation?** Each refresh token works once. Using it gives a new one, so a copied
  old token is useless.
- **Why store a hash of the refresh token?** A leaked database can't be turned into working
  cookies.
- **Why SHA-256 here, but bcrypt for passwords?** Passwords are short and guessable, so
  hashing must be slow. Refresh tokens are 48 random bytes, impossible to guess, so a fast
  hash is fine.
- **Walk through Google sign-in.**
  1. Our server redirects the browser to Google.
  2. The user agrees.
  3. Google redirects back with a one-time code.
  4. Passport swaps the code (with our client secret) for the user's profile.
  5. We find or create the user and start a session.
  6. We redirect to the frontend.
- **Why not put the token in the redirect URL?** URLs end up in history, logs and the
  `Referer` header. The cookie is set on the callback response instead.
- **What does `sameSite: "lax"` do?** The browser doesn't send the cookie on requests other
  sites start (forms, scripts), except top-level links. That blocks most CSRF attacks.
- **Why is `secure` off?** The demo is on `localhost` over HTTP. In production it would be
  on, so the cookie only travels over HTTPS.

## 3. The frontend (built with AI)

React + Vite, plain JavaScript, React Router. It is built against `design.md` §7 and can be
built while the backend is in progress.

`vite.config.js` forwards the API to the backend:

```js
server: { proxy: { "/api": "http://localhost:4000" } }
```

So the browser only ever sees `localhost:5173`: the cookie works and no CORS is needed
(`design.md` §10).

**`src/api.js`:**

- One `apiFetch(path, options)`. It adds `Authorization: Bearer <accessToken>` (kept in a
  module variable, never in localStorage) and `credentials: "include"`.
- On a 401 it calls `/api/auth/refresh` once and retries the request.
- On load it calls `/api/auth/refresh` to find out whether someone is signed in.

**Screens:**

- **Login / Sign up:** email and password, a "Continue with Google" link to
  `/api/auth/google`, and errors from `{ error.message }`.
- **Map:** the topics of JavaScript fundamentals, one row per `level`, each with its status
  colour. The **next** topic is highlighted. A header shows the user and Log out.
- **Topic panel** (opens on click):
  - the summary and the common mistakes;
  - four status buttons and the note box;
  - the stuck hint ("This **may be** because of Callbacks: …");
  - the prompt in a box with **Copy**;
  - **Improve with AI**, which shows "The AI is busy, here's the basic prompt" when
    `improved` is false.
- **Admin** (only when `user.role === "ADMIN"`): a form to add a topic (name, summary,
  mistakes, needs as checkboxes) and edit one.

Commit it as `feat(frontend): …`, a few commits by screen.

## 4. The demo, in order (about 5 minutes)

1. `docker compose up -d`; in `backend`, `npm run dev`; in `frontend`, `npm run dev`.
2. **Riya:**
   - sign up a new account;
   - show the hashed password in `npx prisma studio`;
   - try a wrong password 11 times to show the 429.
3. **Nihamika:**
   - the map in learning order;
   - the seed, and `GET /api/subjects/1/topics`.
4. **Mansha:**
   - mark Variables, Functions and Callbacks Done, and the next topic moves on;
   - mark Promises Stuck, and the hint names Error handling;
   - copy the prompt, then Improve with AI.
5. **Nitesh:**
   - reload the page and you're still signed in (refresh);
   - log out, then sign in with Google;
   - show the cookie (httpOnly) in dev tools.
6. **Riya + Nihamika:** `npm run make-admin -- <email>`, sign in, add a topic. The same
   request as a student gets 403.
7. **Everyone:** `npm test`. All tests pass.
