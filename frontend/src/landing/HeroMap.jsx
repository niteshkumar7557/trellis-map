// The hero: a real subject's map, drawn with the app's own map styles.
//
// The rows, the knots on the stem and the topic boxes are the map screen's classes
// (.trellis, .topic in styles/app.css) and its TopicNode, not copies. Why: a visitor should
// see the product, and a copy would drift the first time the map's look changes.
//
// It is live: the topics come from the API, the statuses are the sample student's, and
// "next" is the backend's findNextTopic. Pointing at a topic says what it is and what it
// needs; the switcher shows another subject.

import { useRef, useState } from "react";
import { TopicNode } from "../MapPage.jsx";
import { STATUS_LABELS } from "../statuses.js";
import { gsap, prefersReducedMotion, useGSAP } from "../lib/gsap.js";

// "A", "A and B", "A, B and C".
const list = (names) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`);

export function HeroMap({ data }) {
  const root = useRef(null);
  const [slug, setSlug] = useState(null);
  const [picked, setPicked] = useState(null);

  const subject = data.subjects.find((s) => s.slug === slug) ?? data.subjects[0];

  // The map grows the way the subject is learned: one step at a time, from the first.
  // Played again when the visitor switches subject.
  useGSAP(
    () => {
      if (!subject || prefersReducedMotion()) return;
      gsap.from("[data-step-row]", { opacity: 0, y: 12, duration: 0.45, ease: "power2.out", stagger: 0.12, clearProps: "all" });
    },
    { scope: root, dependencies: [subject?.id] },
  );

  if (data.state !== "ready" || !subject) {
    return (
      <div className="l-sheet l-hero-sheet" data-state={data.state}>
        <p className="l-sheet-note">
          {data.state === "error"
            ? "The map couldn't be loaded: the server isn't answering. The rest of the page still works."
            : "Loading the map…"}
        </p>
      </div>
    );
  }

  // Until the visitor points at a topic, the readout shows the one to study next.
  const shownId = picked && subject.topicsById[picked] ? picked : (subject.next?.id ?? subject.topics[0].id);
  const shown = subject.topicsById[shownId];
  const status = subject.statusOf(shownId);
  const needs = shown.needs.map((id) => subject.topicsById[id]);
  const waiting = needs.filter((t) => subject.statusOf(t.id) !== "DONE");
  const done = subject.topics.filter((t) => subject.statusOf(t.id) === "DONE").length;

  let verdict;
  if (shownId === subject.next?.id) verdict = { tone: "next", text: "Next up" };
  else if (status === "DONE") verdict = { tone: "done", text: "Done" };
  else if (waiting.length) verdict = { tone: "wait", text: `Needs ${list(waiting.map((t) => t.name))} first` };
  else verdict = { tone: "wait", text: STATUS_LABELS[status] };

  const rows = [];
  for (const topic of subject.topics) (rows[topic.level] ??= []).push(topic);

  return (
    <div ref={root} className="l-sheet">
      <ol className="trellis l-trellis" aria-label={`The ${subject.name} map: ${subject.topics.length} topics in ${subject.steps} steps`}>
        {rows.map((row, level) => {
          const rowDone = row.every((t) => subject.statusOf(t.id) === "DONE");
          return (
            <li key={level} data-step-row className={rowDone ? "trellis-row is-done" : "trellis-row"}>
              <span className="trellis-step">
                Step <span className="num">{level + 1}</span>
              </span>
              <ul className="trellis-topics">
                {row.map((topic) => (
                  <li key={topic.id}>
                    <TopicNode
                      topic={topic}
                      status={subject.statusOf(topic.id)}
                      isNext={subject.next?.id === topic.id}
                      isSelected={topic.id === shownId}
                      isNeeded={shown.needs.includes(topic.id)}
                      onSelect={() => setPicked(topic.id)}
                      onPointerEnter={(e) => e.pointerType === "mouse" && setPicked(topic.id)}
                    />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      <ul className="l-legend" aria-label="Key">
        {["DONE", "LEARNING", "STUCK", "NOT_STARTED"].map((s) => (
          <li key={s}>
            <span className={`dot status-${s}`} aria-hidden="true" />
            {STATUS_LABELS[s]}
          </li>
        ))}
        <li className="l-legend-note">
          <span className="l-swatch-next" aria-hidden="true" /> Next up
        </li>
        <li className="l-legend-note">
          <span className="l-swatch-needed" aria-hidden="true" /> What the open topic needs first
        </li>
      </ul>

      <div className="l-readout">
        <div aria-live="polite">
          <p className="l-read-name">
            <span className={`dot status-${status}`} aria-hidden="true" />
            {shown.name}
            <span className="l-verdict" data-tone={verdict.tone}>
              {verdict.text}
            </span>
          </p>
          <p className="l-read-why">
            {shown.summary.replace(/\.?$/, ".")}{" "}
            {needs.length ? `It needs ${list(needs.map((t) => t.name))}.` : "It needs nothing first: a place to start."}
          </p>
        </div>

        <div className="l-read-subject">
          <div className="l-seg" role="radiogroup" aria-label="Subject">
            {data.subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={s.id === subject.id}
                className="l-seg-btn"
                onClick={() => {
                  setSlug(s.slug);
                  setPicked(null);
                }}
              >
                {s.name.replace(/ fundamentals$/i, "")}
              </button>
            ))}
          </div>
          <p className="l-read-count num">
            {subject.topics.length} topics in {subject.steps} steps. This student has done {done}.
          </p>
        </div>
      </div>
    </div>
  );
}
