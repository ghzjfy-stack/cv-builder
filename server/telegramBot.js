import { issuePaidCode, normalizeContact, normalizeRedemptionCode, consumeCode } from "./codes.js";
import { json, parseBody, readBody } from "./http.js";
import { kvGet, kvSet } from "./kv.js";
import { sendPurchaseConfirmationEmail } from "./notify.js";
import { getPendingOrder, updatePendingOrder } from "./pendingOrders.js";
import {
  escapeTelegramMarkdown,
  formatAmountIls,
  formatPackLabel,
  formatPaymentMethod,
} from "../lib/telegram.js";

const MAX_BYTES = 256 * 1024;

function envValue(name) {
  try {
    return String(process.env[name] || "").trim();
  } catch {
    return "";
  }
}

function botToken() {
  return envValue("TELEGRAM_BOT_TOKEN");
}

function adminChatId() {
  return envValue("TELEGRAM_CHAT_ID");
}

function adminIds() {
  const raw = envValue("TELEGRAM_ADMIN_IDS") || adminChatId();
  return new Set(
    raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function isAdmin(update) {
  const ids = adminIds();
  if (!ids.size) return false;
  const from =
    update?.message?.from?.id ??
    update?.callback_query?.from?.id ??
    update?.edited_message?.from?.id;
  const chat =
    update?.message?.chat?.id ??
    update?.callback_query?.message?.chat?.id ??
    update?.edited_message?.chat?.id;
  const candidates = [from, chat].map((v) => (v == null ? "" : String(v)));
  return candidates.some((id) => id && ids.has(id));
}

async function telegramApi(method, payload) {
  const token = botToken();
  if (!token) return { ok: false, error: "not_configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: (data && data.description) || `http_${res.status}` };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "telegram_failed" };
  } finally {
    clearTimeout(timer);
  }
}

export async function sendTelegramText(chatId, text, extra = {}) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    ...extra,
  });
}

async function editTelegramMessage(chatId, messageId, text) {
  if (chatId == null || messageId == null) return { ok: false };
  return telegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [] },
  });
}

function helpText() {
  return (
    "*לוח בקרה QuickCV*\n\n" +
    "`/help` — רשימת פקודות\n" +
    "`/status` — מצב מערכת\n" +
    "`/code` — הנפקת קוד הורדה\n" +
    "`/code 0501234567` — קוד מקושר לטלפון\n" +
    "`/lookup ABC123` — בדיקת קוד\n" +
    "`/revoke ABC123` — ביטול קוד\n\n" +
    "הזמנות חדשות מגיעות לכאן עם כפתורי *אישור* / *מחיקה*.\n" +
    "אישור שולח מייל Resend ללקוח לפי החבילה."
  );
}

async function statusText() {
  const hasToken = Boolean(botToken());
  const hasChat = Boolean(adminChatId());
  const hasKv = Boolean(envValue("KV_REST_API_URL") || envValue("UPSTASH_REDIS_REST_URL"));
  const hasPaySecret = Boolean(envValue("PAYMENT_TOKEN_SECRET"));
  const hasWebhook = Boolean(envValue("PAYMENT_WEBHOOK_SECRET") || envValue("PAYBOX_WEBHOOK_SECRET"));
  const hasResend = Boolean(envValue("RESEND_API_KEY"));
  const hasOpenAi = Boolean(envValue("OPENAI_API_KEY"));
  const amount = formatAmountIls(process.env.PAYMENT_AMOUNT_ILS || 9.9);
  return (
    "*סטטוס QuickCV*\n\n" +
    `*טוקן בוט:* ${hasToken ? "תקין" : "חסר"}\n` +
    `*צ׳אט מנהל:* ${hasChat ? "תקין" : "חסר"}\n` +
    `*KV / Redis:* ${hasKv ? "תקין" : "חסר (קודים עלולים להתאפס)"}\n` +
    `*Resend:* ${hasResend ? "תקין" : "חסר"}\n` +
    `*סוד תשלום:* ${hasPaySecret ? "תקין" : "חסר"}\n` +
    `*Webhook תשלום:* ${hasWebhook ? "תקין" : "חסר"}\n` +
    `*אימות Bit:* ${hasOpenAi ? "תקין" : "חסר"}\n` +
    `*מחיר בסיסי:* ${escapeTelegramMarkdown(amount)} ₪`
  );
}

function parseCodeArgs(args) {
  let phone = "";
  let email = "";
  let amount = Number(process.env.PAYMENT_AMOUNT_ILS || 9.9);
  let provider = "telegram_admin";
  for (const part of args) {
    if (part.includes("@")) email = normalizeContact(part);
    else if (/^\d+(\.\d+)?$/.test(part) && Number(part) < 1000) amount = Number(part);
    else if (/^[\d+\-\s]{7,}$/.test(part) || part.startsWith("972") || part.startsWith("0")) {
      phone = normalizeContact(part);
    } else if (/^[a-z_]+$/i.test(part)) provider = part.toLowerCase().slice(0, 40);
  }
  return { phone, email, amount, provider };
}

async function handleIssueCode(chatId, args) {
  const parsed = parseCodeArgs(args);
  const issued = await issuePaidCode({
    userPhone: parsed.phone,
    userEmail: parsed.email,
    provider: parsed.provider,
    transactionId: `tg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });
  if (!issued?.code) {
    return sendTelegramText(chatId, "לא הצלחנו להנפיק קוד. בדקו את משתני KV / Redis.");
  }
  try {
    await kvSet(
      `qc:tg:code:${normalizeRedemptionCode(issued.code)}`,
      {
        code: issued.code,
        phone: parsed.phone,
        email: parsed.email,
        amount: parsed.amount,
        provider: parsed.provider,
        created_at: new Date().toISOString(),
      },
      60 * 60 * 24 * 30,
    );
  } catch {
    /* optional index */
  }
  const contactLine =
    parsed.phone || parsed.email
      ? `*איש קשר:* ${escapeTelegramMarkdown(parsed.phone || parsed.email)}\n`
      : "";
  return sendTelegramText(
    chatId,
    `*קוד הורדה הונפק*\n\n` +
      `*קוד:* \`${escapeTelegramMarkdown(issued.code)}\`\n` +
      contactLine +
      `*סכום לציון:* ${escapeTelegramMarkdown(formatAmountIls(parsed.amount))} ₪\n` +
      `*ספק:* ${escapeTelegramMarkdown(formatPaymentMethod(parsed.provider))}\n\n` +
      `שלחו את הקוד ללקוח. הקוד לשימוש חד־פעמי.`,
  );
}

async function handleLookup(chatId, codeRaw) {
  const code = normalizeRedemptionCode(codeRaw);
  if (code.length !== 6) {
    return sendTelegramText(chatId, "שימוש: `/lookup ABC123`");
  }
  const indexed = await kvGet(`qc:tg:code:${code}`);
  if (indexed && typeof indexed === "object") {
    return sendTelegramText(
      chatId,
      `*קוד* \`${escapeTelegramMarkdown(code)}\`\n` +
        `*טלפון:* ${escapeTelegramMarkdown(indexed.phone || "—")}\n` +
        `*אימייל:* ${escapeTelegramMarkdown(indexed.email || "—")}\n` +
        `*ספק:* ${escapeTelegramMarkdown(indexed.provider || "—")}\n` +
        `*נוצר:* ${escapeTelegramMarkdown(indexed.created_at || "—")}`,
    );
  }
  return sendTelegramText(
    chatId,
    `אין אינדקס מנהל ל-\`${escapeTelegramMarkdown(code)}\`. ` +
      `אפשר לבטל עם /revoke.`,
  );
}

async function handleRevoke(chatId, codeRaw) {
  const code = normalizeRedemptionCode(codeRaw);
  if (code.length !== 6) {
    return sendTelegramText(chatId, "שימוש: `/revoke ABC123`");
  }
  const result = await consumeCode(code, "");
  if (result.ok) {
    return sendTelegramText(chatId, `הקוד \`${escapeTelegramMarkdown(code)}\` בוטל.`);
  }
  if (result.reason === "used") {
    return sendTelegramText(chatId, `הקוד \`${escapeTelegramMarkdown(code)}\` כבר שומש.`);
  }
  return sendTelegramText(
    chatId,
    `לא ניתן לבטל \`${escapeTelegramMarkdown(code)}\` (${result.reason || "invalid"}).`,
  );
}

async function handleConfirmOrder(chatId, orderId, messageId) {
  const order = await getPendingOrder(orderId);
  if (!order) {
    await sendTelegramText(chatId, `הזמנה \`${escapeTelegramMarkdown(orderId)}\` לא נמצאה.`);
    return;
  }
  if (order.status === "confirmed") {
    await sendTelegramText(chatId, `הזמנה #${order.order_number} כבר אושרה.`);
    return;
  }
  if (order.status === "deleted") {
    await sendTelegramText(chatId, `הזמנה #${order.order_number} כבר נמחקה.`);
    return;
  }

  const mail = await sendPurchaseConfirmationEmail({
    email: order.email,
    code: order.verification_code,
    pack: order.pack,
    customerName: order.customer_name,
    amountIls: order.amount_ils,
  });

  await updatePendingOrder(orderId, {
    status: "confirmed",
    email_delivered: Boolean(mail.delivered),
    email_error: mail.error || null,
    confirmed_at: new Date().toISOString(),
  });

  const pack = formatPackLabel(order.pack);
  const mailLine = mail.delivered
    ? "✅ מייל אישור נשלח ב-Resend"
    : `⚠️ המייל לא נשלח (${escapeTelegramMarkdown(mail.error || "שגיאה")})`;

  const text =
    `✅ *הזמנה #${order.order_number} אושרה*\n\n` +
    optionalLine("לקוח", order.customer_name) +
    optionalLine("אימייל", order.email) +
    `*חבילה:* ${escapeTelegramMarkdown(pack)}\n` +
    `*קוד:* \`${escapeTelegramMarkdown(order.verification_code || "—")}\`\n` +
    mailLine;

  await editTelegramMessage(chatId, messageId, text);
  if (!mail.delivered) {
    await sendTelegramText(
      chatId,
      `ההזמנה אושרה, אבל המייל נכשל. בדקו \`RESEND_API_KEY\` / אימייל לקוח.\nקוד: \`${escapeTelegramMarkdown(order.verification_code || "")}\``,
    );
  }
}

async function handleDeleteOrder(chatId, orderId, messageId) {
  const order = await getPendingOrder(orderId);
  if (!order) {
    await sendTelegramText(chatId, `הזמנה \`${escapeTelegramMarkdown(orderId)}\` לא נמצאה.`);
    return;
  }
  if (order.status === "deleted") {
    await sendTelegramText(chatId, `הזמנה #${order.order_number} כבר נמחקה.`);
    return;
  }
  if (order.status === "confirmed") {
    await sendTelegramText(chatId, `הזמנה #${order.order_number} כבר אושרה — לא מוחקים אחרי אישור.`);
    return;
  }

  if (order.verification_code) {
    await consumeCode(order.verification_code, "");
  }
  await updatePendingOrder(orderId, {
    status: "deleted",
    deleted_at: new Date().toISOString(),
  });

  const text =
    `🗑 *הזמנה #${order.order_number} נמחקה*\n\n` +
    optionalLine("לקוח", order.customer_name) +
    optionalLine("אימייל", order.email) +
    `*קוד בוטל:* \`${escapeTelegramMarkdown(order.verification_code || "—")}\`\n` +
    `_לא נשלח מייל ללקוח._`;

  await editTelegramMessage(chatId, messageId, text);
}

function optionalLine(label, value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `*${label}:* ${escapeTelegramMarkdown(text)}\n`;
}

async function handleCommand(chatId, text) {
  const trimmed = String(text || "").trim();
  const [cmdRaw, ...args] = trimmed.split(/\s+/);
  const cmd = cmdRaw.replace(/@\w+$/, "").toLowerCase();

  if (cmd === "/start" || cmd === "/help") {
    return sendTelegramText(chatId, helpText());
  }
  if (cmd === "/status") {
    return sendTelegramText(chatId, await statusText());
  }
  if (cmd === "/code" || cmd === "/issue") {
    return handleIssueCode(chatId, args);
  }
  if (cmd === "/lookup") {
    return handleLookup(chatId, args[0] || "");
  }
  if (cmd === "/revoke") {
    return handleRevoke(chatId, args[0] || "");
  }
  return sendTelegramText(chatId, "פקודה לא מוכרת. נסו `/help`.");
}

function verifyTelegramSecret(req) {
  const expected = envValue("TELEGRAM_WEBHOOK_SECRET");
  if (!expected) return true;
  const got = String(req.headers["x-telegram-bot-api-secret-token"] || "").trim();
  return got === expected;
}

/**
 * POST /api/telegram-webhook
 */
export async function handleTelegramWebhookRequest(req, res) {
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
  if (!botToken()) {
    json(res, 503, { ok: false, error: "not_configured" });
    return;
  }
  if (!verifyTelegramSecret(req)) {
    json(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  let update;
  try {
    const raw = await readBody(req, MAX_BYTES);
    update = parseBody(raw, req.headers["content-type"]) || {};
  } catch {
    json(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  json(res, 200, { ok: true });

  try {
    if (!isAdmin(update)) {
      const chatId =
        update?.message?.chat?.id ??
        update?.callback_query?.message?.chat?.id;
      if (chatId != null) {
        await sendTelegramText(chatId, "אין הרשאה. הבוט עונה רק לצ׳אט המנהל של QuickCV.");
      }
      return;
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      const data = String(cq.data || "");
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;
      if (chatId == null) {
        await telegramApi("answerCallbackQuery", { callback_query_id: cq.id });
        return;
      }

      if (data.startsWith("ok:")) {
        await telegramApi("answerCallbackQuery", {
          callback_query_id: cq.id,
          text: "מאשר ושולח מייל...",
        });
        await handleConfirmOrder(chatId, data.slice(3), messageId);
        return;
      }
      if (data.startsWith("no:")) {
        await telegramApi("answerCallbackQuery", {
          callback_query_id: cq.id,
          text: "מוחק הזמנה...",
        });
        await handleDeleteOrder(chatId, data.slice(3), messageId);
        return;
      }
      if (data.startsWith("revoke:")) {
        await telegramApi("answerCallbackQuery", { callback_query_id: cq.id });
        await handleRevoke(chatId, data.slice(7));
        return;
      }
      if (data === "help") {
        await telegramApi("answerCallbackQuery", { callback_query_id: cq.id });
        await sendTelegramText(chatId, helpText());
        return;
      }
      await telegramApi("answerCallbackQuery", { callback_query_id: cq.id });
      return;
    }

    const message = update.message || update.edited_message;
    if (!message?.text) return;
    const chatId = message.chat?.id;
    if (chatId == null) return;
    await handleCommand(chatId, message.text);
  } catch (err) {
    console.error("[quickcv] telegram bot error:", err?.message || err);
  }
}
