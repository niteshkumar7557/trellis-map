const SYSTEM_MESSAGE =
  "You rewrite study prompts so they are clearer and more specific to this student. Keep every fact in the prompt. Return only the new prompt. Never explain the topic yourself.";

export async function improvePrompt(templatePrompt) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE }, // the text in design.md §8
          { role: "user", content: templatePrompt },
        ],
      }),
      signal: AbortSignal.timeout(8000), // give up after 8 seconds
    });
    if (!res.ok) throw new Error(`Groq answered ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty answer");
    return { prompt: text, improved: true };
  } catch (err) {
    console.warn("AI improve failed:", err.message);
    return { prompt: templatePrompt, improved: false }; // the feature fails safely
  }
}
