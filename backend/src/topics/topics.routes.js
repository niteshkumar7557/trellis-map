import { Router } from "express";
import { listSubjects, listTopics } from "./topics.controller.js";

export const topicsRouter = Router();

topicsRouter.get("/subjects", listSubjects);
topicsRouter.get("/subjects/:id/topics", listTopics);
