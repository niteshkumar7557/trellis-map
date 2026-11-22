import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import TopicPanel from "./TopicPanel.jsx";
import { STATUS_LABELS } from "./statuses.js";

// The counts read in the order a student moves through a topic.
const COUNT_ORDER = ["DONE", "LEARNING", "STUCK", "NOT_STARTED"];

// "None", "Objects", "Objects, Loops" or "Objects, Loops and 3 more".
function nameList(list) {
  if (list.length === 0) return "None";
  const names = list.slice(0, 2).map((t) => t.name).join(", ");
  return list.length > 2 ? `${names} and ${list.length - 2} more` : names;
}

// The map: the selected subject's topics in learning order, one row per level.
export default function MapPage({ user }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    const saved = localStorage.getItem("trellis-subject-id");
    return saved ? Number(saved) : null;
  });
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

  // Fetch subject list once on mount and establish initial subject
  useEffect(() => {
    async function initSubjects() {
      try {
        const { subjects: list } = await apiFetch("/api/subjects");
        if (list.length === 0) throw new Error("No subjects yet. Run the seed.");
        setSubjects(list);

        const targetId = list.some((s) => s.id === selectedSubjectId)
          ? selectedSubjectId
          : list[0].id;

        setSelectedSubjectId(targetId);
      } catch (err) {
        setError(err.message);
      }
    }
    initSubjects();
  }, []);

  // Whenever selectedSubjectId changes, drive the topic map and load its topics & progress
  useEffect(() => {
    if (!selectedSubjectId) return;

    let cancelled = false;
    async function loadSubjectData() {
      try {
        setError("");
        setSelectedId(null); // Close any topic panel from a previous subject
        const data = await apiFetch(`/api/subjects/${selectedSubjectId}/topics`);
        if (cancelled) return;

        setSubject(data.subject);
        setTopics(data.topics);
        await loadProgress(selectedSubjectId);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    loadSubjectData();
    return () => {
      cancelled = true;
    };
  }, [selectedSubjectId, loadProgress]);

  function handleSelectSubject(id) {
    if (id === selectedSubjectId) return;
    setSelectedSubjectId(id);
    localStorage.setItem("trellis-subject-id", String(id));
  }

  if (error) {
    return (
      <main className="page">
        <p className="notice" role="alert">
          Couldn't load the map. {error}
        </p>
      </main>
    );
  }
  if (!subject) return <p className="center muted">Loading the map…</p>;

  const topicsById = Object.fromEntries(topics.map((t) => [t.id, t]));
  const selected = topicsById[selectedId];
  const statusOf = (topic) => statusById[topic.id] ?? "NOT_STARTED";
  const topicsWith = (status) => topics.filter((t) => statusOf(t) === status);
  const doneCount = topicsWith("DONE").length;
  const firstName = user.name.split(" ")[0];

  // Group the topics into rows by level. They arrive in learning order already.
  const levels = [];
  for (const topic of topics) {
    (levels[topic.level] ??= []).push(topic);
  }

  return (
    <main className={selected ? "page map-layout has-panel" : "page map-layout"}>
      {subjects.length > 1 && (
        <div className="subject-bar" role="tablist" aria-label="Select subject">
          {subjects.map((s) => {
            const isActive = s.id === selectedSubjectId;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? "subject-tab is-active" : "subject-tab"}
                onClick={() => handleSelectSubject(s.id)}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="title-row">
        <div>
          <h1 className="greeting">
            {next ? `${firstName}, ${next.name} is next.` : `${firstName}, every topic is done.`}
          </h1>
          <p className="title-sub muted">
            {subject.name} · <span className="num">{doneCount}</span> of{" "}
            <span className="num">{topics.length}</span> done
          </p>
        </div>
        {next && next.id !== selectedId && (
          <button className="btn" onClick={() => setSelectedId(next.id)}>
            Open {next.name}
          </button>
        )}
      </div>

      {/* One cell per topic, in learning order: the whole subject at a glance. */}
      <ol className="progress-strip" aria-label={`${doneCount} of ${topics.length} topics done`}>
        {topics.map((topic) => (
          <li key={topic.id} className={`strip-cell status-${statusOf(topic)}`} title={topic.name} />
        ))}
      </ol>

      {/* The four counts are also the legend for the colours on the map. */}
      <ul className="counts" aria-label="Topics by status">
        {COUNT_ORDER.map((status) => {
          const list = topicsWith(status);
          return (
            <li key={status} className="count">
              <span className="count-label">
                <span className={`dot status-${status}`} aria-hidden="true" />
                {STATUS_LABELS[status]}
              </span>
              <span className="count-value num">{list.length}</span>
              <span className="count-caption muted">
                {status === "DONE" ? `of ${topics.length} topics` : nameList(list)}
              </span>
            </li>
          );
        })}
      </ul>

      <section className="panel map" aria-labelledby="map-title">
        <div className="panel-head">
          <h2 id="map-title">Learning order</h2>
          {selected && selected.needs.length > 0 && (
            <p className="muted map-hint">
              <span className="needed-swatch" aria-hidden="true" /> What {selected.name} needs
              first
            </p>
          )}
        </div>

        <ol className="trellis">
          {levels.map((row, level) => {
            const rowDone = row.every((t) => statusOf(t) === "DONE");
            return (
              <li key={level} className={rowDone ? "trellis-row is-done" : "trellis-row"}>
                <span className="trellis-step">
                  Step <span className="num">{level + 1}</span>
                  {rowDone && <span className="visually-hidden"> (all done)</span>}
                </span>
                <ul className="trellis-topics">
                  {row.map((topic) => (
                    <li key={topic.id}>
                      <TopicNode
                        topic={topic}
                        status={statusOf(topic)}
                        isNext={next?.id === topic.id}
                        isSelected={topic.id === selectedId}
                        isNeeded={selected?.needs.includes(topic.id) ?? false}
                        onSelect={() => setSelectedId(topic.id)}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      {selected && (
        <TopicPanel
          // A new key per topic, so the note box and prompt start fresh.
          key={selected.id}
          topic={selected}
          topicsById={topicsById}
          status={statusOf(selected)}
          note={noteById[selected.id] ?? ""}
          onSaved={() => loadProgress(subject.id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
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
      <span className="topic-status">
        <span className={`dot status-${status}`} aria-hidden="true" />
        {STATUS_LABELS[status]}
      </span>
    </button>
  );
}
