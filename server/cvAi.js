import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { completeJson, hasLlmKey } from "./llm.js";

const MAX_JSON_BYTES = 24 * 1024;
const PARSE_MAX_CHARS = 8000;
const POLISH_MAX_CHARS = 1200;
const RATE_MAX = 12;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const PARSE_SYSTEM = `You convert informal Hebrew or English career notes into a structured CV JSON for QuickCV.
Return ONLY JSON with this shape:
{
  "name": "",
  "title": "",
  "phone": "",
  "email": "",
  "location": "",
  "linkedin": "",
  "summary": "",
  "experience": [
    {
      "period": "2021 - present",
      "title": "Store manager",
      "company": "Company if known",
      "bullets": ["achievement-oriented bullet", "another bullet"]
    }
  ],
  "education": "plain text, one item per line as YEAR | degree / school",
  "military": "plain text for army / national service if mentioned",
  "skills": "comma-separated skills",
  "languages": "comma-separated, e.g. Hebrew (native), English (fluent)",
  "references": ""
}

Rules:
- Infer a professional job title when the person describes their work.
- Experience bullets must be concise, professional, achievement-oriented. Do not invent metrics, employers, dates, degrees, or skills that are not implied by the input.
- Keep the same language as the user's notes (Hebrew or English). If mixed, follow the majority language.
- Empty string for unknown fields. Never add commentary.`;

const POLISH_SYSTEM = `You rewrite a single CV bullet or short description into one high-impact professional line.
Return ONLY JSON: { "text": "rewritten line" }
Rules:
- Keep the original language (Hebrew or English).
- Achievement-oriented, active voice, specific. Do not invent numbers, tools, or employers.
- No quotes, no bullet prefix, no extra sentences. One line only.
- If the input is already strong, tighten it rather than padding.`;

function failMsg(lang, he, en) {
  return lang === "en" ? en : he;
}

function clip(value, max) {
  return String(value || "").replace(/\u0000/g, "").slice(0, max);
}

function normalizeLang(value) {
  return String(value || "").toLowerCase().startsWith("en") ? "en" : "he";
}

function asString(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const bits = [item.period, item.dates, item.title, item.role, item.company, item.name, item.level]
            .map((v) => (v == null ? "" : String(v).trim()))
            .filter(Boolean);
          const bullets = Array.isArray(item.bullets) ? item.bullets : [];
          const extra = bullets.map((b) => String(b || "").trim()).filter(Boolean).map((b) => `• ${b}`);
          return [...bits, ...extra].join("\n");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  if (typeof value === "object") return asString([value]);
  return String(value).trim();
}

function serializeExperience(exp) {
  if (typeof exp === "string") return exp.trim();
  if (!Array.isArray(exp)) return asString(exp);
  return exp
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      const period = String(item.period || item.dates || "").trim();
      const title = String(item.title || item.role || "").trim();
      const company = String(item.company || item.org || item.organization || "").trim();
      const roleLine = [title, company].filter(Boolean).join(" | ");
      const header = [period, roleLine].filter(Boolean).join(" | ");
      const bullets = Array.isArray(item.bullets)
        ? item.bullets
        : item.description
          ? String(item.description).split(/\n+/)
          : [];
      const lines = [];
      if (header) lines.push(header);
      bullets
        .map((b) => String(b || "").replace(/^[•\-\*]\s*/, "").trim())
        .filter(Boolean)
        .forEach((b) => lines.push(`• ${b}`));
      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function normalizeCv(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const personal = src.personal && typeof src.personal === "object" ? src.personal : {};
  const pick = (key) => src[key] ?? personal[key] ?? "";
  return {
    name: clip(asString(pick("name")), 120),
    title: clip(asString(pick("title") || pick("role")), 160),
    phone: clip(asString(pick("phone")), 40),
    email: clip(asString(pick("email")), 120),
    location: clip(asString(pick("location") || pick("city")), 80),
    linkedin: clip(asString(pick("linkedin") || pick("website")), 200),
    summary: clip(asString(pick("summary")), 800),
    experience: clip(serializeExperience(src.experience ?? src.experienceItems), 4000),
    education: clip(asString(src.education), 1500),
    military: clip(asString(src.military || src.service), 800),
    skills: clip(Array.isArray(src.skills) ? src.skills.filter(Boolean).join(", ") : asString(src.skills), 500),
    languages: clip(
      Array.isArray(src.languages)
        ? src.languages
            .map((row) => {
              if (typeof row === "string") return row;
              if (!row || typeof row !== "object") return "";
              const name = String(row.name || row.language || "").trim();
              const level = String(row.level || row.proficiency || "").trim();
              return [name, level ? `(${level})` : ""].filter(Boolean).join(" ");
            })
            .filter(Boolean)
            .join(", ")
        : asString(src.languages),
      400,
    ),
    references: clip(asString(src.references), 800),
  };
}

/**
 * POST /api/cv-ai
 * Body: { action: "parse" | "polish", text, lang?, context? }
 */
export async function handleCvAiRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "POST") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(ip, RATE_MAX, RATE_WINDOW_MS)) {
    json(res, 429, {
      ok: false,
      error: "יותר מדי בקשות ל-AI. נסו שוב בעוד כמה דקות.",
    });
    return;
  }

  let payload;
  try {
    const raw = await readBody(req, MAX_JSON_BYTES);
    payload = parseBody(raw, req.headers["content-type"]);
  } catch (err) {
    if (err && err.code === "PAYLOAD_TOO_LARGE") {
      json(res, 413, { ok: false, error: "הטקסט ארוך מדי." });
      return;
    }
    json(res, 400, { ok: false, error: "בקשה לא תקינה." });
    return;
  }

  if (!payload || typeof payload !== "object") {
    json(res, 400, { ok: false, error: "בקשה לא תקינה." });
    return;
  }

  const lang = normalizeLang(payload.lang);
  const action = String(payload.action || "parse").toLowerCase();
  const text = clip(payload.text, action === "polish" ? POLISH_MAX_CHARS : PARSE_MAX_CHARS).trim();

  if (!text) {
    json(res, 400, {
      ok: false,
      error: failMsg(lang, "כתבו או הדביקו טקסט קודם.", "Type or paste some text first."),
    });
    return;
  }

  if (!hasLlmKey()) {
    json(res, 500, {
      ok: false,
      error: failMsg(
        lang,
        "יצירת AI לא זמינה כרגע. חסר מפתח OPENAI_API_KEY או GEMINI_API_KEY.",
        "AI is unavailable. Set OPENAI_API_KEY or GEMINI_API_KEY.",
      ),
    });
    return;
  }

  try {
    if (action === "polish") {
      const context = clip(payload.context, 80);
      const result = await completeJson({
        system: POLISH_SYSTEM,
        user: `Language: ${lang}\nContext: ${context || "experience_bullet"}\nText:\n${text}`,
        temperature: 0.4,
        maxTokens: 220,
      });
      const polished = clip(asString(result?.text || result?.bullet || result?.rewritten), 500);
      if (!polished) {
        json(res, 502, {
          ok: false,
          error: failMsg(lang, "לא הצלחנו לשדרג את הניסוח. נסו שוב.", "Could not polish that line. Try again."),
        });
        return;
      }
      json(res, 200, { ok: true, action: "polish", text: polished });
      return;
    }

    const result = await completeJson({
      system: PARSE_SYSTEM,
      user: `Target CV language: ${lang}\nNotes:\n${text}`,
      temperature: 0.25,
      maxTokens: 1800,
    });
    const cv = normalizeCv(result);
    const filled = Object.values(cv).some((v) => String(v).trim());
    if (!filled) {
      json(res, 502, {
        ok: false,
        error: failMsg(
          lang,
          "לא הצלחנו לפענח את הטקסט. נסו לכתוב קצת יותר פרטים.",
          "Could not parse that text. Add a bit more detail and try again.",
        ),
      });
      return;
    }
    json(res, 200, { ok: true, action: "parse", cv });
  } catch (err) {
    if (err && err.code === "MISSING_API_KEY") {
      json(res, 500, {
        ok: false,
        error: failMsg(lang, "יצירת AI לא זמינה כרגע.", "AI is temporarily unavailable."),
      });
      return;
    }
    json(res, 502, {
      ok: false,
      error: failMsg(
        lang,
        "שירות ה-AI לא הגיב. נסו שוב בעוד רגע.",
        "The AI service did not respond. Please try again.",
      ),
    });
  }
}
