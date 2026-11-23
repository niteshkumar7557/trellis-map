// "Stuck" as a scroll scene. The sample student is stuck on Promises, and the page shows
// the rule working, one step per stretch of scroll:
//   1. the stuck topic and what they wrote about it;
//   2. the trace running one step down the map, to each topic it needs;
//   3. how far they got with each one;
//   4. the one the rule names first: "May be why".
//
// The topics, their statuses and the answer all come from the backend's findStuckHint, via
// ./sample.js. Only where each box sits in this small drawing is decided here.
//
// How the motion is built, and why:
// - The finished drawing is the default: it is what shows with no script, on a phone, and
//   for anyone who asked for less motion. The scene only ever hides things and brings them
//   back, so nothing can be left missing.
// - On a wide screen the section is pinned and one GSAP timeline is tied to the scroll
//   (scrub). One timeline, not separate triggers, so the steps stay in order when someone
//   scrolls back up.

import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap.js";
import { EVIDENCE } from "./sample.js";

// About the width the drawing is shown at on a laptop, so its text stays near its set size.
const W = 620;
const H = 300;
const NODE_W = 228;
const NODE_H = 64;
const ROW_Y = [24, 214]; // the stuck topic, and one step down
const MIN_GAP = 20;

/** One row of boxes, spread evenly across the drawing; narrower when they don't fit. */
function spread(count, y) {
  const w = Math.min(NODE_W, (W - (count + 1) * MIN_GAP) / count);
  const gap = (W - count * w) / (count + 1);
  return Array.from({ length: count }, (_, i) => ({ x: gap + i * (w + gap), y, w, h: NODE_H }));
}

/** A line from the bottom middle of one box to the top middle of another, as one S curve. */
function link(from, to) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h;
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const mid = (y1 + y2) / 2;
  return `M${x1} ${y1} C${x1} ${mid} ${x2} ${mid} ${x2} ${y2}`;
}

export function StuckTrace({ stuck }) {
  const root = useRef(null);

  useGSAP(
    () => {
      if (!stuck) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=110%", pin: true, scrub: 0.5 },
        });
        tl.from("[data-line]", { drawSVG: "0%", duration: 1, stagger: 0.15 }, 0.3)
          .from("[data-below]", { opacity: 0, duration: 0.5, stagger: 0.15 }, "<0.4")
          .from("[data-evidence]", { opacity: 0, duration: 0.5, stagger: 0.15 }, "+=0.2")
          // The lines that led nowhere fade to their resting opacity (set in the CSS).
          .from("[data-cleared]", { opacity: 1, duration: 0.8 }, "+=0.3")
          .from("[data-verdict]", { opacity: 0, scale: 0.9, transformOrigin: "50% 50%", duration: 0.6 }, "<")
          .from("[data-reason]", { opacity: 0, duration: 0.6 }, "<")
          .to({}, { duration: 0.6 }); // hold the result before the pin lets go

        // The three sentences on the left light up as their step plays.
        const steps = gsap.utils.toArray("[data-step]");
        gsap.set(steps.slice(1), { opacity: 0.35 });
        tl.to(steps[1], { opacity: 1, duration: 0.4 }, 0.8).to(steps[2], { opacity: 1, duration: 0.4 }, tl.duration() - 2);
      });
    },
    { scope: root, dependencies: [Boolean(stuck)] },
  );

  const name = stuck?.topic.name ?? "a topic";

  return (
    <section ref={root} className="l-stuck" aria-labelledby="stuck-title">
      <div className="l-stuck-text">
        <h2 id="stuck-title" className="l-h2">
          Stuck is traced, not guessed
        </h2>
        <p data-step>You mark {name} as stuck. That is the most useful thing you can tell it.</p>
        <p data-step>
          Trellis looks one step down the map, at the topics {name} needs, and at how far you got with each one.
        </p>
        <p data-step>
          The weakest footing is named first: never started, then stuck, then still learning. Your prompt starts there.
          It is a fixed rule you can read, never an AI&apos;s opinion.
        </p>
      </div>

      <div className="l-stuck-art">{stuck ? <Trace stuck={stuck} /> : <p className="l-sheet-note">The example needs the server.</p>}</div>
    </section>
  );
}

function Trace({ stuck }) {
  const { topic, prereqs, hint, subject, words } = stuck;
  const top = { x: (W - NODE_W) / 2, y: ROW_Y[0], w: NODE_W, h: NODE_H };
  const below = spread(prereqs.length, ROW_Y[1]);
  const likelyAt = prereqs.findIndex((p) => p.id === hint?.topicId);

  // The rule's ranking, for the list shown on phones: the one it names first, then the rest.
  const ranked = [...prereqs].sort((a, b) => (b.id === hint?.topicId) - (a.id === hint?.topicId));

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Stuck on ${topic.name}. ${hint ? `May be why: ${hint.name}.` : "Nothing underneath looks weak."}`}>
        {prereqs.map((p, i) => (
          <path
            key={p.id}
            data-line
            data-cleared={i === likelyAt ? undefined : ""}
            className="l-trace-line"
            d={link(top, below[i])}
          />
        ))}

        <Box box={top} name={topic.name} status="STUCK" tone="stuck" note="Stuck" />
        {prereqs.map((p, i) => (
          <g key={p.id} data-below>
            <Box box={below[i]} name={p.name} status={subject.statusOf(p.id)} tone={i === likelyAt ? "likely" : undefined} note={EVIDENCE[subject.statusOf(p.id)]} />
          </g>
        ))}

        {likelyAt !== -1 && (
          <g data-verdict transform={`translate(${below[likelyAt].x + below[likelyAt].w - 60} ${below[likelyAt].y - 6})`}>
            <rect className="l-verdict-tag" x="-52" y="-15" width="104" height="26" rx="13" />
            <text className="l-verdict-text" y="3">
              May be why
            </text>
          </g>
        )}
      </svg>

      {words && <p className="l-said">“{words}”</p>}

      {/* The same result as a list, for screens too narrow for the drawing. */}
      <ol className="l-trace-list">
        {ranked.map((p) => {
          const st = subject.statusOf(p.id);
          const likely = p.id === hint?.topicId;
          return (
            <li key={p.id} data-likely={likely || undefined}>
              <span className={`dot status-${st}`} aria-hidden="true" />
              <span className="l-trace-list-name">{p.name}</span>
              <span className="l-trace-list-note">{likely ? `May be why. ${hint.reason}` : EVIDENCE[st]}</span>
            </li>
          );
        })}
      </ol>

      {hint && <p className="l-reason" data-reason>{hint.reason}</p>}
    </>
  );
}

function Box({ box, name, status, tone, note }) {
  return (
    <g transform={`translate(${box.x} ${box.y})`}>
      <rect className="l-trace-box" data-tone={tone} width={box.w} height={box.h} rx="12" />
      <circle className={`l-trace-dot status-${status}`} cx="22" cy="24" r="6" />
      <text className="l-trace-name" x="38" y="29">
        {name}
      </text>
      <text data-evidence className="l-evidence" x="38" y="50">
        {note}
      </text>
    </g>
  );
}
