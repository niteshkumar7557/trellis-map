import { useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";
import { NEXT_STATUSES, STATUS_LABELS } from "./statuses.js";
import { CloseIcon } from "./ui.jsx";

// Opens beside the map when a topic is clicked. It never explains the topic itself:
// it builds a prompt for the student's own AI.
export default function TopicPanel({
  topic,
  subject,
  topicsById,
  status,
  note,
  needsNotDone,
  onSaved,
  onClose,
}) {
  const [noteDraft, setNoteDraft] = useState(note ?? "");
  const [editing, setEditing] = useState(false); // editing a saved note
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [blocked, setBlocked] = useState(null); // { title, text } for the pop-up, or null
  const dialogRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [hint, setHint] = useState(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(""); // "status", "save", "delete" or ""
  const [error, setError] = useState("");
  const panelRef = useRef(null);

  // The prompt and the hint depend on the status and the note, so they reload after
  // every save. The server builds both; the page only shows them.
  async function loadPrompt() {
    const data = await apiFetch(`/api/topics/${topic.id}/prompt`);
    setPrompt(data.prompt);
    setHint(data.hint);
  }

  // Once, when the panel opens. Each topic gets a fresh panel (a new key).
  useEffect(() => {
    loadPrompt().catch((err) => setError(err.message));
    // The panel sits at the top of the map (below it on a narrow screen), so a topic
    // clicked further down would open it off screen. Bring its top into view.
    const top = panelRef.current.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight - 100) {
      panelRef.current.scrollIntoView({ block: "start" });
    }
  }, []);

  // Open the pop-up when a status is blocked. The <dialog> calls onClose on OK or Escape.
  useEffect(() => {
    if (blocked) dialogRef.current.showModal();
  }, [blocked]);

  // Both rules are in the page only (the API allows any status). The status only moves
  // forward (NEXT_STATUSES), so the other options are simply disabled. And Learning and
  // Done need every topic this one needs to be Done, which gets a pop-up. Stuck is always
  // allowed: being stuck is how the stuck hint finds a weak earlier topic.
  function chooseStatus(newStatus) {
    if (newStatus === status) return; // already there, nothing to save

    if ((newStatus === "LEARNING" || newStatus === "DONE") && needsNotDone.length > 0) {
      setBlocked({
        title: "Finish what it needs first",
        text: `To mark ${topic.name} as ${STATUS_LABELS[newStatus]}, first mark ${needsNotDone.join(", ")} as Done.`,
      });
      return;
    }

    save({ status: newStatus }, "status");
  }

  // One PUT for every change. A body without `note` keeps the saved note, so changing
  // the status never touches it.
  async function save(changes, kind) {
    setBusy(kind);
    setError("");
    try {
      await apiFetch(`/api/progress/${topic.id}`, {
        method: "PUT",
        body: { status, ...changes },
      });
      await Promise.all([onSaved(), loadPrompt()]);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy("");
    }
  }

  async function saveNote() {
    const text = noteDraft.trim();
    if (await save({ note: text }, "save")) {
      setNoteDraft(text);
      setEditing(false);
    }
  }

  async function deleteNote() {
    if (await save({ note: null }, "delete")) {
      setNoteDraft("");
      setConfirmDelete(false);
    }
  }

  function cancelEdit() {
    setNoteDraft(note);
    setEditing(false);
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
        <div>
          {subject?.name && <span className="topic-panel-subject muted">{subject.name}</span>}
          <h2 id="panel-title">{topic.name}</h2>
        </div>
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
          {Object.entries(STATUS_LABELS).map(([value, label]) => {
            const locked = status !== value && !NEXT_STATUSES[status].includes(value);
            return (
              <button
                key={value}
                className={locked ? "segment is-locked" : "segment"}
                aria-pressed={status === value}
                disabled={busy !== "" || locked}
                onClick={() => chooseStatus(value)}
              >
                <span className={`dot status-${value}`} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel-block">
        <h3 id="note-label">Your note</h3>
        {/* No saved note yet, or the student pressed Edit: show the box. */}
        {editing || !note ? (
          <>
            <textarea
              rows={3}
              maxLength={500}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="What's confusing you? It goes into the prompt."
              aria-labelledby="note-label"
              aria-describedby="note-count"
              autoFocus={editing}
            />
            <div className="note-row">
              <div className="note-actions">
                <button
                  className="btn-secondary"
                  disabled={busy !== "" || !noteDraft.trim()}
                  onClick={saveNote}
                >
                  {busy === "save" ? "Saving…" : "Save note"}
                </button>
                {editing && (
                  <button className="btn-ghost" disabled={busy !== ""} onClick={cancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
              <span className="field-hint num" id="note-count">
                {noteDraft.length} / 500
              </span>
            </div>
          </>
        ) : (
          <div className="saved-note">
            <p className="saved-note-text">{note}</p>
            {confirmDelete ? (
              <div className="note-actions">
                <span className="saved-note-ask">Delete this note?</span>
                <button className="btn-secondary danger" disabled={busy !== ""} onClick={deleteNote}>
                  {busy === "delete" ? "Deleting…" : "Delete"}
                </button>
                <button
                  className="btn-ghost"
                  disabled={busy !== ""}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep it
                </button>
              </div>
            ) : (
              <div className="note-actions">
                <button className="btn-secondary" disabled={busy !== ""} onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button
                  className="btn-ghost danger"
                  disabled={busy !== ""}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
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
        <h3>Prompt for your AI</h3>
        <p className={prompt ? "prompt" : "prompt muted"}>{prompt || "Building the prompt…"}</p>
        <div className="prompt-actions">
          <button className="btn" onClick={copy} disabled={!prompt}>
            {copied ? "Copied" : "Copy prompt"}
          </button>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <dialog
        ref={dialogRef}
        className="dialog"
        aria-labelledby="blocked-title"
        onClose={() => setBlocked(null)}
      >
        <h2 id="blocked-title">{blocked?.title}</h2>
        <p>{blocked?.text}</p>
        <form method="dialog">
          <button className="btn">OK</button>
        </form>
      </dialog>
    </aside>
  );
}
