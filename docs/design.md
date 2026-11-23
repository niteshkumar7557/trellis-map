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
3. Four subjects, **JavaScript fundamentals** (15 topics), **Node.js fundamentals** (12
   topics), **MongoDB fundamentals** (12 topics), and **React fundamentals** (16 topics), with
   "needs" links between them, loaded by a repeatable seed script.
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

**Out (on purpose):** a chat, quizzes, explanations, third-party subjects beyond JS,
Node.js, MongoDB, and React, topics inside topics, password reset, email, deleting your account, deployment. The
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

## 9b. The subject: Node.js fundamentals

Seeded by `prisma/seed.js`, which holds each topic's summary, common mistakes, and prerequisites.

| # | slug | Topic | Needs | Summary | Common mistakes |
|---|---|---|---|---|---|
| 1 | `node-runtime` | Node.js runtime and CLI | none | The V8 engine, running scripts from the CLI, REPL, and node flags | Expecting browser APIs like window or document to exist; running scripts without node installed in PATH |
| 2 | `modules` | CommonJS and ES modules | node-runtime | require/module.exports vs import/export, package.json type field, and file extensions | Mixing require and import in the same file without proper config; forgetting file extensions in relative ESM imports |
| 3 | `process-env` | Process and environment variables | node-runtime | process.env, process.argv, exit codes, and process lifecycle events | Hardcoding secrets instead of reading process.env; treating process.env values as numbers or booleans instead of strings |
| 4 | `buffers` | Buffers and binary data | node-runtime | Buffer.from, Buffer.alloc, string encodings (utf-8, base64), and raw byte handling | Assuming buffers resize automatically like arrays; forgetting to specify encoding when converting buffers to strings |
| 5 | `path-url` | Path and URL utilities | modules | path.join, path.resolve, __dirname, fileURLToPath, and the URL class | Concatenating paths with string slashes instead of path.join; using __dirname directly in ES modules without import.meta.url |
| 6 | `events` | EventEmitter and event-driven architecture | modules | Creating event emitters, emitting events, listening with on and once, and error events | Emitting an error event without an error listener causing an uncaught exception; adding duplicate listeners inside loops causing memory leaks |
| 7 | `npm-packages` | NPM and package management | modules | package.json, npm install, dependencies vs devDependencies, and semantic versioning | Committing node_modules to version control; relying on globally installed packages instead of local dependencies |
| 8 | `fs-promises` | File system with promises | path-url | fs/promises for reading, writing, appending files, and handling file errors | Using synchronous fs methods in request handlers; not awaiting fs/promises calls leading to unhandled rejections |
| 9 | `streams` | Streams and piping | events, buffers | Readable, Writable, pipeline, and streaming data without loading entire files into memory | Using pipe instead of pipeline which leaks file descriptors on error; forgetting to handle error events on individual streams |
| 10 | `http-server` | HTTP server fundamentals | streams, fs-promises | http.createServer, req and res streams, status codes, headers, and basic routing | Forgetting res.end() causing client requests to hang; writing headers after the response body has started streaming |
| 11 | `express-basics` | Express basics and routing | http-server, npm-packages | App setup, route handlers (get, post), route parameters, and query strings | Defining routes in the wrong order so specific paths are caught by wildcards; forgetting req.params values are strings |
| 12 | `middleware` | Middleware and error handling | express-basics | Application, router, and built-in middleware, next(), and 4-argument error handlers | Forgetting to call next() in custom middleware causing requests to stall; omitting any of the 4 arguments in Express error middleware |

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

### 9.3 React fundamentals

| # | slug | Topic | Needs | Summary | Common mistakes |
|---|---|---|---|---|---|
| 1 | `jsx` | JSX and React elements | none | JSX syntax, React.createElement, embedding expressions, and element trees | Treating JSX as HTML strings instead of syntactic sugar for React.createElement; returning multiple adjacent root elements without a fragment |
| 2 | `components` | Functional components and pure rendering | jsx | Functional components, pure rendering rules, and rendering versus DOM mutation | Mutating external variables or DOM directly inside the render body; calling components as plain functions instead of JSX tags |
| 3 | `props` | Props and component composition | components | Passing props, children prop, read-only props, and component composition | Mutating props directly inside the child component; confusing children prop composition with inheritance |
| 4 | `events` | Event handling and synthetic events | components | SyntheticEvent wrapper, inline vs named handlers, passing arguments, and default prevention | Invoking the event handler immediately in JSX instead of passing a function reference (onClick={fn()}); expecting synthetic events to work identically to native DOM events in asynchronous callbacks |
| 5 | `lists-and-keys` | Conditional and list rendering (keys) | props | Array mapping to JSX, stable key props, ternary and && conditional rendering | Using array indexes as keys for dynamically reordered or filtered lists; rendering 0 or empty arrays with && and accidentally displaying 0 in the UI |
| 6 | `state` | State and snapshots (`useState`) | components, events | useState hook, state as a snapshot, updater functions, and re-rendering triggers | Mutating state objects or arrays in-place instead of creating new copies; reading state immediately after set state and expecting the new value synchronously |
| 7 | `reconciliation` | Render, commit and reconciliation | lists-and-keys, state | Virtual DOM diffing, render and commit phases, component identity by position and key | Assuming state updates immediately touch the real DOM; resetting component state unexpectedly due to redefining component functions inside parent render |
| 8 | `controlled-inputs` | Controlled and uncontrolled inputs | state, events | Controlled input value and onChange binding, defaultValue, and form state handling | Switching an input from uncontrolled to controlled by passing undefined value; updating controlled input value without providing an onChange handler |
| 9 | `lifting-state` | Lifting state and derived state | props, state | Sharing state between siblings via common ancestor and calculating derived values during render | Duplicating derived state into useState instead of computing it during render; passing down state setters through excessive layers when state belongs higher or lower |
| 10 | `effects` | Side effects and synchronization (`useEffect`) | state, reconciliation | useEffect lifecycle, dependency array, cleanup functions, and synchronizing with external systems | Omitting reactive values from the useEffect dependency array; using useEffect for calculating derived state instead of doing it during render |
| 11 | `refs` | Refs and escape hatches (`useRef`) | reconciliation | useRef for persistent mutable values without triggering re-render, and DOM node references | Reading or writing ref.current during rendering rather than in effects or event handlers; using useRef when changing values should cause the UI to re-render |
| 12 | `use-reducer` | Complex state with `useReducer` | lifting-state | useReducer hook, actions, dispatch, and predictable multi-step state transitions | Performing side effects or mutating previous state directly inside the reducer function; overcomplicating simple isolated states that only require useState |
| 13 | `context` | Context API and avoiding prop drilling | props, lifting-state | createContext, Provider, useContext, and broadcasting global state across the tree | Putting high-frequency changing state into context causing unwanted re-renders across consumers; using Context as a replacement for component composition |
| 14 | `custom-hooks` | Custom hooks and logic reuse | effects, refs | Extracting reusable stateful logic into custom use* functions following hooks rules | Thinking custom hooks share state values rather than state logic between component instances; violating rules of hooks by calling hooks conditionally inside custom hooks |
| 15 | `error-boundaries` | Error boundaries and async UI states | effects, props | Class component error boundaries, getDerivedStateFromError, componentDidCatch, and suspense/loading fallbacks | Expecting error boundaries to catch errors inside event handlers or asynchronous callbacks; forgetting fallback UI leaving a blank screen when render crashes |
| 16 | `memoization` | Rendering performance and memoization | reconciliation, custom-hooks | React.memo, useMemo, useCallback, and optimizing costly renders and object identity | Prematurely wrapping cheap computations in useMemo adding unnecessary overhead; passing unstable inline object or function references defeating React.memo and useCallback |

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
| 1 | `sortTopics` orders topics, gives the right levels, and catches a loop (tested for JS, Node.js, and React); the error handler sends the right status and shape; `seedGraph.test.js` verifies topic graph validity, acyclicity, and repeatable seeding across all subjects (JS, Node.js, MongoDB, React) |
| 2 | hash then check a password; sign then check a token; `requireAuth` (no token, bad token, good token); `requireAdmin` (student gets 403, admin passes) |
| 3 | `checkRefreshToken` refuses used and expired tokens; `findOrCreateGoogleUser` with a fake database: existing Google user, existing email, new user |
| 4 | `findNextTopic`, `findStuckHint` and `buildPrompt` across topics; `improvePrompt` with a faked `fetch`: success, error and timeout |

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
- **The seed:** `prisma/seed.js` loads JavaScript fundamentals (15 topics), Node.js
  fundamentals (12 topics), MongoDB fundamentals (12 topics), and React fundamentals
  (16 topics) and their "needs" links repeatably without deleting user progress.
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

## 16. Landing page

The public front page. **Frontend only** (no backend change), built with Claude Code
(Nitesh); not part of the viva.

**Where it lives.** Signed out, `/` shows the landing page. Signed in, `/` stays the map.
No URL moves, and Google sign-in still lands on the map.

**The idea: the page is the map.** The first screen is the real map of a subject, drawn
with the app's own map styles, and every section after it shows one rule Trellis runs on
it, worked out live on a sample student.

| Section | What it shows |
|---|---|
| Hero | "The map of what you're learning." The subject's topics in learning order, one row per step, with the sample student's statuses and the next topic marked. A switcher picks one of the subjects. Pointing at a topic shows its summary, its status, what it needs, and whether it's next |
| Stuck | "Stuck is traced, not guessed." The sample student is stuck on Promises. The trace runs one step down to the topics Promises needs, shows each one's status, and names the weakest first (§8: not started, then stuck, then learning) |
| Prompt | "Your AI teaches. Trellis writes the prompt." The prompt for that stuck topic in its **three parts** (below), each lit on hover from its source, a working Copy button, and one line on "Improve with AI" |
| Subjects | Every subject as a miniature of its map, with its topic and step counts. Each links to sign-up |
| What it won't do | Five promises (teach, nag, judge, tell, forget) beside an espalier drawing that turns through the seasons |
| Start | One card: "Start your map", to sign-up, and a link to log in |
| Footer | Product links, the subjects, the promises, and the name across the page |

**Where the numbers come from.** Nothing on the page is typed in by hand:

- **The topics:** the public `GET /api/subjects` and `GET /api/subjects/:id/topics`.
- **The sample student:** a fixed status for some topics, by slug, in
  `frontend/src/landing/sample.js`.
- **The next topic and the stuck hint:** the backend's own `findNextTopic.js` and
  `findStuckHint.js`.
  - They're plain functions with no imports, so the frontend imports them straight from
    `backend/src/progress/`, through the Vite alias `@rules`.
  - If a rule changes, the landing page changes with it.
- **The prompt:** `buildLayeredPrompt` in `frontend/src/landing/layeredPrompt.js`. It uses
  the three-part structure prompts are moving to (see "The three-part prompt" below).
- **If the API isn't reachable:** the live sections say so in one line. The rest of the
  page still shows.

**The look.**

- The same layout as a poster-style landing: a wall with paper sheets on it.
- Instrument Serif headings, Instrument Sans text, and the app's teal and status
  colours.
- **It follows the theme.** In light mode the wall behind the hero and the footer is
  white; in dark mode it is charcoal. The hero map uses the app's own tokens for the
  theme the visitor is in, so it looks exactly like the map screen.
- The page has its own `--l-*` tokens in `frontend/src/landing/landing.css` for its whole
  fields of colour, set once for light and once for dark.
- Pictures are SVG drawn in code; there are no image files.

**Motion (GSAP).** The frontend now depends on `gsap` and `@gsap/react`.

- The hero map grows one step at a time, its links drawn just before its topics appear.
- On wide screens the stuck section is pinned while the trace plays with the scroll.
- Each section's parts rise in once as it arrives, and the espalier turns through its
  seasons.
- If the system asks for less motion, everything shows in its finished state.

**Files.** All in `frontend/src/landing/`:

| File | What it holds |
|---|---|
| `Landing.jsx` | The frame and the small sections |
| `HeroMap.jsx` | The hero map |
| `StuckTrace.jsx` | The stuck scene |
| `PromptSlip.jsx` | The prompt slip |
| `MiniMap.jsx` | A subject's miniature |
| `Espalier.jsx` | The drawing |
| `sample.js` | The sample student, and the data loading |
| `layeredPrompt.js` | The three-part prompt (below) |
| `landing.css` | The page's styles and `--l-*` tokens |

Also new is `frontend/src/lib/gsap.js`, which registers the plugins once. In `App.jsx`, the
`/` route chooses between the landing page and the map. A server that doesn't answer now
counts as signed out, so the landing page still shows. `MapPage.jsx` exports its
`TopicNode`, so the hero draws the same boxes as the map.

**The three-part prompt (planned for the backend).** The landing page already shows it; the
backend's `buildPrompt` will move to the same structure later (Nitesh). The prompt is
assembled, never generated, in three parts:

1. **Known:** what the map says.
   - The topic's status, as a sentence: "I'm learning JavaScript fundamentals and I'm
     stuck on Promises."
   - Each topic it needs, grouped: "I'm comfortable with…" (Done), "I'm shaky on…"
     (Learning or Stuck), "I haven't studied… yet" (Not started).
   - When stuck, the hint's topic is named as "my real gap".
2. **From my own notes:** this topic's note, plus the notes of up to two topics it needs
   that are Done (what worked there).
3. **How I'd like you to help:** fixed lines, in this order:
   - one or two lines for the topic's status (Stuck: start with the gap, then explain it a
     different way; Done: quiz me first; Learning: pick up where I stopped; Not started:
     tell me where it fits);
   - the topic's common mistakes ("Watch for the usual traps: …");
   - five lines for every prompt: small steps with a question after each, short examples,
     no lecturing, use my notes without reminding me of past mistakes, and end with two
     lines to paste back.

**Checks.** The frontend has no test runner. The page is checked with `npm run build` and
in a browser at desktop and phone widths, in light and dark, with and without reduced
motion.
