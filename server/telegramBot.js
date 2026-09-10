import { issuePaidCode, normalizeContact, normalizeRedemptionCode, consumeCode } from "./codes.js";
import { json, parseBody, readBody } from "./http.js";
import { kvGet, kvSet } from "./kv.js";
import { escapeTelegramMarkdown, formatAmountIls, formatPaymentMethod } from "../lib/telegram.js";

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

function helpText() {
  return (
    "*QuickCV control panel*\n\n" +
    "`/help` — this list\n" +
    "`/status` — env + storage health\n" +
    "`/code` — issue a one-time unlock code\n" +
    "`/code 0501234567` — code tied to a phone\n" +
    "`/code 19.9 paybox` — amount + provider note\n" +
    "`/lookup ABC123` — inspect a code (hashed lookup)\n" +
    "`/revoke ABC123` — mark a code as used / blocked\n\n" +
    "New paid orders also post here automatically."
  );
}

async function statusText() {
  const hasToken = Boolean(botToken());
  const hasChat = Boolean(adminChatId());
  const hasKv = Boolean(envValue("KV_REST_API_URL") || envValue("UPSTASH_REDIS_REST_URL"));
  const hasPaySecret = Boolean(envValue("PAYMENT_TOKEN_SECRET"));
  const hasWebhook = Boolean(envValue("PAYMENT_WEBHOOK_SECRET") || envValue("PAYBOX_WEBHOOK_SECRET"));
  const hasOpenAi = Boolean(envValue("OPENAI_API_KEY"));
  const amount = formatAmountIls(process.env.PAYMENT_AMOUNT_ILS || 9.9);
  return (
    "*QuickCV status*\n\n" +
    `*Bot token:* ${hasToken ? "ok" : "missing"}\n` +
    `*Admin chat:* ${hasChat ? "ok" : "missing"}\n` +
    `*KV / Redis:* ${hasKv ? "ok" : "missing (codes may reset on cold start)"}\n` +
    `*Payment token secret:* ${hasPaySecret ? "ok" : "missing"}\n` +
    `*Payment webhooks:* ${hasWebhook ? "ok" : "missing"}\n` +
    `*Bit screenshot AI:* ${hasOpenAi ? "ok" : "missing (Bit image verify)"}\n` +
    `*Basic price:* ${escapeTelegramMarkdown(amount)} ₪`
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
    return sendTelegramText(chatId, "Could not issue a code. Check KV / Redis env vars.");
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
      ? `*Contact:* ${escapeTelegramMarkdown(parsed.phone || parsed.email)}\n`
      : "";
  return sendTelegramText(
    chatId,
    `*Unlock code issued*\n\n` +
      `*Code:* \`${escapeTelegramMarkdown(issued.code)}\`\n` +
      contactLine +
      `*Note amount:* ${escapeTelegramMarkdown(formatAmountIls(parsed.amount))} ₪\n` +
      `*Provider tag:* ${escapeTelegramMarkdown(formatPaymentMethod(parsed.provider))}\n\n` +
      `Send this code to the customer. It is one-time use.`,
  );
}

async function handleLookup(chatId, codeRaw) {
  const code = normalizeRedemptionCode(codeRaw);
  if (code.length !== 6) {
    return sendTelegramText(chatId, "Usage: `/lookup ABC123`");
  }
  const indexed = await kvGet(`qc:tg:code:${code}`);
  if (indexed && typeof indexed === "object") {
    return sendTelegramText(
      chatId,
      `*Code* \`${escapeTelegramMarkdown(code)}\`\n` +
        `*Phone:* ${escapeTelegramMarkdown(indexed.phone || "—")}\n` +
        `*Email:* ${escapeTelegramMarkdown(indexed.email || "—")}\n` +
        `*Provider:* ${escapeTelegramMarkdown(indexed.provider || "—")}\n` +
        `*Created:* ${escapeTelegramMarkdown(indexed.created_at || "—")}`,
    );
  }
  return sendTelegramText(
    chatId,
    `No admin index for \`${escapeTelegramMarkdown(code)}\`. ` +
      `Codes issued by payment webhooks are stored hashed only — use /revoke to burn one.`,
  );
}

async function handleRevoke(chatId, codeRaw) {
  const code = normalizeRedemptionCode(codeRaw);
  if (code.length !== 6) {
    return sendTelegramText(chatId, "Usage: `/revoke ABC123`");
  }
  const result = await consumeCode(code, "");
  if (result.ok) {
    return sendTelegramText(chatId, `Code \`${escapeTelegramMarkdown(code)}\` marked used / revoked.`);
  }
  if (result.reason === "used") {
    return sendTelegramText(chatId, `Code \`${escapeTelegramMarkdown(code)}\` was already used.`);
  }
  return sendTelegramText(chatId, `Could not revoke \`${escapeTelegramMarkdown(code)}\` (${result.reason || "invalid"}).`);
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
  return sendTelegramText(chatId, "Unknown command. Try `/help`.");
}

function verifyTelegramSecret(req) {
  const expected = envValue("TELEGRAM_WEBHOOK_SECRET");
  if (!expected) return true;
  const got = String(req.headers["x-telegram-bot-api-secret-token"] || "").trim();
  return got === expected;
}

/**
 * POST /api/telegram-webhook
 * Telegram Bot API update endpoint for the admin control panel.
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

  // Always ack quickly so Telegram does not retry.
  json(res, 200, { ok: true });

  try {
    if (!isAdmin(update)) {
      const chatId =
        update?.message?.chat?.id ??
        update?.callback_query?.message?.chat?.id;
      if (chatId != null) {
        await sendTelegramText(chatId, "Unauthorized. This bot only answers the QuickCV admin chat.");
      }
      return;
    }

    if (update.callback_query) {
      const cq = update.callback_query;
      await telegramApi("answerCallbackQuery", { callback_query_id: cq.id });
      const data = String(cq.data || "");
      const chatId = cq.message?.chat?.id;
      if (chatId == null) return;
      if (data.startsWith("revoke:")) {
        await handleRevoke(chatId, data.slice(7));
      } else if (data === "help") {
        await sendTelegramText(chatId, helpText());
      }
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
