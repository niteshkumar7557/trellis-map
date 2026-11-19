import { HttpError } from "../lib/httpError.js";
import { sortTopics } from "./sortTopics.js";

/**
 * Loads a subject's topics in learning order with levels.
 * Throws HttpError(404) if subject does not exist.
 */
export async function getSortedTopics(db, subjectId) {
  const subject = await db.subject.findUnique({
    where: { id: Number(subjectId) },
  });

  if (!subject) {
    throw new HttpError(404, "Subject not found");
  }

  const rawTopics = await db.topic.findMany({
    where: { subjectId: Number(subjectId) },
    include: {
      needs: true,
    },
  });

  // Turn each topic's needs into a plain array of prerequisite topic IDs
  const topics = rawTopics.map((t) => ({
    id: t.id,
    subjectId: t.subjectId,
    slug: t.slug,
    name: t.name,
    summary: t.summary,
    mistakes: t.mistakes,
    needs: t.needs.map((n) => n.prerequisiteId),
  }));

  return {
    subject,
    topics: sortTopics(topics),
  };
}
