import crypto from "node:crypto";

export const REFRESH_DAYS = 7;

// A random string, not a JWT. Its only job is to be unguessable and to be looked up
// in the database, so it needs nothing inside it.
export const newRefreshToken = () => crypto.randomBytes(48).toString("base64url");

// We store only the hash. If the database leaks, the hashes can't be used as cookies.
// SHA-256 is enough here (unlike passwords): the token is already long and random,
// so there's nothing to guess.
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Returns null when the row may be used, or the reason it can't be.
export function checkRefreshToken(row, now = new Date()) {
  if (!row) return "unknown";
  if (row.usedAt) return "used";
  if (row.expiresAt <= now) return "expired";
  return null;
}
