import { describe, it, expect } from "vitest";
import { findStuckHint } from "./findStuckHint.js";

describe("findStuckHint", () => {
  const topicsById = {
    1: { id: 1, name: "Callbacks", needs: [] },
    2: { id: 2, name: "Error handling", needs: [] },
    3: { id: 3, name: "Promises", needs: [1, 2] },
  };
  const topic = topicsById[3];

  it("with every prerequisite done, the hint is null", () => {
    const statusById = { 1: "DONE", 2: "DONE" };
    expect(findStuckHint(topic, topicsById, statusById)).toBeNull();
  });

  it("with one not started and one learning, the not-started one is named", () => {
    const statusById = { 1: "NOT_STARTED", 2: "LEARNING" };
    const hint = findStuckHint(topic, topicsById, statusById);

    expect(hint).toEqual({
      topicId: 1,
      name: "Callbacks",
      reason: "You haven't started Callbacks yet, and Promises needs it.",
    });
  });

  it("with one stuck and one learning, the stuck one is named", () => {
    const statusById = { 1: "STUCK", 2: "LEARNING" };
    const hint = findStuckHint(topic, topicsById, statusById);

    expect(hint).toEqual({
      topicId: 1,
      name: "Callbacks",
      reason: "You're stuck on Callbacks too, and Promises builds on it.",
    });
  });

  it("the reason text names both topics", () => {
    const statusById = { 1: "NOT_STARTED", 2: "DONE" };
    const hint = findStuckHint(topic, topicsById, statusById);

    expect(hint.reason).toContain("Callbacks");
    expect(hint.reason).toContain("Promises");
  });

  describe("with React fundamentals topics", () => {
    const reactTopicsById = {
      2: { id: 2, name: "Functional components and pure rendering", needs: [1] },
      4: { id: 4, name: "Event handling and synthetic events", needs: [2] },
      6: { id: 6, name: "State and snapshots (useState)", needs: [2, 4] },
      7: { id: 7, name: "Render, commit and reconciliation", needs: [5, 6] },
      14: { id: 14, name: "Custom hooks and logic reuse", needs: [10, 11] },
      16: { id: 16, name: "Rendering performance and memoization", needs: [7, 14] },
    };

    it("hints unstarted prerequisite events when stuck on state", () => {
      const topic = reactTopicsById[6]; // state needs components (2) and events (4)
      const statusById = { 2: "LEARNING", 4: "NOT_STARTED" };
      const hint = findStuckHint(topic, reactTopicsById, statusById);

      expect(hint).toEqual({
        topicId: 4,
        name: "Event handling and synthetic events",
        reason: "You haven't started Event handling and synthetic events yet, and State and snapshots (useState) needs it.",
      });
    });

    it("hints stuck prerequisite custom-hooks when stuck on memoization", () => {
      const topic = reactTopicsById[16]; // memoization needs reconciliation (7) and custom-hooks (14)
      const statusById = { 7: "DONE", 14: "STUCK" };
      const hint = findStuckHint(topic, reactTopicsById, statusById);

      expect(hint).toEqual({
        topicId: 14,
        name: "Custom hooks and logic reuse",
        reason: "You're stuck on Custom hooks and logic reuse too, and Rendering performance and memoization builds on it.",
      });
    });

    it("returns null when all React prerequisites are DONE", () => {
      const topic = reactTopicsById[6];
      const statusById = { 2: "DONE", 4: "DONE" };
      expect(findStuckHint(topic, reactTopicsById, statusById)).toBeNull();
    });
  });
});

