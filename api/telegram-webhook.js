import { handleTelegramWebhookRequest } from "../server/telegramBot.js";

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  try {
    await handleTelegramWebhookRequest(req, res);
  } catch (err) {
    console.error("[quickcv] telegram webhook crashed:", err?.message || err);
    if (!res.headersSent) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true }));
    }
  }
}
