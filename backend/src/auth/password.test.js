import { describe, it, expect } from "vitest";
import { hashPassword, checkPassword } from "./password.js";

describe("password", () => {
  it("checkPassword is true for the right password and false for a wrong one", async () => {
    const password = "secret-password";
    const hash = await hashPassword(password);

    expect(await checkPassword(password, hash)).toBe(true);
    expect(await checkPassword("wrong-password", hash)).toBe(false);
  });

  it("the hash is not the password", async () => {
    const password = "secret-password";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
  });

  it("hashing the same password twice gives different hashes", async () => {
    const password = "secret-password";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});
