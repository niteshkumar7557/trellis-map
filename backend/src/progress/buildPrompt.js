// Assemble a deterministic study prompt from the map, saved notes, and fixed instructions.

const MAX_NOTES_BELOW = 2; // notes from the topics this one needs

// Lines every prompt ends with. The last one gives the student words to paste back.
const BASE = [
  "Go in small steps, and ask me a question after each one to check I've really got it.",
  "Use short examples I can run myself.",
  "Don't lecture, and don't give me everything at once.",
  "Use my notes to shape how you teach, but don't remind me of past mistakes or of what I found hard. Just make it easier this time.",
  "When we finish, end with two short lines I can paste back into Trellis: what I understood, and what is still unclear.",
];

// Lines for the topic's own status. {topic} is its name; {gap} is the stuck hint's topic.
const BY_STATUS = {
  NOT_STARTED: ["Start from what I already know, and tell me where {topic} fits."],
  LEARNING: ["Pick up where I stopped. Don't start {topic} from zero."],
  STUCK: [
    "Start with {gap}, briefly, then connect it back to {topic}.",
    "Explain it a different way from the usual docs; the usual way didn't work for me.",
  ],
  DONE: ["Quiz me on {topic} with three questions, hardest last, before explaining anything."],
};

// "A", "A and B", "A, B and C".
function list(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

// Lower-case the first letter to continue a sentence, but leave "I" and names like "JSX".
const lower = (s) => (/^(I\b|[A-Z]{2}|[A-Z][a-z]+[A-Z])/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

const sentence = (s) => (/[.!?]$/.test(s) ? s : `${s}.`);

/**
 * @param subjectName  "JavaScript fundamentals"
 * @param topic        { id, name, summary, mistakes: [string] }
 * @param prereqs      the topics it needs, [{ id, name }]
 * @param statusById   { [topicId]: "DONE" | "LEARNING" | "STUCK" | "NOT_STARTED" }
 * @param noteById     { [topicId]: string }
 * @param hint         findStuckHint's answer, or null
 * @returns {string} the assembled prompt
 */
export function buildPrompt({ subjectName, topic, prereqs = [], statusById = {}, noteById = {}, hint = null }) {
  const statusOf = (id) => statusById[id] ?? "NOT_STARTED";
  const status = statusOf(topic.id);
  const gap = status === "STUCK" ? hint?.name : undefined;

  // ---------------------------------------------------------------- 1. known
  const known = [];
  if (status === "STUCK") known.push(`I'm learning ${subjectName} and I'm stuck on ${topic.name}.`);
  else if (status === "LEARNING") known.push(`I'm learning ${subjectName} and I'm partway through ${topic.name}.`);
  else if (status === "DONE")
    known.push(`I'm learning ${subjectName}. I've covered ${topic.name} and want to check I really understand it, not just recognise it.`);
  else known.push(`I'm learning ${subjectName}. Next I want to learn ${topic.name}${topic.summary ? `: ${sentence(lower(topic.summary))}` : "."}`);

  const names = (want) => prereqs.filter((p) => want.includes(statusOf(p.id))).map((p) => p.name);
  const solid = names(["DONE"]);
  const shaky = names(["LEARNING", "STUCK"]);
  const fresh = names(["NOT_STARTED"]);
  // Name the gap once, beside the group it is in ("it" when the group is only the gap).
  const withGap = (group) => {
    if (!gap || !group.includes(gap)) return "";
    return group.length === 1 ? ", and I think it's my real gap" : `, and I think ${gap} is my real gap`;
  };
  if (solid.length) known.push(`I'm comfortable with ${list(solid)}.`);
  if (shaky.length) known.push(`I'm shaky on ${list(shaky)}${withGap(shaky)}.`);
  if (fresh.length) known.push(`I haven't studied ${list(fresh)} yet${withGap(fresh)}.`);
  if (gap && !shaky.includes(gap) && !fresh.includes(gap)) known.push(`I think my real gap is ${gap}.`);

  // ---------------------------------------------------------------- 2. experiences
  // A note on a topic that is done can't be a difficulty any more, so only what worked
  // below comes along; the topic's own note always does.
  const noteLine = (t) => `${t.name}: ${sentence(lower(noteById[t.id].trim()))}`;
  const hasNote = (t) => Boolean(noteById[t.id]?.trim());
  const experiences = [
    ...(hasNote(topic) ? [noteLine(topic)] : []),
    ...prereqs.filter((p) => statusOf(p.id) === "DONE" && hasNote(p)).slice(0, MAX_NOTES_BELOW).map(noteLine),
  ];

  // ---------------------------------------------------------------- 3. instructions
  const fill = (text) => text.replaceAll("{topic}", topic.name).replaceAll("{gap}", gap ?? "");
  const byStatus = BY_STATUS[status].filter((line) => !line.includes("{gap}") || gap).map(fill);
  const mistakes = Array.isArray(topic.mistakes) ? topic.mistakes : typeof topic.mistakes === "string" ? [topic.mistakes] : [];
  const traps = mistakes.filter(Boolean).length ? [`Watch for the usual traps: ${list(mistakes.filter(Boolean).map(lower))}.`] : [];
  const instructions = [...byStatus, ...traps, ...BASE];

  const text = [
    known.join(" "),
    ...(experiences.length ? ["", "From my own notes:", ...experiences.map((l) => `- ${l}`)] : []),
    "",
    "How I'd like you to help:",
    ...instructions.map((l) => `- ${l}`),
  ].join("\n");

  return text;
}
