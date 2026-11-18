import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { signAccessToken, verifyAccessToken } from "./tokens.js";

describe("tokens", () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "test-secret";
  });

  it("a signed token verifies and has the right sub and role", () => {
    const user = { id: 42, role: "STUDENT" };
    const token = signAccessToken(user);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("42");
    expect(payload.role).toBe("STUDENT");
  });

  it("a token with one character changed throws", () => {
    const user = { id: 42, role: "STUDENT" };
    const token = signAccessToken(user);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it("a token signed with a different secret throws", () => {
    const token = jwt.sign({ sub: "42", role: "STUDENT" }, "different-secret", {
      expiresIn: "15m",
    });

    expect(() => verifyAccessToken(token)).toThrow();
  });
});
