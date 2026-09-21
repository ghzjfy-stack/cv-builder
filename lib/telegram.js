/**
 * @typedef {object} TelegramNotifyResult
 * @property {boolean} sent
 * @property {string} [error]
 * @property {number} [messageId]
 */

/**
 * @typedef {object} OrderNotificationData
 * @property {number} orderNumber
 * @property {string} [orderId]
 * @property {string} [customerName]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} paymentMethod
 * @property {number} amountIls
 * @property {string} verificationCode
 * @property {string} [pack]
 * @property {Date | string | number} [timestamp]
 */

function envValue(name) {
  try {
    return String(process.env[name] || "").trim();
  } catch {
    return "";
  }
}

function telegramConfig() {
  const token = envValue("TELEGRAM_BOT_TOKEN");
  const chatId = envValue("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return null;
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) return null;
  return { token, chatId };
}

/** Escape user-controlled text for Telegram legacy Markdown. */
export function escapeTelegramMarkdown(value) {
  return String(value || "").replace(/([_*`\[])/g, "\\$1");
}

export function formatPaymentMethod(providerOrMethod) {
  const raw = String(providerOrMethod || "").trim().toLowerCase();
  if (raw === "bit") return "Bit";
  if (raw === "paybox") return "PayBox";
  if (raw === "card" || raw === "credit" || raw === "creditcard" || raw === "credit_card") {
    return "כרטיס אשראי";
  }
  if (!raw) return "לא ידוע";
  return String(providerOrMethod).trim();
}

export function formatAmountIls(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function formatPackLabel(_pack) {
  return "הורדת PDF מלא";
}

function formatTimestamp(timestamp) {
  const date =
    timestamp instanceof Date
      ? timestamp
      : timestamp != null && timestamp !== ""
        ? new Date(timestamp)
        : new Date();
  const safe = Number.isNaN(date.getTime()) ? new Date() : date;
  try {
    return new Intl.DateTimeFormat("he-IL", {
      timeZone: "Asia/Jerusalem",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(safe);
  } catch {
    return safe.toISOString();
  }
}

function optionalLine(label, value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `*${label}:* ${escapeTelegramMarkdown(text)}\n`;
}

export function formatOrderNotificationMessage(orderData) {
  const orderNo = Number(orderData.orderNumber);
  const orderLabel = Number.isInteger(orderNo) && orderNo > 0 ? `#${orderNo}` : "#—";
  const amount = formatAmountIls(orderData.amountIls);
  const method = formatPaymentMethod(orderData.paymentMethod);
  const code = String(orderData.verificationCode || "").trim() || "—";
  const pack = formatPackLabel(orderData.pack);

  return (
    `🛒 *הזמנה חדשה ממתינה לאישור* ${escapeTelegramMarkdown(orderLabel)}\n\n` +
    optionalLine("לקוח", orderData.customerName) +
    (String(orderData.phone || "").trim()
      ? `*טלפון (זיהוי Bit):* \`${escapeTelegramMarkdown(String(orderData.phone).trim())}\`\n`
      : optionalLine("טלפון", orderData.phone)) +
    optionalLine("אימייל", orderData.email) +
    `*חבילה:* ${escapeTelegramMarkdown(pack)}\n` +
    `*תשלום:* ${escapeTelegramMarkdown(`${amount} ₪`)} ב-${escapeTelegramMarkdown(method)}\n` +
    `*קוד גישה:* \`${escapeTelegramMarkdown(code)}\`\n` +
    `*זמן:* ${escapeTelegramMarkdown(formatTimestamp(orderData.timestamp))}\n\n` +
    `_התאימו את מספר הטלפון ב-Bit ואשרו._`
  );
}

/**
 * Send a Markdown order notification via Telegram Bot API.
 * Never throws — Telegram / config failures are returned as `{ sent: false }`.
 *
 * @param {OrderNotificationData} orderData
 * @returns {Promise<TelegramNotifyResult>}
 */
export async function sendTelegramOrderNotification(orderData) {
  try {
    if (!orderData || typeof orderData !== "object") {
      return { sent: false, error: "invalid_order_data" };
    }

    const cfg = telegramConfig();
    if (!cfg) {
      return { sent: false, error: "not_configured" };
    }

    const orderId = String(orderData.orderId || orderData.orderNumber || "").trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res;
    try {
      const payload = {
        chat_id: cfg.chatId,
        text: formatOrderNotificationMessage(orderData),
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      };
      if (orderId) {
        payload.reply_markup = {
          inline_keyboard: [
            [
              { text: "✅ אישור הזמנה", callback_data: `ok:${orderId}` },
              { text: "🗑 מחיקת הזמנה", callback_data: `no:${orderId}` },
            ],
          ],
        };
      }
      res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(payload),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        sent: false,
        error: body.slice(0, 200) || `telegram_http_${res.status}`,
      };
    }

    const payload = await res.json().catch(() => null);
    if (!payload || payload.ok !== true) {
      return { sent: false, error: "telegram_rejected" };
    }
    return { sent: true, messageId: payload.result?.message_id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "telegram_failed";
    return { sent: false, error: String(message).slice(0, 200) };
  }
}
