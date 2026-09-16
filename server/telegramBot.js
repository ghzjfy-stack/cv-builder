import { issuePaidCode, normalizeContact, normalizeRedemptionCode, consumeCode } from "./codes.js";
import { json, parseBody, readBody } from "./http.js";
import { kvGet, kvSet } from "./kv.js";
import { sendPurchaseConfirmationEmail } from "./notify.js";
import { getPendingOrder, updatePendingOrder } from "./pendingOrders.js";
import {
  approveManualOrder,
  normalizeOrderId,
  orderIdFromPayCallback,
  rejectManualOrder,
} from "./manualOrders.js";
import { isSupabaseConfigured } from "./supabaseOrders.js";
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
    "הזמנות חדשות מגיעות לכאן עם כפתורי *Yes / No*.\n" +
    "אישור משחרר הורדה ללקוח (Supabase confirm) ושולח מייל Resend אם יש אימייל."
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
  const hasSupabase = isSupabaseConfigured();
  const amount = formatAmountIls(process.env.PAYMENT_AMOUNT_ILS || 10);
  return (
    "*סטטוס QuickCV*\n\n" +
    `*טוקן בוט:* ${hasToken ? "תקין" : "חסר"}\n` +
    `*צ׳אט מנהל:* ${hasChat ? "תקין" : "חסר"}\n` +
    `*Supabase:* ${hasSupabase ? "מחובר" : "חסר"}\n` +
    `*אחסון הזמנות:* ${hasKv ? "KV מחובר" : "זיכרון מקומי (ללא KV)"}\n` +
    `*Resend:* ${hasResend ? "תקין" : "חסר"}\n` +
    `*סוד תשלום:* ${hasPaySecret ? "תקין" : "חסר"}\n` +
    `*Webhook תשלום:* ${hasWebhook ? "תקין" : "חסר"}\n` +
    `*אימות Bit:* ${hasOpenAi ? "תקין" : "חסר"}\n` +
    `*מחיר:* ${escapeTelegramMarkdown(amount)} ₪`
  );
}

function parseCodeArgs(args) {
  let phone = "";
  let email = "";
  let amount = Number(process.env.PAYMENT_AMOUNT_ILS || 10);
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
    return sendTelegramText(chatId, "לא הצלחנו להנפיק קוד. נסו שוב.");
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

async function handleApprovePayment(chatId, orderId, messageId, messageText) {
  const resolvedId = normalizeOrderId(orderId) || orderIdFromMessageText(messageText);
  let result;
  try {
    result = await approveManualOrder(resolvedId, { messageText: messageText || "" });
  } catch (err) {
    console.error("[quickcv] approve payment failed:", err?.message || err);
    await sendTelegramText(
      chatId,
      `Could not approve \`${escapeTelegramMarkdown(resolvedId || orderId)}\`. Please try again.`,
    );
    return;
  }
  if (!result.ok) {
    if (result.reason === "cancelled") {
      await editTelegramMessage(
        chatId,
        messageId,
        `⚠️ Order \`${escapeTelegramMarkdown(resolvedId || orderId)}\` was already rejected — download stays blocked.`,
      );
      return;
    }
    await sendTelegramText(
      chatId,
      result.reason === "not_found"
        ? `Order \`${escapeTelegramMarkdown(resolvedId || orderId)}\` could not be recovered. Ask the customer to restart checkout.`
        : `Could not approve \`${escapeTelegramMarkdown(resolvedId || orderId)}\` (${result.reason || "error"}).`,
    );
    return;
  }

  const order = result.order;
  if (order?.email && order?.unlock_token) {
    // Optional receipt: issue a one-time code for email downloads when contact is email.
    try {
      const issued = await issuePaidCode({
        userPhone: order.phone,
        userEmail: order.email,
        provider: order.payment_method || "manual",
        transactionId: `manual-${order.order_id}`,
      });
      if (issued?.code) {
        await sendPurchaseConfirmationEmail({
          email: order.email,
          code: issued.code,
          pack: order.pack,
          customerName: order.customer_name,
          amountIls: order.amount_ils,
        });
      }
    } catch (err) {
      console.error("[quickcv] approve email failed:", err?.message || err);
    }
  }

  const text =
    `✅ Payment Approved & Download Released!\n\n` +
    `*Order:* \`${escapeTelegramMarkdown(order.order_id)}\`\n` +
    optionalLine("Name", order.customer_name) +
    optionalLine("Phone", order.phone || order.email) +
    `*Amount:* ${escapeTelegramMarkdown(formatAmountIls(order.amount_ils))} ILS\n` +
    `*Supabase confirm:* yes\n` +
    (result.already ? `_Already approved earlier._` : `_Client polling will unlock download now._`);

  await editTelegramMessage(chatId, messageId, text);
}

async function handleRejectPayment(chatId, orderId, messageId, messageText) {
  const resolvedId = normalizeOrderId(orderId) || orderIdFromMessageText(messageText);
  let result;
  try {
    result = await rejectManualOrder(resolvedId, { messageText: messageText || "" });
  } catch (err) {
    console.error("[quickcv] reject payment failed:", err?.message || err);
    await sendTelegramText(
      chatId,
      `Could not reject \`${escapeTelegramMarkdown(resolvedId || orderId)}\`. Please try again.`,
    );
    return;
  }
  if (!result.ok) {
    if (result.reason === "already_paid") {
      await editTelegramMessage(
        chatId,
        messageId,
        `✅ Order \`${escapeTelegramMarkdown(resolvedId || orderId)}\` was already approved — download stays open.`,
      );
      return;
    }
    await sendTelegramText(
      chatId,
      result.reason === "not_found"
        ? `Order \`${escapeTelegramMarkdown(resolvedId || orderId)}\` could not be recovered.`
        : `Could not reject \`${escapeTelegramMarkdown(resolvedId || orderId)}\` (${result.reason || "error"}).`,
    );
    return;
  }

  const order = result.order;
  const text =
    `❌ Payment Rejected — Download Blocked\n\n` +
    `*Order:* \`${escapeTelegramMarkdown(order.order_id)}\`\n` +
    optionalLine("Name", order.customer_name) +
    optionalLine("Phone", order.phone || order.email) +
    `*Supabase confirm:* no\n` +
    (result.already ? `_Already rejected earlier._` : `_Customer will not get PDF access._`);

  await editTelegramMessage(chatId, messageId, text);
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

function orderIdFromMessageText(text) {
  const match = String(text || "").match(/\bCV-\d{4}\b/i);
  return match ? normalizeOrderId(match[0]) : "";
}

function normalizeCallbackLabel(raw) {
  return String(raw || "")
    .replace(/[\u2705\u274c\u2716\u2714\ufe0f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Parse Inline Keyboard callback_data: pay:/deny: snapshots, ok:/no:, or Yes/No labels.
 */
function parseCallbackQueryData(data, messageText) {
  const raw = String(data || "").trim();
  const label = normalizeCallbackLabel(raw);
  const fromMessage = orderIdFromMessageText(messageText);
  const snapshotSource = [raw, messageText].filter(Boolean).join("\n");

  if (/^pay:/i.test(raw) || label === "yes" || label === "approve" || label === "אישור") {
    const orderId = orderIdFromPayCallback(raw) || fromMessage;
    return { action: "approve", orderId, snapshotSource };
  }
  if (/^deny:/i.test(raw) || label === "no" || label === "reject" || label === "דחייה" || label === "סירוב") {
    const orderId = orderIdFromPayCallback(raw) || fromMessage;
    return { action: "reject", orderId, snapshotSource };
  }
  if (/^ok:/i.test(raw)) {
    return { action: "confirm_email", orderId: raw.slice(3).trim(), snapshotSource };
  }
  if (/^no:/i.test(raw)) {
    return { action: "delete", orderId: raw.slice(3).trim(), snapshotSource };
  }
  if (/^revoke:/i.test(raw)) {
    return { action: "revoke", orderId: raw.slice(7).trim(), snapshotSource };
  }
  if (label === "help") {
    return { action: "help", orderId: "", snapshotSource };
  }
  return { action: "unknown", orderId: fromMessage, snapshotSource };
}

function toastForCallbackAction(action) {
  if (action === "approve") return "Approving payment...";
  if (action === "reject") return "Rejecting payment...";
  if (action === "confirm_email") return "מאשר ושולח מייל...";
  if (action === "delete") return "מוחק הזמנה...";
  if (action === "unauthorized") return "אין הרשאה";
  return "";
}

/** Always ACK the spinner. Never throw. Retry without toast if Telegram rejects the payload. */
async function answerCallbackQuery(callbackQueryId, extra = {}) {
  const id = String(callbackQueryId || "").trim();
  if (!id) return { ok: false, error: "missing_callback_query_id" };
  const payload = { callback_query_id: id, ...extra };
  try {
    const result = await telegramApi("answerCallbackQuery", payload);
    if (!result.ok && extra && Object.keys(extra).length) {
      return await telegramApi("answerCallbackQuery", { callback_query_id: id });
    }
    return result;
  } catch (err) {
    console.error("[quickcv] answerCallbackQuery failed:", err?.message || err);
    try {
      return await telegramApi("answerCallbackQuery", { callback_query_id: id });
    } catch (retryErr) {
      console.error("[quickcv] answerCallbackQuery retry failed:", retryErr?.message || retryErr);
      return { ok: false, error: retryErr instanceof Error ? retryErr.message : "answer_failed" };
    }
  }
}

async function handleCallbackQuery(update) {
  const cq = update?.callback_query;
  if (!cq?.id) {
    console.error("[quickcv] callback_query missing id");
    return;
  }

  let answered = false;
  const answerOnce = async (extra = {}) => {
    if (answered) return;
    const result = await answerCallbackQuery(cq.id, extra);
    if (result?.ok !== false) answered = true;
    else if (!extra || !Object.keys(extra).length) answered = true;
  };

  const data = String(cq.data || "");
  const chatId = cq.message?.chat?.id;
  const messageId = cq.message?.message_id;
  const messageText = cq.message?.text || "";

  try {
    if (!isAdmin(update)) {
      await answerOnce({ text: toastForCallbackAction("unauthorized"), show_alert: true });
      if (chatId != null) {
        await sendTelegramText(chatId, "אין הרשאה. הבוט עונה רק לצ׳אט המנהל של QuickCV.");
      }
      return;
    }

    const parsed = parseCallbackQueryData(data, messageText);
    const toast = toastForCallbackAction(parsed.action);
    await answerOnce(toast ? { text: toast } : {});

    console.info("[quickcv] telegram callback", {
      action: parsed.action,
      orderId: parsed.orderId || "",
    });

    if (chatId == null) {
      console.error("[quickcv] callback_query missing chat id", { action: parsed.action });
      return;
    }

    if (parsed.action === "approve") {
      await handleApprovePayment(chatId, parsed.orderId, messageId, parsed.snapshotSource);
      return;
    }
    if (parsed.action === "reject") {
      await handleRejectPayment(chatId, parsed.orderId, messageId, parsed.snapshotSource);
      return;
    }
    if (parsed.action === "confirm_email") {
      await handleConfirmOrder(chatId, parsed.orderId, messageId);
      return;
    }
    if (parsed.action === "delete") {
      await handleDeleteOrder(chatId, parsed.orderId, messageId);
      return;
    }
    if (parsed.action === "revoke") {
      await handleRevoke(chatId, parsed.orderId);
      return;
    }
    if (parsed.action === "help") {
      await sendTelegramText(chatId, helpText());
      return;
    }

    console.warn("[quickcv] unknown telegram callback_data", data.slice(0, 80));
  } catch (err) {
    console.error("[quickcv] callback query handler error:", err?.message || err);
    try {
      if (chatId != null) {
        await sendTelegramText(
          chatId,
          "שגיאה בטיפול בכפתור Yes/No. נסו שוב, או בדקו את לוג השרת.",
        );
      }
    } catch (notifyErr) {
      console.error("[quickcv] callback error notify failed:", notifyErr?.message || notifyErr);
    }
  } finally {
    try {
      await answerOnce();
    } catch (ackErr) {
      console.error("[quickcv] callback ACK in finally failed:", ackErr?.message || ackErr);
    }
  }
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

  let update;
  try {
    const raw = await readBody(req, MAX_BYTES);
    update = parseBody(raw, req.headers["content-type"]) || {};
  } catch {
    json(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  if (!verifyTelegramSecret(req)) {
    try {
      if (update?.callback_query?.id) {
        await answerCallbackQuery(update.callback_query.id, {
          text: "אין הרשאה",
          show_alert: true,
        });
      }
    } catch (ackErr) {
      console.error("[quickcv] unauthorized callback ACK failed:", ackErr?.message || ackErr);
    }
    json(res, 401, { ok: false, error: "unauthorized" });
    return;
  }

  try {
    if (update.callback_query) {
      await handleCallbackQuery(update);
    } else if (!isAdmin(update)) {
      const chatId = update?.message?.chat?.id ?? update?.edited_message?.chat?.id;
      if (chatId != null) {
        await sendTelegramText(chatId, "אין הרשאה. הבוט עונה רק לצ׳אט המנהל של QuickCV.");
      }
    } else {
      const message = update.message || update.edited_message;
      if (message?.text && message.chat?.id != null) {
        await handleCommand(message.chat.id, message.text);
      }
    }
  } catch (err) {
    console.error("[quickcv] telegram bot error:", err?.message || err);
    try {
      const cqId = update?.callback_query?.id;
      if (cqId) await answerCallbackQuery(cqId);
    } catch (ackErr) {
      console.error("[quickcv] telegram fallback ACK failed:", ackErr?.message || ackErr);
    }
  }

  if (!res.headersSent) {
    json(res, 200, { ok: true });
  }
}
