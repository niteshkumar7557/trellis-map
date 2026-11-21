import { Router } from "express";
import { requireAuth } from "../auth/requireAuth.js";
import { requireAdmin } from "../auth/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import {
  listSubjects,
  listTopics,
  createTopic,
  updateTopic,
  createTopicSchema,
  updateTopicSchema,
} from "./topics.controller.js";

export const topicsRouter = Router();

topicsRouter.get("/subjects", listSubjects);
topicsRouter.get("/subjects/:id/topics", listTopics);
topicsRouter.post("/topics", requireAuth, requireAdmin, validateBody(createTopicSchema), createTopic);
topicsRouter.put("/topics/:id", requireAuth, requireAdmin, validateBody(updateTopicSchema), updateTopic);
