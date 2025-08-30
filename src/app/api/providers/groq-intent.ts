const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function extractIntent(prompt: string, fallbackCity?: string, fallbackCountry?: string) {
  const body = {
    model: "openai/gpt-oss-20b", // pick any chat model you have access to
    response_format: { type: "json_object" }, // JSON mode for structured output
    messages: [
      { role: "system", content: "Return ONLY valid JSON for the user's event intent." },
      {
        role: "user",
        content:
`Prompt: ${prompt}

Return JSON with keys:
- topic_keywords: string[] (keywords to search, lowercased)
- time_window: "today" | "tonight" | "tomorrow" | "weekend" | "any"
- city: optional
- country: optional (2-letter)
If unknown, omit city/country.`
      }
    ]
  };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const json = await res.json();

  // JSON mode returns a single choice with JSON in message.content
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  let out: Record<string, unknown> = {};
  try { out = JSON.parse(content); } catch {}
  // sensible fallbacks
  if (!out.city && fallbackCity) out.city = fallbackCity;
  if (!out.country && fallbackCountry) out.country = fallbackCountry;
  if (!Array.isArray(out.topic_keywords) || !out.topic_keywords.length) {
    out.topic_keywords = prompt.toLowerCase().split(/\s+/).slice(0, 3);
  }
  if (!out.time_window) out.time_window = "any";
  return out;
}
