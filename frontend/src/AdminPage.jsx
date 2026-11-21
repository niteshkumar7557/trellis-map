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
    return error ? <p className="center error" role="alert">{error}</p> : <p className="center">Loading…</p>;
  }

  return (
    <main className="admin">
      <h1>Topics in {subject.name}</h1>

      <label>
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

      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          Summary
          <input
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="One line: what the topic covers"
            required
          />
        </label>
        <label>
          Common mistakes, one per line
          <textarea
            rows={4}
            value={form.mistakes}
            onChange={(e) => setForm({ ...form, mistakes: e.target.value })}
          />
        </label>

        <fieldset>
          <legend>Needs these topics first</legend>
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

        {message && <p className="success" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" disabled={busy}>
          {editingId ? "Save changes" : "Add topic"}
        </button>
      </form>
    </main>
  );
}
