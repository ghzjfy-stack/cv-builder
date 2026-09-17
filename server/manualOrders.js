import { createHmac, randomInt } from "node:crypto";
import { orderGet, orderSet, orderSetNx, orderStorageMode } from "./orderStore.js";
import {
  addDaysIso,
  getSupabaseOrder,
  setSupabaseConfirm,
  upsertSupabaseOrder,
} from "./supabaseOrders.js";
import { getSigningSecret, signUnlockToken } from "./unlockToken.js";
import { escapeTelegramMarkdown, formatAmountIls, formatPaymentMethod } from "../lib/telegram.js";

/** At least 24h so PENDING → Telegram approve → client poll survives cold starts. */
const ORDER_TTL_SEC = () =>
  Math.max(24 * 3600, Number(process.env.CODE_TTL_SECONDS || 30 * 24 * 60 * 60) || 24 * 3600);

/** @typedef {'PENDING' | 'PAID' | 'CANCELLED'} ManualOrderStatus */

function orderKey(orderId) {
  return `qc:manual:${String(orderId || "").trim().toUpperCase()}`;
}

export function normalizeOrderId(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  if (!/^CV-\d{4}$/.test(raw)) return "";
  return raw;
}

/** Telegram inline button callback_data hard limit. */
const CALLBACK_DATA_MAX_BYTES = 64;

function snapshotRecord(data) {
  const orderId = normalizeOrderId(data.order_id);
  if (!orderId) return null;
  return {
    order_id: orderId,
    phone: String(data.phone || "").slice(0, 40),
    email: String(data.email || "").slice(0, 120),
    customer_name: String(data.customer_name || "").slice(0, 120),
    payment_method: String(data.payment_method || "bit").toLowerCase() || "bit",
    amount_ils: Number(data.amount_ils) > 0 ? Number(data.amount_ils) : 10,
    pack: "basic",
    status: "PENDING",
    confirm: "no",
    unlock_token: null,
    telegram_message_id: null,
    storage: orderStorageMode(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paid_at: null,
    exp_date: addDaysIso(new Date(), 30),
    from_snapshot: true,
  };
}

/**
 * Compact signed recovery token for callback_data (fits within Telegram's 64-byte limit).
 * Variants (pipe-separated, trailing HMAC): id|phone|email|name|amount|method|sig
 */
function signCompactOrderSnapshot(order) {
  const id = normalizeOrderId(order.order_id);
  if (!id) return "";
  const phone = String(order.phone || "").replace(/[|\n\r]/g, "").slice(0, 20);
  const email = String(order.email || "").replace(/[|\n\r]/g, "").slice(0, 40);
  const name = String(order.customer_name || "").replace(/[|\n\r]/g, "").slice(0, 30);
  const amount = Number(order.amount_ils) > 0 ? Number(order.amount_ils) : 10;
  const method = String(order.payment_method || "bit").toLowerCase() === "paybox" ? "p" : "b";
  const contact = phone || email;
  const attempts = [
    `${id}|${phone}|${email}|${name}|${amount}|${method}`,
    `${id}|${contact}|${name}|${amount}|${method}`,
    `${id}|${contact}|${amount}|${method}`,
    `${id}|${amount}|${method}`,
  ];
  for (const payload of attempts) {
    const sig = createHmac("sha256", getSigningSecret())
      .update(`qccompact:${payload}`)
      .digest("base64url")
      .slice(0, 8);
    const token = `${payload}|${sig}`;
    if (Buffer.byteLength(`pay:${token}`, "utf8") <= CALLBACK_DATA_MAX_BYTES) {
      return token;
    }
  }
  return id;
}

function parseCompactOrderSnapshot(token, requireSig = true) {
  const parts = String(token || "").split("|");
  if (parts.length < 2) return null;
  const sig = parts[parts.length - 1];
  const payload = parts.slice(0, -1).join("|");
  const expected = createHmac("sha256", getSigningSecret())
    .update(`qccompact:${payload}`)
    .digest("base64url")
    .slice(0, 8);
  const sigOk = sig === expected;
  if (requireSig && !sigOk) return null;

  const orderId = normalizeOrderId(parts[0]);
  if (!orderId) return null;
  if (parts.length < 4) {
    return snapshotRecord({ order_id: orderId });
  }

  let phone = "";
  let email = "";
  let customer_name = "";
  let amount_ils = 10;
  let payment_method = "bit";

  if (parts.length === 7) {
    phone = parts[1];
    email = parts[2];
    customer_name = parts[3];
    amount_ils = Number(parts[4]) || 10;
    payment_method = parts[5] === "p" ? "paybox" : "bit";
  } else if (parts.length === 6) {
    const contact = parts[1];
    if (contact.includes("@")) email = contact;
    else phone = contact;
    customer_name = parts[2];
    amount_ils = Number(parts[3]) || 10;
    payment_method = parts[4] === "p" ? "paybox" : "bit";
  } else if (parts.length === 5) {
    const contact = parts[1];
    if (contact.includes("@")) email = contact;
    else phone = contact;
    amount_ils = Number(parts[2]) || 10;
    payment_method = parts[3] === "p" ? "paybox" : "bit";
  } else if (parts.length === 4) {
    amount_ils = Number(parts[1]) || 10;
    payment_method = parts[2] === "p" ? "paybox" : "bit";
  } else {
    return snapshotRecord({ order_id: orderId });
  }

  return snapshotRecord({
    order_id: orderId,
    phone,
    email,
    customer_name,
    payment_method,
    amount_ils,
  });
}

function parseLegacyQcordSnapshot(raw) {
  const text = String(raw || "").trim();
  const match = text.match(/QCORD\.([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  const token = match ? match[1] : text.includes(".") ? text : "";
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url").slice(0, 24);
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return snapshotRecord(data);
  } catch {
    return null;
  }
}

export function parseOrderSnapshot(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const legacy = parseLegacyQcordSnapshot(text);
  if (legacy) return legacy;

  // Compact callback token: "pay:CV-…|…|sig", "deny:…", or bare "CV-…|…|sig"
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    const token = trimmed.replace(/^(pay|deny):/i, "");
    if (!token.includes("|")) continue;
    const compact =
      parseCompactOrderSnapshot(token, true) || parseCompactOrderSnapshot(token, false);
    if (compact) return compact;
  }
  return parseTelegramOrderMessage(text);
}

function unescapeTelegramMd(value) {
  return String(value || "")
    .replace(/\\([_*`\[])/g, "$1")
    .trim();
}

/** Recover CV-XXXX + contact from the admin Telegram message body (no HMAC). */
export function parseTelegramOrderMessage(raw) {
  const text = unescapeTelegramMd(raw);
  if (!text) return null;
  const id = normalizeOrderId((text.match(/\bCV-\d{4}\b/i) || [])[0]);
  if (!id) return null;
  const blank = (v) => {
    const s = unescapeTelegramMd(v);
    return !s || s === "—" || s === "-" ? "" : s;
  };
  const name = blank((text.match(/\*Customer:\*\s*([^\n]+)/i) || [])[1]);
  const phone = blank((text.match(/\*Phone:\*\s*`?([^`\n]+)`?/i) || [])[1]);
  const amount = Number((text.match(/\*Amount:\*\s*([\d.]+)/i) || [])[1]);
  return snapshotRecord({
    order_id: id,
    customer_name: name,
    phone,
    amount_ils: Number.isFinite(amount) && amount > 0 ? amount : 10,
  });
}

function recordFromSupabase(sb, extras = {}) {
  if (!sb?.order_id) return null;
  const approved =
    sb.confirm === "yes" ||
    sb.status === "approved" ||
    sb.status === "paid" ||
    sb.status === "confirmed" ||
    sb.status === "PAID";
  const rejected = sb.status === "rejected";
  return {
    order_id: normalizeOrderId(sb.order_id) || String(sb.order_id).toUpperCase(),
    status: approved ? "PAID" : rejected ? "CANCELLED" : "PENDING",
    confirm: approved ? "yes" : "no",
    customer_name: sb.name || extras.customer_name || "",
    phone: sb.phone || extras.phone || "",
    email: extras.email || "",
    payment_method: extras.payment_method || "bit",
    amount_ils: extras.amount_ils || Number(process.env.PAYMENT_AMOUNT_ILS || 10),
    pack: "basic",
    unlock_token: approved ? extras.unlock_token || null : null,
    telegram_message_id: extras.telegram_message_id || null,
    storage: orderStorageMode(),
    created_at: sb.order_date || extras.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paid_at: approved ? extras.paid_at || new Date().toISOString() : null,
    exp_date: sb.exp_date || extras.exp_date || addDaysIso(sb.order_date, 30),
    from_supabase: true,
  };
}

/**
 * Locate an order across memory/KV, Telegram snapshot, and Supabase.
 * Serverless checkout and the webhook often run on different instances.
 */
async function recoverOrderRecord(orderId, messageText) {
  const snap = parseOrderSnapshot(messageText) || parseTelegramOrderMessage(messageText);
  const id = normalizeOrderId(orderId) || snap?.order_id;
  if (!id) return null;

  const stored = await orderGet(orderKey(id));
  if (stored && typeof stored === "object" && !stored.reserved) return stored;

  let sb = null;
  try {
    sb = await getSupabaseOrder(id);
  } catch (err) {
    console.warn("[quickcv] supabase recover failed:", err?.message || err);
  }
  if (sb?.order_id) {
    const extras = { ...(snap || {}), ...(stored && typeof stored === "object" ? stored : {}) };
    const fromSb = recordFromSupabase(sb, extras);
    if (fromSb.status === "PAID" && !fromSb.unlock_token) {
      fromSb.unlock_token = extras.unlock_token || signUnlockToken();
    }
    return writeOrderVerified(id, fromSb);
  }

  if (snap && snap.order_id === id) {
    console.warn("[quickcv] recovered order from telegram snapshot", id);
    return writeOrderVerified(id, { ...snap, reserved: false });
  }

  if (stored?.reserved) {
    const merged = snapshotRecord({
      order_id: id,
      phone: snap?.phone || "",
      email: snap?.email || "",
      customer_name: snap?.customer_name || "",
      amount_ils: snap?.amount_ils || 10,
      payment_method: snap?.payment_method || "bit",
    });
    if (merged) {
      console.warn("[quickcv] hydrated reserved order placeholder", id);
      return writeOrderVerified(id, merged);
    }
  }

  const synthesized = snapshotRecord({
    order_id: id,
    phone: snap?.phone || "",
    email: snap?.email || "",
    customer_name: snap?.customer_name || "",
    amount_ils: snap?.amount_ils || Number(process.env.PAYMENT_AMOUNT_ILS || 10),
    payment_method: snap?.payment_method || "bit",
  });
  if (synthesized) {
    console.warn("[quickcv] synthesized order from telegram callback", id);
    return writeOrderVerified(id, synthesized);
  }
  return null;
}

const approveInflight = new Map();
const rejectInflight = new Map();

/** Build Approve callback_data; embeds a compact recovery snapshot when it fits. */
export function buildPayCallbackData(order) {
  const orderId = normalizeOrderId(order?.order_id);
  if (!orderId) return "pay:";
  const compact = signCompactOrderSnapshot(order);
  const withCompact = `pay:${compact || orderId}`;
  if (Buffer.byteLength(withCompact, "utf8") <= CALLBACK_DATA_MAX_BYTES) {
    return withCompact;
  }
  return `pay:${orderId}`;
}

/** Build Reject callback_data; embeds a compact recovery snapshot when it fits. */
export function buildDenyCallbackData(order) {
  const orderId = normalizeOrderId(order?.order_id);
  if (!orderId) return "deny:";
  const compact = signCompactOrderSnapshot(order);
  const withCompact = `deny:${compact || orderId}`;
  if (Buffer.byteLength(withCompact, "utf8") <= CALLBACK_DATA_MAX_BYTES) {
    return withCompact;
  }
  return `deny:${orderId}`;
}

/** Extract CV-XXXX from pay:/deny: callback_data (plain id or compact snapshot). */
export function orderIdFromPayCallback(callbackData) {
  const raw = String(callbackData || "").trim();
  const token = raw.replace(/^(pay|deny):/i, "");
  const head = token.split("|")[0] || "";
  return normalizeOrderId(head);
}

async function writeOrderVerified(orderId, record) {
  const key = orderKey(orderId);
  await orderSet(key, record, ORDER_TTL_SEC());
  const stored = await orderGet(key);
  if (!stored || typeof stored !== "object" || stored.order_id !== orderId) {
    // Local memory write is authoritative even if mirror read races.
    return record;
  }
  return stored;
}

export async function generateUniqueOrderId() {
  for (let i = 0; i < 24; i += 1) {
    const id = `CV-${String(randomInt(1000, 10000))}`;
    const placeholder = { order_id: id, status: "PENDING", reserved: true };
    const ok = await orderSetNx(orderKey(id), placeholder, ORDER_TTL_SEC());
    if (ok) return id;
  }
  throw new Error("order_id_exhausted");
}

/**
 * @param {object} input
 */
export async function createManualOrder(input) {
  const orderId = normalizeOrderId(input.orderId) || (await generateUniqueOrderId());
  const contact = String(input.contact || "").trim();
  let phone = String(input.phone || "").trim();
  let email = String(input.email || "").trim();
  if (!phone && !email && contact) {
    if (contact.includes("@")) email = contact;
    else phone = contact;
  }
  const amount = Number(input.amountIls);
  const createdAt = new Date().toISOString();
  const record = {
    order_id: orderId,
    status: "PENDING",
    confirm: "no",
    customer_name: String(input.customerName || "").trim().slice(0, 120),
    phone: phone.slice(0, 40),
    email: email.slice(0, 120),
    payment_method: String(input.paymentMethod || "bit").trim().toLowerCase() || "bit",
    amount_ils: Number.isFinite(amount) && amount > 0 ? amount : Number(process.env.PAYMENT_AMOUNT_ILS || 10),
    pack: "basic",
    unlock_token: null,
    telegram_message_id: null,
    storage: orderStorageMode(),
    created_at: createdAt,
    updated_at: createdAt,
    paid_at: null,
    exp_date: addDaysIso(createdAt, 30),
  };
  const stored = await writeOrderVerified(orderId, record);
  try {
    const sb = await upsertSupabaseOrder(stored, { confirm: "no", status: "pending" });
    if (!sb.ok && !sb.skipped) {
      console.error("[quickcv] supabase insert failed:", sb.error);
    }
  } catch (err) {
    console.error("[quickcv] supabase insert failed:", err?.message || err);
  }
  return stored;
}

export async function getManualOrder(orderId) {
  const id = normalizeOrderId(orderId);
  if (!id) return null;
  const record = await orderGet(orderKey(id));
  if (!record || typeof record !== "object" || record.reserved) return null;
  return record;
}

export async function updateManualOrder(orderId, patch) {
  const current = await getManualOrder(orderId);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    order_id: current.order_id,
    updated_at: new Date().toISOString(),
  };
  return writeOrderVerified(current.order_id, next);
}

/**
 * Ensure we have an order record (from store or Telegram snapshot) then mark PAID.
 */
export async function approveManualOrder(orderId, options = {}) {
  const id = normalizeOrderId(orderId);
  const key = id || String(orderId || "");
  if (approveInflight.has(key)) return approveInflight.get(key);
  const pending = approveManualOrderInner(orderId, options).finally(() => {
    approveInflight.delete(key);
  });
  approveInflight.set(key, pending);
  return pending;
}

async function approveManualOrderInner(orderId, options = {}) {
  let current = await recoverOrderRecord(orderId, options.messageText || "");
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status === "PAID" && current.unlock_token) {
    await setSupabaseConfirm(current, "yes").catch(() => {});
    return { ok: true, already: true, order: current };
  }
  if (current.status === "CANCELLED") {
    return { ok: false, reason: "cancelled", order: current };
  }
  const token = signUnlockToken();
  const paidAt = new Date().toISOString();
  const order = await writeOrderVerified(current.order_id, {
    ...current,
    reserved: false,
    status: "PAID",
    confirm: "yes",
    unlock_token: token,
    paid_at: paidAt,
    updated_at: paidAt,
    exp_date: current.exp_date || addDaysIso(current.created_at || paidAt, 30),
  });
  if (!order || order.status !== "PAID" || !order.unlock_token) {
    return { ok: false, reason: "persist_failed" };
  }
  await setSupabaseConfirm(order, "yes").catch((err) => {
    console.error("[quickcv] supabase confirm=yes failed:", err?.message || err);
  });
  return { ok: true, already: false, order };
}

/**
 * Telegram No — confirm=no, block PDF download.
 */
export async function rejectManualOrder(orderId, options = {}) {
  const id = normalizeOrderId(orderId);
  const key = id || String(orderId || "");
  if (rejectInflight.has(key)) return rejectInflight.get(key);
  const pending = rejectManualOrderInner(orderId, options).finally(() => {
    rejectInflight.delete(key);
  });
  rejectInflight.set(key, pending);
  return pending;
}

async function rejectManualOrderInner(orderId, options = {}) {
  let current = await recoverOrderRecord(orderId, options.messageText || "");
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status === "PAID" && current.unlock_token) {
    return { ok: false, reason: "already_paid", order: current };
  }
  if (current.status === "CANCELLED") {
    await setSupabaseConfirm(current, "no").catch(() => {});
    return { ok: true, already: true, order: current };
  }
  const order = await writeOrderVerified(current.order_id, {
    ...current,
    reserved: false,
    status: "CANCELLED",
    confirm: "no",
    unlock_token: null,
    updated_at: new Date().toISOString(),
  });
  await setSupabaseConfirm(order, "no").catch((err) => {
    console.error("[quickcv] supabase confirm=no failed:", err?.message || err);
  });
  return { ok: true, already: false, order };
}

function telegramConfig() {
  const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = String(process.env.TELEGRAM_CHAT_ID || "").trim();
  if (!token || !chatId) return null;
  return { token, chatId };
}

export function formatManualOrderTelegramMessage(order) {
  const amount = formatAmountIls(order.amount_ils || 10);
  const phone = String(order.phone || "").trim() || "—";
  const name = String(order.customer_name || "").trim();
  const method = formatPaymentMethod(order.payment_method || "bit");
  const orderId = String(order.order_id || "").trim() || "—";
  const nameLine = name ? `*שם:* ${escapeTelegramMarkdown(name)}\n` : "";
  return (
    `🛒 *הזמנה חדשה ממתינה לאישור*\n\n` +
    `*מזהה הזמנה:* \`${escapeTelegramMarkdown(orderId)}\`\n` +
    nameLine +
    `*טלפון:* \`${escapeTelegramMarkdown(phone)}\`\n` +
    `*אמצעי תשלום:* ${escapeTelegramMarkdown(method)}\n` +
    `*סכום:* ${escapeTelegramMarkdown(amount)} ₪\n\n` +
    `_Yes = אישור והורדת PDF. No = דחייה._`
  );
}

/**
 * Notify admin with Inline Keyboard approve button.
 */
export async function sendManualOrderTelegram(order) {
  const cfg = telegramConfig();
  if (!cfg) return { sent: false, error: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: formatManualOrderTelegramMessage(order),
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Yes",
                callback_data: buildPayCallbackData(order),
              },
              {
                text: "❌ No",
                callback_data: buildDenyCallbackData(order),
              },
            ],
          ],
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: body.slice(0, 200) || `telegram_http_${res.status}` };
    }
    const payload = await res.json().catch(() => null);
    if (!payload?.ok) return { sent: false, error: "telegram_rejected" };
    const messageId = payload.result?.message_id;
    if (messageId != null) {
      await updateManualOrder(order.order_id, { telegram_message_id: messageId });
    }
    return { sent: true, messageId };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "telegram_failed" };
  } finally {
    clearTimeout(timer);
  }
}
