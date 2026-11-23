import { afterEach, describe, expect, it, vi } from "vitest";
import { summarizeNotes } from "./summarizeNotes.js";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GROQ_API_KEY;
});

describe("summarizeNotes", () => {
  it("uses Groq summaries and caches unchanged notes", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ summaries: ["Then appears to run before the data arrives."] }) } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const notes = { 3: "My then runs before data note 1" };
    expect(await summarizeNotes(notes)).toEqual({ 3: "Then appears to run before the data arrives." });
    expect(await summarizeNotes(notes)).toEqual({ 3: "Then appears to run before the data arrives." });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.model).toBe("llama-3.1-8b-instant");
    expect(request.messages[1].content).toContain(notes[3]);
  });

  it("keeps original notes when Groq fails", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await summarizeNotes({ 4: "Original note 2" })).toEqual({ 4: "Original note 2" });
  });

  it("does not call Groq without an API key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await summarizeNotes({ 5: "Original note 3" })).toEqual({ 5: "Original note 3" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
