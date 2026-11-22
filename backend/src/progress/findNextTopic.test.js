import { describe, it, expect } from "vitest";
import { findNextTopic } from "./findNextTopic.js";

describe("findNextTopic", () => {
  const topicA = { id: 1, name: "A", needs: [] };
  const topicB = { id: 2, name: "B", needs: [1] };
  const topicC = { id: 3, name: "C", needs: [1] };
  const topicD = { id: 4, name: "D", needs: [2, 3] };
  const topics = [topicA, topicB, topicC, topicD];

  it("with nothing done, the next topic is A", () => {
    expect(findNextTopic(topics, {})).toEqual(topicA);
  });

  it("with A done, it is B (the first in order)", () => {
    expect(findNextTopic(topics, { 1: "DONE" })).toEqual(topicB);
  });

  it("with A and B done, it is C", () => {
    expect(findNextTopic(topics, { 1: "DONE", 2: "DONE" })).toEqual(topicC);
  });

  it("with A, B and C done, it is D, even if D is STUCK", () => {
    expect(
      findNextTopic(topics, { 1: "DONE", 2: "DONE", 3: "DONE", 4: "STUCK" })
    ).toEqual(topicD);
  });

  it("with all done, it is null", () => {
    expect(
      findNextTopic(topics, { 1: "DONE", 2: "DONE", 3: "DONE", 4: "DONE" })
    ).toBe(null);
  });

  describe("with React fundamentals topics", () => {
    const reactTopics = [
      { id: 1, slug: "jsx", name: "JSX and React elements", needs: [] },
      { id: 2, slug: "components", name: "Functional components and pure rendering", needs: [1] },
      { id: 3, slug: "props", name: "Props and component composition", needs: [2] },
      { id: 4, slug: "events", name: "Event handling and synthetic events", needs: [2] },
      { id: 5, slug: "lists-and-keys", name: "Conditional and list rendering (keys)", needs: [3] },
      { id: 6, slug: "state", name: "State and snapshots (useState)", needs: [2, 4] },
      { id: 7, slug: "reconciliation", name: "Render, commit and reconciliation", needs: [5, 6] },
    ];

    it("starts with jsx when no React topics are completed", () => {
      expect(findNextTopic(reactTopics, {})).toEqual(reactTopics[0]);
    });

    it("moves to components once jsx is completed", () => {
      expect(findNextTopic(reactTopics, { 1: "DONE" })).toEqual(reactTopics[1]);
    });

    it("selects props next once components is done", () => {
      expect(findNextTopic(reactTopics, { 1: "DONE", 2: "DONE" })).toEqual(reactTopics[2]);
    });

    it("advances to state when both components and events are done", () => {
      expect(
        findNextTopic(reactTopics, {
          1: "DONE",
          2: "DONE",
          3: "DONE",
          4: "DONE",
          5: "DONE",
        })
      ).toEqual(reactTopics[5]); // state
    });

    it("returns null when all React topics are completed", () => {
      const allDone = Object.fromEntries(reactTopics.map((t) => [t.id, "DONE"]));
      expect(findNextTopic(reactTopics, allDone)).toBe(null);
    });
  });
});

