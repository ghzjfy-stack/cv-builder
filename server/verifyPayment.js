import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const VISION_MODEL = "gpt-4o-mini";
const MAX_JSON_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const RATE_MAX = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

const VERIFY_FAIL_MSG =
  "Payment screenshot could not be verified. Please make sure the transfer of 5 ILS to 054-3554888 is clearly visible.";

const SYSTEM_PROMPT = `You are an automated payment verification assistant for an Israeli app.
      Examine the provided screenshot from the Bit (ביט) payment app.
      Verify all of the following rules:
      1. Is it a valid Bit payment confirmation screen showing a successful transfer?
      2. Is the payment amount exactly 5 NIS (₪5 / 5 ש״ח)?
      3. Is the recipient phone number or name matching '054-3554888' or '0543554888'?
      4. Is the screenshot recent and visually authentic (not a generic blank template)?

      Respond strictly in JSON format with no extra text:
      {
        "is_valid": true / false,
        "reason": "Brief explanation in Hebrew of why it failed or succeeded",
        "transaction_id": "Extracted transaction/approval ID if visible, else null"
      }`;

/** @type {Map<string, number[]>} */
const rateBuckets = new Map();
/** @type {Map<string, number>} */
const usedTxIds = new Map();
let bootSecret = "";

function getSigningSecret() {
  const fromEnv = process.env.PAYMENT_TOKEN_SECRET || process.env.OPENAI_API_KEY;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (!bootSecret) bootSecret = randomBytes(32).toString("hex");
  return bootSecret;
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimited(ip) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) {
      if (Buffer.isBuffer(req.body)) {
        resolve(req.body);
        return;
      }
      if (typeof req.body === "string") {
        resolve(Buffer.from(req.body, "utf8"));
        return;
      }
      resolve(null);
      return;
    }
    if (req.readableEnded || req.complete) {
      resolve(Buffer.alloc(0));
      return;
    }
    const chunks = [];
    let size = 0;
    const timer = setTimeout(() => {
      reject(Object.assign(new Error("body_timeout"), { code: "BODY_TIMEOUT" }));
    }, 20000);
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        clearTimeout(timer);
        reject(Object.assign(new Error("payload_too_large"), { code: "PAYLOAD_TOO_LARGE" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function readJsonPayload(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const raw = await readBody(req, MAX_JSON_BYTES);
  if (raw == null) return {};
  return JSON.parse(raw.toString("utf8") || "{}");
}

function normalizeMime(mime) {
  const v = String(mime || "").toLowerCase().split(";")[0].trim();
  if (v === "image/jpg") return "image/jpeg";
  return v;
}

function extractImage(payload) {
  if (!payload || typeof payload !== "object") return null;

  let mime = normalizeMime(payload.mimeType || payload.mime || payload.type);
  let raw = payload.imageBase64 || payload.image || payload.data || payload.base64;

  if (typeof raw !== "string" || !raw.trim()) return null;
  raw = raw.trim();

  const dataUrl = raw.match(/^data:([a-z0-9.+/-]+);base64,(.+)$/i);
  if (dataUrl) {
    mime = normalizeMime(dataUrl[1]);
    raw = dataUrl[2];
  }

  raw = raw.replace(/\s/g, "");
  if (!ALLOWED_MIME.has(mime)) return null;

  let buf;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  if (!buf.length || buf.length > MAX_IMAGE_BYTES) return null;
  return { mime, base64: raw, bytes: buf.length };
}

function signUnlockToken() {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUnlockToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

function parseModelJson(text) {
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

async function inspectWithVision(mime, base64) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error("missing_api_key");
    err.code = "MISSING_API_KEY";
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: VISION_MODEL,
        temperature: 0,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Verify this Bit payment screenshot against the rules. Return JSON only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime};base64,${base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const err = new Error("openai_error");
      err.code = "OPENAI_ERROR";
      err.status = response.status;
      throw err;
    }
    const text = data?.choices?.[0]?.message?.content;
    return parseModelJson(text);
  } finally {
    clearTimeout(timer);
  }
}

function rememberTx(txId) {
  const id = String(txId || "").trim();
  if (!id || id === "null") return false;
  const prev = usedTxIds.get(id);
  if (prev && Date.now() - prev < 24 * 60 * 60 * 1000) return true;
  usedTxIds.set(id, Date.now());
  if (usedTxIds.size > 2000) {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const [key, at] of usedTxIds) {
      if (at < cutoff) usedTxIds.delete(key);
    }
  }
  return false;
}

/**
 * POST /api/verify-payment
 * Body: { imageBase64: string, mimeType?: string }
 */
export async function handleVerifyPaymentRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "POST") {
    json(res, 405, { ok: false, is_valid: false, error: "Method not allowed" });
    return;
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    json(res, 429, {
      ok: false,
      is_valid: false,
      error: "Too many verification attempts. Please wait a few minutes and try again.",
    });
    return;
  }

  let payload;
  try {
    payload = await readJsonPayload(req);
  } catch (err) {
    if (err && err.code === "PAYLOAD_TOO_LARGE") {
      json(res, 413, { ok: false, is_valid: false, error: VERIFY_FAIL_MSG });
      return;
    }
    json(res, 400, { ok: false, is_valid: false, error: VERIFY_FAIL_MSG });
    return;
  }

  const image = extractImage(payload);
  if (!image) {
    json(res, 400, { ok: false, is_valid: false, error: VERIFY_FAIL_MSG });
    return;
  }

  let verdict;
  try {
    verdict = await inspectWithVision(image.mime, image.base64);
  } catch (err) {
    if (err && err.code === "MISSING_API_KEY") {
      json(res, 500, {
        ok: false,
        is_valid: false,
        error: "Payment verification is temporarily unavailable.",
      });
      return;
    }
    json(res, 502, {
      ok: false,
      is_valid: false,
      error: "Payment verification is temporarily unavailable. Please try again.",
    });
    return;
  }

  const isValid = Boolean(
    verdict && (verdict.is_valid === true || verdict.is_valid === "true"),
  );
  const reason = typeof verdict?.reason === "string" ? verdict.reason.trim() : "";
  const transactionId =
    verdict && verdict.transaction_id != null && String(verdict.transaction_id).trim()
      ? String(verdict.transaction_id).trim()
      : null;

  if (!isValid) {
    json(res, 200, {
      ok: false,
      is_valid: false,
      reason: reason || null,
      transaction_id: null,
      error: VERIFY_FAIL_MSG,
    });
    return;
  }

  if (transactionId && rememberTx(transactionId)) {
    json(res, 200, {
      ok: false,
      is_valid: false,
      reason: "צילום המסך כבר שומש לאימות.",
      transaction_id: null,
      error: VERIFY_FAIL_MSG,
    });
    return;
  }

  const token = signUnlockToken();
  json(res, 200, {
    ok: true,
    is_valid: true,
    reason: reason || "התשלום אומת בהצלחה.",
    transaction_id: transactionId,
    token,
    expiresInSec: Math.floor(TOKEN_TTL_MS / 1000),
  });
}
