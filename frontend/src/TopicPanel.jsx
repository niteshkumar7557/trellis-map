import { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";
import { STATUS_LABELS } from "./statuses.js";
import { CloseIcon } from "./ui.jsx";

// Opens beside the map when a topic is clicked. It never explains the topic itself:
// it builds a prompt for the student's own AI.
export default function TopicPanel({ topic, subject, topicsById, status, note, onSaved, onClose }) {
  const [noteDraft, setNoteDraft] = useState(note ?? "");
  const [prompt, setPrompt] = useState("");
  const [hint, setHint] = useState(null);
  const [aiMessage, setAiMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(""); // "save", "improve" or ""
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  // The prompt and the hint depend on the status and the note, so they reload after
  // every save. The server builds both; the page only shows them.
  async function loadPrompt() {
    const data = await apiFetch(`/api/topics/${topic.id}/prompt`);
    setPrompt(data.prompt);
    setHint(data.hint);
    setAiMessage("");
  }

  // Once, when the panel opens. Each topic gets a fresh panel (a new key).
  useEffect(() => {
    loadPrompt().catch((err) => setError(err.message));
    // On a narrow screen the panel is below the whole map, so bring it into view.
    if (window.matchMedia("(max-width: 63.99rem)").matches) {
      panelRef.current.scrollIntoView({ block: "start" });
    }
  }, []);

  async function save(newStatus) {
    setBusy("save");
    setError("");
    try {
      await apiFetch(`/api/progress/${topic.id}`, {
        method: "PUT",
        body: { status: newStatus, note: noteDraft.trim() || null },
      });
      await Promise.all([onSaved(), loadPrompt()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function improve() {
    setBusy("improve");
    setError("");
    try {
      const data = await apiFetch(`/api/topics/${topic.id}/prompt/improve`, { method: "POST" });
      setPrompt(data.prompt);
      setAiMessage(data.improved ? "Improved by AI." : "The AI is busy, here's the basic prompt.");
    } catch (err) {
      setError(err.message); // for example the rate limit
    } finally {
      setBusy("");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some browsers block the clipboard; the text can still be selected by hand.
      setError("Couldn't copy. Select the prompt and copy it yourself.");
    }
  }

  const needs = topic.needs.map((id) => topicsById[id]?.name).filter(Boolean);

  return (
    <aside
      className="panel topic-panel"
      aria-labelledby="panel-title"
      ref={panelRef}
      data-subject={subject?.slug}
    >
      <div className="topic-panel-head">
        <h2 id="panel-title">{topic.name}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close the topic">
          <CloseIcon />
        </button>
      </div>
      <p className="topic-summary">{topic.summary}</p>
      {needs.length > 0 && (
        <p className="topic-needs muted">
          Needs first: <span className="topic-needs-list">{needs.join(", ")}</span>
        </p>
      )}

      {topic.mistakes.length > 0 && (
        <div className="panel-block">
          <h3>Common mistakes</h3>
          <ul className="mistakes">
            {topic.mistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel-block">
        <h3 id="status-label">Where you are</h3>
        <div className="segmented" role="group" aria-labelledby="status-label">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <button
              key={value}
              className="segment"
              aria-pressed={status === value}
              disabled={busy !== ""}
              onClick={() => save(value)}
            >
              <span className={`dot status-${value}`} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-block">
        <label className="field">
          Your note
          <textarea
            rows={3}
            maxLength={500}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="What's confusing you? It goes into the prompt."
            aria-describedby="note-count"
          />
        </label>
        <div className="note-row">
          <button className="btn-secondary" disabled={busy !== ""} onClick={() => save(status)}>
            {busy === "save" ? "Saving…" : "Save note"}
          </button>
          <span className="field-hint num" id="note-count">
            {noteDraft.length} / 500
          </span>
        </div>
      </div>

      {status === "STUCK" && (
        <div className="notice hint" role="status">
          {hint ? (
            <p>
              This <strong>may be</strong> because of {hint.name}. {hint.reason}
            </p>
          ) : (
            <p>Nothing underneath looks weak. Try the prompt with a different way in.</p>
          )}
        </div>
      )}

      <div className="prompt-card">
        <div className="prompt-head">
          <h3>Prompt for your AI</h3>
          {aiMessage && (
            <span className="field-hint" role="status">
              {aiMessage}
            </span>
          )}
        </div>
        <p className={prompt ? "prompt" : "prompt muted"}>{prompt || "Building the prompt…"}</p>
        <div className="prompt-actions">
          <button className="btn" onClick={copy} disabled={!prompt}>
            {copied ? "Copied" : "Copy prompt"}
          </button>
          <button className="btn-secondary" onClick={improve} disabled={!prompt || busy !== ""}>
            {busy === "improve" ? "Improving…" : "Improve with AI"}
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </aside>
  );
}
