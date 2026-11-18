import { HttpError } from "../lib/httpError.js";

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(400, result.error.issues[0]?.message || "Invalid request body");
    }
    // Replace req.body with parsed data so extra fields are dropped
    req.body = result.data;
    next();
  };
}
