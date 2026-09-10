import { createHmac, createVerify, timingSafeEqual } from "node:crypto";
import { issuePaidCode } from "./codes.js";
import { json, parseBody, readBody } from "./http.js";
import { sendVerificationCode } from "./notify.js";
import { notifyPaidOrder } from "./orderNotify.js";
import { extractSessionId, getCheckoutSession, markCheckoutPaid } from "./payboxSession.js";

const MAX_BYTES = 64 * 1024;
const EXPECTED_AMOUNT = Number(process.env.PAYMENT_AMOUNT_ILS || 9.9);
const COMPLETE_AMOUNT = Number(process.env.PAYMENT_PACK_COMPLETE_ILS || 19.9);

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function webhookSecrets() {
  return [process.env.PAYBOX_WEBHOOK_SECRET, process.env.PAYMENT_WEBHOOK_SECRET]
    .map((value) => String(value || "").trim())
    .filter((value) => value.length >= 16);
}

function extractSignature(req, payload) {
  const headers = req.headers || {};
  const raw =
    headers["x-paybox-signature"] ||
    headers["x-webhook-signature"] ||
    headers["x-hub-signature-256"] ||
    headers["x-signature"] ||
    "";
  const headerSig = String(raw).replace(/^sha256=/i, "").trim();
  if (headerSig) return headerSig;
  const nested = payload && typeof payload === "object" ? payload : {};
  return String(
    nested.signature ||
      nested.sign ||
      nested.hmac ||
      nested.hash ||
      nested.PBX_HMAC ||
      nested.K ||
      "",
  ).trim();
}

function hmacHex(secret, data) {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function hmacB64(secret, data) {
  return createHmac("sha256", secret).update(data).digest("base64");
}

function canonicalFields(payload) {
  if (!payload || typeof payload !== "object") return "";
  const skip = new Set(["signature", "sign", "hmac", "hash", "PBX_HMAC", "K"]);
  return Object.keys(payload)
    .filter((key) => !skip.has(key) && payload[key] != null && typeof payload[key] !== "object")
    .sort()
    .map((key) => `${key}=${payload[key]}`)
    .join("&");
}

function verifyRsaSignature(message, signature, pem) {
  if (!pem || !signature || !message) return false;
  try {
    const verifier = createVerify("SHA1");
    verifier.update(message);
    verifier.end();
    return verifier.verify(pem, signature.replace(/ /g, "+"), "base64");
  } catch {
    return false;
  }
}

function verifyWebhookAuth(req, raw, payload) {
  const secrets = webhookSecrets();
  if (!secrets.length) {
    const err = new Error("missing_webhook_secret");
    err.code = "MISSING_WEBHOOK_SECRET";
    throw err;
  }

  const auth = String(req.headers.authorization || "");
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (secrets.some((secret) => safeEqual(token, secret))) return true;
  }

  const provided = extractSignature(req, payload);
  const rawBuf = raw || Buffer.alloc(0);
  const canonical = canonicalFields(payload);
  const publicKey = String(process.env.PAYBOX_PUBLIC_KEY || "").trim();
  if (provided && publicKey && verifyRsaSignature(canonical || rawBuf.toString("utf8"), provided, publicKey)) {
    return true;
  }
  if (!provided) return false;

  for (const secret of secrets) {
    const hex = hmacHex(secret, rawBuf);
    const b64 = hmacB64(secret, rawBuf);
    const canonHex = canonical ? hmacHex(secret, canonical) : "";
    if (
      safeEqual(provided, hex) ||
      safeEqual(provided, b64) ||
      (canonHex && safeEqual(provided, canonHex))
    ) {
      return true;
    }
  }
  return false;
}

function pick(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value != null && String(value).trim()) return value;
  }
  return "";
}

function isSuccessStatus(payload) {
  const status = String(
    payload.status ||
      payload.Status ||
      payload.event ||
      payload.Event ||
      payload.DealResponse ||
      payload.dealResponse ||
      payload.transaction_status ||
      payload.Erreur ||
      payload.error_code ||
      payload.code ||
      "",
  ).toLowerCase();
  if (payload.is_paid === true || payload.paid === true || payload.success === true) return true;
  return [
    "success",
    "paid",
    "completed",
    "approved",
    "complete",
    "captured",
    "payment.success",
    "charge.succeeded",
    "1",
    "000",
    "ok",
  ].includes(status);
}

function toAmountIls(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (amount >= 50 && Math.abs(amount / 100 - EXPECTED_AMOUNT) < 0.05) return amount / 100;
  if (amount >= 50 && Math.abs(amount / 100 - COMPLETE_AMOUNT) < 0.05) return amount / 100;
  return amount;
}

function normalizePayboxPayment(payload) {
  const nested = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const amount = toAmountIls(
    nested.amount ??
      nested.Sum ??
      nested.sum ??
      nested.CCardSum ??
      nested.price ??
      nested.Amount ??
      nested.MONTANT ??
      nested.PBX_TOTAL ??
      0,
  );
  return {
    provider: "paybox",
    transactionId: String(
      pick(nested, [
        "transaction_id",
        "transactionId",
        "TransactionId",
        "internalDealNumber",
        "DealNumber",
        "confirmation",
        "id",
        "txid",
        "NUMTRANS",
        "PBX_TRANS",
      ]) || "",
    ),
    amount,
    phone: String(pick(nested, ["phone", "user_phone", "msisdn", "payer_phone", "Phone", "PBX_PORTEUR"]) || ""),
    email: String(pick(nested, ["email", "user_email", "payer_email", "Email"]) || ""),
    name: String(
      pick(nested, ["name", "full_name", "fullName", "customer_name", "payer_name", "Name"]) || "",
    ),
    success: isSuccessStatus(payload) || isSuccessStatus(nested),
    sessionId: extractSessionId(payload) || extractSessionId(nested),
    method: "paybox",
  };
}

function amountOk(amount, expected) {
  const target = Number(expected);
  if (Number.isFinite(target) && target > 0) {
    return Math.abs(amount - target) < 0.05;
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return process.env.PAYMENT_REQUIRE_AMOUNT !== "1";
  }
  return (
    Math.abs(amount - EXPECTED_AMOUNT) < 0.05 ||
    Math.abs(amount - COMPLETE_AMOUNT) < 0.05
  );
}

function queryPayload(req) {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch {
    return {};
  }
}

/**
 * POST /api/webhooks/paybox
 * PayBox IPN: verify signature, issue a 30-day redemption code, notify buyer.
 */
export async function handlePayboxWebhookRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, GET, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "POST" && req.method !== "GET") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  let raw = Buffer.alloc(0);
  if (req.method === "POST") {
    try {
      raw = await readBody(req, MAX_BYTES);
    } catch (err) {
      if (err && err.code === "PAYLOAD_TOO_LARGE") {
        json(res, 413, { ok: false, error: "Payload too large" });
        return;
      }
      json(res, 400, { ok: false, error: "Invalid body" });
      return;
    }
  }

  const payload =
    req.method === "GET"
      ? queryPayload(req)
      : parseBody(raw, req.headers["content-type"]) || queryPayload(req);

  let authorized = false;
  try {
    authorized = verifyWebhookAuth(req, raw, payload && typeof payload === "object" ? payload : {});
  } catch (err) {
    if (err && err.code === "MISSING_WEBHOOK_SECRET") {
      json(res, 500, { ok: false, error: "Webhook is not configured" });
      return;
    }
    json(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }
  if (!authorized) {
    json(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }

  if (!payload || typeof payload !== "object") {
    json(res, 400, { ok: false, error: "Invalid JSON" });
    return;
  }

  const payment = normalizePayboxPayment(payload);
  if (!payment.success) {
    json(res, 200, { ok: true, ignored: true, reason: "not_successful" });
    return;
  }

  let expectedAmount = 0;
  if (payment.sessionId) {
    const session = await getCheckoutSession(payment.sessionId);
    if (!session) {
      json(res, 400, { ok: false, error: "Unknown session" });
      return;
    }
    expectedAmount = session.amount_ils;
    payment.method = session.method === "card" ? "card" : "paybox";
    if (!payment.phone && !payment.email && session.contact) {
      if (session.contact.includes("@")) payment.email = session.contact;
      else payment.phone = session.contact;
    }
  }

  if (expectedAmount > 0 && (!Number.isFinite(payment.amount) || payment.amount <= 0)) {
    payment.amount = expectedAmount;
  }
  if (!amountOk(payment.amount, expectedAmount)) {
    json(res, 200, { ok: true, ignored: true, reason: "amount_mismatch" });
    return;
  }
  if (!payment.transactionId) {
    json(res, 400, { ok: false, error: "Missing transaction_id" });
    return;
  }

  const issued = await issuePaidCode({
    userPhone: payment.phone,
    userEmail: payment.email,
    provider: "paybox",
    transactionId: payment.transactionId,
    sessionId: payment.sessionId,
  });

  if (payment.sessionId) {
    await markCheckoutPaid(payment.sessionId, {
      record: issued.record,
      transactionId: payment.transactionId,
    });
  }

  if (issued.alreadyUsed) {
    json(res, 200, { ok: true, already_used: true, delivered: false, session_id: payment.sessionId || null });
    return;
  }

  const notify = issued.code
    ? await sendVerificationCode({
        phone: payment.phone,
        email: payment.email,
        code: issued.code,
      })
    : { delivered: false, channel: null, error: "no_code" };

  if (issued.code) {
    await notifyPaidOrder({
      provider: payment.method === "card" ? "card" : "paybox",
      transactionId: payment.transactionId,
      customerName: payment.name,
      phone: payment.phone,
      email: payment.email,
      paymentMethod: payment.method === "card" ? "card" : "paybox",
      amountIls: payment.amount,
      verificationCode: issued.code,
    });
  }

  const debug = process.env.PAYMENT_WEBHOOK_DEBUG === "1" && process.env.NODE_ENV !== "production";
  json(res, 200, {
    ok: true,
    is_paid: true,
    delivered: Boolean(notify.delivered),
    channel: notify.channel,
    expires_at: issued.record?.expires_at || null,
    session_id: payment.sessionId || null,
    ...(debug ? { debug_code: issued.code } : {}),
    ...(!notify.delivered && !payment.phone && !payment.email ? { warning: "missing_contact" } : {}),
  });
}
