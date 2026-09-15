import { randomInt } from "node:crypto";
import { kvGet, kvSet, kvSetNx } from "./kv.js";
import { signUnlockToken } from "./unlockToken.js";
import { escapeTelegramMarkdown, formatAmountIls, formatPackLabel } from "../lib/telegram.js";

const ORDER_TTL_SEC = () => Math.max(3600, Number(process.env.CODE_TTL_SECONDS || 30 * 24 * 60 * 60));

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

export async function generateUniqueOrderId() {
  for (let i = 0; i < 24; i += 1) {
    const id = `CV-${String(randomInt(1000, 10000))}`;
    const placeholder = { order_id: id, status: "PENDING", reserved: true };
    const ok = await kvSetNx(orderKey(id), placeholder, ORDER_TTL_SEC());
    if (ok) return id;
  }
  throw new Error("order_id_exhausted");
}

/**
 * @param {object} input
 * @param {string} input.orderId
 * @param {string} [input.customerName]
 * @param {string} [input.phone]
 * @param {string} [input.email]
 * @param {string} [input.contact]
 * @param {string} [input.paymentMethod]
 * @param {number} [input.amountIls]
 * @param {string} [input.pack]
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
    amount_ils: Number.isFinite(amount) && amount > 0 ? amount : Number(process.env.PAYMENT_AMOUNT_ILS || 9.9),
    pack: input.pack === "complete" ? "complete" : "basic",
    unlock_token: null,
    telegram_message_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    paid_at: null,
  };
  await kvSet(orderKey(orderId), record, ORDER_TTL_SEC());
  return record;
}

export async function getManualOrder(orderId) {
  const id = normalizeOrderId(orderId);
  if (!id) return null;
  const record = await kvGet(orderKey(id));
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
  await kvSet(orderKey(current.order_id), next, ORDER_TTL_SEC());
  return next;
}

/**
 * Mark order PAID and attach unlock token for client polling.
 */
export async function approveManualOrder(orderId) {
  const current = await getManualOrder(orderId);
  if (!current) return { ok: false, reason: "not_found" };
  if (current.status === "PAID" && current.unlock_token) {
    return { ok: true, already: true, order: current };
  }
  if (current.status === "CANCELLED") {
    return { ok: false, reason: "cancelled", order: current };
  }
  const token = signUnlockToken();
  const order = await updateManualOrder(current.order_id, {
    status: "PAID",
    unlock_token: token,
    paid_at: new Date().toISOString(),
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
  const amount = formatAmountIls(order.amount_ils);
  const method = String(order.payment_method || "bit").toLowerCase() === "paybox" ? "PayBox" : "Bit";
  return (
    `🧾 *New checkout order* \`${escapeTelegramMarkdown(order.order_id)}\`\n\n` +
    `*Name:* ${escapeTelegramMarkdown(order.customer_name || "—")}\n` +
    `*Phone:* ${escapeTelegramMarkdown(order.phone || order.email || "—")}\n` +
    `*Amount:* ${escapeTelegramMarkdown(amount)} ILS\n` +
    `*Pack:* ${escapeTelegramMarkdown(formatPackLabel(order.pack))}\n` +
    `*Method:* ${escapeTelegramMarkdown(method)}\n` +
    `*Status:* PENDING\n\n` +
    `_Approve after you verify the Bit/PayBox payment._`
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
