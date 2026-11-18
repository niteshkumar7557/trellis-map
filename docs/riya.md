# Riya: Part 2, login and access control

You build accounts: sign up, log in, password hashing, the access token, and the
middlewares that guard routes. `requireAuth` checks **who** someone is, `requireAdmin`
checks **what they may do**, and the rate limiter stops password guessing. Mansha, Nitesh
and Nihamika all use your middlewares.

Read `docs/design.md` §5 (User), §6 and §7 (Auth) first.

## What you own

| File | What it does |
|---|---|
| `backend/prisma/schema.prisma` | The `Role` enum and the `User` model |
| `backend/src/auth/password.js` | `hashPassword(plain)` and `checkPassword(plain, hash)` with bcrypt |
| `backend/src/auth/tokens.js` | `signAccessToken(user)` and `verifyAccessToken(token)` with jsonwebtoken |
| `backend/src/auth/requireAuth.js` | Checks the `Authorization: Bearer` token and sets `req.user` |
| `backend/src/auth/requireAdmin.js` | 403 unless `req.user.role === "ADMIN"` |
| `backend/src/auth/rateLimits.js` | `loginLimiter` and `aiLimiter` |
| `backend/src/auth/auth.routes.js`, `auth.controller.js` | signup, login, `/me` |
| `backend/scripts/make-admin.js` | `npm run make-admin -- email` makes that user an admin |
| `backend/src/auth/*.test.js` | Your tests |

## Steps

Start once Nihamika has pushed the app skeleton: pull `main` and create your branch.

```bash
npm install bcrypt jsonwebtoken express-rate-limit
```

### 1. The `User` model

- Add `Role` and `User` from `design.md` §5. Leave out the lines marked "added by Part 3"
  and "added by Part 4".
- Run `npx prisma migrate dev --name users`.
- `passwordHash` can be null, because people who sign in with Google have no password.

### 2. Passwords (`password.js`)

```js
import bcrypt from "bcrypt";
const ROUNDS = 10; // each extra round doubles the work; 10 is the common default
export const hashPassword = (plain) => bcrypt.hash(plain, ROUNDS);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);
```

**Why bcrypt and not SHA-256:**

- bcrypt is **slow on purpose**, so guessing millions of passwords takes far too long.
- It adds a random **salt**, so two people with the same password get different hashes.
- The salt is stored inside the hash, so `compare` needs nothing else.

### 3. Access tokens (`tokens.js`)

- `signAccessToken(user)`: `jwt.sign({ sub: String(user.id), role: user.role },
  process.env.JWT_ACCESS_SECRET, { expiresIn: "15m" })`.
- `verifyAccessToken(token)`: `jwt.verify(…)`. It returns the payload, or **throws** if the
  token was changed or has expired.
- A JWT has three parts: header, payload, signature.
  - Anyone can **read** the payload; it's only base64. Never put secrets in it.
  - Only someone with the secret can make a **valid signature**, so nobody can change
    `role` to `ADMIN` without the server noticing.

### 4. The middlewares

**`requireAuth(req, res, next)`**

- Read `req.headers.authorization`. It must start with `"Bearer "`.
- Verify the token. Set `req.user = { id: Number(payload.sub), role: payload.role }`.
- Call `next()`.
- If the header is missing, or verification throws, call
  `next(new HttpError(401, "Please sign in"))`.

**`requireAdmin(req, res, next)`**

- `req.user.role === "ADMIN"` calls `next()`; otherwise call
  `next(new HttpError(403, "Admins only"))`.
- It always runs **after** `requireAuth`, so `req.user` is set.

**`rateLimits.js`**

```js
import { rateLimit } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10,             // 10 tries per 15 minutes per IP
  standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: { message: "Too many tries. Wait a few minutes." } },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10,
  keyGenerator: (req) => String(req.user.id),      // per user, so runs after requireAuth
  standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: { message: "You've used the AI a lot. Try again in a few minutes." } },
});
```

Mansha puts `aiLimiter` on her AI route.

### 5. The routes

Mount them in `app.js`: `app.use("/api", authRouter)`.

| Route | Steps |
|---|---|
| `POST /api/auth/signup` | 1. zod: `name` (1–80 chars), `email` (valid, lower-cased), `password` (8–72 chars; bcrypt only reads the first 72 bytes)<br>2. If the email is already used, throw 409<br>3. Hash the password and create the user<br>4. Return 201 `{ accessToken, user }` |
| `POST /api/auth/login` | 1. `loginLimiter` first<br>2. Find the user by email<br>3. If there's no user, no `passwordHash` (a Google-only account), or `checkPassword` fails, throw 401 **"Wrong email or password"**: the same message every time<br>4. Return `{ accessToken, user }` |
| `GET /api/me` | `requireAuth`, then load the user by `req.user.id` and return `{ user }` |

Never send `passwordHash`. Write one helper, `publicUser(user)`, that returns
`{ id, name, email, role }`, and use it everywhere.

**Why one message for wrong email and wrong password:** if they differed, anyone could find
out which emails have accounts.

**Nitesh's part plugs in here.** For now, signup and login send
`{ accessToken: signAccessToken(user), user }`. Nitesh replaces that one line with
`startSession(res, user)`, which also sets the refresh cookie. Keep the line easy to find.

### 6. `make-admin`

`scripts/make-admin.js` reads the email from `process.argv[2]` and runs
`prisma.user.update({ where: { email }, data: { role: "ADMIN" } })`. Add the script
`"make-admin": "node scripts/make-admin.js"` to `package.json`.

**Why a script and not a route:** there is no safe way for the first admin to make
themselves admin through the API. Someone with access to the server has to do it.

### 7. Your tests

`password.test.js`:

- `checkPassword` is true for the right password and false for a wrong one;
- the hash is not the password;
- hashing the same password twice gives different hashes (the salt).

`tokens.test.js`. Set the secret with `process.env.JWT_ACCESS_SECRET = "test-secret"` in
`beforeAll`.

- a signed token verifies and has the right `sub` and `role`;
- a token with one character changed throws;
- a token signed with a different secret throws.

`requireAuth.test.js`. Use a fake `req` and `next = vi.fn()`.

- no header calls `next` with an error whose status is 401;
- `Bearer garbage` gives the same 401;
- a good token sets `req.user` and calls `next()` with no argument.

`requireAdmin.test.js`:

- a student calls `next` with a 403 error;
- an admin calls `next()` with no argument.

## Suggested commits

1. `feat(auth): add user model with role`
2. `feat(auth): hash and check passwords with bcrypt`
3. `feat(auth): sign and verify access tokens`
4. `feat(auth): signup, login and /me`
5. `feat(auth): requireAuth and requireAdmin middlewares`
6. `feat(auth): rate limit login and AI routes`
7. `feat(auth): make-admin script`
8. `test(auth): passwords, tokens and middlewares`

## Viva questions to be ready for

- **Authentication vs authorization?** Authentication is proving who you are (`requireAuth`,
  401). Authorization is what you're allowed to do (`requireAdmin`, 403).
- **401 vs 403?** 401 means we don't know who you are. 403 means we know, and you're not
  allowed.
- **Why hash passwords? Why not encrypt?** Encryption can be undone with the key. A hash
  can't be undone, so even we can't read passwords, and a leaked database doesn't leak them.
- **What is a salt?** Random data mixed in before hashing, so equal passwords give
  different hashes and precomputed tables don't work.
- **What's inside a JWT? Can someone change it?** Header, payload, signature. They can read
  it, but changing anything breaks the signature, and `jwt.verify` refuses it.
- **Why does the access token expire in 15 minutes?** A JWT can't be cancelled once issued,
  so a stolen one should stop working soon. The refresh token (Nitesh's part) gets a new one.
- **Where is the token sent?** In the `Authorization: Bearer <token>` header.
- **What does rate limiting protect?** Login: password guessing. AI: one user using up our
  free API quota.
- **Why is the limit by IP for login but by user for AI?** Before login we don't know who
  you are; after `requireAuth` we do.
- **Why the same error for a wrong email and a wrong password?** So nobody can test which
  emails are registered.
