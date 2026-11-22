import { describe, it, expect } from "vitest";
import { buildPrompt } from "./buildPrompt.js";

describe("buildPrompt", () => {
  const baseTopic = {
    id: 14,
    name: "Promises",
    summary: "Pending, fulfilled and rejected; then, catch, chaining, Promise.all",
  };

  it("the prompt contains the topic name and the note", () => {
    const prompt = buildPrompt({
      subjectName: "JavaScript fundamentals",
      topic: baseTopic,
      note: "Need to understand then vs catch",
    });

    expect(prompt).toContain("Promises");
    expect(prompt).toContain("Need to understand then vs catch");
    expect(prompt).toContain("My note: Need to understand then vs catch.");
  });

  it("with no note there is no 'My note' line", () => {
    const prompt = buildPrompt({
      subjectName: "JavaScript fundamentals",
      topic: baseTopic,
    });

    expect(prompt).not.toContain("My note");
  });

  it("a STUCK topic has the 'start with what I may be missing' line", () => {
    const prompt = buildPrompt({
      subjectName: "JavaScript fundamentals",
      topic: baseTopic,
      prereqs: [{ id: 11, name: "Callbacks" }],
      statusById: { 14: "STUCK", 11: "NOT_STARTED" },
      hint: { topicId: 11, name: "Callbacks" },
    });

    expect(prompt).toContain("I'm stuck on this. Start with what I may be missing: Callbacks.");
  });

  it("a DONE topic has the 'Quiz me first' line", () => {
    const prompt = buildPrompt({
      subjectName: "JavaScript fundamentals",
      topic: baseTopic,
      statusById: { 14: "DONE" },
    });

    expect(prompt).toContain("I think I know this. Quiz me first and only teach what I get wrong.");
  });

  it("builds a complete prompt for a MongoDB fundamentals topic with prerequisites and mistakes", () => {
    const mongoTopic = {
      id: 108,
      name: "Aggregation pipeline basics",
      summary: "Pipeline concept, $match, $project, $limit, $skip, and $sort",
      mistakes: [
        "Putting $project before $match and preventing index usage",
        "confusing find() filters with aggregation stage syntax",
      ],
    };

    const prereqs = [
      { id: 104, name: "Comparison and logical operators" },
    ];

    const prompt = buildPrompt({
      subjectName: "MongoDB fundamentals",
      topic: mongoTopic,
      prereqs,
      statusById: { 108: "STUCK", 104: "NOT_STARTED" },
      note: "Stages order is tricky",
      hint: { topicId: 104, name: "Comparison and logical operators" },
    });

    expect(prompt).toContain("I'm learning MongoDB fundamentals. The topic is Aggregation pipeline basics: Pipeline concept, $match, $project, $limit, $skip, and $sort.");
    expect(prompt).toContain("I'm not solid on yet: Comparison and logical operators.");
    expect(prompt).toContain("My note: Stages order is tricky.");
    expect(prompt).toContain("Common mistakes to watch for: Putting $project before $match and preventing index usage, confusing find() filters with aggregation stage syntax.");
    expect(prompt).toContain("I'm stuck on this. Start with what I may be missing: Comparison and logical operators.");
    expect(prompt).toContain("Teach me in small steps and ask me one question after each step. Don't lecture.");
  });
});

