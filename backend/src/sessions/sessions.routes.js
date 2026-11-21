import { Router } from "express";
import { refresh, logout } from "./sessions.controller.js";

export const sessionsRouter = Router();

sessionsRouter.post("/refresh", refresh);
sessionsRouter.post("/logout", logout);

