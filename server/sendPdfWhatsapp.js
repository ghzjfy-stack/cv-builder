import { normalizeContact } from "./codes.js";
import { json, parseBody, rateLimited, readBody } from "./http.js";
import { verifyUnlockToken } from "./unlockToken.js";

const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_PDF = 3 * 1024 * 1024;

function phoneFromContact(value) {
  const n = normalizeContact(value);
  if (!n || n.includes("@")) return "";
  if (n.startsWith("972") && n.length >= 11) return n;
  return "";
}

function decodePdf(payload) {
  let raw = payload?.pdfBase64 || payload?.pdf || payload?.data || "";
  if (typeof raw !== "string" || !raw.trim()) return null;
  raw = raw.trim();
  const dataUrl = raw.match(/^data:application\/pdf;base64,(.+)$/i);
  if (dataUrl) raw = dataUrl[1];
  raw = raw.replace(/\s/g, "");
  let buf;
  try {
    buf = Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  if (!buf.length || buf.length > MAX_PDF) return null;
  if (buf.slice(0, 4).toString("utf8") !== "%PDF") return null;
  return buf;
}

function safeFilename(name) {
  const raw = String(name || "cv.pdf").replace(/[/\\?%*:|"<>]/g, "_").slice(0, 80);
  return raw.toLowerCase().endsWith(".pdf") ? raw : `${raw}.pdf`;
}

async function uploadMedia(buffer, filename) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: false, error: "not_configured" };

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "application/pdf");
  form.append("file", new Blob([buffer], { type: "application/pdf" }), filename);

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id) {
    return { ok: false, error: "media_upload_failed" };
  }
  return { ok: true, id: String(data.id) };
}

async function sendDocument(mediaId, phone, filename) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "document",
      document: {
        id: mediaId,
        filename,
        caption: "קורות החיים מ-QuickCV",
      },
    }),
  });
  if (!res.ok) return { ok: false, error: "send_failed" };
  return { ok: true };
}

/**
 * POST /api/send-pdf-whatsapp
 * Body: { token, phone, filename, pdfBase64 }
 */
export async function handleSendPdfWhatsappRequest(req, res) {
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

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  const ipKey = String(ip).split(",")[0].trim();
  if (rateLimited(ipKey, 5, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "too_many_requests", fallback: true });
    return;
  }

  let payload;
  try {
    const raw = await readBody(req, MAX_BYTES);
    payload = parseBody(raw, req.headers["content-type"]) || {};
  } catch (err) {
    json(res, err?.code === "PAYLOAD_TOO_LARGE" ? 413 : 400, { ok: false, error: "bad_request", fallback: true });
    return;
  }

  if (!verifyUnlockToken(String(payload.token || ""))) {
    json(res, 401, { ok: false, error: "unauthorized", fallback: true });
    return;
  }

  const phone = phoneFromContact(payload.phone || payload.contact);
  const pdf = decodePdf(payload);
  if (!phone || !pdf) {
    json(res, 400, { ok: false, error: "invalid_payload", fallback: true });
    return;
  }

  if (!(process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN) || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    json(res, 200, { ok: false, fallback: true, error: "not_configured" });
    return;
  }

  const filename = safeFilename(payload.filename);
  try {
    const media = await uploadMedia(pdf, filename);
    if (!media.ok) {
      json(res, 200, { ok: false, fallback: true, error: media.error });
      return;
    }
    const sent = await sendDocument(media.id, phone, filename);
    json(res, 200, sent.ok ? { ok: true, delivered: true } : { ok: false, fallback: true, error: sent.error });
  } catch {
    json(res, 200, { ok: false, fallback: true, error: "send_failed" });
  }
}
