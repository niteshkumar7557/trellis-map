import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { hashToken, checkRefreshToken } from "./refreshTokens.js";
import { startSession, refreshCookieOptions } from "./startSession.js";

export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) throw new HttpError(401, "Please sign in");

  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (checkRefreshToken(row)) {
    res.clearCookie("refreshToken", refreshCookieOptions);
    throw new HttpError(401, "Please sign in again");
  }

  // "Is it unused?" and "mark it used" in one SQL statement, so two requests racing
  // with the same token can't both succeed. This is what makes rotation safe.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (count === 0) {
    res.clearCookie("refreshToken", refreshCookieOptions);
    throw new HttpError(401, "Please sign in again");
  }

  res.json(await startSession(res, row.user));
}

// Logging out twice isn't an error: with no cookie there's simply nothing to delete.
export async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  res.clearCookie("refreshToken", refreshCookieOptions);
  res.status(204).end();
}

