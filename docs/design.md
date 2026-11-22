# Trellis: design

A study planner built around a map of topics. It never explains a topic itself. It shows
what to study next, points to the earlier topic that is probably why you're stuck, and
writes a prompt you paste into your own AI.

Team: Nihamika, Riya, Nitesh and Mansha. Each person owns one backend part; §13 says who
built what.

---

## 1. The idea

Learning a subject like JavaScript goes wrong in a predictable way. You get stuck on
promises, and the real reason is that callbacks never made sense. Another explanation of
promises won't fix that.

Trellis knows which topic **needs** which, so it can:

- show the topics in learning order, with your status on each;
- tell you the **next** topic: the first one you haven't finished whose prerequisites you
  have;
- when you mark a topic **Stuck**, say "this may be because of *Callbacks*": an earlier
  topic you haven't finished;
- build a **prompt** for your own AI (ChatGPT, Claude, anything) that says what you know,
  what you don't and what you wrote down, and asks it to teach in small steps;
- optionally have an AI **improve that prompt** for you.

**The one rule: Trellis never teaches.** Explanations are free everywhere. Trellis does the
part a chat AI can't: it knows the shape of the subject and where you are in it. Even the
AI feature only rewrites the prompt; it never explains the topic.

## 2. What's in, what's out

**In:**

1. Sign up and log in with email and password, or with Google.
2. A short-lived access token plus a refresh token in a cookie; logout really ends the
   session.
3. Two subjects, **JavaScript fundamentals** (15 topics) and **MongoDB fundamentals** (12
   topics), with "needs" links between them, loaded by a seed script.
4. Subject switcher allowing students and admins to choose between subjects.
5. Topics shown in learning order (grouped by level).
6. A status on each topic: Not started, Learning, Done, Stuck. Plus a short note.
7. The next topic.
8. The stuck hint.
9. The prompt, built from a template, with a Copy button.
10. "Improve with AI": one Groq call that rewrites the prompt; falls back to the template if
    the AI fails.
11. An admin role: admins can add and edit topics. Students can't.
12. Rate limiting on login and on the AI route.
13. Unit tests (Vitest) for every part.

**Out (on purpose):** a chat, quizzes, explanations, third-party subjects beyond JS and
MongoDB, topics inside topics, password reset, email, deleting your account, deployment. The
app runs on our laptops for the demo.

## 3. Tech stack and why

| Piece | Choice | Why this one |
|---|---|---|
| Language | JavaScript everywhere, ES modules (`"type": "module"`) | One language for the whole team; `import`/`export` is the modern standard and what Vitest expects |
| Backend | Node.js 20+ and **Express 5** | Express 5 passes errors from `async` route handlers to the error handler by itself, so no `try/catch` in every route |
| Database | **PostgreSQL** with **Prisma 6** | Prisma turns the schema into tables (migrations) and gives a simple query API. We pin **version 6**: Prisma 7 generates a TypeScript client and needs a driver adapter, which is more to set up and explain in a JavaScript project |
| Validation | **zod** | One schema per request body; bad input becomes a 400 with a clear message |
| Passwords | **bcrypt** | Slow on purpose, salted, the standard choice |
| Tokens | **jsonwebtoken** for access tokens; a random string for refresh tokens | See §6 |
| Cookies | **cookie-parser** | Reads the refresh token cookie |
| Google sign-in | **passport** + **passport-google-oauth20** | The usual Express way to do OAuth; Passport handles the redirect and code exchange |
| Rate limiting | **express-rate-limit** | A ready middleware; about 10 lines |
| AI | **Groq** API, model `llama-3.1-8b-instant`, called with Node's built-in `fetch` | Free API key, very fast. Plain `fetch` (no SDK) so we can show exactly what is sent |
| Tests | **Vitest** | Fast, works with ES modules without setup, same `expect` style as Jest |
| Frontend | **React** with **Vite**, React Router | Built with AI; not part of the viva |
| Database for development | Postgres in **Docker** (`docker-compose.yml`) | Everyone gets the same database with one command. No Docker? Use a free Neon database and put its URL in `.env` |

## 4. Folders

The backend is split **by feature**, one folder per part. Each person mostly works in their
own folder, so their commits are easy to show and merge conflicts are rare.

```
trellis-map/
├── docs/design.md            # this doc
├── docker-compose.yml        # Postgres for development (Nitesh)
├── backend/
│   ├── package.json
│   ├── .env.example          # every variable, no real secrets
│   ├── prisma/
│   │   ├── schema.prisma     # every model; each part adds its own (see §5)
│   │   ├── migrations/       # made by `npx prisma migrate dev`
│   │   └── seed.js           # JavaScript fundamentals (Part 1)
│   └── src/
│       ├── server.js         # starts listening (Part 1)
│       ├── app.js            # builds the Express app; exported so tests can import it (Part 1)
│       ├── lib/              # prisma.js, httpError.js (Part 1)
│       ├── middleware/       # errorHandler.js, validate.js (Part 1)
│       ├── topics/           # Part 1: Nihamika
│       ├── auth/             # Part 2: Riya
│       ├── sessions/         # Part 3: Nitesh
│       └── progress/         # Part 4: Mansha
└── frontend/                 # React + Vite (Nitesh, built with AI)
```

Inside a feature folder:

- `*.routes.js` lists the URLs;
- `*.controller.js` reads the request and sends the response;
- plain logic files (`sortTopics.js`, `findNextTopic.js`, …) don't touch Express or the
  database.

That last rule is what makes unit tests easy: a plain function gets plain data and returns
plain data. Tests sit next to the file they test: `sortTopics.test.js` beside
`sortTopics.js`.

## 5. The database

One `schema.prisma`. Who adds which model is shown on the right.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---- Part 1 (Nihamika) ----
model Subject {
  id          Int     @id @default(autoincrement())
  slug        String  @unique            // "javascript"
  name        String
  description String
  topics      Topic[]
}

model Topic {
  id        Int      @id @default(autoincrement())
  subjectId Int
  subject   Subject  @relation(fields: [subjectId], references: [id])
  slug      String                         // "closures"; stable key for the seed
  name      String
  summary   String                         // one line: what the topic covers
  mistakes  String[]                       // common mistakes; Postgres supports arrays
  needs     TopicPrerequisite[] @relation("TopicNeeds")
  neededBy  TopicPrerequisite[] @relation("TopicNeededBy")
  progress  Progress[]                     // added by Part 4

  @@unique([subjectId, slug])
}

// "topic needs prerequisite". A join table, because a topic can need many topics
// and be needed by many.
model TopicPrerequisite {
  topicId        Int
  prerequisiteId Int
  topic          Topic @relation("TopicNeeds",    fields: [topicId],        references: [id], onDelete: Cascade)
  prerequisite   Topic @relation("TopicNeededBy", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@id([topicId, prerequisiteId])
}

// ---- Part 2 (Riya) ----
enum Role {
  STUDENT
  ADMIN
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String
  passwordHash String?                    // null for people who only use Google
  role         Role     @default(STUDENT)
  createdAt    DateTime @default(now())
  googleId      String?  @unique          // added by Part 3
  refreshTokens RefreshToken[]            // added by Part 3
  progress      Progress[]                // added by Part 4
}

// ---- Part 3 (Nitesh) ----
model RefreshToken {
  id        Int       @id @default(autoincrement())
  tokenHash String    @unique             // SHA-256 of the token; the token itself is never stored
  userId    Int
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?                     // set when it is swapped for a new one
  createdAt DateTime  @default(now())
}

// ---- Part 4 (Mansha) ----
enum Status {
  NOT_STARTED
  LEARNING
  DONE
  STUCK
}

model Progress {
  id        Int      @id @default(autoincrement())
  userId    Int
  topicId   Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic     Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  status    Status   @default(NOT_STARTED)
  note      String?
  updatedAt DateTime @updatedAt

  @@unique([userId, topicId])               // one row per student per topic
}
```

A topic with no `Progress` row counts as **Not started**, so we don't create 15 empty rows
for every new user.

**Migrations, to avoid stepping on each other:**

- always pull `main` before `npx prisma migrate dev --name <what-you-added>`;
- one migration per part;
- if Prisma complains that the database and the migrations disagree, run
  `npx prisma migrate reset`. That wipes the **development** database and runs the seed
  again; nothing real is lost.

## 6. Sign-in, step by step

**Two tokens, and why.**

- The **access token** is a JWT that lives 15 minutes.
  - It holds `{ sub: userId, role }`, signed with `JWT_ACCESS_SECRET`.
  - The frontend keeps it **in memory** and sends it as `Authorization: Bearer <token>`.
  - Checking it needs no database lookup, which is why it's fast.
  - It can't be cancelled, which is why it's short.
- The **refresh token** is a long random string (`crypto.randomBytes(48)`) that lives 7
  days.
  - It sits in an **httpOnly cookie**, so JavaScript in the page can't read it, which
    protects it from XSS.
  - The cookie's path is `/api/auth`, so it's only sent to the auth routes.
  - The database keeps only its **SHA-256 hash**, so a leaked database doesn't leak
    working tokens.
  - Its only use is getting a new access token.

**Flows:**

1. **Sign up / log in** (Riya). The password is checked with bcrypt, and then
   `startSession(res, user)` runs (Nitesh). It creates a refresh token, saves its hash,
   sets the cookie and returns a new access token. The response is
   `{ accessToken, user }`.
2. **Every protected request:** `requireAuth` (Riya) checks the access token and puts
   `{ id, role }` on `req.user`. No token or a bad one gives 401.
3. **Access token expired:** the frontend calls `POST /api/auth/refresh` (Nitesh).
   - The server hashes the cookie, finds the row, and checks it isn't used and isn't
     expired.
   - It marks that row used, then calls `startSession` again: new refresh token, new
     cookie, new access token.
   - This is **rotation**: each refresh token works once.
4. **Page reload:** the access token in memory is gone, so the frontend calls
   `/api/auth/refresh` once on load. The cookie survives reloads.
5. **Log out:** the server deletes the refresh token row and clears the cookie.
6. **Google:** `GET /api/auth/google` sends the browser to Google.
   - Google sends it back to `/api/auth/google/callback` with a code.
   - Passport swaps the code for the profile.
   - We find the user by `googleId`. Failing that, we find them by email and link
     Google. Failing that, we create the user.
   - Then `startSession` sets the cookie and redirects to the frontend. The frontend
     calls `/refresh` to get its access token. No token ever goes in the URL.
7. **Admin routes:** `requireAuth`, then `requireAdmin` (Riya), which gives 403 unless
   `req.user.role === "ADMIN"`. Someone becomes admin with
   `npm run make-admin -- someone@example.com`.

**Authentication vs authorization:** `requireAuth` answers "who are you?" (401 if
unknown). `requireAdmin` answers "are you allowed?" (403 if not).

## 7. The API

Every route is under `/api`. Every error has the same shape:

```json
{ "error": { "message": "Wrong email or password" } }
```

Status codes:

| Code | Meaning |
|---|---|
| 400 | Bad input (zod) |
| 401 | Not signed in |
| 403 | Not allowed |
| 404 | Not found |
| 409 | Email already used |
| 429 | Too many requests |
| 500 | Our bug |

### Auth (Parts 2 and 3)

| Method and path | Who | Body | Response |
|---|---|---|---|
| `POST /api/auth/signup` | anyone | `{ name, email, password }` (password ≥ 8 chars) | 201 `{ accessToken, user }` + refresh cookie |
| `POST /api/auth/login` | anyone, **rate limited** | `{ email, password }` | 200 `{ accessToken, user }` + refresh cookie |
| `GET /api/me` | signed in | | `{ user }` |
| `POST /api/auth/refresh` | refresh cookie | | `{ accessToken, user }` + new cookie |
| `POST /api/auth/logout` | refresh cookie | | 204 |
| `GET /api/auth/google` | anyone | | redirect to Google |
| `GET /api/auth/google/callback` | Google | | cookie + redirect to the frontend |

`user` is `{ id, name, email, role }`, never the password hash.

### Topics (Part 1)

| Method and path | Who | Body | Response |
|---|---|---|---|
| `GET /api/subjects` | anyone | | `{ subjects: [{ id, slug, name, description, topicCount }] }` |
| `GET /api/subjects/:id/topics` | anyone | | `{ subject, topics: [{ id, slug, name, summary, mistakes, level, needs: [topicId] }] }` in learning order |
| `POST /api/topics` | admin | `{ subjectId, name, summary, mistakes, needs }` | 201 `{ topic }` |
| `PUT /api/topics/:id` | admin | any of `{ name, summary, mistakes, needs }` | `{ topic }` |

`level` is how deep the topic sits:

- 0 means it needs nothing;
- otherwise it is 1 plus the highest level among the topics it needs.

The frontend shows one row per level. Adding or editing a topic so that the links go round
in a loop (A needs B, B needs A) is refused with 400, because a loop has no learning order.

### Progress and prompts (Part 4)

All of these need sign-in, and every query is limited to `req.user.id`.

| Method and path | Body | Response |
|---|---|---|
| `GET /api/subjects/:id/progress` | | `{ progress: [{ topicId, status, note, updatedAt }] }` |
| `PUT /api/progress/:topicId` | `{ status, note? }` | `{ progress, hint }`; `hint` is set when the status is `STUCK` |
| `GET /api/subjects/:id/next` | | `{ next: topic or null }` (`null` means every topic is done) |
| `GET /api/topics/:id/prompt` | | `{ prompt, hint }` |
| `POST /api/topics/:id/prompt/improve` | | `{ prompt, improved }`, **rate limited**. `improved: false` means the AI failed and this is the template prompt |

## 8. The rules, exactly

**Next topic** (`findNextTopic`): go through the topics in learning order. Return the
first one that is not Done and whose prerequisites are all Done. If every topic is Done,
return `null`.

**Stuck hint** (`findStuckHint`): look only at the stuck topic's **direct** prerequisites
that are not Done, and rank them:

1. Not started
2. Stuck
3. Learning

Return the top one with a reason, for example
`{ topicId, name, reason: "You haven't started Callbacks yet, and Promises needs it." }`.
If every prerequisite is Done, return `null`. The page then says: "Nothing underneath
looks weak. Try the prompt with a different way in."

It's always "**may be** because of": a guess, never a verdict. It's a fixed rule, not the
AI's opinion, so we can always explain why it said what it said.

**The prompt** (`buildPrompt`) is a template, filled in from the data:

```
I'm learning JavaScript fundamentals. The topic is Promises: <summary>.
I'm comfortable with: Functions, Callbacks.
I'm not solid on yet: Scope and hoisting.
My note: <the student's note, if any>.
Common mistakes to watch for: <the topic's mistakes>.
<status line>
Teach me in small steps and ask me one question after each step. Don't lecture.
When we finish, give me two lines: what I understood, and what is still unclear.
```

The status line depends on where the student is:

| Status | Status line |
|---|---|
| Stuck | "I'm stuck on this. Start with what I may be missing: Callbacks." |
| Done | "I think I know this. Quiz me first and only teach what I get wrong." |
| Anything else | (no line) |

A line with nothing to say (no note, no prerequisites) is left out.

**Improve with AI** (`improvePrompt`): send the template prompt to Groq.

- The system message: "You rewrite study prompts so they are clearer and more specific to
  this student. Keep every fact in the prompt. Return only the new prompt. Never explain
  the topic yourself."
- `temperature: 0.4`, and an 8-second timeout (`AbortSignal.timeout(8000)`).
- If anything goes wrong, return the template with `improved: false`: a network error, a
  non-200 answer, an empty reply, or the timeout. The page says "The AI is busy, here's the
  basic prompt." The feature can fail without breaking anything.

**Rate limits** (`express-rate-limit`):

| What | Limit | Key |
|---|---|---|
| Login | 10 tries per 15 minutes | IP address |
| AI improve | 10 per 15 minutes | user id |

Groq's free tier is one key shared by everyone, so the AI limit stops one student using it
all up.

## 9. The subjects

Seeded by `prisma/seed.js` (Part 1), which also holds each topic's summary and common
mistakes.

### 9.1 JavaScript fundamentals

| # | slug | Topic | Needs |
|---|---|---|---|
| 1 | `variables` | Variables and types | none |
| 2 | `operators` | Operators and expressions | variables |
| 3 | `conditionals` | Conditionals | operators |
| 4 | `loops` | Loops | conditionals |
| 5 | `functions` | Functions | variables |
| 6 | `arrays` | Arrays | loops, functions |
| 7 | `objects` | Objects | variables, functions |
| 8 | `scope` | Scope and hoisting | functions |
| 9 | `closures` | Closures | scope |
| 10 | `this` | The `this` keyword | objects, functions |
| 11 | `callbacks` | Callbacks | functions |
| 12 | `array-methods` | map, filter and reduce | arrays, callbacks |
| 13 | `errors` | Error handling | functions |
| 14 | `promises` | Promises | callbacks, errors |
| 15 | `async-await` | async and await | promises |

### 9.2 MongoDB fundamentals

| # | slug | Topic | Needs | Summary | Common mistakes |
|---|---|---|---|---|---|
| 1 | `documents` | Documents and BSON | none | Documents, collections, JSON vs BSON, and field types (ObjectId, string, number, date) | Thinking MongoDB is schemaless with no structure needed; using strings for IDs instead of ObjectId |
| 2 | `crud-insert` | Inserting documents | documents | insertOne, insertMany, auto-generated _id, and write concern basics | Re-inserting the same _id and hitting duplicate key errors; expecting insertMany to roll back on partial failure without transactions |
| 3 | `crud-find` | Querying documents | documents | find, findOne, query filters, equality, and projections | Omitting projection for unwanted fields; confusing query filter syntax with projection syntax |
| 4 | `comparison-operators` | Comparison and logical operators | crud-find | $eq, $ne, $gt, $gte, $lt, $lte, $in, $and, $or, $nor | Forgetting that $in takes an array; wrapping multiple fields in $and when implicit AND works |
| 5 | `nested-documents` | Embedded documents and dot notation | crud-find | Querying and updating nested fields with dot notation and nested object equality | Matching an entire subdocument when matching a single nested field was intended; forgetting quotes in dot notation ("address.city") |
| 6 | `arrays-query` | Querying arrays | nested-documents | Array field queries, $all, $size, $elemMatch, and element querying | Expecting multiple conditions on array elements to match the same element without $elemMatch; checking array length with comparison operators instead of $size |
| 7 | `crud-update` | Updating documents | crud-find | updateOne, updateMany, replaceOne, and field update operators ($set, $unset, $inc) | Forgetting $set and accidentally replacing the entire document; assuming updateOne updates all matching rows |
| 8 | `array-updates` | Updating arrays | crud-update, arrays-query | Array update operators: $push, $pull, $addToSet, and the positional operator ($) | Using $push when avoiding duplicates requires $addToSet; mutating the wrong array element with improper positional operators |
| 9 | `crud-delete` | Deleting documents | crud-find | deleteOne, deleteMany, and drop collection | Calling deleteMany with an empty filter and wiping all documents; confusing drop collection with deleting documents |
| 10 | `indexes` | Indexes and performance | crud-find | Single field indexes, compound indexes, explain(), and COLLSCAN vs IXSCAN | Creating too many indexes and slowing down writes; indexing fields in compound indexes in an order that violates equality-sort-range rules |
| 11 | `aggregation-pipeline` | Aggregation pipeline basics | comparison-operators | Pipeline concept, $match, $project, $limit, $skip, and $sort | Putting $project before $match and preventing index usage; confusing find() filters with aggregation stage syntax |
| 12 | `aggregation-group` | Grouping and transforming | aggregation-pipeline, array-updates | $group, accumulator expressions ($sum, $avg, $push), and $unwind | Forgetting that _id is required in $group; expecting $unwind to keep empty arrays without preserveNullAndEmptyArrays |

## 10. Environment variables (`backend/.env`)

```
PORT=4000
DATABASE_URL=postgresql://trellis:trellis@localhost:5433/trellis
JWT_ACCESS_SECRET=<a long random string>
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALLBACK_URL=http://localhost:5173/api/auth/google/callback
GROQ_API_KEY=<from console.groq.com>
GROQ_MODEL=llama-3.1-8b-instant
```

- `.env` is git-ignored; `.env.example` is committed.
- Postgres is mapped to port **5433**, so it doesn't clash with a Postgres someone already
  has on 5432.
- **The frontend and backend look like one site.** Vite's dev server forwards `/api/*` to
  `localhost:4000`. To the browser everything is `localhost:5173`, so the cookie just works
  and we need no CORS setup.
  - This is also why the Google callback URL uses port 5173.
  - In a real deployment a reverse proxy (nginx, Caddy) would do the same job.

## 11. Tests (Vitest)

Everyone writes unit tests for their own part. They need no database, no running server
and no internet. Run them with `npm test` (which is `vitest run`) inside `backend/`.

| Part | What is tested |
|---|---|
| 1 | `sortTopics` orders topics, gives the right levels, and catches a loop; the error handler sends the right status and shape |
| 2 | hash then check a password; sign then check a token; `requireAuth` (no token, bad token, good token); `requireAdmin` (student gets 403, admin passes) |
| 3 | `checkRefreshToken` refuses used and expired tokens; `findOrCreateGoogleUser` with a fake database: existing Google user, existing email, new user |
| 4 | `findNextTopic`, `findStuckHint` and `buildPrompt` on small made-up topic lists; `improvePrompt` with a faked `fetch`: success, error and timeout |

How code is written so it can be tested:

- Logic lives in plain functions.
- Functions that need the database **take it as an argument**, for example
  `findOrCreateGoogleUser(db, profile)`. A test passes a fake object instead of Prisma.
- `fetch` is faked with Vitest's `vi.stubGlobal`.

## 12. Git: how we work

- `main` is the shared branch. Each part gets its own branch (`part-1-topics`,
  `part-2-auth`, `part-3-sessions`, `part-4-progress`), merged into `main` with a pull
  request on GitHub.
- Before your first commit, set your own name and email:
  `git config user.name "..."` and `git config user.email "..."`. Use the email of your
  GitHub account, so your commits show under your name.
- Commit small and often, with clear messages, for example:
  `feat(auth): hash passwords with bcrypt on signup`.
- Shared files everyone touches, so keep the change to the lines you need:
  - `schema.prisma`: add your model;
  - `app.js`: one line to mount your router;
  - `package.json`: add your dependencies.

## 13. Who built what

Every part has its own branch and pull requests, merged with a merge commit, so each
person's commits show on GitHub under their name.

### Part 1, foundation and topics: Nihamika

- **The base of the backend:** the package, the Express app (`app.js`, `server.js`), the
  shared Prisma client and `HttpError` (`lib/`), the error handler and `validateBody`
  (`middleware/`).
- **The topic models:** `Subject`, `Topic` and `TopicPrerequisite` in `schema.prisma`.
- **The seed:** `prisma/seed.js` loads JavaScript fundamentals: 15 topics and their
  "needs" links.
- **`sortTopics`:** puts topics in learning order with a level each, and refuses a loop
  with 400.
- **The topic routes:** `GET /api/subjects`, `GET /api/subjects/:id/topics`, and the admin
  `POST /api/topics` and `PUT /api/topics/:id` (topic and links saved in one transaction).
- **Tests:** `sortTopics.test.js`. `errorHandler.test.js` was added by Nitesh.

### Part 2, login and access control: Riya

- **The `User` model** with a `Role` (`STUDENT` or `ADMIN`).
- **Passwords:** hashed and checked with bcrypt (`password.js`).
- **Access tokens:** 15-minute JWTs signed and checked (`tokens.js`).
- **`requireAuth`** (401 without a valid token) and **`requireAdmin`** (403 for students).
- **The routes:** `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/me`.
- **Rate limits** on login and on the AI route (`rateLimits.js`), and
  **`npm run make-admin`** (`scripts/make-admin.js`).
- **Tests:** passwords, tokens, `requireAuth`, `requireAdmin`.

### Part 3, sessions and Google: Nitesh

- **The `RefreshToken` model:** only the SHA-256 hash of the token is stored.
- **Refresh tokens:** created, hashed and checked (`refreshTokens.js`), and
  `startSession`, which sets the httpOnly cookie and returns an access token. Riya's signup
  and login call it.
- **The routes:** `POST /api/auth/refresh` (with rotation: each token works once) and
  `POST /api/auth/logout`.
- **Google sign-in** through Passport: `GET /api/auth/google` and its callback, with
  `findOrCreateGoogleUser`.
- **Tests:** `checkRefreshToken` and `findOrCreateGoogleUser` with a fake database.
- **Also:** the repo, `docker-compose.yml`, the Google and Groq setup, and the whole
  frontend (React + Vite, built with Claude Code): login and sign up, the map, the topic
  panel and the admin screen.

### Part 4, progress and AI: Mansha

- **The `Progress` model:** one row per student per topic, with a status and a note.
- **`findNextTopic`:** the first unfinished topic whose prerequisites are all done.
- **`findStuckHint`:** the earlier topic that "may be" why the student is stuck.
- **`buildPrompt`:** the study prompt from the template in §8.
- **`improvePrompt`:** one Groq call through `fetch`, falling back to the template if it
  fails or takes over 8 seconds.
- **The routes:** progress, next topic, prompt and "Improve with AI" (behind Riya's
  per-user AI rate limit), each behind `requireAuth`.
- **Tests:** all four functions; `improvePrompt` with a faked `fetch`.

## 14. Where this falls short of production

We know these and can say so if asked:

- **No HTTPS.** The demo runs on `localhost`. In production, cookies would be `secure` and
  everything would be HTTPS.
- **No reuse detection.** A stolen refresh token that's used before the real one still
  works once. A real system would notice a used token coming back and end every session
  for that user.
- **The rate limits are in memory.** They reset on restart, and with two servers each would
  count on its own. Production would keep the counts in Redis.
- **No logging or monitoring, no password reset, no email verification.**
- **Unit tests only.** There are no integration tests against a real database, and no CI
  running the tests on every push.

## 15. Frontend design system

The frontend has no backend logic of its own; this is how it looks, so every screen stays
consistent. Built with Claude Code (Nitesh); not part of the viva.

- **Files.** `frontend/src/index.css` imports three layers:
  - `styles/tokens.css`: every colour, size, radius and timing as a CSS variable, once for
    light and once for dark (`:root[data-theme="dark"]`). Nothing else uses a raw colour.
  - `styles/base.css`: plain elements and the shared controls: `.btn` (the one filled,
    near-black button per screen), `.btn-secondary`, `.btn-ghost`, `.icon-btn`, `.field`,
    `.dot` (the status mark), `.notice`.
  - `styles/app.css`: the frame and the four screens.
- **Light and dark.** A small script in `index.html` sets `data-theme` on `<html>` before
  the page paints: the saved choice (`localStorage` key `trellis-theme`), otherwise the
  system setting. The moon/sun button in the header (`ThemeToggle` in `src/ui.jsx`, using
  `src/theme.js`) switches it and saves the choice.
- **Type.** Instrument Sans for everything; Instrument Serif only for the greeting.
  Sizes 12 / 14 / 15 / 16 / 22 / 32 / 44px. Numbers use tabular figures (`.num`).
- **Colour.** Neutral chrome; colour only means something. Deep teal is Done and the next
  topic, amber is Learning, red is Stuck, grey is Not started. Each status has one mark
  (`.dot`) used on the map, in the counts and in the panel, so the counts are the legend.
- **The frame.** The header sits on a tinted frame; each screen sits on a white sheet.
  Panels are one tone step off the sheet, with no shadows.
- **The map screen.** A greeting that names the next topic ("Asha, Objects is next.") with
  an "Open" button; a strip of 15 cells in learning order; four counts by status; the
  trellis, where a step's knot fills once all its topics are done. The topic panel opens
  beside the map (below it on narrow screens).
- **Phones.** Below 640px the frame goes and the sheet is the whole screen; counts go 2 x 2
  and topics stack.
- **Motion.** Feedback only (hover, press, the panel opening), and none when the system
  asks for reduced motion.
