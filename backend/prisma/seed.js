import { prisma } from "../src/lib/prisma.js";

export const JAVASCRIPT_SUBJECT = {
  slug: "javascript",
  name: "JavaScript fundamentals",
  description: "Learn JavaScript fundamentals in topic order.",
};

export const JAVASCRIPT_TOPICS = [
  {
    slug: "variables",
    name: "Variables and types",
    summary: "let, const, var, and the basic types: string, number, boolean, null, undefined",
    mistakes: [
      "Using var and being surprised by its scope",
      "thinking const makes an object unchangeable",
    ],
    needs: [],
  },
  {
    slug: "operators",
    name: "Operators and expressions",
    summary: "Arithmetic, comparison, logical operators, and type coercion",
    mistakes: [
      "Using == instead of ===",
      'forgetting that "5" + 1 is "51"',
    ],
    needs: ["variables"],
  },
  {
    slug: "conditionals",
    name: "Conditionals",
    summary: "if/else, switch, the ternary operator, truthy and falsy values",
    mistakes: [
      'Forgetting that 0 and "" are falsy',
      "missing break in a switch",
    ],
    needs: ["operators"],
  },
  {
    slug: "loops",
    name: "Loops",
    summary: "for, while, for...of, for...in, break and continue",
    mistakes: [
      "Off-by-one errors",
      "using for...in on an array",
    ],
    needs: ["conditionals"],
  },
  {
    slug: "functions",
    name: "Functions",
    summary: "Declarations, expressions, arrow functions, parameters and return values",
    mistakes: [
      "Forgetting to return",
      "arrow functions with braces returning undefined",
    ],
    needs: ["variables"],
  },
  {
    slug: "arrays",
    name: "Arrays",
    summary: "Creating, reading and changing arrays; length, push, pop, slice, splice",
    mistakes: [
      "Mixing up slice and splice",
      "changing an array while looping over it",
    ],
    needs: ["loops", "functions"],
  },
  {
    slug: "objects",
    name: "Objects",
    summary: "Properties, dot and bracket access, nesting, destructuring, spread",
    mistakes: [
      "Copying an object with = and changing the original",
      "accessing a property of undefined",
    ],
    needs: ["variables", "functions"],
  },
  {
    slug: "scope",
    name: "Scope and hoisting",
    summary: "Global, function and block scope; hoisting; the temporal dead zone",
    mistakes: [
      "Using a let variable before its line",
      "expecting var to be block-scoped",
    ],
    needs: ["functions"],
  },
  {
    slug: "closures",
    name: "Closures",
    summary: "A function remembers the variables around where it was created",
    mistakes: [
      "The classic var in a loop bug",
      "not seeing why a counter keeps its value",
    ],
    needs: ["scope"],
  },
  {
    slug: "this",
    name: "The this keyword",
    summary: "What this points to in methods, plain functions, arrow functions; bind",
    mistakes: [
      "Losing this when passing a method as a callback",
      "expecting arrow functions to have their own this",
    ],
    needs: ["objects", "functions"],
  },
  {
    slug: "callbacks",
    name: "Callbacks",
    summary: "Passing a function to be called later; synchronous vs asynchronous callbacks",
    mistakes: [
      "Calling the function instead of passing it (f() vs f)",
      "expecting code after a timer to wait",
    ],
    needs: ["functions"],
  },
  {
    slug: "array-methods",
    name: "map, filter and reduce",
    summary: "Transforming arrays with callbacks instead of loops",
    mistakes: [
      "Forgetting to return inside map",
      "leaving out reduce's starting value",
    ],
    needs: ["arrays", "callbacks"],
  },
  {
    slug: "errors",
    name: "Error handling",
    summary: "throw, try/catch/finally, error objects",
    mistakes: [
      "Catching an error and doing nothing with it",
      "throwing strings instead of Error objects",
    ],
    needs: ["functions"],
  },
  {
    slug: "promises",
    name: "Promises",
    summary: "Pending, fulfilled and rejected; then, catch, chaining, Promise.all",
    mistakes: [
      "Forgetting to return inside then",
      "no catch, so errors vanish",
    ],
    needs: ["callbacks", "errors"],
  },
  {
    slug: "async-await",
    name: "async and await",
    summary: "Writing promise code that reads top to bottom; try/catch with await",
    mistakes: [
      "Forgetting await",
      "awaiting in a loop when Promise.all would run them together",
    ],
    needs: ["promises"],
  },
];

export const NODEJS_SUBJECT = {
  slug: "nodejs",
  name: "Node.js fundamentals",
  description: "Server-side JavaScript runtime, core modules, asynchronous I/O, and HTTP servers",
};

export const NODEJS_TOPICS = [
  {
    slug: "node-runtime",
    name: "Node.js runtime and CLI",
    summary: "The V8 engine, running scripts from the CLI, REPL, and node flags",
    mistakes: [
      "Expecting browser APIs like window or document to exist",
      "running scripts without node installed in PATH",
    ],
    needs: [],
  },
  {
    slug: "modules",
    name: "CommonJS and ES modules",
    summary: "require/module.exports vs import/export, package.json type field, and file extensions",
    mistakes: [
      "Mixing require and import in the same file without proper config",
      "forgetting file extensions in relative ESM imports",
    ],
    needs: ["node-runtime"],
  },
  {
    slug: "process-env",
    name: "Process and environment variables",
    summary: "process.env, process.argv, exit codes, and process lifecycle events",
    mistakes: [
      "Hardcoding secrets instead of reading process.env",
      "treating process.env values as numbers or booleans instead of strings",
    ],
    needs: ["node-runtime"],
  },
  {
    slug: "buffers",
    name: "Buffers and binary data",
    summary: "Buffer.from, Buffer.alloc, string encodings (utf-8, base64), and raw byte handling",
    mistakes: [
      "Assuming buffers resize automatically like arrays",
      "forgetting to specify encoding when converting buffers to strings",
    ],
    needs: ["node-runtime"],
  },
  {
    slug: "path-url",
    name: "Path and URL utilities",
    summary: "path.join, path.resolve, __dirname, fileURLToPath, and the URL class",
    mistakes: [
      "Concatenating paths with string slashes instead of path.join",
      "using __dirname directly in ES modules without import.meta.url",
    ],
    needs: ["modules"],
  },
  {
    slug: "events",
    name: "EventEmitter and event-driven architecture",
    summary: "Creating event emitters, emitting events, listening with on and once, and error events",
    mistakes: [
      "Emitting an error event without an error listener causing an uncaught exception",
      "adding duplicate listeners inside loops causing memory leaks",
    ],
    needs: ["modules"],
  },
  {
    slug: "npm-packages",
    name: "NPM and package management",
    summary: "package.json, npm install, dependencies vs devDependencies, and semantic versioning",
    mistakes: [
      "Committing node_modules to version control",
      "relying on globally installed packages instead of local dependencies",
    ],
    needs: ["modules"],
  },
  {
    slug: "fs-promises",
    name: "File system with promises",
    summary: "fs/promises for reading, writing, appending files, and handling file errors",
    mistakes: [
      "Using synchronous fs methods in request handlers",
      "not awaiting fs/promises calls leading to unhandled rejections",
    ],
    needs: ["path-url"],
  },
  {
    slug: "streams",
    name: "Streams and piping",
    summary: "Readable, Writable, pipeline, and streaming data without loading entire files into memory",
    mistakes: [
      "Using pipe instead of pipeline which leaks file descriptors on error",
      "forgetting to handle error events on individual streams",
    ],
    needs: ["events", "buffers"],
  },
  {
    slug: "http-server",
    name: "HTTP server fundamentals",
    summary: "http.createServer, req and res streams, status codes, headers, and basic routing",
    mistakes: [
      "Forgetting res.end() causing client requests to hang",
      "writing headers after the response body has started streaming",
    ],
    needs: ["streams", "fs-promises"],
  },
  {
    slug: "express-basics",
    name: "Express basics and routing",
    summary: "App setup, route handlers (get, post), route parameters, and query strings",
    mistakes: [
      "Defining routes in the wrong order so specific paths are caught by wildcards",
      "forgetting req.params values are strings",
    ],
    needs: ["http-server", "npm-packages"],
  },
  {
    slug: "middleware",
    name: "Middleware and error handling",
    summary: "Application, router, and built-in middleware, next(), and 4-argument error handlers",
    mistakes: [
      "Forgetting to call next() in custom middleware causing requests to stall",
      "omitting any of the 4 arguments in Express error middleware",
    ],
    needs: ["express-basics"],
  },
];

export const MONGODB_SUBJECT = {
  slug: "mongodb",
  name: "MongoDB fundamentals",
  description: "Learn MongoDB fundamentals, document modeling, queries, and aggregations in topic order.",
};

export const MONGODB_TOPICS = [
  {
    slug: "documents",
    name: "Documents and BSON",
    summary: "Documents, collections, JSON vs BSON, and field types (ObjectId, string, number, date)",
    mistakes: [
      "Thinking MongoDB is schemaless with no structure needed",
      "using strings for IDs instead of ObjectId",
    ],
    needs: [],
  },
  {
    slug: "crud-insert",
    name: "Inserting documents",
    summary: "insertOne, insertMany, auto-generated _id, and write concern basics",
    mistakes: [
      "Re-inserting the same _id and hitting duplicate key errors",
      "expecting insertMany to roll back on partial failure without transactions",
    ],
    needs: ["documents"],
  },
  {
    slug: "crud-find",
    name: "Querying documents",
    summary: "find, findOne, query filters, equality, and projections",
    mistakes: [
      "Omitting projection for unwanted fields",
      "confusing query filter syntax with projection syntax",
    ],
    needs: ["documents"],
  },
  {
    slug: "comparison-operators",
    name: "Comparison and logical operators",
    summary: "$eq, $ne, $gt, $gte, $lt, $lte, $in, $and, $or, $nor",
    mistakes: [
      "Forgetting that $in takes an array",
      "wrapping multiple fields in $and when implicit AND works",
    ],
    needs: ["crud-find"],
  },
  {
    slug: "nested-documents",
    name: "Embedded documents and dot notation",
    summary: "Querying and updating nested fields with dot notation and nested object equality",
    mistakes: [
      "Matching an entire subdocument when matching a single nested field was intended",
      'forgetting quotes in dot notation ("address.city")',
    ],
    needs: ["crud-find"],
  },
  {
    slug: "crud-update",
    name: "Updating documents",
    summary: "updateOne, updateMany, replaceOne, and field update operators ($set, $unset, $inc)",
    mistakes: [
      "Forgetting $set and accidentally replacing the entire document",
      "assuming updateOne updates all matching rows",
    ],
    needs: ["crud-find"],
  },
  {
    slug: "arrays-query",
    name: "Querying arrays",
    summary: "Array field queries, $all, $size, $elemMatch, and element querying",
    mistakes: [
      "Expecting multiple conditions on array elements to match the same element without $elemMatch",
      "checking array length with comparison operators instead of $size",
    ],
    needs: ["nested-documents"],
  },
  {
    slug: "array-updates",
    name: "Updating arrays",
    summary: "Array update operators: $push, $pull, $addToSet, and the positional operator ($)",
    mistakes: [
      "Using $push when avoiding duplicates requires $addToSet",
      "mutating the wrong array element with improper positional operators",
    ],
    needs: ["crud-update", "arrays-query"],
  },
  {
    slug: "crud-delete",
    name: "Deleting documents",
    summary: "deleteOne, deleteMany, and drop collection",
    mistakes: [
      "Calling deleteMany with an empty filter and wiping all documents",
      "confusing drop collection with deleting documents",
    ],
    needs: ["crud-find"],
  },
  {
    slug: "indexes",
    name: "Indexes and performance",
    summary: "Single field indexes, compound indexes, explain(), and COLLSCAN vs IXSCAN",
    mistakes: [
      "Creating too many indexes and slowing down writes",
      "indexing fields in compound indexes in an order that violates equality-sort-range rules",
    ],
    needs: ["crud-find"],
  },
  {
    slug: "aggregation-pipeline",
    name: "Aggregation pipeline basics",
    summary: "Pipeline concept, $match, $project, $limit, $skip, and $sort",
    mistakes: [
      "Putting $project before $match and preventing index usage",
      "confusing find() filters with aggregation stage syntax",
    ],
    needs: ["comparison-operators"],
  },
  {
    slug: "aggregation-group",
    name: "Grouping and transforming",
    summary: "$group, accumulator expressions ($sum, $avg, $push), and $unwind",
    mistakes: [
      "Forgetting that _id is required in $group",
      "expecting $unwind to keep empty arrays without preserveNullAndEmptyArrays",
    ],
    needs: ["aggregation-pipeline", "array-updates"],
  },
];

export const REACT_SUBJECT = {
  slug: "react",
  name: "React fundamentals",
  description: "Learn React fundamentals, component architecture, hooks, and state in topic order.",
};

export const REACT_TOPICS = [
  {
    slug: "jsx",
    name: "JSX and React elements",
    summary: "JSX syntax, React.createElement, embedding expressions, and element trees",
    mistakes: [
      "Treating JSX as HTML strings instead of syntactic sugar for React.createElement",
      "Returning multiple adjacent root elements without a fragment",
    ],
    needs: [],
  },
  {
    slug: "components",
    name: "Functional components and pure rendering",
    summary: "Functional components, pure rendering rules, and rendering versus DOM mutation",
    mistakes: [
      "Mutating external variables or DOM directly inside the render body",
      "Calling components as plain functions instead of JSX tags",
    ],
    needs: ["jsx"],
  },
  {
    slug: "props",
    name: "Props and component composition",
    summary: "Passing props, children prop, read-only props, and component composition",
    mistakes: [
      "Mutating props directly inside the child component",
      "Confusing children prop composition with inheritance",
    ],
    needs: ["components"],
  },
  {
    slug: "events",
    name: "Event handling and synthetic events",
    summary: "SyntheticEvent wrapper, inline vs named handlers, passing arguments, and default prevention",
    mistakes: [
      "Invoking the event handler immediately in JSX instead of passing a function reference (onClick={fn()})",
      "Expecting synthetic events to work identically to native DOM events in asynchronous callbacks",
    ],
    needs: ["components"],
  },
  {
    slug: "lists-and-keys",
    name: "Conditional and list rendering (keys)",
    summary: "Array mapping to JSX, stable key props, ternary and && conditional rendering",
    mistakes: [
      "Using array indexes as keys for dynamically reordered or filtered lists",
      "Rendering 0 or empty arrays with && and accidentally displaying 0 in the UI",
    ],
    needs: ["props"],
  },
  {
    slug: "state",
    name: "State and snapshots (useState)",
    summary: "useState hook, state as a snapshot, updater functions, and re-rendering triggers",
    mistakes: [
      "Mutating state objects or arrays in-place instead of creating new copies",
      "Reading state immediately after set state and expecting the new value synchronously",
    ],
    needs: ["components", "events"],
  },
  {
    slug: "reconciliation",
    name: "Render, commit and reconciliation",
    summary: "Virtual DOM diffing, render and commit phases, component identity by position and key",
    mistakes: [
      "Assuming state updates immediately touch the real DOM",
      "Resetting component state unexpectedly due to redefining component functions inside parent render",
    ],
    needs: ["lists-and-keys", "state"],
  },
  {
    slug: "controlled-inputs",
    name: "Controlled and uncontrolled inputs",
    summary: "Controlled input value and onChange binding, defaultValue, and form state handling",
    mistakes: [
      "Switching an input from uncontrolled to controlled by passing undefined value",
      "Updating controlled input value without providing an onChange handler",
    ],
    needs: ["state", "events"],
  },
  {
    slug: "lifting-state",
    name: "Lifting state and derived state",
    summary: "Sharing state between siblings via common ancestor and calculating derived values during render",
    mistakes: [
      "Duplicating derived state into useState instead of computing it during render",
      "Passing down state setters through excessive layers when state belongs higher or lower",
    ],
    needs: ["props", "state"],
  },
  {
    slug: "effects",
    name: "Side effects and synchronization (useEffect)",
    summary: "useEffect lifecycle, dependency array, cleanup functions, and synchronizing with external systems",
    mistakes: [
      "Omitting reactive values from the useEffect dependency array",
      "Using useEffect for calculating derived state instead of doing it during render",
    ],
    needs: ["state", "reconciliation"],
  },
  {
    slug: "refs",
    name: "Refs and escape hatches (useRef)",
    summary: "useRef for persistent mutable values without triggering re-render, and DOM node references",
    mistakes: [
      "Reading or writing ref.current during rendering rather than in effects or event handlers",
      "Using useRef when changing values should cause the UI to re-render",
    ],
    needs: ["reconciliation"],
  },
  {
    slug: "use-reducer",
    name: "Complex state with useReducer",
    summary: "useReducer hook, actions, dispatch, and predictable multi-step state transitions",
    mistakes: [
      "Performing side effects or mutating previous state directly inside the reducer function",
      "Overcomplicating simple isolated states that only require useState",
    ],
    needs: ["lifting-state"],
  },
  {
    slug: "context",
    name: "Context API and avoiding prop drilling",
    summary: "createContext, Provider, useContext, and broadcasting global state across the tree",
    mistakes: [
      "Putting high-frequency changing state into context causing unwanted re-renders across consumers",
      "Using Context as a replacement for component composition",
    ],
    needs: ["props", "lifting-state"],
  },
  {
    slug: "custom-hooks",
    name: "Custom hooks and logic reuse",
    summary: "Extracting reusable stateful logic into custom use* functions following hooks rules",
    mistakes: [
      "Thinking custom hooks share state values rather than state logic between component instances",
      "Violating rules of hooks by calling hooks conditionally inside custom hooks",
    ],
    needs: ["effects", "refs"],
  },
  {
    slug: "error-boundaries",
    name: "Error boundaries and async UI states",
    summary: "Class component error boundaries, getDerivedStateFromError, componentDidCatch, and suspense/loading fallbacks",
    mistakes: [
      "Expecting error boundaries to catch errors inside event handlers or asynchronous callbacks",
      "Forgetting fallback UI leaving a blank screen when render crashes",
    ],
    needs: ["effects", "props"],
  },
  {
    slug: "memoization",
    name: "Rendering performance and memoization",
    summary: "React.memo, useMemo, useCallback, and optimizing costly renders and object identity",
    mistakes: [
      "Prematurely wrapping cheap computations in useMemo adding unnecessary overhead",
      "Passing unstable inline object or function references defeating React.memo and useCallback",
    ],
    needs: ["reconciliation", "custom-hooks"],
  },
];

/**
 * Upserts a subject, its topics, and prerequisite links.
 * Preserves existing topic IDs and user progress records.
 */
export async function seedSubject(db, subjectData, topics) {
  const subject = await db.subject.upsert({
    where: { slug: subjectData.slug },
    update: {
      name: subjectData.name,
      description: subjectData.description,
    },
    create: {
      slug: subjectData.slug,
      name: subjectData.name,
      description: subjectData.description,
    },
  });

  const topicMap = new Map();
  for (const t of topics) {
    const topic = await db.topic.upsert({
      where: {
        subjectId_slug: {
          subjectId: subject.id,
          slug: t.slug,
        },
      },
      update: {
        name: t.name,
        summary: t.summary,
        mistakes: t.mistakes,
      },
      create: {
        subjectId: subject.id,
        slug: t.slug,
        name: t.name,
        summary: t.summary,
        mistakes: t.mistakes,
      },
    });
    topicMap.set(t.slug, topic);
  }

  // Delete only this subject's TopicPrerequisite links so progress and other subjects remain intact
  await db.topicPrerequisite.deleteMany({
    where: {
      topic: {
        subjectId: subject.id,
      },
    },
  });

  const prereqRows = [];
  for (const t of topics) {
    const topicId = topicMap.get(t.slug).id;
    for (const needSlug of t.needs) {
      const prerequisite = topicMap.get(needSlug);
      if (prerequisite) {
        prereqRows.push({ topicId, prerequisiteId: prerequisite.id });
      }
    }
  }

  if (prereqRows.length > 0) {
    await db.topicPrerequisite.createMany({
      data: prereqRows,
    });
  }

  console.log(`Seeded ${topics.length} topics and ${prereqRows.length} prerequisite links for ${subject.slug}.`);
  return { subject, topicCount: topics.length, prereqCount: prereqRows.length };
}

export const DEFAULT_SUBJECTS = [
  { subject: JAVASCRIPT_SUBJECT, topics: JAVASCRIPT_TOPICS },
  { subject: NODEJS_SUBJECT, topics: NODEJS_TOPICS },
  { subject: MONGODB_SUBJECT, topics: MONGODB_TOPICS },
  { subject: REACT_SUBJECT, topics: REACT_TOPICS },
];

export async function seedAll(db, subjects = DEFAULT_SUBJECTS) {
  const results = [];
  for (const entry of subjects) {
    if (entry.topics && entry.topics.length > 0) {
      const res = await seedSubject(db, entry.subject, entry.topics);
      results.push(res);
    }
  }
  return results;
}

async function main() {
  await seedAll(prisma);
}

// Run when called directly by "node prisma/seed.js"
if (process.argv[1]?.endsWith("seed.js")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
