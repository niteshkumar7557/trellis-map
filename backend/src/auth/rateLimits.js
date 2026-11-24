import { rateLimit } from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10,             // 10 tries per 15 minutes per IP
  standardHeaders: "draft-8", legacyHeaders: false,
  message: { error: { message: "Too many tries. Wait a few minutes." } },
});
