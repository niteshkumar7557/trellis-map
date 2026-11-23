import { describe, it, expect } from "vitest";
import { buildPrompt } from "./buildPrompt.js";

const topic = { id: 3, name: "Promises", summary: "then, catch, and chaining", mistakes: ["Forgetting to return inside then", "No catch"] };
const prereqs = [{ id: 1, name: "Callbacks" }, { id: 2, name: "Error handling" }];
const make = (overrides = {}) => buildPrompt({ subjectName: "JavaScript fundamentals", topic, prereqs, statusById: { 3: "STUCK", 1: "DONE" }, noteById: { 3: "then runs too soon", 1: "Passing the function itself worked", 2: "Should not appear" }, hint: { name: "Error handling" }, ...overrides });

describe("buildPrompt", () => {
  it("assembles map context, own notes, and instructions", () => {
    const text = make();
    expect(text).toContain("I'm learning JavaScript fundamentals and I'm stuck on Promises.");
    expect(text).toContain("I'm comfortable with Callbacks.");
    expect(text).toContain("I haven't studied Error handling yet, and I think it's my real gap.");
    expect(text).toContain("Promises: then runs too soon.");
    expect(text).toContain("Callbacks: passing the function itself worked.");
    expect(text).not.toContain("Should not appear");
    expect(text).toContain("Start with Error handling, briefly, then connect it back to Promises.");
    expect(text).toContain("Watch for the usual traps: forgetting to return inside then and no catch.");
  });
  it("limits completed prerequisite notes to two", () => {
    const text = make({ prereqs: [{ id: 1, name: "A" }, { id: 2, name: "B" }, { id: 4, name: "C" }], statusById: { 1: "DONE", 2: "DONE", 4: "DONE" }, noteById: { 1: "first", 2: "second", 4: "third" }, hint: null });
    expect(text).toContain("A: first.");
    expect(text).toContain("B: second.");
    expect(text).not.toContain("C: third.");
  });
  it("changes guidance with status", () => {
    expect(make({ statusById: { 3: "DONE" }, hint: null })).toContain("Quiz me on Promises with three questions");
    expect(make({ statusById: { 3: "LEARNING" }, hint: null })).toContain("Pick up where I stopped");
    expect(make({ statusById: {}, hint: null, noteById: {} })).toContain("Next I want to learn Promises: then, catch, and chaining.");
  });
});
