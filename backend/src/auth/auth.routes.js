import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { signupSchema, loginSchema, signup, login, me } from "./auth.controller.js";
import { loginLimiter } from "./rateLimits.js";
import { requireAuth } from "./requireAuth.js";

export const authRouter = Router();

authRouter.post("/auth/signup", validateBody(signupSchema), signup);
authRouter.post("/auth/login", loginLimiter, validateBody(loginSchema), login);
authRouter.get("/me", requireAuth, me);
