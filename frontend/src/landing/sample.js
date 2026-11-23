// The landing page's sample student, and the real data it is shown on.
//
// Nothing the landing page says about "a student" is typed in by hand except the
// student's record below (a status and a note on some topics):
//   - the topics come from the public API, so they are the real subjects;
//   - the next topic and the stuck hint come from the backend's own rule functions
//     (@rules, see vite.config.js), the same code the app runs;
//   - the prompt comes from buildLayeredPrompt (./layeredPrompt.js).
// Why: a landing page with invented examples drifts from the product the first time a
// topic or a rule changes. This one changes with it.

import { useEffect, useState } from "react";
import { findNextTopic } from "@rules/findNextTopic.js";
import { findStuckHint } from "@rules/findStuckHint.js";
import { apiFetch } from "../api.js";
import { buildLayeredPrompt } from "./layeredPrompt.js";

// ---------------------------------------------------------------- the record

// By topic slug, since slugs stay the same across databases and ids don't.
// A topic that isn't listed is Not started, as in the app.
const RECORD = {
  javascript: {
    variables: "DONE",
    operators: "DONE",
    functions: "DONE",
    conditionals: "DONE",
    loops: "DONE",
    scope: "DONE",
    callbacks: "DONE",
    objects: "LEARNING",
    closures: "LEARNING",
    promises: "STUCK",
  },
  nodejs: { "node-runtime": "DONE", modules: "DONE", "process-env": "LEARNING" },
  mongodb: { documents: "DONE", "crud-insert": "DONE", "crud-find": "DONE", "comparison-operators": "LEARNING" },
  react: { jsx: "DONE", components: "DONE", props: "DONE", events: "LEARNING" },
};

const NOTES = {
  javascript: {
    promises: "My .then() runs before the data is there, and the error just disappears",
    callbacks: "It clicked when I passed the function itself instead of calling it",
  },
};

/** The subject the stuck scene and the prompt are about, and the topic that is stuck. */
export const STUCK_SUBJECT = "javascript";
export const STUCK_SLUG = "promises";

// ---------------------------------------------------------------- loading

/**
 * Every subject with its topics, in learning order. Only public routes, so it works
 * signed out. { state: "loading" | "ready" | "error", subjects }
 */
export function useLandingData() {
  const [data, setData] = useState({ state: "loading", subjects: [] });

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { subjects } = await apiFetch("/api/subjects");
        const full = await Promise.all(
          subjects.map(async (s) => ({ ...s, topics: (await apiFetch(`/api/subjects/${s.id}/topics`)).topics })),
        );
        if (live) setData({ state: "ready", subjects: full.map(withRecord) });
      } catch {
        if (live) setData({ state: "error", subjects: [] });
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return data;
}

/** Turns the slug-keyed record into the id-keyed maps the rule functions take. */
function withRecord(subject) {
  const byId = (record = {}) =>
    Object.fromEntries(subject.topics.filter((t) => record[t.slug]).map((t) => [t.id, record[t.slug]]));
  const statusById = byId(RECORD[subject.slug]);
  const noteById = byId(NOTES[subject.slug]);
  const topicsById = Object.fromEntries(subject.topics.map((t) => [t.id, t]));
  return {
    ...subject,
    statusById,
    noteById,
    topicsById,
    statusOf: (id) => statusById[id] ?? "NOT_STARTED",
    next: findNextTopic(subject.topics, statusById),
    steps: Math.max(0, ...subject.topics.map((t) => t.level)) + 1,
  };
}

// ---------------------------------------------------------------- the stuck scene and its prompt

/**
 * The stuck topic, what it needs (one step down, as the rule looks), the rule's answer,
 * and the prompt the student would take. null if that subject or topic isn't there.
 */
export function stuckCase(subjects) {
  const subject = subjects.find((s) => s.slug === STUCK_SUBJECT);
  const topic = subject?.topics.find((t) => t.slug === STUCK_SLUG);
  if (!topic) return null;

  const hint = findStuckHint(topic, subject.topicsById, subject.statusById);
  const prereqs = topic.needs.map((id) => subject.topicsById[id]);
  const prompt = buildLayeredPrompt({
    subjectName: subject.name,
    topic,
    prereqs,
    statusById: subject.statusById,
    noteById: subject.noteById,
    hint,
  });
  return { subject, topic, prereqs, hint, prompt, words: subject.noteById[topic.id] ?? "" };
}

/** The words the app uses for a topic's status, as evidence in the stuck trace. */
export const EVIDENCE = {
  DONE: "Done",
  LEARNING: "Partly done",
  STUCK: "Stuck too",
  NOT_STARTED: "Not studied yet",
};
