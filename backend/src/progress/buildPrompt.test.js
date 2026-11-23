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

  it("builds a complete prompt for a React fundamentals topic with prerequisites and mistakes", () => {
    const reactTopic = {
      id: 10,
      name: "Side effects and synchronization (useEffect)",
      summary: "useEffect lifecycle, dependency array, cleanup functions, and synchronizing with external systems",
      mistakes: [
        "Omitting reactive values from the useEffect dependency array",
        "Using useEffect for calculating derived state instead of doing it during render",
      ],
    };

    const prereqs = [
      { id: 6, name: "State and snapshots (useState)" },
      { id: 7, name: "Render, commit and reconciliation" },
    ];

    const prompt = buildPrompt({
      subjectName: "React fundamentals",
      topic: reactTopic,
      prereqs,
      statusById: { 10: "STUCK", 6: "DONE", 7: "NOT_STARTED" },
      note: "Cleanup function order is confusing",
      hint: { topicId: 7, name: "Render, commit and reconciliation" },
    });

    expect(prompt).toContain(
      "I'm learning React fundamentals. The topic is Side effects and synchronization (useEffect): useEffect lifecycle, dependency array, cleanup functions, and synchronizing with external systems."
    );
    expect(prompt).toContain("I'm comfortable with: State and snapshots (useState).");
    expect(prompt).toContain("I'm not solid on yet: Render, commit and reconciliation.");
    expect(prompt).toContain("My note: Cleanup function order is confusing.");
    expect(prompt).toContain(
      "Common mistakes to watch for: Omitting reactive values from the useEffect dependency array, Using useEffect for calculating derived state instead of doing it during render."
    );
    expect(prompt).toContain("I'm stuck on this. Start with what I may be missing: Render, commit and reconciliation.");
    expect(prompt).toContain("Teach me in small steps and ask me one question after each step. Don't lecture.");
    expect(prompt).toContain("When we finish, give me two lines: what I understood, and what is still unclear.");
  });

  it("builds a prompt for a completed React topic with quiz instruction", () => {
    const reactTopic = {
      id: 1,
      name: "JSX and React elements",
      summary: "JSX syntax, React.createElement, embedding expressions, and element trees",
      mistakes: ["Returning multiple adjacent root elements without a fragment"],
    };

    const prompt = buildPrompt({
      subjectName: "React fundamentals",
      topic: reactTopic,
      statusById: { 1: "DONE" },
    });

    expect(prompt).toContain("I'm learning React fundamentals. The topic is JSX and React elements");
    expect(prompt).toContain("I think I know this. Quiz me first and only teach what I get wrong.");
  });

  it("builds a complete prompt for a Node.js fundamentals topic with prerequisites and mistakes", () => {
    const nodeTopic = {
      id: 10,
      slug: "http-server",
      name: "HTTP server fundamentals",
      summary: "http.createServer, req and res streams, status codes, headers, and basic routing",
      mistakes: [
        "Forgetting res.end() causing client requests to hang",
        "writing headers after the response body has started streaming",
      ],
    };

    const prereqs = [
      { id: 9, name: "Streams and piping" },
      { id: 8, name: "File system with promises" },
    ];

    const prompt = buildPrompt({
      subjectName: "Node.js fundamentals",
      topic: nodeTopic,
      prereqs,
      statusById: { 10: "STUCK", 9: "DONE", 8: "NOT_STARTED" },
      note: "Need help handling streaming request bodies",
      hint: { topicId: 8, name: "File system with promises" },
    });

    expect(prompt).toContain(
      "I'm learning Node.js fundamentals. The topic is HTTP server fundamentals: http.createServer, req and res streams, status codes, headers, and basic routing."
    );
    expect(prompt).toContain("I'm comfortable with: Streams and piping.");
    expect(prompt).toContain("I'm not solid on yet: File system with promises.");
    expect(prompt).toContain("My note: Need help handling streaming request bodies.");
    expect(prompt).toContain(
      "Common mistakes to watch for: Forgetting res.end() causing client requests to hang, writing headers after the response body has started streaming."
    );
    expect(prompt).toContain(
      "I'm stuck on this. Start with what I may be missing: File system with promises."
    );
    expect(prompt).toContain("Teach me in small steps and ask me one question after each step. Don't lecture.");
  });

  it("builds a prompt for a completed Node.js topic with quiz instruction", () => {
    const nodeTopic = {
      id: 1,
      name: "Node.js runtime and CLI",
      summary: "The V8 engine, running scripts from the CLI, REPL, and node flags",
      mistakes: ["Expecting browser APIs like window or document to exist"],
    };

    const prompt = buildPrompt({
      subjectName: "Node.js fundamentals",
      topic: nodeTopic,
      statusById: { 1: "DONE" },
    });

    expect(prompt).toContain("I'm learning Node.js fundamentals. The topic is Node.js runtime and CLI");
    expect(prompt).toContain("I think I know this. Quiz me first and only teach what I get wrong.");
  });
});

