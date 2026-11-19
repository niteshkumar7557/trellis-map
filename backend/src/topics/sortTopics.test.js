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
});
