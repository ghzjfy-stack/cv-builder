import { createHmac, timingSafeEqual } from "node:crypto";
import { issuePaidCode } from "./codes.js";
import { json, parseBody, readBody } from "./http.js";
import { sendVerificationCode } from "./notify.js";
import { notifyPaidOrder } from "./orderNotify.js";

const MAX_BYTES = 64 * 1024;
const EXPECTED_AMOUNT = Number(process.env.PAYMENT_AMOUNT_ILS || 9.9);
const COVER_LETTER_BUMP = Number(process.env.COVER_LETTER_BUMP_ILS || 10);
const COMPLETE_AMOUNT = Number(process.env.PAYMENT_PACK_COMPLETE_ILS || 19.9);

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function extractSignature(req) {
  const headers = req.headers || {};
  const raw =
    headers["x-webhook-signature"] ||
    headers["x-hub-signature-256"] ||
    headers["x-signature"] ||
    "";
  return String(raw).replace(/^sha256=/i, "").trim();
}

function verifyWebhookAuth(req, raw) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || "";
  if (!secret || secret.length < 16) {
    const err = new Error("missing_webhook_secret");
    err.code = "MISSING_WEBHOOK_SECRET";
    throw err;
  }

  const auth = String(req.headers.authorization || "");
  if (auth.toLowerCase().startsWith("bearer ")) {
    if (safeEqual(auth.slice(7).trim(), secret)) return true;
  }

  const provided = extractSignature(req);
  if (!provided) return false;
  const expectedHex = createHmac("sha256", secret).update(raw).digest("hex");
  const expectedB64 = createHmac("sha256", secret).update(raw).digest("base64");
  return safeEqual(provided, expectedHex) || safeEqual(provided, expectedB64);
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
  ].includes(status);
}

function normalizePayment(payload) {
  const nested = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const amount = Number(
    nested.amount ??
      nested.Sum ??
      nested.sum ??
      nested.CCardSum ??
      nested.price ??
      nested.Amount ??
      0,
  );
  return {
    provider: String(pick(nested, ["provider", "source", "gateway"]) || pick(payload, ["provider"]) || "card"),
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
      ]) || "",
    ),
    amount,
    phone: String(pick(nested, ["phone", "user_phone", "msisdn", "payer_phone", "Phone"]) || ""),
    email: String(pick(nested, ["email", "user_email", "payer_email", "Email"]) || ""),
    name: String(
      pick(nested, ["name", "full_name", "fullName", "customer_name", "payer_name", "Name"]) || "",
    ),
    success: isSuccessStatus(payload) || isSuccessStatus(nested),
  };
}

function amountOk(amount) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return process.env.PAYMENT_REQUIRE_AMOUNT !== "1";
  }
  return (
    Math.abs(amount - EXPECTED_AMOUNT) < 0.05 ||
    Math.abs(amount - COMPLETE_AMOUNT) < 0.05 ||
    Math.abs(amount - (EXPECTED_AMOUNT + COVER_LETTER_BUMP)) < 0.05
  );
}

/**
 * POST /api/payment-webhook
 * Authenticated payment confirmation from Bit/card aggregators (Grow, Meshulam, Cardcom, Zapier, etc).
 */
export async function handlePaymentWebhookRequest(req, res) {
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

  let raw;
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

  let authorized = false;
  try {
    authorized = verifyWebhookAuth(req, raw || Buffer.alloc(0));
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

  const payload = parseBody(raw, req.headers["content-type"]);
  if (!payload || typeof payload !== "object") {
    json(res, 400, { ok: false, error: "Invalid JSON" });
    return;
  }

  const payment = normalizePayment(payload);
  if (!payment.success) {
    json(res, 200, { ok: true, ignored: true, reason: "not_successful" });
    return;
  }
  if (!amountOk(payment.amount)) {
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
    provider: payment.provider,
    transactionId: payment.transactionId,
  });

  if (issued.alreadyUsed) {
    json(res, 200, { ok: true, already_used: true, delivered: false });
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
      provider: payment.provider,
      transactionId: payment.transactionId,
      customerName: payment.name,
      phone: payment.phone,
      email: payment.email,
      paymentMethod: payment.provider,
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
    ...(debug ? { debug_code: issued.code } : {}),
    ...(!notify.delivered && !payment.phone && !payment.email
      ? { warning: "missing_contact" }
      : {}),
  });
}
