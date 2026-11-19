import { describe, it, expect, vi, beforeAll } from "vitest";
import { requireAuth } from "./requireAuth.js";
import { signAccessToken } from "./tokens.js";

describe("requireAuth", () => {
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = "test-secret";
  });

  it("no header calls next with an error whose status is 401", () => {
    const req = { headers: {} };
    const next = vi.fn();

    requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(401);
    expect(err.message).toBe("Please sign in");
  });

  it("Bearer garbage gives the same 401", () => {
    const req = { headers: { authorization: "Bearer garbage" } };
    const next = vi.fn();

    requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(401);
    expect(err.message).toBe("Please sign in");
  });

  it("a good token sets req.user and calls next() with no argument", () => {
    const user = { id: 7, role: "STUDENT" };
    const token = signAccessToken(user);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = vi.fn();

    requireAuth(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 7, role: "STUDENT" });
  });
});
