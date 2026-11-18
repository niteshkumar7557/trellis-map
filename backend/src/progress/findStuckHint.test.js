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
});

