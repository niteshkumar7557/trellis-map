// A subject's whole map in miniature: a dot per topic, one row per step (step 1 at the
// top, as on the map screen), and a line from each topic to each topic it needs.
// Drawn from the real topic list, so its shape is the subject's real shape.

const PAD = 14;

export function MiniMap({ subject, width = 520, height = 250, className }) {
  const rows = [];
  for (const t of subject.topics) (rows[t.level] ??= []).push(t);

  // Each row is spread across the width; rows are spread down the height.
  const rowGap = rows.length > 1 ? (height - PAD * 2) / (rows.length - 1) : 0;
  const at = {};
  rows.forEach((row, level) => {
    const step = (width - PAD * 2) / row.length;
    row.forEach((t, i) => {
      at[t.id] = { x: PAD + step * (i + 0.5), y: PAD + level * rowGap };
    });
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label={`${subject.name}: ${subject.topics.length} topics in ${subject.steps} steps`}>
      {subject.topics.flatMap((t) =>
        t.needs.map((id) => {
          const a = at[id];
          const b = at[t.id];
          const mid = (a.y + b.y) / 2;
          return <path key={`${id}-${t.id}`} className="l-mini-line" d={`M${a.x} ${a.y} C${a.x} ${mid} ${b.x} ${mid} ${b.x} ${b.y}`} />;
        }),
      )}
      {subject.topics.map((t) => (
        <circle key={t.id} className="l-mini-dot" cx={at[t.id].x} cy={at[t.id].y} r="7" />
      ))}
    </svg>
  );
}
