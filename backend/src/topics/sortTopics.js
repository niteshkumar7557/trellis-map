import { HttpError } from "../lib/httpError.js";

/**
 * Sorts topics into learning order using Kahn's algorithm, assigning each topic a level.
 * Level 0 = no prerequisites.
 * Level N = 1 + max level of prerequisites.
 * Throws HttpError(400) if prerequisites form a cycle.
 */
export function sortTopics(topics) {
  const inDegree = new Map();
  const dependents = new Map();
  const levels = new Map();
  const topicById = new Map();

  for (const topic of topics) {
    topicById.set(topic.id, topic);
    inDegree.set(topic.id, (topic.needs || []).length);
    dependents.set(topic.id, []);
  }

  for (const topic of topics) {
    for (const prereqId of topic.needs || []) {
      if (dependents.has(prereqId)) {
        dependents.get(prereqId).push(topic.id);
      }
    }
  }

  // Start with topics that have 0 prerequisites (level 0)
  const queue = [];
  for (const topic of topics) {
    if (inDegree.get(topic.id) === 0) {
      levels.set(topic.id, 0);
      queue.push(topic.id);
    }
  }

  while (queue.length > 0) {
    const currentId = queue.shift();

    for (const depId of dependents.get(currentId)) {
      const remaining = inDegree.get(depId) - 1;
      inDegree.set(depId, remaining);

      if (remaining === 0) {
        const depTopic = topicById.get(depId);
        const maxPrereqLevel = Math.max(
          ...depTopic.needs.map((pId) => levels.get(pId))
        );
        levels.set(depId, maxPrereqLevel + 1);
        queue.push(depId);
      }
    }
  }

  // If some topics were never placed, there is a cycle
  if (levels.size < topics.length) {
    const unplaced = topics.filter((t) => !levels.has(t.id));
    const names = unplaced.map((t) => t.name || t.slug || t.id).join(", ");
    throw new HttpError(400, `These topics need each other in a loop: ${names}`);
  }

  // Return topics with level, sorted by level then by id
  return topics
    .map((topic) => ({
      ...topic,
      level: levels.get(topic.id),
    }))
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      if (typeof a.id === "number" && typeof b.id === "number") {
        return a.id - b.id;
      }
      return String(a.id).localeCompare(String(b.id));
    });
}
