import { describe, it, expect, vi } from "vitest";
import { requireAdmin } from "./requireAdmin.js";

describe("requireAdmin", () => {
  it("a student calls next with a 403 error", () => {
    const req = { user: { id: 1, role: "STUDENT" } };
    const next = vi.fn();

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.status).toBe(403);
    expect(err.message).toBe("Admins only");
  });

  it("an admin calls next() with no argument", () => {
    const req = { user: { id: 2, role: "ADMIN" } };
    const next = vi.fn();

    requireAdmin(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
