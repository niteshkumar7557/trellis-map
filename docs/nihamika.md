# Nihamika: Part 1, foundation and topics

You build the base everyone else stands on: the Express app, the database connection, the
error handling, the subject and its topics, and the admin routes that add and edit topics.
**Your first push unblocks the whole team**, so do steps 1 to 4 first and push them.

Read `docs/design.md` §3–§5, §7 (Topics), §9 and §11 first.

## What you own

| File | What it does |
|---|---|
| `backend/package.json` | Scripts and dependencies (others add theirs) |
| `backend/src/app.js` | Builds the Express app: JSON parsing, cookies, routes, error handler |
| `backend/src/server.js` | Starts the app on `PORT` |
| `backend/src/lib/prisma.js` | One shared Prisma client |
| `backend/src/lib/httpError.js` | `HttpError(status, message)`: an error that carries its status code |
| `backend/src/middleware/errorHandler.js` | Turns any error into `{ error: { message } }` with the right status |
| `backend/src/middleware/validate.js` | `validateBody(schema)`: checks `req.body` with zod; 400 if wrong |
| `backend/prisma/schema.prisma` | The `Subject`, `Topic`, `TopicPrerequisite` models |
| `backend/prisma/seed.js` | Loads JavaScript fundamentals |
| `backend/src/topics/sortTopics.js` | Learning order + levels; catches loops |
| `backend/src/topics/topics.service.js` | `getSortedTopics(db, subjectId)`: loads a subject's topics in learning order (Mansha uses it too) |
| `backend/src/topics/topics.routes.js`, `topics.controller.js` | The four topic routes |
| `backend/src/topics/sortTopics.test.js`, `backend/src/middleware/errorHandler.test.js` | Your tests |

## Steps

### 1. Set up the backend project

```bash
cd backend
npm init -y
npm install express@5 @prisma/client@6 zod cookie-parser dotenv
npm install -D prisma@6 vitest nodemon
```

In `package.json`, set `"type": "module"` and these scripts:

```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "test": "vitest run",
  "db:migrate": "prisma migrate dev",
  "db:seed": "prisma db seed"
},
"prisma": { "seed": "node prisma/seed.js" }
```

**Why `app.js` and `server.js` are separate:** `app.js` builds the app and exports it;
`server.js` only calls `app.listen`. Tests and other files can import the app without
starting a server.

### 2. `app.js`, the order matters

```js
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { topicsRouter } from "./topics/topics.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
app.use(express.json());        // turns a JSON body into req.body
app.use(cookieParser());        // turns the Cookie header into req.cookies (Part 3 needs it)

app.use("/api", topicsRouter);
// Others add their routers here, one line each.

// 404 for any /api route nobody matched, then the error handler. The error handler
// must be LAST: Express only sends an error to middleware registered after the route
// that threw it.
app.use("/api", (req, res) => res.status(404).json({ error: { message: "Not found" } }));
app.use(errorHandler);
```

### 3. Errors

- `HttpError` is a class that extends `Error` and adds `status`.
- Any route can `throw new HttpError(404, "Topic not found")`.
- Express 5 catches errors thrown in `async` handlers and passes them to `errorHandler`, so
  no `try/catch` is needed in routes.
- `errorHandler(err, req, res, next)`:
  - if `err.status` is set, send that status and `err.message`;
  - otherwise log the error and send 500 "Something went wrong". Never send the real
    message of an unknown error, because it can leak internals such as SQL or file paths.
- `validateBody(schema)` runs `schema.safeParse(req.body)`.
  - On failure it throws `HttpError(400, <first zod issue message>)`.
  - On success it replaces `req.body` with the parsed data, so extra fields are dropped.

### 4. Prisma and the topic models

- `npx prisma init` creates `prisma/schema.prisma` and `.env`.
- Copy the Part 1 models from `design.md` §5. Leave out the `progress` line on `Topic`;
  Mansha adds it.
- Run `npx prisma migrate dev --name topics`.
- `src/lib/prisma.js` exports one `new PrismaClient()`. **Why one:** each client opens its
  own pool of database connections, so making one per request would run out of them.

**Push here.** Everyone else can start now.

### 5. The seed

`prisma/seed.js` **upserts**: it creates a row when it's missing and updates it when it's
there. The subject is matched by `slug`, and each topic by `subjectId + slug`. So the seed
can run again and again without making duplicates, and it never breaks a student's progress.

1. Upsert the subject `javascript`, named "JavaScript fundamentals".
2. Upsert every topic from the table below.
3. Recreate the prerequisite links: delete this subject's `TopicPrerequisite` rows, then
   insert them from the "needs" column with `createMany`.

| slug | Name | Summary | Mistakes | Needs |
|---|---|---|---|---|
| `variables` | Variables and types | `let`, `const`, `var`, and the basic types: string, number, boolean, null, undefined | Using `var` and being surprised by its scope; thinking `const` makes an object unchangeable | none |
| `operators` | Operators and expressions | Arithmetic, comparison, logical operators, and type coercion | Using `==` instead of `===`; forgetting that `"5" + 1` is `"51"` | variables |
| `conditionals` | Conditionals | `if`/`else`, `switch`, the ternary operator, truthy and falsy values | Forgetting that `0` and `""` are falsy; missing `break` in a `switch` | operators |
| `loops` | Loops | `for`, `while`, `for...of`, `for...in`, `break` and `continue` | Off-by-one errors; using `for...in` on an array | conditionals |
| `functions` | Functions | Declarations, expressions, arrow functions, parameters and return values | Forgetting to `return`; arrow functions with braces returning `undefined` | variables |
| `arrays` | Arrays | Creating, reading and changing arrays; length, push, pop, slice, splice | Mixing up `slice` and `splice`; changing an array while looping over it | loops, functions |
| `objects` | Objects | Properties, dot and bracket access, nesting, destructuring, spread | Copying an object with `=` and changing the original; accessing a property of `undefined` | variables, functions |
| `scope` | Scope and hoisting | Global, function and block scope; hoisting; the temporal dead zone | Using a `let` variable before its line; expecting `var` to be block-scoped | functions |
| `closures` | Closures | A function remembers the variables around where it was created | The classic `var` in a loop bug; not seeing why a counter keeps its value | scope |
| `this` | The `this` keyword | What `this` points to in methods, plain functions, arrow functions; `bind` | Losing `this` when passing a method as a callback; expecting arrow functions to have their own `this` | objects, functions |
| `callbacks` | Callbacks | Passing a function to be called later; synchronous vs asynchronous callbacks | Calling the function instead of passing it (`f()` vs `f`); expecting code after a timer to wait | functions |
| `array-methods` | map, filter and reduce | Transforming arrays with callbacks instead of loops | Forgetting to return inside `map`; leaving out `reduce`'s starting value | arrays, callbacks |
| `errors` | Error handling | `throw`, `try`/`catch`/`finally`, error objects | Catching an error and doing nothing with it; throwing strings instead of `Error` objects | functions |
| `promises` | Promises | Pending, fulfilled and rejected; `then`, `catch`, chaining, `Promise.all` | Forgetting to return inside `then`; no `catch`, so errors vanish | callbacks, errors |
| `async-await` | async and await | Writing promise code that reads top to bottom; `try`/`catch` with `await` | Forgetting `await`; awaiting in a loop when `Promise.all` would run them together | promises |

Run `npx prisma db seed`, then check the data with `npx prisma studio`.

### 6. `sortTopics(topics)`: learning order and levels

- **Input:** `[{ id, needs: [id, …], …rest }]`.
- **Output:** the same topics, each with `level` added, sorted so that every topic comes
  **after** everything it needs. Sort by level, then by `id`, so the order is always the
  same.
- **The method:** Kahn's algorithm, a topological sort.
  1. Count how many prerequisites each topic has.
  2. Start with the topics that have none: level 0.
  3. Take one, and for each topic that needs it, lower that topic's count by one. When a
     count reaches 0, the topic can be placed: its level is 1 plus the highest level of
     its prerequisites.
  4. Repeat until nothing is left.
- **Loop check:** if some topics were never placed, the links go round in a loop. Throw
  `HttpError(400, "These topics need each other in a loop: …")`.
- This is a plain function: no Express, no Prisma. That's what makes it easy to test.

### 7. The routes

| Route | What it does |
|---|---|
| `GET /api/subjects` | `prisma.subject.findMany` with `_count: { select: { topics: true } }` |
| `GET /api/subjects/:id/topics` | Calls `getSortedTopics(prisma, subjectId)` (below) and returns `{ subject, topics }` |
| `POST /api/topics` | Admin only. Body checked by zod: `subjectId`, `name`, `summary`, `mistakes` (array), `needs` (array of ids). Make the `slug` from the name. Create the topic and its links in one `prisma.$transaction` |
| `PUT /api/topics/:id` | Admin only. Same fields, all optional. If `needs` changes, run `sortTopics` on the subject's topics with the new links **before** saving; a loop gives 400 and nothing is saved |

**`getSortedTopics(db, subjectId)`** goes in `src/topics/topics.service.js`.

1. Load the subject. If it's missing, throw `HttpError(404, "Subject not found")`.
2. Load its topics with `include: { needs: true }`.
3. Turn each topic's `needs` into a plain list of prerequisite ids.
4. Return `{ subject, topics: sortTopics(topics) }`.

Mansha's next-topic route needs exactly this, so it lives in one function she imports
instead of copying.

Routes 3 and 4 use `requireAuth` and `requireAdmin` from Riya:

```js
router.post("/topics", requireAuth, requireAdmin, validateBody(createTopicSchema), createTopic);
```

Write both routes while Riya builds the middlewares, then add the two middlewares to the
route lines when her code is merged.

**Why a transaction:** a topic and its prerequisite links should be saved together or not
at all. Without a transaction, a failure halfway would leave a topic without its links.

### 8. Your tests

`src/topics/sortTopics.test.js`:

- a small chain (A, B needs A, C needs B) comes back in order with levels 0, 1, 2;
- two topics that need nothing are both level 0;
- the 15 real topics come back with every topic after its prerequisites;
- A needs B and B needs A throws an error with status 400.

`src/middleware/errorHandler.test.js`. Use a fake `res`:
`{ status: vi.fn().mockReturnThis(), json: vi.fn() }`.

- an `HttpError(404, "x")` gives `status(404)` and `{ error: { message: "x" } }`;
- a plain `Error` gives 500 and does not send its message.

## Suggested commits

1. `chore: set up express app, prisma and error handling`
2. `feat(topics): add subject and topic models`
3. `feat(topics): seed JavaScript fundamentals`
4. `feat(topics): sort topics into learning order with levels`
5. `feat(topics): list subjects and topics`
6. `feat(topics): admin routes to add and edit topics`
7. `test(topics): sortTopics and the error handler`

## Viva questions to be ready for

- **What is middleware?** A function `(req, res, next)` that runs before the route. It can
  change `req`, end the response, or call `next()` to pass the request on.
- **Why does the error handler have four parameters?** That's how Express recognises an
  error handler: `(err, req, res, next)`.
- **Why is the error handler last?** Express only passes an error to middleware registered
  after the place where the error happened.
- **What does Prisma do?** It reads the schema, makes the SQL tables through migrations,
  and gives a JavaScript API (`findMany`, `create`, …) instead of writing SQL by hand.
- **What's a migration?** A SQL file recording one change to the database structure, kept
  in git, so everyone's database matches.
- **Why the `TopicPrerequisite` table?** A topic can need many topics and be needed by
  many: a many-to-many relation needs a join table.
- **What is upsert and why does the seed use it?** Create or update in one call. The seed
  can then run many times safely.
- **How do you find the learning order?** A topological sort (Kahn's algorithm). It also
  catches loops, which have no valid order.
- **Why validate with zod?** Never trust the client. Bad input becomes a clear 400 instead
  of a database error.
- **What's 404 vs 400?** 404 means the thing doesn't exist; 400 means the request itself is
  wrong.
