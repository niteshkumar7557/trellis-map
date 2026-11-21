import { describe, it, expect } from "vitest";
import { newRefreshToken, hashToken, checkRefreshToken } from "./refreshTokens.js";

const now = new Date("2026-11-21T12:00:00Z");
const tomorrow = new Date("2026-11-22T12:00:00Z");
const yesterday = new Date("2026-11-20T12:00:00Z");

describe("checkRefreshToken", () => {
  it("gives null for a fresh row", () => {
    expect(checkRefreshToken({ usedAt: null, expiresAt: tomorrow }, now)).toBeNull();
  });

  it('gives "used" when usedAt is set', () => {
    expect(checkRefreshToken({ usedAt: yesterday, expiresAt: tomorrow }, now)).toBe("used");
  });

  it('gives "expired" when expiresAt has passed', () => {
    expect(checkRefreshToken({ usedAt: null, expiresAt: yesterday }, now)).toBe("expired");
  });

  it('gives "unknown" for no row', () => {
    expect(checkRefreshToken(null, now)).toBe("unknown");
  });
});

describe("hashToken", () => {
  it("gives the same hash for the same token", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
  });

  it("gives a different hash for a different token", () => {
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("newRefreshToken", () => {
  it("never gives the same token twice", () => {
    expect(newRefreshToken()).not.toBe(newRefreshToken());
  });
});
