import { createServer } from "node:http";
import { handleCvAiRequest } from "./cvAi.js";
import { handlePayboxSessionRequest, handlePayboxStatusRequest } from "./payboxSession.js";
import { handlePayboxWebhookRequest } from "./payboxWebhook.js";
import { handlePaymentWebhookRequest } from "./paymentWebhook.js";
import { handleVerifyCodeAndDownloadRequest } from "./verifyCodeDownload.js";
import { handleSendPdfWhatsappRequest } from "./sendPdfWhatsapp.js";
import { handleVerifyPaymentRequest } from "./verifyPayment.js";
import { loadEnv } from "./env.js";

loadEnv();

const PORT = Number(process.env.PORT || 8787);

const routes = {
  "/api/verify-payment": handleVerifyPaymentRequest,
  "/api/payment-webhook": handlePaymentWebhookRequest,
  "/api/webhooks/paybox": handlePayboxWebhookRequest,
  "/api/paybox-session": handlePayboxSessionRequest,
  "/api/paybox-status": handlePayboxStatusRequest,
  "/api/verify-code-and-download": handleVerifyCodeAndDownloadRequest,
  "/api/cv-ai": handleCvAiRequest,
  "/api/send-pdf-whatsapp": handleSendPdfWhatsappRequest,
};

createServer((req, res) => {
  const path = (req.url || "").split("?")[0];
  const handler = routes[path];
  if (handler) {
    handler(req, res).catch(() => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: false, error: "Internal server error" }));
      }
    });
    return;
  }
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not found" }));
}).listen(PORT, () => {
  console.log(
    `Payment APIs on http://localhost:${PORT}/api/{webhooks/paybox,paybox-session,paybox-status,payment-webhook,verify-code-and-download,verify-payment}`,
  );
});
