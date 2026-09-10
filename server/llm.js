const OPENAI_MODEL = process.env.OPENAI_CV_MODEL || "gpt-4o-mini";
const GEMINI_MODELS = (process.env.GEMINI_CV_MODEL || "gemini-2.0-flash,gemini-1.5-flash")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function parseModelJson(text) {
  if (!text) return null;
  let raw = String(text).trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) raw = fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function preferProvider() {
  const forced = String(process.env.CV_AI_PROVIDER || "").toLowerCase();
  const openai = Boolean(process.env.OPENAI_API_KEY);
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  if (forced === "openai" && openai) return "openai";
  if (forced === "gemini" && gemini) return "gemini";
  if (openai) return "openai";
  if (gemini) return "gemini";
  return "";
}

export function hasLlmKey() {
  return Boolean(preferProvider());
}

async function callOpenAI({ system, user, temperature, maxTokens }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const err = new Error("openai_error");
      err.code = "LLM_ERROR";
      err.status = response.status;
      throw err;
    }
    return parseModelJson(data?.choices?.[0]?.message?.content);
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiOnce(model, { system, user, temperature, maxTokens }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: "application/json",
        },
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const err = new Error("gemini_error");
      err.code = "LLM_ERROR";
      err.status = response.status;
      throw err;
    }
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p?.text || "")
      .join("\n");
    return parseModelJson(text);
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(opts) {
  let lastErr;
  for (const model of GEMINI_MODELS) {
    try {
      return await callGeminiOnce(model, opts);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("gemini_error");
}

export async function completeJson({ system, user, temperature = 0.3, maxTokens = 1600 }) {
  const provider = preferProvider();
  if (!provider) {
    const err = new Error("missing_api_key");
    err.code = "MISSING_API_KEY";
    throw err;
  }
  if (provider === "gemini") return callGemini({ system, user, temperature, maxTokens });
  return callOpenAI({ system, user, temperature, maxTokens });
}
