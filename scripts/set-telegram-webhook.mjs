import { loadEnv } from "../server/env.js";
import { TELEGRAM_WEBHOOK_SECRET_FALLBACK } from "../server/telegramWebhookSecret.js";

loadEnv();

const token = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const secret = TELEGRAM_WEBHOOK_SECRET_FALLBACK;
const webhookUrl =
  "https://ywzylohuyppykhzfscnz.supabase.co/functions/v1/telegram-webhook";

if (!token) {
  console.error("missing_bot_token");
  process.exit(1);
}
if (!secret) {
  console.error("missing_webhook_secret");
  process.exit(1);
}

const setRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    drop_pending_updates: false,
    allowed_updates: ["message", "edited_message", "callback_query"],
  }),
});
const setBody = await setRes.json().catch(() => null);
if (!setRes.ok || !setBody?.ok) {
  console.error("setWebhook_failed", setBody?.description || setRes.status);
  process.exit(1);
}

const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
const info = await infoRes.json().catch(() => null);
const result = info?.result || {};
console.log(
  JSON.stringify({
    ok: true,
    url: result.url || webhookUrl,
    pending: result.pending_update_count ?? null,
    last_error: result.last_error_message || null,
  }),
);
