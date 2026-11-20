import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { topicsRouter } from "./topics/topics.routes.js";
import { authRouter } from "./auth/auth.routes.js";
import { progressRouter } from "./progress/progress.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
app.use(express.json());        // turns a JSON body into req.body
app.use(cookieParser());        // turns the Cookie header into req.cookies (Part 3 needs it)

app.use("/api", topicsRouter);
app.use("/api", authRouter);
app.use("/api", progressRouter);
// Others add their routers here, one line each.

// 404 for any /api route nobody matched, then the error handler. The error handler
// must be LAST: Express only sends an error to middleware registered after the route
// that threw it.
app.use("/api", (req, res) => res.status(404).json({ error: { message: "Not found" } }));
app.use(errorHandler);
