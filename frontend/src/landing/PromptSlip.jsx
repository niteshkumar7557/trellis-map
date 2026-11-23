// The prompt, shown as what it is: a slip of text assembled from three places, with no AI
// writing any of it. The text is buildLayeredPrompt() for the sample student's stuck topic
// (see ./sample.js), so it is the prompt the student would take.
//
// Pointing at one of the three sources lights up the part of the slip that came from it.
// Copy works: a visitor can take this prompt to their own AI before signing up.

import { useState } from "react";

const SOURCES = [
  { part: "known", name: "Your map", text: "How far you got with this topic and the ones it needs, and the one that may be why you're stuck." },
  { part: "experiences", name: "Your own notes", text: "What you wrote on this topic, and what worked on the topics underneath it." },
  { part: "instructions", name: "Fixed instructions", text: "How to teach this kind of stuck, and this topic's usual traps. The same lines for everyone." },
];

export function PromptSlip({ stuck }) {
  const [lit, setLit] = useState(null);
  const [copied, setCopied] = useState(false);
  const prompt = stuck?.prompt;

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The clipboard is blocked (an old browser, or a page not served over https). The
      // slip's text can still be selected by hand, so there is nothing to recover.
    }
  }

  return (
    <section className="l-prompt" data-section aria-labelledby="prompt-title">
      <div className="l-prompt-text">
        <h2 id="prompt-title" className="l-h2" data-rise>
          Your AI teaches. Trellis writes the prompt.
        </h2>
        <p className="l-lead" data-rise>
          It never explains {stuck?.topic.name ?? "a topic"}. It puts together what your AI needs to know about you, from
          three places, and no model writes a word of it.
        </p>
        <ul className="l-sources">
          {SOURCES.map((s) => (
            <li key={s.part} data-rise>
              <button
                type="button"
                className="l-source"
                data-part={s.part}
                aria-pressed={lit === s.part}
                onPointerEnter={() => setLit(s.part)}
                onPointerLeave={() => setLit(null)}
                onFocus={() => setLit(s.part)}
                onBlur={() => setLit(null)}
                onClick={() => setLit(s.part)}
              >
                <span className="l-source-name">{s.name}</span>
                <span className="l-source-text">{s.text}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="l-prompt-ai" data-rise>
          Want it in your own words? <strong>Improve with AI</strong> asks a model to rewrite it for you. If the AI is busy,
          you keep this one.
        </p>
      </div>

      <div className="l-slip" data-lit={lit ?? undefined} data-rise>
        {prompt ? (
          <>
            <p className="l-slip-head">Prompt for {stuck.topic.name}</p>
            <p data-part="known">{prompt.known}</p>
            {prompt.experiences.length > 0 && (
              <div data-part="experiences">
                <p>From my own notes:</p>
                <ul>
                  {prompt.experiences.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            <div data-part="instructions">
              <p>How I&apos;d like you to help:</p>
              <ul>
                {prompt.instructions.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="l-slip-actions">
              <button type="button" className="l-slip-copy" onClick={copy}>
                {copied ? "Copied" : "Copy the prompt"}
              </button>
              <span className="l-slip-meta">Paste it into ChatGPT, Claude, or any AI.</span>
            </div>
          </>
        ) : (
          <p className="l-sheet-note">The example prompt needs the server.</p>
        )}
      </div>
    </section>
  );
}
