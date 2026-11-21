import { Router } from "express";
import passport from "passport";
import { refresh, logout, googleCallback } from "./sessions.controller.js";

export const sessionsRouter = Router();

sessionsRouter.post("/refresh", refresh);
sessionsRouter.post("/logout", logout);

// session: false, because we use tokens, not server sessions.
sessionsRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);
sessionsRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.FRONTEND_URL + "/login?error=google",
  }),
  googleCallback,
);
