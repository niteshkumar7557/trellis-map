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

  it("improves a prompt built from React fundamentals data", async () => {
    const reactTemplate =
      "I'm learning React fundamentals. The topic is Side effects and synchronization (useEffect). I'm stuck on this. Start with what I may be missing: Reconciliation.";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "I'm studying React fundamentals, focusing on Effects. Let's start with Reconciliation before tackling cleanup functions.",
              },
            },
          ],
        }),
      })
    );

    const result = await improvePrompt(reactTemplate);
    expect(result.improved).toBe(true);
    expect(result.prompt).toContain("React fundamentals");
  });

  it("improves a prompt built from Node.js fundamentals data", async () => {
    const nodeTemplate =
      "I'm learning Node.js fundamentals. The topic is HTTP server fundamentals. I'm stuck on this. Start with what I may be missing: Streams and piping.";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  "I'm studying Node.js fundamentals focusing on HTTP server fundamentals. Teach me in small interactive steps starting with Streams and piping.",
              },
            },
          ],
        }),
      })
    );

    const result = await improvePrompt(nodeTemplate);
    expect(result.improved).toBe(true);
    expect(result.prompt).toContain("Node.js fundamentals");
  });
});
