import { Router } from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { aiLimiter } from "../auth/rateLimits.js";
import { validateBody } from "../middleware/validate.js";
import {
  getProgress,
  updateProgress,
  updateProgressSchema,
  getNextTopic,
  getPrompt,
  improveTopicPrompt,
} from "./progress.controller.js";

export const progressRouter = Router();

progressRouter.use(requireAuth);

progressRouter.get("/subjects/:id/progress", getProgress);
progressRouter.put(
  "/progress/:topicId",
  validateBody(updateProgressSchema),
  updateProgress
);
progressRouter.get("/subjects/:id/next", getNextTopic);
progressRouter.get("/topics/:id/prompt", getPrompt);
progressRouter.post("/topics/:id/prompt/improve", aiLimiter, improveTopicPrompt);
