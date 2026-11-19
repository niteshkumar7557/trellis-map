import { prisma } from "../src/lib/prisma.js";

const TOPICS = [
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

async function main() {
  // 1. Upsert the subject "javascript"
  const subject = await prisma.subject.upsert({
    where: { slug: "javascript" },
    update: {
      name: "JavaScript fundamentals",
      description: "Learn JavaScript fundamentals in topic order.",
    },
    create: {
      slug: "javascript",
      name: "JavaScript fundamentals",
      description: "Learn JavaScript fundamentals in topic order.",
    },
  });

  // 2. Upsert every topic for this subject
  const topicMap = new Map();
  for (const t of TOPICS) {
    const topic = await prisma.topic.upsert({
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

  // 3. Delete this subject's TopicPrerequisite rows and recreate them from "needs"
  await prisma.topicPrerequisite.deleteMany({
    where: {
      topic: {
        subjectId: subject.id,
      },
    },
  });

  const prereqRows = [];
  for (const t of TOPICS) {
    const topicId = topicMap.get(t.slug).id;
    for (const needSlug of t.needs) {
      const prerequisiteId = topicMap.get(needSlug).id;
      prereqRows.push({ topicId, prerequisiteId });
    }
  }

  await prisma.topicPrerequisite.createMany({
    data: prereqRows,
  });

  console.log(`Seeded ${TOPICS.length} topics and ${prereqRows.length} prerequisite links for ${subject.slug}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
