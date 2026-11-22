import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "./errorHandler.js";
import { HttpError } from "../lib/httpError.js";

// A fake res: status() returns res so that res.status(...).json(...) works like in Express
function fakeRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

describe("errorHandler", () => {
  it("an HttpError(404, 'x') gives status 404 and its message", () => {
    const res = fakeRes();
    errorHandler(new HttpError(404, "x"), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: "x" } });
  });

  it("a plain Error gives 500 and does not send its message", () => {
    const res = fakeRes();
    // The handler logs unknown errors; silence it so the test output stays clean
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    errorHandler(new Error("secret database detail"), {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: "Something went wrong" } });
    log.mockRestore();
  });
});
