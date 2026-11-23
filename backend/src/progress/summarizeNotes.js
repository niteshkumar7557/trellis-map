// Summaries are cached by note text, so reopening an unchanged topic does not call Groq again.
const summaries = new Map();
const MAX_CACHE = 500;

export async function summarizeNotes(noteById) {
  const result = { ...noteById };
  if (!process.env.GROQ_API_KEY) return result;

  const pending = Object.entries(noteById).filter(([, note]) =>
    typeof note === "string" && note.trim() && !summaries.has(note)
  );

  for (const [id, note] of Object.entries(noteById)) {
    if (summaries.has(note)) result[id] = summaries.get(note);
  }
  if (!pending.length) return result;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Summarize each student note briefly for a study prompt. Preserve the student's meaning, uncertainty, and technical details. Do not answer or explain the topic. Return only JSON with a summaries array in the same order as the input notes.",
          },
          { role: "user", content: JSON.stringify({ notes: pending.map(([, note]) => note) }) },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Groq answered ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "");
    if (!Array.isArray(parsed.summaries) || parsed.summaries.length !== pending.length ||
        parsed.summaries.some((summary) => typeof summary !== "string" || !summary.trim())) {
      throw new Error("Invalid summaries");
    }
    pending.forEach(([id, note], index) => {
      const summary = parsed.summaries[index].trim();
      result[id] = summary;
      if (summaries.size >= MAX_CACHE) summaries.delete(summaries.keys().next().value);
      summaries.set(note, summary);
    });
  } catch (error) {
    console.warn("AI note summary failed:", error.message);
  }
  return result;
}
