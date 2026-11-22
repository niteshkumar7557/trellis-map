import { useEffect, useState } from "react";
import { apiFetch } from "./api.js";

const EMPTY = { name: "", summary: "", mistakes: "", needs: [] };

// Admins add and edit topics. The server checks the role too (403 for a student);
// hiding the link is only so students don't see a screen they can't use.
export default function AdminPage() {
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [editingId, setEditingId] = useState(""); // "" = a new topic
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTopics() {
    const { subjects } = await apiFetch("/api/subjects");
    const data = await apiFetch(`/api/subjects/${subjects[0].id}/topics`);
    setSubject(data.subject);
    setTopics(data.topics);
  }

  useEffect(() => {
    loadTopics().catch((err) => setError(err.message));
  }, []);

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
      mistakes: form.mistakes.split("\n").map((m) => m.trim()).filter(Boolean),
      needs: form.needs,
    };
    try {
      if (editingId) {
        await apiFetch(`/api/topics/${editingId}`, { method: "PUT", body });
        setMessage(`Saved ${body.name}.`);
      } else {
        await apiFetch("/api/topics", { method: "POST", body: { ...body, subjectId: subject.id } });
        setMessage(`Added ${body.name}.`);
        setForm(EMPTY);
      }
      await loadTopics();
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

        <section className="settings-row" aria-labelledby="details-title">
          <div className="settings-label">
            <h2 id="details-title">Details</h2>
            <p className="muted">
              Students see the name and summary on the map, and the mistakes in the topic
              panel and the prompt.
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
              Common mistakes
              <textarea
                rows={4}
                value={form.mistakes}
                onChange={(e) => setForm({ ...form, mistakes: e.target.value })}
                aria-describedby="mistakes-hint"
              />
              <span className="field-hint" id="mistakes-hint">
                One mistake per line.
              </span>
            </label>
          </div>
        </section>

        <section className="settings-row" aria-labelledby="needs-title">
          <div className="settings-label">
            <h2 id="needs-title">Needs these topics first</h2>
            <p className="muted">
              They decide the topic's step on the map. A loop, where two topics need each
              other, is refused.
            </p>
            <p className="muted num">{form.needs.length} chosen</p>
          </div>
          <fieldset className="settings-panel">
            <legend className="visually-hidden">Needs these topics first</legend>
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
        </section>

        <div className="save-row">
          {message && (
            <p className="success" role="status">
              {message}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Add topic"}
          </button>
        </div>
      </form>
    </main>
  );
}
