import { describe, it, expect, vi } from "vitest";
import { findOrCreateGoogleUser } from "./google.js";

// A fake database: only the three calls findOrCreateGoogleUser makes.
const fakeDb = () => ({ user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() } });

const profile = (verified) => ({
  id: "google-123",
  displayName: "Asha",
  emails: [{ value: "asha@example.com", verified }],
});

describe("findOrCreateGoogleUser", () => {
  it("returns an existing Google user and creates nothing", async () => {
    const db = fakeDb();
    const asha = { id: 1, googleId: "google-123" };
    db.user.findUnique.mockResolvedValueOnce(asha);

    expect(await findOrCreateGoogleUser(db, profile(true))).toBe(asha);
    expect(db.user.create).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("links Google to an existing account with a verified email", async () => {
    const db = fakeDb();
    const linked = { id: 2, email: "asha@example.com", googleId: "google-123" };
    db.user.findUnique
      .mockResolvedValueOnce(null)                                  // no one with this googleId
      .mockResolvedValueOnce({ id: 2, email: "asha@example.com" }); // but the email exists
    db.user.update.mockResolvedValueOnce(linked);

    expect(await findOrCreateGoogleUser(db, profile(true))).toBe(linked);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { googleId: "google-123" },
    });
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("does not link an unverified email", async () => {
    const db = fakeDb();
    db.user.findUnique.mockResolvedValue(null);

    await findOrCreateGoogleUser(db, profile(false));

    expect(db.user.update).not.toHaveBeenCalled();
    // Only the googleId lookup ran: the email was never used to find an account.
    expect(db.user.findUnique).toHaveBeenCalledTimes(1);
  });

  it("creates a brand-new person with their email, name and googleId", async () => {
    const db = fakeDb();
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValueOnce({ id: 3 });

    expect(await findOrCreateGoogleUser(db, profile(true))).toEqual({ id: 3 });
    expect(db.user.create).toHaveBeenCalledWith({
      data: { email: "asha@example.com", name: "Asha", googleId: "google-123" },
    });
  });
});
