import { createHmac, randomInt } from "node:crypto";
import { orderGet, orderSet, orderSetNx, orderStorageMode } from "./orderStore.js";
import { getSigningSecret, signUnlockToken } from "./unlockToken.js";
import { escapeTelegramMarkdown, formatAmountIls } from "../lib/telegram.js";

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

function signOrderSnapshot(order) {
  const payload = Buffer.from(
    JSON.stringify({
      order_id: order.order_id,
      phone: order.phone || "",
      email: order.email || "",
      customer_name: order.customer_name || "",
      payment_method: order.payment_method || "bit",
      amount_ils: order.amount_ils || 10,
      pack: order.pack || "basic",
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url").slice(0, 24);
  return `${payload}.${sig}`;
}

export function parseOrderSnapshot(raw) {
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
      unlock_token: null,
      telegram_message_id: null,
      storage: orderStorageMode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      paid_at: null,
      from_snapshot: true,
    };
  } catch {
    return null;
  }
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
  const record = {
    order_id: orderId,
    status: "PENDING",
    customer_name: String(input.customerName || "").trim().slice(0, 120),
    phone: phone.slice(0, 40),
    email: email.slice(0, 120),
    payment_method: String(input.paymentMethod || "bit").trim().toLowerCase() || "bit",
    amount_ils: Number.isFinite(amount) && amount > 0 ? amount : Number(process.env.PAYMENT_AMOUNT_ILS || 10),
    pack: "basic",
    unlock_token: null,
    telegram_message_id: null,
    storage: orderStorageMode(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paid_at: null,
  };
  return writeOrderVerified(orderId, record);
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
  let current = await getManualOrder(orderId);
  if (!current && options.messageText) {
    const snap = parseOrderSnapshot(options.messageText);
    if (snap && snap.order_id === normalizeOrderId(orderId)) {
      current = await writeOrderVerified(snap.order_id, snap);
    }
  }
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status === "PAID" && current.unlock_token) {
    return { ok: true, already: true, order: current };
  }
  if (current.status === "CANCELLED") {
    return { ok: false, reason: "cancelled", order: current };
  }
  const token = signUnlockToken();
  const order = await writeOrderVerified(current.order_id, {
    ...current,
    status: "PAID",
    unlock_token: token,
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!order || order.status !== "PAID" || !order.unlock_token) {
    return { ok: false, reason: "persist_failed" };
  }
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
  const method = String(order.payment_method || "bit").toLowerCase() === "paybox" ? "PayBox" : "Bit";
  const phone = String(order.phone || "").trim() || "—";
  const snap = signOrderSnapshot(order);
  return (
    `🧾 *New checkout order* \`${escapeTelegramMarkdown(order.order_id)}\`\n\n` +
    `*Name:* ${escapeTelegramMarkdown(order.customer_name || "—")}\n` +
    `*Phone (Bit/PayBox ID):* \`${escapeTelegramMarkdown(phone)}\`\n` +
    `*Amount:* ${escapeTelegramMarkdown(amount)} ILS\n` +
    `*Pack:* PDF Download\n` +
    `*Method:* ${escapeTelegramMarkdown(method)}\n` +
    `*Status:* PENDING\n\n` +
    `_Match this phone in Bit/PayBox, then Approve._\n` +
    "`QCORD." +
    snap +
    "`"
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
                text: "🟢 Approve Payment & Release Download",
                callback_data: `pay:${order.order_id}`,
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
