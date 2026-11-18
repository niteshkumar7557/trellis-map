# Mansha: Part 4, progress and AI

You build what makes Trellis useful: each student's status and note on every topic, and
the three answers worked out from them:

- **the next topic**;
- **the stuck hint** ("this may be because of Callbacks");
- **the prompt** for the student's own AI, plus "Improve with AI" through Groq.

Read `docs/design.md` §1, §5 (Progress), §7 (Progress and prompts), §8 and §11 first.

## What you own

| File | What it does |
|---|---|
| `backend/prisma/schema.prisma` | The `Status` enum and the `Progress` model (plus the `progress` lines on `User` and `Topic`) |
| `backend/src/progress/findNextTopic.js` | The next topic, from topics + progress |
| `backend/src/progress/findStuckHint.js` | The likely earlier cause of being stuck |
| `backend/src/progress/buildPrompt.js` | The template prompt |
| `backend/src/progress/improvePrompt.js` | The Groq call, with timeout and fallback |
| `backend/src/progress/progress.routes.js`, `progress.controller.js` | Your five routes |
| `backend/src/progress/*.test.js` | Your tests |

## Steps

You can start **before** anyone else finishes: steps 1 to 3 are plain functions that need
no database, no Express and nobody else's code.

### 1. `findNextTopic(sortedTopics, statusById)`

- **Input:**
  - `sortedTopics` is the output of Nihamika's `sortTopics`: in learning order, each with
    `needs: [id]`;
  - `statusById` is an object such as `{ 5: "DONE", 8: "STUCK" }`. A missing id means
    `"NOT_STARTED"`.
- **Rule:** return the first topic that is not `DONE` and whose `needs` are all `DONE`.
  If every topic is done, return `null`.

**Why `statusById`:** looking a status up in an object is instant, while searching an
array for each topic would be slow. Build it once from the progress rows:

```js
Object.fromEntries(rows.map(r => [r.topicId, r.status]))
```

### 2. `findStuckHint(topic, topicsById, statusById)`

1. Take the topic's **direct** prerequisites that are not `DONE`.
2. Rank them: `NOT_STARTED` first, then `STUCK`, then `LEARNING`. On a tie, the one that
   comes first in learning order wins.
3. Return `{ topicId, name, reason }` for the top one, or `null` if every prerequisite is
   `DONE`.

The reason depends on the prerequisite's status:

| Its status | Reason |
|---|---|
| `NOT_STARTED` | "You haven't started Callbacks yet, and Promises needs it." |
| `STUCK` | "You're stuck on Callbacks too, and Promises builds on it." |
| `LEARNING` | "You're still learning Callbacks, and Promises needs it." |

**Why this order:** a prerequisite you never studied is the strongest sign of a gap. One
you're also stuck on comes next. One you're halfway through is the weakest.

### 3. `buildPrompt({ subjectName, topic, prereqs, statusById, note, hint })`

- Build the text in `design.md` §8 line by line.
  - "Comfortable with" lists the prerequisites that are `DONE`; "Not solid on yet" lists
    the rest.
  - The status line comes from the topic's own status.
- Leave out any line that would be empty, then `join("\n")`.
- **No AI here:** the same data always gives the same prompt, instantly and for free.

### 4. `improvePrompt(templatePrompt)`

```js
export async function improvePrompt(templatePrompt) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },   // the text in design.md §8
          { role: "user", content: templatePrompt },
        ],
      }),
      signal: AbortSignal.timeout(8000),                 // give up after 8 seconds
    });
    if (!res.ok) throw new Error(`Groq answered ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty answer");
    return { prompt: text, improved: true };
  } catch (err) {
    console.warn("AI improve failed:", err.message);
    return { prompt: templatePrompt, improved: false };  // the feature fails safely
  }
}
```

The key decisions, and why:

- **The key stays on the server.** If the frontend called Groq itself, anyone could open
  the browser's dev tools and copy our key.
- **There's a timeout.** Without one, a slow AI would leave the request hanging.
- **There's a fallback.** The student always gets a usable prompt; the AI only makes it
  better.
- **Plain `fetch`, no SDK.** We can show exactly what is sent and received. Groq's API has
  the same shape as OpenAI's.
- **The system message.** It keeps the AI to rewriting, never explaining the topic itself.

### 5. The `Progress` model

Wait until Riya's `User` model is merged into `main`, then pull.

- Add `Status` and `Progress` from `design.md` §5.
- Add `progress Progress[]` to both `User` and `Topic`.
- Run `npx prisma migrate dev --name progress`.

**Why `@@unique([userId, topicId])`:** it makes "one row per student per topic" a database
rule, not just a hope. It's also what `upsert` needs to find the row.

### 6. The routes

Every route uses `requireAuth` (Riya). **Every query includes `userId: req.user.id`.** A
student can only ever read or change their own rows: the user id comes from the token,
never from the request body.

| Route | Steps |
|---|---|
| `GET /api/subjects/:id/progress` | `prisma.progress.findMany({ where: { userId, topic: { subjectId } } })` |
| `PUT /api/progress/:topicId` | 1. zod: `status` (one of the four), `note` (optional, up to 500 chars)<br>2. 404 if the topic doesn't exist<br>3. `prisma.progress.upsert({ where: { userId_topicId: { userId, topicId } }, create: {…}, update: {…} })`<br>4. If the status is `STUCK`, work out the hint<br>5. Return `{ progress, hint }` |
| `GET /api/subjects/:id/next` | 1. Get the sorted topics with Nihamika's `getSortedTopics(prisma, subjectId)` from `src/topics/topics.service.js`<br>2. Build `statusById`<br>3. Return `{ next: findNextTopic(…) }` |
| `GET /api/topics/:id/prompt` | 1. Load the topic with its prerequisites, and this user's progress on them and on the topic<br>2. Work out the hint if the topic is `STUCK`<br>3. Return `{ prompt: buildPrompt(…), hint }` |
| `POST /api/topics/:id/prompt/improve` | 1. `requireAuth`, then `aiLimiter` (Riya)<br>2. Build the template as above<br>3. Return `await improvePrompt(template)` |

**Why upsert:** the first time a student sets a status there's no row yet, and after that
there is. Upsert handles both in one database call, so there's no "check, then insert"
where two quick clicks could make two rows.

### 7. Your tests

`findNextTopic.test.js`. Use a made-up list of 4 topics: A; B needs A; C needs A; D needs
B and C.

- with nothing done, the next topic is A;
- with A done, it is B (the first in order);
- with A and B done, it is C;
- with A, B and C done, it is D, even if D is `STUCK`;
- with all done, it is `null`.

`findStuckHint.test.js`:

- with every prerequisite done, the hint is `null`;
- with one not started and one learning, the not-started one is named;
- with one stuck and one learning, the stuck one is named;
- the reason text names both topics.

`buildPrompt.test.js`:

- the prompt contains the topic name and the note;
- with no note there is no "My note" line;
- a `STUCK` topic has the "start with what I may be missing" line;
- a `DONE` topic has the "Quiz me first" line.

`improvePrompt.test.js`. Fake `fetch` with
`vi.stubGlobal("fetch", vi.fn(...))`, and call `vi.unstubAllGlobals()` in `afterEach`.

- a good answer gives `{ improved: true }` and the AI's text;
- a 500 answer gives `{ improved: false }` and the template;
- `fetch` throwing (network down or timeout) gives `{ improved: false }`;
- an empty `content` gives `{ improved: false }`.

## Suggested commits

1. `feat(progress): find the next topic`
2. `feat(progress): find the likely cause when stuck`
3. `feat(progress): build the study prompt from a template`
4. `feat(progress): improve the prompt with Groq, falling back to the template`
5. `feat(progress): add progress model`
6. `feat(progress): save status and note, list progress`
7. `feat(progress): next topic, prompt and AI routes`
8. `test(progress): next topic, stuck hint, prompt and AI fallback`

## Viva questions to be ready for

- **How do you stop one student reading another's progress?** The user id comes from the
  verified token (`req.user.id`), never from the request, and every query filters by it.
- **What is upsert? Why use it?** Update the row if it exists, otherwise create it, in one
  call. No duplicate rows, no race between "check" and "insert".
- **What does `@@unique([userId, topicId])` do?** The database refuses a second row for the
  same student and topic.
- **Why no row for a topic you haven't started?** Missing means Not started. That saves 15
  empty rows per user, and nothing needs fixing when topics are added.
- **How is the next topic chosen?** In learning order, the first topic not done whose
  prerequisites are all done.
- **How is the stuck hint chosen?** Direct prerequisites that aren't done, ranked: never
  started, then stuck, then still learning. It's a fixed rule, so we can always explain it.
- **Why is the AI on the backend, not the frontend?** To keep the API key secret, and to
  rate limit it.
- **What happens if Groq is down?** After 8 seconds at most, the student gets the template
  prompt and a note that the AI was busy. Nothing breaks.
- **Why does the app never let the AI explain topics?** That's the product's rule: we
  point and prepare, the student's own AI teaches.
- **How did you test the AI without calling it?** We replaced `fetch` with a fake one
  (`vi.stubGlobal`) that returns whatever the test needs: success, an error, or nothing.
