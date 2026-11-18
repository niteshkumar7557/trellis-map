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
});

