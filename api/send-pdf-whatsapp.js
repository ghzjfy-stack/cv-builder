import { handleSendPdfWhatsappRequest } from "../server/sendPdfWhatsapp.js";

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  try {
    await handleSendPdfWhatsappRequest(req, res);
  } catch {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, fallback: true, error: "Internal server error" }));
    }
  }
}
