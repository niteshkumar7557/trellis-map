import { prisma } from "../lib/prisma.js";
import { getSortedTopics } from "./topics.service.js";

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
