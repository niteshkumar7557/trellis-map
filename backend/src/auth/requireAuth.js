import { HttpError } from "../lib/httpError.js";
import { verifyAccessToken } from "./tokens.js";

export function requireAuth(req, res, next) {
  const header = req.headers?.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new HttpError(401, "Please sign in"));
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    next(new HttpError(401, "Please sign in"));
  }
}
