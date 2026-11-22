# AGENTS.md

Read this first. It is for every AI agent working in this repo: Claude Code for Nitesh, and
Antigravity for Riya, Nihamika and Mansha.

## What this is

**Trellis** is a study planner built around a map of topics, for a backend course's
end-of-semester viva.

- It shows the topics of **JavaScript fundamentals** and **MongoDB fundamentals** in
  learning order and the next topic.
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

## The doc (the source of truth)

`docs/design.md` is the only doc. It has what the app does, the stack, the folders, the full
Prisma schema, how sign-in works, every API route, the exact rules (next topic, stuck hint,
prompt, AI), the 15 topics, `.env`, tests, the git workflow and who built what.

If code and the doc disagree, fix one of them in the same change.

## Rules for every agent

- **JavaScript only**, ES modules (`import`/`export`). No TypeScript.
- **The stack is fixed.** Use only these unless the owner of the part asks for more:
  - backend: Express 5, Prisma **6** (not 7), PostgreSQL, zod, bcrypt, jsonwebtoken,
    cookie-parser, passport + passport-google-oauth20, express-rate-limit, Vitest;
  - AI: Groq through plain `fetch`;
  - frontend: React + Vite.
- **Only touch the files the feature needs.** Each person's commits must stay in their own
  part. The shared files take one small addition each:
  - `schema.prisma`: add your model;
  - `app.js`: one line to mount your router;
  - `package.json`: add your dependencies.
- **Don't invent** routes, fields, file names or packages that aren't in `docs/design.md`.
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

## Current status (22 Nov 2026)

**The first version is complete and merged into `main`** (PRs #1 to #14): all four backend
parts, their tests (`npm test`: 12 files, 45 passed) and the frontend. `docs/design.md` §13
says who built what. The step-by-step checklist and the per-person docs have been removed;
they are in the git history if needed.

**Frontend redesign (22 Nov 2026), branch `frontend-design-system`:** a design system with
light and dark mode (`docs/design.md` §15). Frontend only; no backend changes.

**MongoDB fundamentals (22 Nov 2026), branch `feat/mongodb-subject`:** added MongoDB fundamentals
as a second subject with 12 topics, DAG validation, repeatable multi-subject seed, and
subject selection in the frontend map and admin views. All 13 test files passed (50 tests total).

**Next:** the viva deadline has been extended, so the team will add new features. Add each
feature to `docs/design.md` (what it does, its routes and fields, who owns it) before
building it, on that owner's branch.

## Keep this file current

When a feature is done, update "Current status" here and `docs/design.md`.
