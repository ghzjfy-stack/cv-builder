import { handleTelegramWebhookRequest } from "../server/telegramBot.js";

export const config = {
  maxDuration: 15,
};

export default async function handler(req, res) {
  try {
    await handleTelegramWebhookRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
    }
  }
}
