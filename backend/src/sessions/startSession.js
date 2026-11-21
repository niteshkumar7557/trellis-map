import { prisma } from "../lib/prisma.js";
import { signAccessToken } from "../auth/tokens.js";
import { publicUser } from "../auth/auth.controller.js";
import { REFRESH_DAYS, newRefreshToken, hashToken } from "./refreshTokens.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// The cookie options, shared with logout: a cookie is only cleared if the path matches.
export const refreshCookieOptions = {
  httpOnly: true,        // page JavaScript can't read it, so XSS can't steal it
  sameSite: "lax",       // not sent on requests other sites start, except plain links
  secure: process.env.NODE_ENV === "production", // HTTPS only, once we have HTTPS
  path: "/api/auth",     // only sent to the auth routes, nowhere else
};

// The one place a session begins: signup, login, refresh and Google all call this.
export async function startSession(res, user) {
  const token = newRefreshToken();
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * DAY_MS),
    },
  });

  res.cookie("refreshToken", token, {
    ...refreshCookieOptions,
    maxAge: REFRESH_DAYS * DAY_MS,
  });

  return { accessToken: signAccessToken(user), user: publicUser(user) };
}
