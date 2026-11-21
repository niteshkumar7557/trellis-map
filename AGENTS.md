# AGENTS.md

Read this first. It is for every AI agent working in this repo: Claude Code for Nitesh, and
Antigravity for Riya, Nihamika and Mansha.

## What this is

**Trellis** is a study planner built around a map of topics, for a backend course's
end-of-semester viva.

- It shows the topics of **JavaScript fundamentals** in learning order and the next topic.
- When a topic is marked Stuck, it says which earlier topic "may be" the cause.
- It builds a prompt for the student's own AI, with an optional "Improve with AI" through
  Groq.
- **It never explains topics itself.**

There are four people, each owning one backend part. The examiners ask only about the
backend. The viva is short: about one minute of questions each. **Keep everything simple.**

| Part | Who | Folder |
|---|---|---|
| 1: foundation and topics | Nihamika | `backend/src/topics/`, `lib/`, `middleware/`, `prisma/seed.js` |
| 2: login and access control | Riya | `backend/src/auth/`, `backend/scripts/make-admin.js` |
| 3: sessions and Google | Nitesh | `backend/src/sessions/` |
| 4: progress and AI | Mansha | `backend/src/progress/` |
| Frontend (React + Vite) | Nitesh, built with Claude Code | `frontend/` |

## The docs (the source of truth)

| Doc | What's in it |
|---|---|
| `docs/design.md` | What the app does, stack, folders, full Prisma schema, how sign-in works, every API route, the exact rules (next topic, stuck hint, prompt, AI), the 15 topics, `.env`, tests, git workflow |
| `docs/checklist.md` | **The three days, step by step.** Who does each step, the prompt to paste, the check, the commit. **Follow this.** |
| `docs/nihamika.md`, `docs/riya.md`, `docs/nitesh.md`, `docs/mansha.md` | Each part in detail, with its tests and likely viva questions |

If code and docs disagree, fix one of them in the same change.

## Rules for every agent

- **JavaScript only**, ES modules (`import`/`export`). No TypeScript.
- **The stack is fixed.** Use only these unless the owner of the part asks for more:
  - backend: Express 5, Prisma **6** (not 7), PostgreSQL, zod, bcrypt, jsonwebtoken,
    cookie-parser, passport + passport-google-oauth20, express-rate-limit, Vitest;
  - AI: Groq through plain `fetch`;
  - frontend: React + Vite.
- **Only touch the files the step names.** Each person's commits must stay in their own
  part. The shared files take one small addition each:
  - `schema.prisma`: add your model;
  - `app.js`: one line to mount your router;
  - `package.json`: add your dependencies.
- **Don't invent** routes, fields, file names or packages that aren't in the docs.
- Logic goes in **plain functions** that are easy to unit test. Anything needing the
  database takes it as an argument.
- **Every part has Vitest unit tests** that need no database, no server and no internet.
- **Secrets live only in `backend/.env`,** which git ignores. Never commit keys, and never
  put them in docs or in the frontend.
- Comments say **why**, briefly. Code must be simple enough for a beginner to explain.

## Git rules

- `main` is shared. Each part has its own branch: `part-1-topics`, `part-2-auth`,
  `part-3-sessions`, `part-4-progress`. Fixes go on `fix/...`.
- Merge pull requests with **"Create a merge commit", never "Squash"**, so each person's
  commits stay visible.
- **No co-author lines** in commit messages (no `Co-Authored-By`).
- Commit, push or merge only when the person you're working for asks.

## Current status (21 Nov 2026)

**Done:**

- [x] All docs written and approved by Nitesh.
- [x] Repo created locally and pushed to https://github.com/niteshkumar7557/trellis-map
  (`main`). It contains `docs/`, `.gitignore` and `docker-compose.yml` (Postgres 18 on
  port 5433).
- [x] **Day 1 is complete.**
  - Parts 1, 2 and 4 are merged into `main` (PRs #1 to #3). Gate A is open.
  - The frontend skeleton (N.1) is in `frontend/`: Vite + React, the `/api` proxy,
    `src/api.js`, and the Login and Sign up screens.

- [x] **Day 2 is complete.**
  - Parts 1, 2 and 4 are merged into `main` (PRs #6 to #8). Gates B and C are open.
  - Part 3 (3.1 and 3.2) is merged into `main` (PR #9): refresh with rotation, logout and
    Google sign-in, with `startSession` swapped into signup and login, and its tests. It
    also adds the missing `progress` migration.
  - The frontend screens (N.2) are on the `frontend` branch: the map, the topic panel and
    the admin screen, wired to the real API. The admin screen's save needs 1.8.

**Next:** 1.8 and 1.9, then 5.1 to 5.4 (Day 3 is running a day late). Known issues:

- `progressRouter.use(requireAuth)` covers all of `/api`, so unknown routes give 401, not
  404. Mansha fixes it on a `fix/...` branch.
- `GET /api/subjects/:id/next` gave 500: `getNextTopic` passed `{ subject, topics }` to
  `findNextTopic`. Fixed on `fix/next-topic`.

## Future work, in order (details in `docs/checklist.md`)

**Nitesh, before the session (checklist step 0):**

- [x] 0.1: add Riya, Nihamika and Mansha as collaborators on GitHub.
- [x] 0.2: Google OAuth credentials, with every teammate's Gmail and the demo account as
  **test users**. The redirect URI is `http://localhost:5173/api/auth/google/callback`.
- [x] 0.3: a Groq API key and a `JWT_ACCESS_SECRET`.
- [x] 0.4: send each teammate the filled-in `.env` privately.

**Day 1 (18 Nov):**

- [x] Everyone sets up their laptop (0.5 to 0.7).
- [x] Nihamika: 1.1 to 1.4. This opens **gate A**, which everyone waits on.
- [x] Riya: 2.1 to 2.3.
- [x] Mansha: 4.1 to 4.3.
- [x] Nitesh: N.1, the frontend skeleton.

**Day 2 (19 Nov):**

- [x] Nihamika: 1.5 to 1.7. This opens **gate B**.
- [x] Riya: 2.4 and 2.5. This opens **gate C**.
- [x] Mansha: 4.4 to 4.6.
- [x] Nitesh: 3.1 (Part 3, after gate C).
- [x] Nitesh: N.2 (the frontend screens).

**Day 3 (20 Nov):**

- [ ] Nihamika: 1.8 and 1.9.
- [x] Nitesh: 3.2 (Part 3 tests) and merge every open PR.
- [ ] Everyone: 5.1 to 5.4 (run everything, rehearse the demo, practise the one-minute
  answers).

**If time runs out, cut in this order:**

1. Admin `PUT`.
2. Google sign-in.
3. The AI route.

## Keep this file current

When a step is done, tick it here and in `docs/checklist.md`, and update "Current status".
