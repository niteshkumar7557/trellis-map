import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { getSortedTopics } from "../topics/topics.service.js";
import { findNextTopic } from "./findNextTopic.js";
import { findStuckHint } from "./findStuckHint.js";
import { buildPrompt } from "./buildPrompt.js";
import { summarizeNotes } from "./summarizeNotes.js";

export const updateProgressSchema = z.object({
  status: z.enum(["NOT_STARTED", "LEARNING", "DONE", "STUCK"]),
  note: z.string().max(500).optional().nullable(),
});

// GET /api/subjects/:id/progress
export async function getProgress(req, res) {
  const subjectId = Number(req.params.id);
  const userId = req.user.id;

  const rows = await prisma.progress.findMany({
    where: {
      userId,
      topic: { subjectId },
    },
    select: {
      topicId: true,
      status: true,
      note: true,
      updatedAt: true,
    },
  });

  res.json({ progress: rows });
}

// PUT /api/progress/:topicId
export async function updateProgress(req, res) {
  const topicId = Number(req.params.topicId);
  const userId = req.user.id;
  const { status, note } = req.body;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      needs: {
        include: {
          prerequisite: true,
        },
      },
    },
  });

  if (!topic) {
    throw new HttpError(404, "Topic not found");
  }

  const progress = await prisma.progress.upsert({
    where: {
      userId_topicId: { userId, topicId },
    },
    create: {
      userId,
      topicId,
      status,
      note: note ?? null,
    },
    update: {
      status,
      ...(note !== undefined ? { note } : {}),
    },
  });

  let hint = null;
  if (status === "STUCK") {
    const prereqs = topic.needs.map((n) => n.prerequisite);
    const prereqIds = prereqs.map((p) => p.id);
    const topicsById = Object.fromEntries(prereqs.map((p) => [p.id, p]));

    const prereqProgress = await prisma.progress.findMany({
      where: {
        userId,
        topicId: { in: prereqIds },
      },
    });

    const statusById = Object.fromEntries(
      prereqProgress.map((p) => [p.topicId, p.status])
    );
    const topicForHint = { id: topic.id, name: topic.name, needs: prereqIds };
    hint = findStuckHint(topicForHint, topicsById, statusById);
  }

  res.json({ progress, hint });
}

// GET /api/subjects/:id/next
export async function getNextTopic(req, res) {
  const subjectId = Number(req.params.id);
  const userId = req.user.id;

  const { topics: sortedTopics } = await getSortedTopics(prisma, subjectId);

  const rows = await prisma.progress.findMany({
    where: {
      userId,
      topic: { subjectId },
    },
  });

  const statusById = Object.fromEntries(rows.map((r) => [r.topicId, r.status]));
  const next = findNextTopic(sortedTopics, statusById);

  res.json({ next });
}

// Helper to build prompt and stuck hint for a topic
async function loadPromptContext(userId, topicId) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: true,
      needs: {
        include: {
          prerequisite: true,
        },
      },
    },
  });

  if (!topic) {
    throw new HttpError(404, "Topic not found");
  }

  const prereqs = topic.needs.map((n) => n.prerequisite);
  const prereqIds = prereqs.map((p) => p.id);
  const allTopicIds = [topic.id, ...prereqIds];

  const progressRows = await prisma.progress.findMany({
    where: {
      userId,
      topicId: { in: allTopicIds },
    },
  });

  const statusById = Object.fromEntries(
    progressRows.map((p) => [p.topicId, p.status])
  );
  const savedNotes = Object.fromEntries(progressRows.filter((p) => p.note).map((p) => [p.topicId, p.note]));
  const topicStatus = statusById[topic.id] ?? "NOT_STARTED";

  let hint = null;
  if (topicStatus === "STUCK") {
    const topicsById = Object.fromEntries(prereqs.map((p) => [p.id, p]));
    const topicForHint = { id: topic.id, name: topic.name, needs: prereqIds };
    hint = findStuckHint(topicForHint, topicsById, statusById);
  }

  const noteIds = [topic.id, ...prereqs.filter((p) => statusById[p.id] === "DONE" && savedNotes[p.id]).slice(0, 2).map((p) => p.id)];
  const relevantNotes = Object.fromEntries(noteIds.filter((id) => savedNotes[id]).map((id) => [id, savedNotes[id]]));
  const noteById = await summarizeNotes(relevantNotes);
  const template = buildPrompt({
    subjectName: topic.subject.name,
    topic,
    prereqs,
    statusById,
    noteById,
    hint,
  });

  return { prompt: template, hint };
}

// GET /api/topics/:id/prompt
export async function getPrompt(req, res) {
  const topicId = Number(req.params.id);
  const userId = req.user.id;

  const { prompt, hint } = await loadPromptContext(userId, topicId);
  res.json({ prompt, hint });
}
