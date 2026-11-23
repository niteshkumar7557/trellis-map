// The landing page, shown at / to anyone signed out (design.md §16). Its idea: the page is
// the map. The first screen is a real subject's map, and every section after it shows one
// thing Trellis does with that map, worked out live on a sample student:
//
//   Hero        the map itself (HeroMap.jsx)
//   Stuck       the "may be why" rule, played as you scroll (StuckTrace.jsx)
//   Prompt      the assembled prompt, and where each part came from (PromptSlip.jsx)
//   Subjects    every subject's map in miniature (MiniMap.jsx)
//   Won't do    the promises, beside an espalier that turns through its seasons
//   Start       the one action
//
// The data and the sample student are in ./sample.js. This file holds the page's frame,
// its small sections and the motion they share.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap.js";
import { Brand, ThemeToggle } from "../ui.jsx";
import { Espalier } from "./Espalier.jsx";
import { HeroMap } from "./HeroMap.jsx";
import { MiniMap } from "./MiniMap.jsx";
import { PromptSlip } from "./PromptSlip.jsx";
import { stuckCase, useLandingData } from "./sample.js";
import { StuckTrace } from "./StuckTrace.jsx";
import "./landing.css";

export default function Landing() {
  const root = useRef(null);
  const data = useLandingData();
  const stuck = data.state === "ready" ? stuckCase(data.subjects) : null;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The first screen's words arrive first, heading first.
        gsap.from("[data-hero] [data-rise]", { y: 20, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 });

        // Each section's parts rise in once, in reading order, as the section arrives.
        gsap.utils.toArray("[data-section]").forEach((section) => {
          const parts = section.querySelectorAll("[data-rise]");
          if (!parts.length) return;
          gsap.from(parts, {
            y: 24,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.075,
            scrollTrigger: { trigger: section, start: "top 78%", once: true },
          });
        });

        // The one moving picture: the espalier turns through its seasons, slowly, for ever.
        const seasons = gsap.utils.toArray("[data-season]");
        gsap.set(seasons.slice(1), { opacity: 0 });
        const turn = gsap.timeline({ repeat: -1, delay: 2 });
        seasons.forEach((season, i) => {
          const following = seasons[(i + 1) % seasons.length];
          turn.to(following, { opacity: 1, duration: 1.6, ease: "sine.inOut" }, "+=3.5");
          turn.to(season, { opacity: 0, duration: 1.6, ease: "sine.inOut" }, "<");
        });
        // A hidden tab shouldn't keep animating.
        const onVisibility = () => (document.hidden ? turn.pause() : turn.resume());
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
      });

      // With less motion asked for, the plate simply shows the tree in fruit.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        const seasons = gsap.utils.toArray("[data-season]");
        gsap.set(seasons, { opacity: 0 });
        gsap.set(seasons.at(-1), { opacity: 1 });
      });
    },
    { scope: root },
  );

  // The live sections change height once the data arrives, and the web fonts change text
  // heights after first paint: measure the scroll triggers again after both.
  useEffect(() => {
    ScrollTrigger.refresh();
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, [data.state]);

  return (
    <div ref={root} className="l-page">
      <main>
        <Hero data={data} />
        <StuckTrace stuck={stuck} />
        <PromptSlip stuck={stuck} />
        <Subjects data={data} />
        <WontDo />
        <Start />
      </main>
      <Footer data={data} />
    </div>
  );
}

// ------------------------------------------------------------ hero

function Hero({ data }) {
  return (
    <section className="l-hero" data-hero aria-labelledby="hero-title">
      <header className="l-nav">
        <Brand />
        <nav className="l-nav-links" aria-label="Site">
          <a href="#stuck-title">How it works</a>
          <a href="#subjects-title">Subjects</a>
          <ThemeToggle />
          <Link to="/login">Log in</Link>
          <Link to="/signup" className="l-button">
            Start your map
          </Link>
        </nav>
      </header>

      <div className="l-hero-head">
        <h1 id="hero-title" className="l-hero-title" data-rise>
          The map of what you&apos;re learning.
        </h1>
        <div className="l-hero-side">
          <p className="l-hero-sub" data-rise>
            Trellis shows what to study next, and the earlier topic that is really why you&apos;re stuck. It never teaches.
            It writes the prompt for your own AI.
          </p>
          <p className="l-hero-facts" data-rise>
            Free and private. No streaks, no reminders.
          </p>
        </div>
      </div>

      <HeroMap data={data} />

      <p className="l-hero-caption">
        This is one sample student&apos;s map, as it is today. Point at a topic, or switch the subject.
      </p>
    </section>
  );
}

// ------------------------------------------------------------ subjects: every map, at its real size

const COUNT = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
const howMany = (n) => COUNT[n] ?? String(n);
// Three or fewer sit in one row; four go two by two; more go in threes.
const columnsFor = (n) => (n <= 3 ? Math.max(n, 1) : n === 4 ? 2 : 3);

function Subjects({ data }) {
  const n = data.subjects.length;
  return (
    <section className="l-subjects" data-section aria-labelledby="subjects-title">
      <div className="l-subjects-head">
        <h2 id="subjects-title" className="l-h2" data-rise>
          {n ? `${howMany(n)} ${n === 1 ? "subject" : "subjects"}, drawn in full` : "The subjects, drawn in full"}
        </h2>
        <p className="l-lead" data-rise>
          A map is only worth following if every link on it was checked by a person. So there are only a few for now, and
          each one is drawn here at its real size.
        </p>
      </div>
      {data.state === "error" && <p className="l-sheet-note">The subjects couldn't be loaded: the server isn&apos;t answering.</p>}
      <div className="l-subject-grid" style={{ "--cols": columnsFor(n) }}>
        {data.subjects.map((s) => (
          <Link key={s.id} to="/signup" className="l-subject" data-rise>
            <MiniMap subject={s} className="l-subject-map" />
            <span className="l-subject-name">{s.name}</span>
            <span className="l-subject-size num">
              {s.topics.length} topics in {s.steps} steps
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------ what it won't do

const WONT = [
  { word: "teach", fact: "Your own AI does that. Trellis hands it the right question." },
  { word: "nag", fact: "No reminders and no streaks. It waits until you come back." },
  { word: "judge", fact: "Stuck is information, and the most useful thing you can say." },
  { word: "tell", fact: "No other student can see your map, your statuses or your notes." },
  { word: "forget", fact: "The note you leave on a topic comes back in its next prompt." },
];

function WontDo() {
  return (
    <section className="l-wont" data-section aria-labelledby="wont-title">
      <h2 id="wont-title" className="l-h2" data-rise>
        What it won&apos;t do
      </h2>
      <ul className="l-wont-list">
        {WONT.map((w) => (
          <li key={w.word} data-rise>
            <span className="l-wont-word">{w.word}</span>
            <span className="l-wont-fact">{w.fact}</span>
          </li>
        ))}
      </ul>
      <p className="l-wont-for" data-rise>
        Made for subjects where one idea stands on another, like programming and databases. Not for memorising, a craft
        you practise, or an exam next week.
      </p>

      <figure className="l-plate" data-rise>
        <div className="l-plate-art">
          <div className="l-season" data-season="bare">
            <Espalier layers={["bare"]} seed={7} title="An espalier in winter: bare trained wood" />
          </div>
          <div className="l-season" data-season="leaf">
            <Espalier layers={["bare", "leaf"]} seed={7} title="The espalier in leaf" />
          </div>
          <div className="l-season" data-season="blossom">
            <Espalier layers={["bare", "leaf", "blossom"]} seed={7} title="The espalier in blossom" />
          </div>
          <div className="l-season" data-season="fruit">
            <Espalier layers={["bare", "leaf", "fruit"]} seed={7} ripeness={0.62} title="The espalier in fruit" />
          </div>
        </div>
        <figcaption>A trellis doesn&apos;t grow the tree. It shows each branch where to go, one tier at a time.</figcaption>
      </figure>
    </section>
  );
}

// ------------------------------------------------------------ start: a card lying on the page

function Start() {
  return (
    <section className="l-start" data-section aria-labelledby="start-title">
      <p className="l-start-aside" data-rise>
        Signing up takes a minute: an email and a password, or your Google account. Then your map is drawn.
      </p>
      <div className="l-start-card" data-rise>
        <h2 id="start-title" className="l-start-title">
          Start your map
        </h2>
        <p>Pick a subject, mark how far you&apos;ve got, and see what&apos;s next.</p>
        <Link to="/signup" className="l-start-action">
          Create a free account
        </Link>
        <Link to="/login" className="l-start-second">
          Already have one? Log in
        </Link>
      </div>
    </section>
  );
}

// ------------------------------------------------------------ footer

function Footer({ data }) {
  return (
    <footer className="l-footer">
      <div className="l-foot-cols">
        <div>
          <p className="l-foot-head">Trellis</p>
          <p>A study map.</p>
          <p>It never teaches.</p>
        </div>
        <div>
          <p className="l-foot-head">Product</p>
          <a href="#stuck-title">How it works</a>
          <Link to="/login">Log in</Link>
          <Link to="/signup">Start your map</Link>
        </div>
        <div>
          <p className="l-foot-head">Subjects</p>
          {data.subjects.map((s) => (
            <p key={s.id}>{s.name}</p>
          ))}
        </div>
        <div>
          <p className="l-foot-head">Promises</p>
          <p>Your map is yours alone</p>
          <p>No streaks, no reminders</p>
          <p>It never teaches</p>
        </div>
      </div>

      <div className="l-foot-bottom">
        <FootWord />
        <p className="l-legal">© 2026 Trellis.</p>
      </div>
    </footer>
  );
}

/** The name across the full width of the page: the SVG's viewBox is fitted to the word once it is drawn. */
function FootWord() {
  const svg = useRef(null);
  const [box, setBox] = useState("0 0 1000 230");
  useEffect(() => {
    const fitWord = () => {
      const text = svg.current?.querySelector("text");
      if (!text) return;
      const b = text.getBBox();
      setBox(`${b.x} ${b.y + b.height * 0.2} ${b.width} ${b.height * 0.72}`);
    };
    fitWord();
    document.fonts?.ready.then(fitWord);
  }, []);
  return (
    <svg ref={svg} className="l-foot-word" viewBox={box} role="img" aria-label="Trellis">
      <text x="0" y="0">
        Trellis
      </text>
    </svg>
  );
}
