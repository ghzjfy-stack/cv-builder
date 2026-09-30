import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { kvGet, kvIsRemote, kvSet } from "./kv.js";
import { verifyUnlockToken } from "./unlockToken.js";

const KEY_PREFIX = "handoff-pdf:";
const DRAFT_PREFIX = "handoff:";
const TTL_SEC = 60 * 60 * 24;
const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_PDF = 2.8 * 1024 * 1024;
const TMP_DIR = path.join("/tmp", "quickcv-handoff-pdf");

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

function safeFilename(name) {
  const raw = String(name || "cv.pdf")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return raw.toLowerCase().endsWith(".pdf") ? raw : `${raw}.pdf`;
}

/** ASCII-only filename for the legacy Content-Disposition filename= parameter. */
function asciiFilename(name) {
  const raw = safeFilename(name)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const base = raw.replace(/\.pdf$/i, "").replace(/^\.+/, "");
  const out = base || "cv";
  return `${out}.pdf`;
}

function contentDisposition(forceDownload, filename) {
  const utf8Name = safeFilename(filename);
  const asciiName = asciiFilename(filename);
  const type = forceDownload ? "attachment" : "inline";
  return `${type}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`;
}

function decodePdf(payload) {
  let raw = payload?.pdfBase64 || payload?.pdf || payload?.data || "";
  if (typeof raw !== "string" || !raw.trim()) return null;
  raw = raw.trim();
  const dataUrl = raw.match(/^data:application\/pdf;base64,(.+)$/i);
  if (dataUrl) raw = dataUrl[1];
  raw = raw.replace(/\s/g, "");
  let buf;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  if (!buf.length || buf.length > MAX_PDF) return null;
  if (buf.slice(0, 4).toString("utf8") !== "%PDF") return null;
  return buf;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function requestOrigin(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    .trim();
  if (!host) return "";
  const fwd = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
  const proto = fwd === "http" || fwd === "https" ? fwd : local ? "http" : "https";
  return `${proto}://${host}`;
}

function tmpMetaPath(id) {
  return path.join(TMP_DIR, `${id}.json`);
}

function tmpPdfPath(id) {
  return path.join(TMP_DIR, `${id}.pdf`);
}

async function storePdfLocal(id, buf, filename) {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.writeFile(tmpPdfPath(id), buf);
  await fs.writeFile(
    tmpMetaPath(id),
    JSON.stringify({ filename, bytes: buf.length, exp: Date.now() + TTL_SEC * 1000 }),
    "utf8",
  );
}

async function loadPdfLocal(id) {
  try {
    const metaRaw = await fs.readFile(tmpMetaPath(id), "utf8");
    const meta = JSON.parse(metaRaw);
    if (!meta || (meta.exp && Date.now() > meta.exp)) {
      await fs.unlink(tmpPdfPath(id)).catch(() => {});
      await fs.unlink(tmpMetaPath(id)).catch(() => {});
      return null;
    }
    const buf = await fs.readFile(tmpPdfPath(id));
    if (!buf.length || buf.slice(0, 4).toString("utf8") !== "%PDF") return null;
    return { buf, filename: safeFilename(meta.filename) };
  } catch {
    return null;
  }
}

async function storePdfRecord(id, buf, filename) {
  const row = {
    pdfBase64: buf.toString("base64"),
    filename,
    bytes: buf.length,
    at: Date.now(),
  };
  if (kvIsRemote()) {
    try {
      await kvSet(KEY_PREFIX + id, row, TTL_SEC);
      return;
    } catch (err) {
      console.warn("[quickcv] handoff-pdf kv set failed, using /tmp:", err?.message || err);
    }
  }
  await storePdfLocal(id, buf, filename);
}

async function loadPdfRecord(id) {
  if (kvIsRemote()) {
    try {
      const row = await kvGet(KEY_PREFIX + id);
      if (row && typeof row === "object" && row.pdfBase64) {
        const buf = Buffer.from(String(row.pdfBase64), "base64");
        if (buf.length && buf.slice(0, 4).toString("utf8") === "%PDF") {
          return { buf, filename: safeFilename(row.filename) };
        }
      }
    } catch (err) {
      console.warn("[quickcv] handoff-pdf kv get failed, trying /tmp:", err?.message || err);
    }
  }
  return loadPdfLocal(id);
}

/**
 * POST /api/handoff-pdf — store a PDF (and optional draft) for WhatsApp open/save.
 * GET  /api/handoff-pdf?id=… — serve application/pdf so WhatsApp opens a real file.
 */
export async function handleHandoffPdfRequest(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, POST, OPTIONS");
    res.end();
    return;
  }

  const ip = clientIp(req);

  if (req.method === "GET") {
    if (rateLimited(`handoff-pdf-get:${ip}`, 60, 10 * 60 * 1000)) {
      json(res, 429, { ok: false, error: "rate" });
      return;
    }
    const url = new URL(req.url || "/", "http://localhost");
    const id = String(url.searchParams.get("id") || "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 16);
    if (!id) {
      json(res, 400, { ok: false, error: "missing" });
      return;
    }
    const stored = await loadPdfRecord(id);
    if (!stored) {
      json(res, 404, { ok: false, error: "expired" });
      return;
    }
    const { buf, filename } = stored;
    const forceDownload = url.searchParams.get("dl") === "1";
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", contentDisposition(forceDownload, filename));
    res.setHeader("Content-Length", String(buf.length));
    res.setHeader("Cache-Control", "private, max-age=300");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(buf);
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { ok: false, error: "method" });
    return;
  }

  if (rateLimited(`handoff-pdf-post:${ip}`, 8, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "rate" });
    return;
  }

  let body;
  try {
    const raw = await readBody(req, MAX_BYTES);
    body = parseBody(raw, req.headers["content-type"]) || {};
  } catch (err) {
    json(res, err?.code === "PAYLOAD_TOO_LARGE" ? 413 : 400, { ok: false, error: "bad_request" });
    return;
  }

  // Prefer a fresh unlock token; allow paid-session uploads without one (rate-limited).
  const token = String(body.token || "");
  if (token && !verifyUnlockToken(token)) {
    json(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  const pdf = decodePdf(body);
  if (!pdf) {
    json(res, 400, { ok: false, error: "bad_pdf" });
    return;
  }

  const id = newId();
  const filename = safeFilename(body.filename);
  await storePdfRecord(id, pdf, filename);

  const draft = sanitizeDraft(body.draft || null);
  if (draft) {
    try {
      await kvSet(DRAFT_PREFIX + id, draft, TTL_SEC);
    } catch {
      /* draft is optional — PDF link still works */
    }
  }

  const origin = requestOrigin(req);
  const path = `/api/handoff-pdf?id=${encodeURIComponent(id)}`;
  json(res, 200, {
    ok: true,
    id,
    ttl: TTL_SEC,
    filename,
    url: origin ? `${origin}${path}` : path,
    studioUrl: origin ? `${origin}/?h=${encodeURIComponent(id)}#studio` : `/?h=${encodeURIComponent(id)}#studio`,
  });
}
