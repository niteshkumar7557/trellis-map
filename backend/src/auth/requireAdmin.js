import { HttpError } from "../lib/httpError.js";

export function requireAdmin(req, res, next) {
  if (req.user?.role === "ADMIN") {
    return next();
  }
  next(new HttpError(403, "Admins only"));
}
