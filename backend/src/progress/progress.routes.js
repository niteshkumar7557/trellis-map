import { Router } from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { validateBody } from "../middleware/validate.js";
import {
  getProgress,
  updateProgress,
  updateProgressSchema,
  getNextTopic,
  getPrompt,
} from "./progress.controller.js";

export const progressRouter = Router();

// A router mounted at /api with router.use() would run requireAuth on every /api request.
progressRouter.get("/subjects/:id/progress", requireAuth, getProgress);
progressRouter.put(
  "/progress/:topicId",
  requireAuth,
  validateBody(updateProgressSchema),
  updateProgress
);
progressRouter.get("/subjects/:id/next", requireAuth, getNextTopic);
progressRouter.get("/topics/:id/prompt", requireAuth, getPrompt);
