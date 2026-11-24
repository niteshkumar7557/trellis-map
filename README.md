# Trellis

**Live:** https://trellis.kumarnitesh.in

A study planner built around a map of topics. Trellis never explains a topic itself. It
shows what to study next, points to the earlier topic that may be why you're stuck, and
writes a prompt you paste into your own AI.

It covers four subjects: **JavaScript**, **Node.js**, **MongoDB** and **React**
fundamentals.

## What it does

- **The map:** each subject's topics in learning order, one row per step, with your status
  on each (Not started, Learning, Stuck, Done) and the next topic to study.
- **The stuck hint:** mark a topic Stuck and Trellis checks the topics it needs first. It
  names the one that may be why: one you haven't started, then one you're stuck on too,
  then one you're still learning. A fixed rule, not an AI.
- **The prompt:** a ready prompt for ChatGPT, Claude or any AI, built from the map, your
  statuses and your notes, with a Copy button.
- **Notes:** one note per topic, shown with Edit and Delete. Groq briefly summarizes the
  notes that go into the prompt; that is the only use of AI.
- **Sign-in:** email and password, or Google.
- **Admins** can add and edit topics.

## Stack

| | |
|---|---|
| Backend | Node.js 20+, Express 5, Prisma 6, PostgreSQL, zod |
| Auth | bcrypt, JWT access tokens, rotating refresh tokens in an httpOnly cookie, Passport (Google) |
| AI | Groq (`llama-3.1-8b-instant`) through plain `fetch` |
| Frontend | React, Vite, React Router, GSAP (landing page) |
| Tests | Vitest |

## Run it locally

You need Node.js 20+ and Docker (or any Postgres database).

```bash
# 1. Postgres on port 5433
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env      # fill it in: see docs/design.md §10
npm install
npm run db:migrate
npm run db:seed           # the four subjects and their topics
npm run dev               # http://localhost:4000

# 3. Frontend, in a second terminal
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173. Vite forwards `/api` to the backend, so the two act as one site.

To make a user an admin: `npm run make-admin -- you@example.com` (in `backend/`).

## Tests

```bash
cd backend
npm test
```

The unit tests need no database, no server and no internet.

## Docs and team

[`docs/design.md`](docs/design.md) is the full design: the schema, every API route, the
exact rules, the topics and who built what.

Built by Nihamika (foundation and topics), Riya (login and access control), Nitesh
(sessions, Google sign-in and the frontend) and Mansha (progress and AI).
