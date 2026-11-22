import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

const EMPTY = { name: "", summary: "", mistakes: "", needs: [] };

// Admins add and edit topics. The server checks the role too (403 for a student);
// hiding the link is only so students don't see a screen they can't use.
export default function AdminPage() {
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [editingId, setEditingId] = useState(""); // "" = a new topic
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTopics(subjectIdToLoad) {
    const { subjects: list } = await apiFetch("/api/subjects");
    setSubjects(list);
    const targetId = subjectIdToLoad ?? subject?.id ?? list[0]?.id;
    if (!targetId) return;
    const data = await apiFetch(`/api/subjects/${targetId}/topics`);
    setSubject(data.subject);
    setTopics(data.topics);
  }

  useEffect(() => {
    loadTopics().catch((err) => setError(err.message));
  }, []);

  function handleSubjectChange(newSubjectId) {
    setEditingId("");
    setForm(EMPTY);
    setMessage("");
    setError("");
    loadTopics(newSubjectId).catch((err) => setError(err.message));
  }

  function pickTopic(id) {
    setEditingId(id);
    setMessage("");
    setError("");
    const topic = topics.find((t) => t.id === Number(id));
    setForm(
      topic
        ? {
            name: topic.name,
            summary: topic.summary,
            mistakes: topic.mistakes.join("\n"),
            needs: topic.needs,
          }
        : EMPTY,
    );
  }

  function toggleNeed(id) {
    setForm((f) => ({
      ...f,
      needs: f.needs.includes(id) ? f.needs.filter((n) => n !== id) : [...f.needs, id],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    const body = {
      name: form.name.trim(),
      summary: form.summary.trim(),
      // One mistake per line in the box; the API wants a list.
      mistakes: form.mistakes
        .split("\n")
        .map((m) => m.trim())
        .filter(Boolean),
      needs: form.needs,
    };
    try {
      if (editingId) {
        await apiFetch(`/api/topics/${editingId}`, { method: "PUT", body });
        setMessage(`Saved ${body.name}.`);
      } else {
        await apiFetch("/api/topics", {
          method: "POST",
          body: { ...body, subjectId: subject.id },
        });
        setMessage(`Added ${body.name}.`);
        setForm(EMPTY);
      }
      await loadTopics(subject.id);
    } catch (err) {
      setError(err.message); // for example a loop in the links gives 400
    } finally {
      setBusy(false);
    }
  }

  if (!subject) {
    return error ? (
      <main className="page">
        <p className="notice" role="alert">
          Couldn't load the topics. {error}
        </p>
      </main>
    ) : (
      <p className="center muted">Loading…</p>
    );
  }

  return (
    <main className="page admin">
      <div className="title-row">
        <div>
          <h1>Edit topics</h1>
          <p className="title-sub muted">
            {subject.name} · <span className="num">{topics.length}</span> topics
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <section className="settings-row" aria-labelledby="pick-title">
          <div className="settings-label">
            <h2 id="pick-title">Which topic</h2>
            <p className="muted">Pick one to change it, or start a new one.</p>
          </div>
          <div className="settings-panel">
            {subjects.length > 1 && (
              <label className="field">
                Subject
                <select
                  value={subject.id}
                  onChange={(e) => handleSubjectChange(Number(e.target.value))}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              Topic
              <select value={editingId} onChange={(e) => pickTopic(e.target.value)}>
                <option value="">New topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="settings-row" aria-labelledby="fields-title">
          <div className="settings-label">
            <h2 id="fields-title">{editingId ? "Topic details" : "New topic"}</h2>
            <p className="muted">
              Keep the summary short. Common mistakes are shown in the panel when the topic is
              clicked.
            </p>
          </div>
          <div className="settings-panel">
            <label className="field">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              Summary
              <input
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="One line: what the topic covers"
                required
              />
            </label>
            <label className="field">
              Common mistakes (one per line)
              <textarea
                rows={4}
                value={form.mistakes}
                onChange={(e) => setForm({ ...form, mistakes: e.target.value })}
              />
            </label>
          </div>
        </section>

        <section className="settings-row" aria-labelledby="needs-title">
          <div className="settings-label">
            <h2 id="needs-title">Needs first</h2>
            <p className="muted">
              Check every earlier topic a student should finish before this one. Loops (A needs B
              and B needs A) are refused.
            </p>
          </div>
          <div className="settings-panel">
            <fieldset className="field">
              <legend className="visually-hidden">Prerequisites</legend>
              <div className="needs-grid">
                {topics
                  .filter((t) => t.id !== Number(editingId))
                  .map((t) => (
                    <label key={t.id} className="check">
                      <input
                        type="checkbox"
                        checked={form.needs.includes(t.id)}
                        onChange={() => toggleNeed(t.id)}
                      />
                      {t.name}
                    </label>
                  ))}
              </div>
            </fieldset>
          </div>
        </section>

        {message && (
          <p className="notice notice-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn" disabled={busy}>
            {editingId ? "Save changes" : "Add topic"}
          </button>
        </div>
      </form>
    </main>
  );
}
