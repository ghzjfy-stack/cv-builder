import { handlePayboxSessionRequest, handlePayboxStatusRequest } from "./payboxSession.js";
import { handlePayboxWebhookRequest } from "./payboxWebhook.js";
import { handlePaymentWebhookRequest } from "./paymentWebhook.js";
import { handleVerifyCodeAndDownloadRequest } from "./verifyCodeDownload.js";
import { handleSendPdfWhatsappRequest } from "./sendPdfWhatsapp.js";
import { handleTelegramWebhookRequest } from "./telegramBot.js";
import { handleVerifyPaymentRequest } from "./verifyPayment.js";
import { loadEnv } from "./env.js";

const routes = {
  "/api/verify-payment": handleVerifyPaymentRequest,
  "/api/payment-webhook": handlePaymentWebhookRequest,
  "/api/webhooks/paybox": handlePayboxWebhookRequest,
  "/api/paybox-session": handlePayboxSessionRequest,
  "/api/paybox-status": handlePayboxStatusRequest,
  "/api/verify-code-and-download": handleVerifyCodeAndDownloadRequest,
  "/api/send-pdf-whatsapp": handleSendPdfWhatsappRequest,
  "/api/telegram-webhook": handleTelegramWebhookRequest,
};

function attach(middlewares) {
  middlewares.use((req, res, next) => {
    const path = (req.url || "").split("?")[0];
    const handler = routes[path];
    if (!handler) {
      next();
      return;
    }
    handler(req, res).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
      }
    });
  });
}

export function paymentApiPlugin() {
  loadEnv();
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[quickcv] OPENAI_API_KEY is missing. /api/verify-payment (Bit screenshot) will return 500 until it is set in .env");
  }
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn("[quickcv] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing. Order alerts and Telegram control panel are off.");
  }
  if (!process.env.PAYMENT_WEBHOOK_SECRET && !process.env.PAYBOX_WEBHOOK_SECRET) {
    console.warn(
      "[quickcv] PAYMENT_WEBHOOK_SECRET / PAYBOX_WEBHOOK_SECRET is missing. Payment webhooks will return 500 until set.",
    );
  }
  return {
    name: "quickcv-payment-api",
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
  };
}
