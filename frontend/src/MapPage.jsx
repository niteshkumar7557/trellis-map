import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { STATUS_LABELS } from "./statuses.js";

// The map: the subject's topics in learning order, one row per level.
export default function MapPage() {
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [statusById, setStatusById] = useState({});
  const [noteById, setNoteById] = useState({});
  const [next, setNext] = useState(undefined); // undefined = loading, null = all done
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  // Progress and the next topic change whenever a status is saved, so they reload
  // together. The topics themselves don't change while the page is open.
  const loadProgress = useCallback(async (subjectId) => {
    const [{ progress }, { next }] = await Promise.all([
      apiFetch(`/api/subjects/${subjectId}/progress`),
      apiFetch(`/api/subjects/${subjectId}/next`),
    ]);
    setStatusById(Object.fromEntries(progress.map((p) => [p.topicId, p.status])));
    setNoteById(Object.fromEntries(progress.map((p) => [p.topicId, p.note])));
    setNext(next);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        // There is one subject for now: JavaScript fundamentals.
        const { subjects } = await apiFetch("/api/subjects");
        if (subjects.length === 0) throw new Error("No subjects yet. Run the seed.");
        const data = await apiFetch(`/api/subjects/${subjects[0].id}/topics`);
        setSubject(data.subject);
        setTopics(data.topics);
        await loadProgress(data.subject.id);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [loadProgress]);

  if (error) return <p className="center error" role="alert">{error}</p>;
  if (!subject) return <p className="center">Loading the map…</p>;

  const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));
  const selected = topicsById[selectedId];
  const doneCount = topics.filter((t) => statusById[t.id] === "DONE").length;

  // Group the topics into rows by level. They arrive in learning order already.
  const levels = [];
  for (const topic of topics) {
    (levels[topic.level] ??= []).push(topic);
  }

  return (
    <div className={selected ? "map-layout has-panel" : "map-layout"}>
      <section className="map" aria-labelledby="map-title">
        <h1 id="map-title">{subject.name}</h1>
        <p className="map-summary">
          {doneCount} of {topics.length} done.{" "}
          {next === null && "Every topic is done."}
          {next && (
            <>
              Next up:{" "}
              <button className="link-inline" onClick={() => setSelectedId(next.id)}>
                {next.name}
              </button>
            </>
          )}
        </p>

        <ul className="legend" aria-label="What the colours mean">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <li key={status}>
              <span className={`swatch status-${status}`} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <ol className="trellis">
          {levels.map((row, level) => (
            <li key={level} className="trellis-row">
              <span className="trellis-step">Step {level + 1}</span>
              <ul className="trellis-topics">
                {row.map((topic) => (
                  <li key={topic.id}>
                    <TopicNode
                      topic={topic}
                      status={statusById[topic.id] ?? "NOT_STARTED"}
                      isNext={next?.id === topic.id}
                      isSelected={topic.id === selectedId}
                      isNeeded={selected?.needs.includes(topic.id) ?? false}
                      onSelect={() => setSelectedId(topic.id)}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {selected && selected.needs.length > 0 && (
          <p className="muted map-hint">Outlined: what {selected.name} needs first.</p>
        )}
      </section>

    </div>
  );
}

function TopicNode({ topic, status, isNext, isSelected, isNeeded, onSelect }) {
  const classes = ["topic", `status-${status}`];
  if (isNext) classes.push("is-next");
  if (isSelected) classes.push("is-selected");
  if (isNeeded) classes.push("is-needed");

  return (
    <button className={classes.join(" ")} onClick={onSelect} aria-pressed={isSelected}>
      {isNext && <span className="topic-next">Next up</span>}
      <span className="topic-name">{topic.name}</span>
      <span className="topic-status">{STATUS_LABELS[status]}</span>
    </button>
  );
}
