import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
app.use(express.json());        // turns a JSON body into req.body
app.use(cookieParser());        // turns the Cookie header into req.cookies (Part 3 needs it)

// Others add their routers here, one line each.

// 404 for any /api route nobody matched, then the error handler. The error handler
// must be LAST: Express only sends an error to middleware registered after the route
// that threw it.
app.use("/api", (req, res) => res.status(404).json({ error: { message: "Not found" } }));
app.use(errorHandler);
