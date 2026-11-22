import { describe, it, expect } from "vitest";
import { sortTopics } from "./sortTopics.js";
import { HttpError } from "../lib/httpError.js";

describe("sortTopics", () => {
  it("a small chain (A, B needs A, C needs B) comes back in order with levels 0, 1, 2", () => {
    const topics = [
      { id: 3, name: "C", needs: [2] },
      { id: 1, name: "A", needs: [] },
      { id: 2, name: "B", needs: [1] },
    ];
    const sorted = sortTopics(topics);
    expect(sorted.map((t) => t.id)).toEqual([1, 2, 3]);
    expect(sorted.map((t) => t.level)).toEqual([0, 1, 2]);
  });

  it("two topics that need nothing are both level 0", () => {
    const topics = [
      { id: 2, name: "B", needs: [] },
      { id: 1, name: "A", needs: [] },
    ];
    const sorted = sortTopics(topics);
    expect(sorted.map((t) => t.id)).toEqual([1, 2]);
    expect(sorted.map((t) => t.level)).toEqual([0, 0]);
  });

  it("the 15 real topics come back with every topic after its prerequisites", () => {
    const realTopics = [
      { id: 1, slug: "variables", name: "Variables and types", needs: [] },
      { id: 2, slug: "operators", name: "Operators and expressions", needs: [1] },
      { id: 3, slug: "conditionals", name: "Conditionals", needs: [2] },
      { id: 4, slug: "loops", name: "Loops", needs: [3] },
      { id: 5, slug: "functions", name: "Functions", needs: [1] },
      { id: 6, slug: "arrays", name: "Arrays", needs: [4, 5] },
      { id: 7, slug: "objects", name: "Objects", needs: [1, 5] },
      { id: 8, slug: "scope", name: "Scope and hoisting", needs: [5] },
      { id: 9, slug: "closures", name: "Closures", needs: [8] },
      { id: 10, slug: "this", name: "The this keyword", needs: [7, 5] },
      { id: 11, slug: "callbacks", name: "Callbacks", needs: [5] },
      { id: 12, slug: "array-methods", name: "map, filter and reduce", needs: [6, 11] },
      { id: 13, slug: "errors", name: "Error handling", needs: [5] },
      { id: 14, slug: "promises", name: "Promises", needs: [11, 13] },
      { id: 15, slug: "async-await", name: "async and await", needs: [14] },
    ];

    const sorted = sortTopics(realTopics);
    expect(sorted).toHaveLength(15);

    const indexById = new Map(sorted.map((t, idx) => [t.id, idx]));
    for (const topic of sorted) {
      for (const prereqId of topic.needs) {
        expect(indexById.get(prereqId)).toBeLessThan(indexById.get(topic.id));
      }
    }
  });

  it("A needs B and B needs A throws an error with status 400", () => {
    const topics = [
      { id: 1, name: "A", needs: [2] },
      { id: 2, name: "B", needs: [1] },
    ];

    try {
      sortTopics(topics);
      expect.unreachable("Should have thrown an HttpError");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect(err.status).toBe(400);
      expect(err.message).toMatch(/loop/i);
    }
  });

  it("the 16 React fundamentals topics sort in learning order and calculate exact levels", () => {
    const reactTopics = [
      { id: 1, slug: "jsx", name: "JSX and React elements", needs: [] },
      { id: 2, slug: "components", name: "Functional components and pure rendering", needs: [1] },
      { id: 3, slug: "props", name: "Props and component composition", needs: [2] },
      { id: 4, slug: "events", name: "Event handling and synthetic events", needs: [2] },
      { id: 5, slug: "lists-and-keys", name: "Conditional and list rendering (keys)", needs: [3] },
      { id: 6, slug: "state", name: "State and snapshots (useState)", needs: [2, 4] },
      { id: 7, slug: "reconciliation", name: "Render, commit and reconciliation", needs: [5, 6] },
      { id: 8, slug: "controlled-inputs", name: "Controlled and uncontrolled inputs", needs: [6, 4] },
      { id: 9, slug: "lifting-state", name: "Lifting state and derived state", needs: [3, 6] },
      { id: 10, slug: "effects", name: "Side effects and synchronization (useEffect)", needs: [6, 7] },
      { id: 11, slug: "refs", name: "Refs and escape hatches (useRef)", needs: [7] },
      { id: 12, slug: "use-reducer", name: "Complex state with useReducer", needs: [9] },
      { id: 13, slug: "context", name: "Context API and avoiding prop drilling", needs: [3, 9] },
      { id: 14, slug: "custom-hooks", name: "Custom hooks and logic reuse", needs: [10, 11] },
      { id: 15, slug: "error-boundaries", name: "Error boundaries and async UI states", needs: [10, 3] },
      { id: 16, slug: "memoization", name: "Rendering performance and memoization", needs: [7, 14] },
    ];

    const sorted = sortTopics(reactTopics);
    expect(sorted).toHaveLength(16);

    const indexById = new Map(sorted.map((t, idx) => [t.id, idx]));
    const levelBySlug = new Map(sorted.map((t) => [t.slug, t.level]));

    // Prerequisites must strictly precede dependent topics
    for (const topic of sorted) {
      for (const prereqId of topic.needs) {
        expect(indexById.get(prereqId)).toBeLessThan(indexById.get(topic.id));
      }
    }

    // Exact topological levels
    expect(levelBySlug.get("jsx")).toBe(0);
    expect(levelBySlug.get("components")).toBe(1);
    expect(levelBySlug.get("props")).toBe(2);
    expect(levelBySlug.get("events")).toBe(2);
    expect(levelBySlug.get("lists-and-keys")).toBe(3);
    expect(levelBySlug.get("state")).toBe(3);
    expect(levelBySlug.get("reconciliation")).toBe(4);
    expect(levelBySlug.get("controlled-inputs")).toBe(4);
    expect(levelBySlug.get("lifting-state")).toBe(4);
    expect(levelBySlug.get("effects")).toBe(5);
    expect(levelBySlug.get("refs")).toBe(5);
    expect(levelBySlug.get("use-reducer")).toBe(5);
    expect(levelBySlug.get("context")).toBe(5);
    expect(levelBySlug.get("custom-hooks")).toBe(6);
    expect(levelBySlug.get("error-boundaries")).toBe(6);
    expect(levelBySlug.get("memoization")).toBe(7);
  });

  it("detects cyclic dependencies in React topics and throws HttpError 400", () => {
    const cyclicReactTopics = [
      { id: 1, slug: "jsx", name: "JSX", needs: [3] },
      { id: 2, slug: "components", name: "Components", needs: [1] },
      { id: 3, slug: "props", name: "Props", needs: [2] },
    ];

    try {
      sortTopics(cyclicReactTopics);
      expect.unreachable("Should have thrown HttpError 400");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect(err.status).toBe(400);
      expect(err.message).toMatch(/loop/i);
    }
  });
});
