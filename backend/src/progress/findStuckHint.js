// Direct prerequisites ranking: NOT_STARTED > STUCK > LEARNING.
const PRIORITY = {
  NOT_STARTED: 1,
  STUCK: 2,
  LEARNING: 3,
};

// Returns { topicId, name, reason } for the highest-ranked prerequisite that is not DONE,
// or null if all prerequisites are DONE. On a tie, learning order (topic.needs order) wins.
export function findStuckHint(topic, topicsById, statusById = {}) {
  let topPrereqId = null;
  let topStatus = null;
  let topPriority = Infinity;

  for (const prereqId of topic.needs ?? []) {
    const status = statusById[prereqId] ?? "NOT_STARTED";
    if (status === "DONE") continue;

    const priority = PRIORITY[status] ?? Infinity;
    // Strict comparison preserves learning order on tie
    if (priority < topPriority) {
      topPriority = priority;
      topPrereqId = prereqId;
      topStatus = status;
    }
  }

  if (!topPrereqId) {
    return null;
  }

  const prereq = topicsById[topPrereqId];
  const prereqName = prereq?.name ?? "";
  const topicName = topic.name ?? "";

  let reason = "";
  if (topStatus === "NOT_STARTED") {
    reason = `You haven't started ${prereqName} yet, and ${topicName} needs it.`;
  } else if (topStatus === "STUCK") {
    reason = `You're stuck on ${prereqName} too, and ${topicName} builds on it.`;
  } else if (topStatus === "LEARNING") {
    reason = `You're still learning ${prereqName}, and ${topicName} needs it.`;
  }

  return {
    topicId: prereq?.id ?? topPrereqId,
    name: prereqName,
    reason,
  };
}

