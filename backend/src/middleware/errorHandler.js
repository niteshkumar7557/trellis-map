// The error handler must have four arguments: Express recognises error middleware by (err, req, res, next).
export function errorHandler(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ error: { message: err.message } });
  }

  // Never leak internal error details to the client
  console.error(err);
  return res.status(500).json({ error: { message: "Something went wrong" } });
}
