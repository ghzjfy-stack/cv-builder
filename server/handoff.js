import { randomBytes } from "node:crypto";
import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { kvGet, kvSet } from "./kv.js";

const MAX_BYTES = 80 * 1024;
const TTL_SEC = 60 * 60 * 24;
const KEY_PREFIX = "handoff:";
const STRING_LIMITS = {
  "in-name": 120,
  "in-title": 160,
  "in-phone": 40,
  "in-email": 120,
  "in-location": 80,
  "in-linkedin": 180,
  "in-summary": 2500,
  "in-experience": 12000,
  "in-education": 4000,
  "in-military": 2500,
  "in-skills": 800,
  "in-languages": 400,
  "in-references": 2500,
  "in-cl-company": 160,
  "in-cl-recipient": 160,
  "in-cl-role": 160,
  "in-cl-body": 4000,
  "phrase-field": 80,
  cvLang: 8,
  layout: 40,
  accent: 24,
  font: 120,
  density: 16,
  example: 40,
  skin: 40,
  previewBg: 40,
  fontScale: 12,
  lineHeight: 12,
};

function newId() {
  return randomBytes(8)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
    .slice(0, 10);
}

function sanitizeDraft(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out = {};
  Object.keys(STRING_LIMITS).forEach((key) => {
    if (raw[key] == null) return;
    const limit = STRING_LIMITS[key];
    if (typeof raw[key] === "boolean") {
      out[key] = raw[key];
      return;
    }
    const value = String(raw[key]).slice(0, limit);
    if (value) out[key] = value;
  });
  if (typeof raw.includeCoverLetter === "boolean") out.includeCoverLetter = raw.includeCoverLetter;
  return Object.keys(out).length ? out : null;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export async function handleHandoffRequest(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.end();
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(`handoff:${ip}`, 24, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "rate" });
    return;
  }

  if (req.method === "GET") {
    const url = new URL(req.url || "/", "http://localhost");
    const id = String(url.searchParams.get("id") || "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 16);
    if (!id) {
      json(res, 400, { ok: false, error: "missing" });
      return;
    }
    const draft = await kvGet(KEY_PREFIX + id);
    if (!draft) {
      json(res, 404, { ok: false, error: "expired" });
      return;
    }
    json(res, 200, { ok: true, draft });
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { ok: false, error: "method" });
    return;
  }

  let body;
  try {
    const raw = await readBody(req, MAX_BYTES);
    body = parseBody(raw, req.headers["content-type"]) || {};
  } catch {
    json(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  const draft = sanitizeDraft(body.draft || body);
  if (!draft) {
    json(res, 400, { ok: false, error: "empty" });
    return;
  }

  const id = newId();
  await kvSet(KEY_PREFIX + id, draft, TTL_SEC);
  json(res, 200, { ok: true, id, ttl: TTL_SEC });
}
