import { describe, it, expect, vi, afterEach } from "vitest";
import { improvePrompt } from "./improvePrompt.js";

describe("improvePrompt", () => {
  const template = "I'm learning JavaScript fundamentals. The topic is Promises.";

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a good answer gives { improved: true } and the AI's text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "An improved prompt text" } }],
        }),
      })
    );

    const result = await improvePrompt(template);

    expect(result).toEqual({
      prompt: "An improved prompt text",
      improved: true,
    });
  });

  it("a 500 answer gives { improved: false } and the template", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
    );

    const result = await improvePrompt(template);

    expect(result).toEqual({
      prompt: template,
      improved: false,
    });
  });

  it("fetch throwing (network down or timeout) gives { improved: false }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network down or timeout"))
    );

    const result = await improvePrompt(template);

    expect(result).toEqual({
      prompt: template,
      improved: false,
    });
  });

  it("an empty content gives { improved: false }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: "   " } }],
        }),
      })
    );

    const result = await improvePrompt(template);

    expect(result).toEqual({
      prompt: template,
      improved: false,
    });
  });
});
