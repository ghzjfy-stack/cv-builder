import { randomUUID } from "node:crypto";
import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { kvGet, kvSet } from "./kv.js";
import { packAmount, isPackId } from "../src/config/checkout.js";
import { signUnlockToken, TOKEN_TTL_MS } from "./unlockToken.js";

const SESSION_TTL_SEC = () => Math.max(3600, Number(process.env.CODE_TTL_SECONDS || 30 * 24 * 60 * 60));

/** @typedef {'pending' | 'paid' | 'expired'} SessionStatus */

/**
 * @typedef {object} PayboxCheckoutSession
 * @property {string} session_id
 * @property {SessionStatus} status
 * @property {string} pack
 * @property {number} amount_ils
 * @property {'paybox' | 'card'} method
 * @property {string} contact
 * @property {string} created_at
 * @property {string | null} paid_at
 * @property {string | null} expires_at
 * @property {string | null} transaction_id
 * @property {string | null} code_hash
 */

export function sessionKey(sessionId) {
  return `qc:paybox:session:${String(sessionId || "").trim()}`;
}

export function isSessionId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function extractSessionId(raw) {
  if (raw == null) return "";
  if (typeof raw === "string" || typeof raw === "number") {
    const text = String(raw).trim();
    if (isSessionId(text)) return text;
    const nested = text.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    );
    return nested ? nested[0] : "";
  }
  if (typeof raw !== "object") return "";
  const obj = /** @type {Record<string, unknown>} */ (raw);
  const keys = [
    "session_id",
    "sessionId",
    "order_id",
    "orderId",
    "uniqueId",
    "unique_id",
    "reference",
    "ref",
    "custom",
    "customData",
    "user_data",
    "userdata",
    "PBX_CMD",
    "pbx_cmd",
    "extra_info",
    "note",
    "description",
  ];
  for (const key of keys) {
    const found = extractSessionId(obj[key]);
    if (found) return found;
  }
  if (obj.data && typeof obj.data === "object") {
    const found = extractSessionId(obj.data);
    if (found) return found;
  }
  return "";
}

function buildPayUrl(sessionId, amountIls, method) {
  const cardTpl = String(process.env.PAYBOX_CARD_URL || "").trim();
  const payTpl = String(process.env.PAYBOX_PAY_URL || "").trim();
  const template = method === "card" && cardTpl ? cardTpl : payTpl || cardTpl;
  if (!template) return "";
  const filled = template
    .replaceAll("{{session}}", encodeURIComponent(sessionId))
    .replaceAll("{{amount}}", encodeURIComponent(Number(amountIls).toFixed(2)))
    .replaceAll("{{method}}", encodeURIComponent(method));
  if (filled.includes("{{")) return "";
  if (template === filled && !/[?&](session|order|ref|unique)/i.test(template)) {
    const join = template.includes("?") ? "&" : "?";
    return `${template}${join}session=${encodeURIComponent(sessionId)}&amount=${encodeURIComponent(
      Number(amountIls).toFixed(2),
    )}&method=${encodeURIComponent(method)}`;
  }
  return filled;
}

/**
 * @param {string} sessionId
 * @returns {Promise<PayboxCheckoutSession | null>}
 */
export async function getCheckoutSession(sessionId) {
  if (!isSessionId(sessionId)) return null;
  const row = await kvGet(sessionKey(sessionId));
  if (!row || typeof row !== "object") return null;
  return /** @type {PayboxCheckoutSession} */ (row);
}

/**
 * @param {object} input
 * @param {string} [input.pack]
 * @param {string} [input.contact]
 * @param {'paybox' | 'card'} [input.method]
 */
export async function createCheckoutSession(input) {
  const pack = isPackId(input.pack) ? input.pack : "basic";
  const method = input.method === "card" ? "card" : "paybox";
  const amountIls = packAmount(pack);
  const now = Date.now();
  const ttl = SESSION_TTL_SEC();
  /** @type {PayboxCheckoutSession} */
  const record = {
    session_id: randomUUID(),
    status: "pending",
    pack,
    amount_ils: amountIls,
    method,
    contact: String(input.contact || "").trim().slice(0, 120),
    created_at: new Date(now).toISOString(),
    paid_at: null,
    expires_at: new Date(now + ttl * 1000).toISOString(),
    transaction_id: null,
    code_hash: null,
  };
  await kvSet(sessionKey(record.session_id), record, ttl);
  return {
    record,
    payUrl: buildPayUrl(record.session_id, amountIls, method),
  };
}

/**
 * @param {string} sessionId
 * @param {{ record?: { code_hash?: string, expires_at?: string, transaction_id?: string }, transactionId?: string }} issued
 */
export async function markCheckoutPaid(sessionId, issued = {}) {
  const current = await getCheckoutSession(sessionId);
  if (!current) return null;
  const ttl = SESSION_TTL_SEC();
  /** @type {PayboxCheckoutSession} */
  const next = {
    ...current,
    status: "paid",
    paid_at: current.paid_at || new Date().toISOString(),
    expires_at: issued.record?.expires_at || current.expires_at,
    transaction_id: String(issued.transactionId || issued.record?.transaction_id || current.transaction_id || ""),
    code_hash: issued.record?.code_hash || current.code_hash,
  };
  await kvSet(sessionKey(sessionId), next, ttl);
  return next;
}

export async function handlePayboxSessionRequest(req, res) {
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
  if (rateLimited(`paybox-session:${ip}`, 20, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes." });
    return;
  }

  let payload;
  try {
    const raw = await readBody(req, 8 * 1024);
    payload = parseBody(raw, req.headers["content-type"] || "application/json");
  } catch {
    json(res, 400, { ok: false, error: "Invalid body" });
    return;
  }
  if (!payload || typeof payload !== "object") {
    json(res, 400, { ok: false, error: "Invalid JSON" });
    return;
  }

  const method = payload.method === "card" ? "card" : "paybox";
  const created = await createCheckoutSession({
    pack: payload.pack,
    contact: payload.contact || payload.phone || payload.email || "",
    method,
  });

  json(res, 200, {
    ok: true,
    session_id: created.record.session_id,
    status: created.record.status,
    amount_ils: created.record.amount_ils,
    expires_at: created.record.expires_at,
    pay_url: created.payUrl,
    method,
  });
}

export async function handlePayboxStatusRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "GET") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(`paybox-status:${ip}`, 90, 60 * 1000)) {
    json(res, 429, { ok: false, error: "Too many attempts. Please wait a few minutes." });
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const sessionId = String(url.searchParams.get("session") || url.searchParams.get("session_id") || "").trim();
  const session = await getCheckoutSession(sessionId);
  if (!session) {
    json(res, 404, { ok: false, paid: false, error: "Session not found" });
    return;
  }

  const exp = Date.parse(session.expires_at || "");
  if (Number.isFinite(exp) && exp <= Date.now() && session.status !== "paid") {
    json(res, 200, { ok: true, paid: false, status: "expired" });
    return;
  }

  if (session.status !== "paid") {
    json(res, 200, { ok: true, paid: false, status: session.status });
    return;
  }

  json(res, 200, {
    ok: true,
    paid: true,
    status: "paid",
    token: signUnlockToken(),
    expiresInSec: Math.floor(TOKEN_TTL_MS / 1000),
    download: { authorized: true, mode: "client" },
  });
}
