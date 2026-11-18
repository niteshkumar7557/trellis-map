# Checklist: three days, step by step

Every step says **who**, **what to paste into the AI**, **how to check it worked**, and
**what to commit**. Do the steps in order. Tick each box when it's done.

- Day 1 is 18 Nov, Day 2 is 19 Nov, Day 3 is 20 Nov. The viva is the day after.
- About 2 hours of coding a day.

**Who:**

| Name | Part | AI tool |
|---|---|---|
| **Nihamika** | Part 1 | Antigravity |
| **Riya** | Part 2 | Antigravity |
| **Nitesh** | Part 3 + frontend | Claude Code |
| **Mansha** | Part 4 | Antigravity |

---

## How to use the AI (Antigravity)

At the start of **every** new chat, paste this first. Put your own name and doc where it
says `<your-doc>`.

```
You are helping me build one small part of a student project called Trellis.
Rules:
- JavaScript only, ES modules (import/export). No TypeScript.
- Express 5, Prisma 6, zod, Vitest. Do not add any other package unless I ask.
- Only create or change the files I name in my message. Do not touch other files.
- Follow docs/design.md and docs/<your-doc>.md exactly. Do not invent new routes,
  fields, file names or packages.
- Keep the code short and simple. Add a short comment only where the reason is not obvious.
- When you finish, tell me which files you changed.
```

Then paste **one step's prompt at a time**. After each step:

1. **Read** what it changed. If it touched a file you didn't name, undo that part.
2. **Run** the "Check" command. If it fails, paste the error back to the AI with the words
   "fix this error, change only the files from the last step".
3. **Commit** with the given message.

**Windows:** run every command in **Git Bash** (it comes with git), not PowerShell.

**Small models make things up.** If the AI uses a package or a function name that isn't in
your doc, tell it: "use only what docs/`<your-doc>`.md says".

---

## How we use git (everyone)

Each person works on their own branch and opens a pull request (PR). **Nitesh merges.**

```bash
git checkout main && git pull                       # always start from the latest main
git checkout -b part-2-auth                         # your branch: part-1-topics / part-2-auth / part-3-sessions / part-4-progress
# ... do steps, commit after each one ...
git push -u origin part-2-auth                      # then open a PR on GitHub
```

- **Nitesh:** merge PRs with **"Create a merge commit"**, never "Squash", so everyone's
  commits stay visible under their own name.
- After a PR is merged, everyone runs these two commands in `backend/`:

  ```bash
  git checkout main && git pull
  npx prisma migrate dev
  ```

- If `migrate dev` complains, run `npx prisma migrate reset` (it only wipes your own
  development database), then go back to your branch and run
  `git merge main` to bring in the new code.

---

## Gates: who waits for whom

| Gate | Opens when this is merged into `main` | Who is waiting |
|---|---|---|
| **A** | Nihamika's app skeleton + Prisma + topic models (step 1.4) | Riya, Mansha, Nitesh's Part 3 |
| **B** | Nihamika's `getSortedTopics` and GET routes (step 1.7) | Mansha's routes (step 4.6) |
| **C** | Riya's `User` model, tokens and middlewares (step 2.5) | Mansha's progress model (4.5), Nitesh's sessions (3.1), Nihamika's admin routes (1.8) |

**If you're waiting on a gate,** do your next step that doesn't need it, or practise your
one-minute answer (at the end of this doc).

---

# Day 1 (18 Nov)

### Before anyone starts: Nitesh

- [x] **0.1 Nitesh: create the repo.**
  - Create `trellis-map` on GitHub and add Riya, Nihamika and Mansha as collaborators.
  - Copy in `docs/` and add `.gitignore`: `node_modules/`, `.env`, `dist/`, `coverage/`.
  - Add `docker-compose.yml` from `nitesh.md` §1.
  - Commit `chore: docs, gitignore and docker compose for postgres` and push to `main`.
- [x] **0.2 Nitesh: Google credentials.** Follow `nitesh.md` §1 ("Google credentials").
  Add every teammate's Gmail as a **test user**.
- [x] **0.3 Nitesh: Groq key and JWT secret.**
  - Make a key at console.groq.com.
  - Make the JWT secret with
    `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- [ ] **0.4 Nitesh: send the `.env` privately** to each teammate, one-to-one (not a group,
  not GitHub). Fill in the template from `design.md` §10.

### Everyone: set up your laptop (15 minutes)

- [ ] **0.5 Everyone: install the tools.** Node 20 or newer (`node -v` shows `v20` or
  higher), git, and Docker Desktop. Without Docker, make a free database at neon.tech and
  use its URL in `.env`.
- [ ] **0.6 Everyone: set your git name.** Use your GitHub account's email, or your commits
  won't show as yours.

  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "the-email-on-your-github-account"
  ```

- [ ] **0.7 Everyone: get the code and the database.**

  ```bash
  git clone https://github.com/niteshkumar7557/trellis-map.git && cd trellis-map
  docker compose up -d
  ```

  **Check:** `docker ps` shows a `postgres:18` container.

### Nihamika: Part 1, the foundation (do this first; everyone waits on it)

- [ ] **1.1 Nihamika: the backend project.**
  - Run the two `npm install` lines and set up `package.json` exactly as in `nihamika.md`
    step 1.
  - Put the `.env` from Nitesh in `backend/.env`.
  - Create `backend/.env.example` with the same names and empty values.

  Prompt:
  ```
  Read docs/nihamika.md step 1. Edit backend/package.json: add "type": "module",
  the scripts and the "prisma" block exactly as written there. Change nothing else.
  ```
  **Check:** `cat backend/package.json` shows `"type": "module"` and the six scripts.
  **Commit:** `chore: set up backend package`

- [ ] **1.2 Nihamika: the app, the server and the error handling.**

  Prompt:
  ```
  Read docs/nihamika.md steps 2 and 3. Create these files:
  backend/src/app.js (exactly the code in step 2, but leave out the topicsRouter import and its app.use line for now),
  backend/src/server.js (imports app from ./app.js and calls app.listen on process.env.PORT or 4000, logging the URL),
  backend/src/lib/httpError.js (export class HttpError extends Error, constructor(status, message)),
  backend/src/middleware/errorHandler.js (export function errorHandler(err, req, res, next) as described in step 3),
  backend/src/middleware/validate.js (export function validateBody(schema) as described in step 3).
  ```
  **Check:** `cd backend && npm run dev`. Then, in another terminal:
  `curl http://localhost:4000/api/anything` shows `{"error":{"message":"Not found"}}`.
  **Commit:** `chore: set up express app and error handling`

- [ ] **1.3 Nihamika: Prisma and the topic models.**
  - Run `npx prisma init`. Keep your `.env`; if Prisma overwrote it, paste Nitesh's
    values back in.

  Prompt:
  ```
  Read docs/design.md section 5. In backend/prisma/schema.prisma, write the generator and
  datasource blocks and ONLY the Part 1 models: Subject, Topic, TopicPrerequisite.
  In Topic, leave out the line "progress Progress[]".
  Then create backend/src/lib/prisma.js that exports one PrismaClient: export const prisma = new PrismaClient();
  ```
  **Check:** `npx prisma migrate dev --name topics` ends with "Your database is now in
  sync with your schema."
  **Commit:** `feat(topics): add subject and topic models`

- [ ] **1.4 Nihamika: push and open a PR.** Tell Nitesh to merge it. **Gate A is open.**
  Tell the team.

### Riya: Part 2, the start (after gate A)

- [ ] **2.1 Riya: the `User` model.** Run `git checkout main && git pull`, then
  `git checkout -b part-2-auth`. Then run `npm install bcrypt jsonwebtoken express-rate-limit`
  in `backend/`.

  Prompt:
  ```
  Read docs/design.md section 5. In backend/prisma/schema.prisma, add the Role enum and
  the User model. Leave out the three lines marked "added by Part 3" and "added by Part 4"
  (googleId, refreshTokens, progress). Do not change the other models.
  ```
  **Check:** `npx prisma migrate dev --name users` ends with "in sync".
  **Commit:** `feat(auth): add user model with role`

- [ ] **2.2 Riya: passwords, with the test first.**

  Prompt:
  ```
  Read docs/riya.md steps 2 and 7. Create backend/src/auth/password.test.js with the three
  tests listed under password.test.js, using Vitest (import { describe, it, expect } from "vitest").
  Then create backend/src/auth/password.js exactly as in step 2.
  ```
  **Check:** `npx vitest run src/auth/password.test.js` shows **3 passed**.
  **Commit:** `feat(auth): hash and check passwords with bcrypt`

- [ ] **2.3 Riya: access tokens, with the test first.**

  Prompt:
  ```
  Read docs/riya.md steps 3 and 7. Create backend/src/auth/tokens.test.js with the three
  tests under tokens.test.js (set process.env.JWT_ACCESS_SECRET = "test-secret" in beforeAll).
  Then create backend/src/auth/tokens.js with signAccessToken(user) and verifyAccessToken(token)
  as in step 3.
  ```
  **Check:** `npx vitest run src/auth/tokens.test.js` shows **3 passed**.
  **Commit:** `feat(auth): sign and verify access tokens`

### Mansha: Part 4, the plain functions (after gate A; no database needed)

- [ ] **4.1 Mansha: `findNextTopic`, with the test first.** Run
  `git checkout main && git pull`, then `git checkout -b part-4-progress`.

  Prompt:
  ```
  Read docs/mansha.md steps 1 and 7. Create backend/src/progress/findNextTopic.test.js with
  the five tests under findNextTopic.test.js, using this made-up list:
  A (id 1, needs []), B (id 2, needs [1]), C (id 3, needs [1]), D (id 4, needs [2, 3]).
  Then create backend/src/progress/findNextTopic.js:
  export function findNextTopic(sortedTopics, statusById). A missing id in statusById means "NOT_STARTED".
  ```
  **Check:** `npx vitest run src/progress/findNextTopic.test.js` shows **5 passed**.
  **Commit:** `feat(progress): find the next topic`

- [ ] **4.2 Mansha: `findStuckHint`, with the test first.**

  Prompt:
  ```
  Read docs/mansha.md steps 2 and 7. Create backend/src/progress/findStuckHint.test.js with
  the four tests under findStuckHint.test.js. Then create backend/src/progress/findStuckHint.js:
  export function findStuckHint(topic, topicsById, statusById), returning { topicId, name, reason }
  or null. Use the exact reason sentences from step 2.
  ```
  **Check:** `npx vitest run src/progress/findStuckHint.test.js` shows **4 passed**.
  **Commit:** `feat(progress): find the likely cause when stuck`

- [ ] **4.3 Mansha: `buildPrompt`, with the test first.**

  Prompt:
  ```
  Read docs/design.md section 8 ("The prompt") and docs/mansha.md steps 3 and 7.
  Create backend/src/progress/buildPrompt.test.js with the four tests under buildPrompt.test.js.
  Then create backend/src/progress/buildPrompt.js:
  export function buildPrompt({ subjectName, topic, prereqs, statusById, note, hint }) returning a string.
  Use the template lines from design.md section 8 exactly. Leave out empty lines.
  ```
  **Check:** `npx vitest run src/progress/buildPrompt.test.js` shows **4 passed**.
  **Commit:** `feat(progress): build the study prompt from a template`

### Nitesh: the frontend

- [ ] **N.1 Nitesh (Claude Code): the frontend skeleton.**
  - Vite + React in `frontend/`, with the `/api` proxy, `src/api.js` and the Login and
    Sign up screens.
  - Everything follows `nitesh.md` §3.
  - **Commit:** `feat(frontend): vite app, api client and login screens`

---

# Day 2 (19 Nov)

### Nihamika

- [ ] **1.5 Nihamika: the seed.** Run `git checkout -b part-1-topics` from the latest
  `main`.

  Prompt:
  ```
  Read docs/nihamika.md step 5. Create backend/prisma/seed.js. It imports prisma from
  ../src/lib/prisma.js, upserts the subject (slug "javascript", name "JavaScript fundamentals",
  a one-line description), upserts all 15 topics from the table (slug, name, summary, mistakes as
  an array of the two mistakes), then deletes this subject's TopicPrerequisite rows and recreates
  them from the "Needs" column with createMany. Use the table's text exactly.
  ```
  **Check:**
  - `npx prisma db seed` finishes with no error.
  - In `npx prisma studio`, `Topic` has 15 rows and `TopicPrerequisite` has 19 rows.
  - Run the seed a second time: the counts are the same.

  **Commit:** `feat(topics): seed JavaScript fundamentals`

- [ ] **1.6 Nihamika: `sortTopics`, with the test first.**

  Prompt:
  ```
  Read docs/nihamika.md steps 6 and 8. Create backend/src/topics/sortTopics.test.js with the
  four tests under sortTopics.test.js (for the "15 real topics" test, write the 15 slugs and needs
  from the table in docs/design.md section 9 as a plain array in the test file).
  Then create backend/src/topics/sortTopics.js: export function sortTopics(topics) using Kahn's
  algorithm as described in step 6. Each topic is { id, needs: [ids], ...rest }. Return the topics
  with a level added, sorted by level then id. Throw new HttpError(400, ...) on a loop.
  ```
  **Check:** `npx vitest run src/topics/sortTopics.test.js` shows **4 passed**.
  **Commit:** `feat(topics): sort topics into learning order with levels`

- [ ] **1.7 Nihamika: the GET routes and `getSortedTopics`.**

  Prompt:
  ```
  Read docs/nihamika.md step 7 (only the two GET routes and getSortedTopics, not POST/PUT).
  Create backend/src/topics/topics.service.js with export async function getSortedTopics(db, subjectId).
  Create backend/src/topics/topics.controller.js with listSubjects and listTopics.
  Create backend/src/topics/topics.routes.js exporting topicsRouter (an express.Router) with
  GET /subjects and GET /subjects/:id/topics.
  In backend/src/app.js add: import { topicsRouter } from "./topics/topics.routes.js";
  and app.use("/api", topicsRouter); in the place step 2 shows.
  ```
  **Check:**
  - `curl http://localhost:4000/api/subjects` shows one subject with `"topicCount":15`.
  - `curl http://localhost:4000/api/subjects/1/topics` shows `variables` first with
    `"level":0`.
  - `curl http://localhost:4000/api/subjects/99/topics` shows the 404 error.

  **Commit:** `feat(topics): list subjects and topics`

  Push and open a PR. When it's merged, **gate B is open**.

### Riya

- [ ] **2.4 Riya: `requireAuth` and `requireAdmin`, with the tests first.**

  Prompt:
  ```
  Read docs/riya.md steps 4 and 7. Create backend/src/auth/requireAuth.test.js and
  backend/src/auth/requireAdmin.test.js with the tests listed (fake req objects, next = vi.fn()).
  Then create backend/src/auth/requireAuth.js and backend/src/auth/requireAdmin.js as in step 4.
  Import HttpError from ../lib/httpError.js.
  ```
  **Check:** `npx vitest run src/auth` shows **11 passed**.
  **Commit:** `feat(auth): requireAuth and requireAdmin middlewares`

- [ ] **2.5 Riya: the routes, rate limits and make-admin.**

  Prompt:
  ```
  Read docs/riya.md steps 4, 5 and 6. Create backend/src/auth/rateLimits.js exactly as in step 4.
  Create backend/src/auth/auth.controller.js (signup, login, me, and a publicUser(user) helper
  returning { id, name, email, role }) and backend/src/auth/auth.routes.js exporting authRouter with
  POST /auth/signup, POST /auth/login (loginLimiter first) and GET /me (requireAuth first).
  Validate bodies with validateBody from ../middleware/validate.js and zod schemas as in step 5.
  For now signup and login respond with { accessToken: signAccessToken(user), user: publicUser(user) }.
  In backend/src/app.js add the import and app.use("/api", authRouter); after the topics line.
  Create backend/scripts/make-admin.js as in step 6 and add the "make-admin" script to package.json.
  ```
  **Check:**
  - Sign up:

    ```bash
    curl -X POST http://localhost:4000/api/auth/signup -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com","password":"password123"}'
    ```

    shows an `accessToken`.
  - The same command again shows a 409 error.
  - A wrong password on `/api/auth/login` shows "Wrong email or password".

  **Commit:** `feat(auth): signup, login, /me, rate limits and make-admin`

  Push and open a PR. When it's merged, **gate C is open**. Tell the team.

### Mansha

- [ ] **4.4 Mansha: `improvePrompt`, with the test first.**

  Prompt:
  ```
  Read docs/design.md section 8 ("Improve with AI") and docs/mansha.md steps 4 and 7.
  Create backend/src/progress/improvePrompt.test.js with the four tests under improvePrompt.test.js,
  faking fetch with vi.stubGlobal("fetch", vi.fn(...)) and calling vi.unstubAllGlobals() in afterEach.
  Then create backend/src/progress/improvePrompt.js with the code from step 4. SYSTEM_MESSAGE is the
  exact system message text from design.md section 8.
  ```
  **Check:** `npx vitest run src/progress` shows **17 passed**.
  **Commit:** `feat(progress): improve the prompt with Groq, falling back to the template`

- [ ] **4.5 Mansha: the `Progress` model (after gate C).** Run `git merge main` on your
  branch.

  Prompt:
  ```
  Read docs/design.md section 5. In backend/prisma/schema.prisma add the Status enum and the
  Progress model, and add the line "progress Progress[]" to both the User and Topic models.
  Do not change anything else.
  ```
  **Check:** `npx prisma migrate dev --name progress` ends with "in sync".
  **Commit:** `feat(progress): add progress model`

- [ ] **4.6 Mansha: the five routes (after gates B and C).**

  Prompt:
  ```
  Read docs/mansha.md step 6. Create backend/src/progress/progress.controller.js and
  backend/src/progress/progress.routes.js exporting progressRouter with the five routes in the table.
  Every route uses requireAuth from ../auth/requireAuth.js. The improve route uses requireAuth
  then aiLimiter from ../auth/rateLimits.js. Every query filters by userId: req.user.id.
  Use getSortedTopics from ../topics/topics.service.js, findNextTopic, findStuckHint,
  buildPrompt and improvePrompt from this folder. Validate the PUT body with zod
  (status: one of NOT_STARTED, LEARNING, DONE, STUCK; note: optional string up to 500 chars).
  In backend/src/app.js add the import and app.use("/api", progressRouter);
  ```
  **Check:** sign up with curl (Riya's check) and copy the `accessToken`. Then:

  ```bash
  curl http://localhost:4000/api/subjects/1/next -H "Authorization: Bearer <token>"
  ```

  shows Variables and types. Without the header, it shows 401.

  **Commit:** `feat(progress): progress, next topic, prompt and AI routes`

  Push and open a PR.

### Nitesh

- [ ] **3.1 Nitesh: Part 3 (after gate C).** Steps 1 to 5 of `nitesh.md` §2, a commit
  each, as listed there. Swap `startSession` into Riya's signup and login. Push and open a
  PR.
- [ ] **N.2 Nitesh: frontend screens.** The map, the topic panel and the admin screen,
  wired to the real API.

---

# Day 3 (20 Nov)

### Building (first hour)

- [ ] **1.8 Nihamika: the admin routes (after gate C).**

  Prompt:
  ```
  Read docs/nihamika.md step 7 (POST /api/topics and PUT /api/topics/:id).
  Add createTopic and updateTopic to backend/src/topics/topics.controller.js and add the two
  routes to topics.routes.js with requireAuth, requireAdmin, validateBody(...) before the controller.
  Create the topic and its TopicPrerequisite rows in one prisma.$transaction. In PUT, if needs
  changes, run sortTopics on the subject's topics with the new links first; a loop must give 400 and save nothing.
  ```
  **Check:**
  - A student's token on `POST /api/topics` gives 403.
  - Run `npm run make-admin -- t@t.com`, log in again for a new token, and the same
    request gives 201.

  **Commit:** `feat(topics): admin routes to add and edit topics`

- [ ] **1.9 Nihamika: the error handler test.**

  Prompt:
  ```
  Read docs/nihamika.md step 8. Create backend/src/middleware/errorHandler.test.js with the two tests listed,
  using a fake res = { status: vi.fn().mockReturnThis(), json: vi.fn() }.
  ```
  **Check:** `npx vitest run src/middleware` shows **2 passed**.
  **Commit:** `test(topics): error handler`

  Push and open a PR.
- [ ] **3.2 Nitesh: Part 3 tests**, `nitesh.md` §2 step 6. Push and merge every open PR.

### Everyone together (second hour)

- [ ] **5.1 Everyone: pull and run everything.**

  ```bash
  git checkout main && git pull
  cd backend && npm install
  npx prisma migrate reset     # answer yes; it re-seeds
  npm test
  ```

  **Check:** every test file passes, 0 failed.
- [ ] **5.2 Everyone: the demo, once through on Nitesh's laptop.** Follow `nitesh.md` §4.
  Fix anything that breaks, on a `fix/...` branch.
- [ ] **5.3 Everyone: practise your one-minute answer** (below) out loud, twice. Then
  ask each other the questions from your own doc's "Viva questions" list.
- [ ] **5.4 Nitesh: the night before.**
  - Run the demo again from a fresh `migrate reset`.
  - Check that the Google sign-in still works.
  - Have `npm test` ready in a terminal tab.

---

## Your one-minute answer

Say this when asked "what did you build?" Point at your files on GitHub while you talk.

**Nihamika:**
- I built the base of the backend: the Express app, the error handling and the database
  for topics.
- Topics link to the topics they need through a join table, because it's many-to-many.
- A seed script loads 15 JavaScript topics, using upsert so it can run again safely.
- To show topics in learning order I wrote a topological sort (Kahn's algorithm). It also
  refuses loops, because a loop has no order.
- Admins can add and edit topics.
- I tested the sort and the error handler with Vitest.

**Riya:**
- I built sign up and log in.
- Passwords are hashed with bcrypt, which is slow and salted, so a leaked database doesn't
  leak passwords.
- Logging in gives a JWT access token that lasts 15 minutes.
- `requireAuth` checks that token and gives 401 if it's missing or wrong. That's
  authentication.
- `requireAdmin` gives 403 to non-admins. That's authorization.
- I added rate limiting on login against password guessing.
- I tested hashing, tokens and both middlewares with Vitest.

**Nitesh:**
- I built sessions and Google sign-in.
- The access token is short, so a refresh token in an httpOnly cookie gets a new one. Page
  JavaScript can't read that cookie.
- We store only its hash, and each refresh token works once. That's rotation.
- Logout deletes it.
- Google sign-in uses Passport: Google sends back a code, Passport swaps it for the profile,
  and we find or create the user.
- I also set up the repo and the frontend, which was built with AI.

**Mansha:**
- I built progress: each student's status and note on each topic.
- One row per student per topic, enforced by a unique key and saved with upsert.
- Every query is filtered by the user id from the token, so nobody sees anyone else's data.
- From that data the backend works out the next topic, the "may be stuck because of" hint,
  and a study prompt.
- "Improve with AI" sends the prompt to Groq from the server, so the key stays secret. It
  has a timeout, and falls back to the basic prompt if the AI fails.
- I tested all of it with Vitest, faking the AI call.
