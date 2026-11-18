// Returns the first topic in learning order that is not DONE and whose
// prerequisites are all DONE. A missing id in statusById means "NOT_STARTED".
export function findNextTopic(sortedTopics, statusById = {}) {
  for (const topic of sortedTopics) {
    const status = statusById[topic.id] ?? "NOT_STARTED";
    const needsAllDone = (topic.needs ?? []).every(
      (prereqId) => statusById[prereqId] === "DONE"
    );

    if (status !== "DONE" && needsAllDone) {
      return topic;
    }
  }

  return null;
}

