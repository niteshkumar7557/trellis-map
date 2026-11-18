// Builds a plain study prompt from a template. No AI is used here.
export function buildPrompt({
  subjectName = "",
  topic = {},
  prereqs = [],
  statusById = {},
  note,
  hint,
} = {}) {
  const lines = [];

  let topicLine = `I'm learning ${subjectName}. The topic is ${topic.name ?? ""}`;
  if (topic.summary) {
    topicLine += `: ${topic.summary}`;
  }
  if (!topicLine.endsWith(".")) {
    topicLine += ".";
  }
  lines.push(topicLine);

  const comfortable = [];
  const notSolid = [];
  for (const prereq of prereqs) {
    const status = statusById[prereq.id] ?? "NOT_STARTED";
    if (status === "DONE") {
      comfortable.push(prereq.name);
    } else {
      notSolid.push(prereq.name);
    }
  }

  if (comfortable.length > 0) {
    lines.push(`I'm comfortable with: ${comfortable.join(", ")}.`);
  }
  if (notSolid.length > 0) {
    lines.push(`I'm not solid on yet: ${notSolid.join(", ")}.`);
  }

  if (note && typeof note === "string" && note.trim().length > 0) {
    const cleanNote = note.trim();
    lines.push(`My note: ${cleanNote.endsWith(".") ? cleanNote : `${cleanNote}.`}`);
  }

  let mistakesText = "";
  if (Array.isArray(topic.mistakes) && topic.mistakes.length > 0) {
    mistakesText = topic.mistakes.filter(Boolean).join(", ");
  } else if (typeof topic.mistakes === "string" && topic.mistakes.trim()) {
    mistakesText = topic.mistakes.trim();
  }
  if (mistakesText) {
    if (!mistakesText.endsWith(".")) {
      mistakesText += ".";
    }
    lines.push(`Common mistakes to watch for: ${mistakesText}`);
  }

  const topicStatus = statusById[topic.id] ?? topic.status ?? "NOT_STARTED";
  if (topicStatus === "STUCK") {
    const hintName = typeof hint === "string" ? hint : hint?.name;
    if (hintName) {
      lines.push(`I'm stuck on this. Start with what I may be missing: ${hintName}.`);
    } else {
      lines.push("I'm stuck on this. Start with what I may be missing.");
    }
  } else if (topicStatus === "DONE") {
    lines.push("I think I know this. Quiz me first and only teach what I get wrong.");
  }

  lines.push("Teach me in small steps and ask me one question after each step. Don't lecture.");
  lines.push("When we finish, give me two lines: what I understood, and what is still unclear.");

  return lines.filter(Boolean).join("\n");
}

