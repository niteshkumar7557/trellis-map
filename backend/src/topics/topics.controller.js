import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";
import { getSortedTopics } from "./topics.service.js";
import { sortTopics } from "./sortTopics.js";

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const createTopicSchema = z.object({
  subjectId: z.number().int(),
  name: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  mistakes: z.array(z.string()),
  needs: z.array(z.number().int()),
});

export const updateTopicSchema = z.object({
  name: z.string().trim().min(1).optional(),
  summary: z.string().trim().min(1).optional(),
  mistakes: z.array(z.string()).optional(),
  needs: z.array(z.number().int()).optional(),
});

export async function listSubjects(req, res) {
  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: { topics: true },
      },
    },
  });

  const formatted = subjects.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    topicCount: s._count.topics,
  }));

  res.json({ subjects: formatted });
}

export async function listTopics(req, res) {
  const subjectId = Number(req.params.id);
  const data = await getSortedTopics(prisma, subjectId);
  res.json(data);
}

export async function createTopic(req, res) {
  const { subjectId, name, summary, mistakes, needs } = req.body;
  const slug = makeSlug(name);

  const topic = await prisma.$transaction(async (tx) => {
    const created = await tx.topic.create({
      data: {
        subjectId,
        slug,
        name,
        summary,
        mistakes,
      },
    });

    if (needs.length > 0) {
      await tx.topicPrerequisite.createMany({
        data: needs.map((prerequisiteId) => ({
          topicId: created.id,
          prerequisiteId,
        })),
      });
    }

    return created;
  });

  res.status(201).json({
    topic: {
      ...topic,
      needs,
    },
  });
}

export async function updateTopic(req, res) {
  const id = Number(req.params.id);
  const existingTopic = await prisma.topic.findUnique({
    where: { id },
    include: { needs: true },
  });

  if (!existingTopic) {
    throw new HttpError(404, "Topic not found");
  }

  const { name, summary, mistakes, needs } = req.body;

  // If needs was sent, check that the new prerequisite links do not form a loop
  if (needs !== undefined) {
    const allTopics = await prisma.topic.findMany({
      where: { subjectId: existingTopic.subjectId },
      include: { needs: true },
    });

    const topicsForSort = allTopics.map((t) => ({
      id: t.id,
      name: t.id === id && name ? name : t.name,
      slug: t.slug,
      needs: t.id === id ? needs : t.needs.map((n) => n.prerequisiteId),
    }));

    sortTopics(topicsForSort);
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (summary !== undefined) updateData.summary = summary;
  if (mistakes !== undefined) updateData.mistakes = mistakes;

  const topic = await prisma.$transaction(async (tx) => {
    const updated = await tx.topic.update({
      where: { id },
      data: updateData,
    });

    if (needs !== undefined) {
      await tx.topicPrerequisite.deleteMany({
        where: { topicId: id },
      });

      if (needs.length > 0) {
        await tx.topicPrerequisite.createMany({
          data: needs.map((prerequisiteId) => ({
            topicId: id,
            prerequisiteId,
          })),
        });
      }
    }

    return updated;
  });

  const finalNeeds =
    needs !== undefined
      ? needs
      : existingTopic.needs.map((n) => n.prerequisiteId);

  res.status(200).json({
    topic: {
      ...topic,
      needs: finalNeeds,
    },
  });
}
