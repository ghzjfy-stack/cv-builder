import { normalizeContact } from "./codes.js";

const FAIL = { delivered: false, channel: null, error: "not_configured" };

function messageBody(code) {
  return `קוד האימות של QuickCV: ${code}\nהקוד תקף לזמן מוגבל. אין לשתף אותו.`;
}

function siteUrl() {
  return String(process.env.NEXT_PUBLIC_SITE_URL || "https://quickcv.app").replace(/\/$/, "");
}

function packLabel(pack) {
  return pack === "complete" ? "הורדת PDF מלא" : "הורדת PDF מלא";
}

function packBenefits(pack) {
  if (pack === "complete") {
    return [
      "הורדת PDF באיכות גבוהה",
      "קובץ Word לעריכה",
      "מכתב מקדים",
      "גישה לעריכה והורדה חוזרת ל־24 שעות",
    ];
  }
  return ["הורדת PDF מוכן להגשה"];
}

async function sendWhatsApp(phone, code) {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || !phone) return null;

  const template = process.env.WHATSAPP_TEMPLATE_NAME;
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "he" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { preview_url: false, body: messageBody(code) },
      };

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return { delivered: false, channel: "whatsapp", error: err.slice(0, 200) || "whatsapp_error" };
  }
  return { delivered: true, channel: "whatsapp", error: null };
}

async function sendEmail(email, code) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "QuickCV <noreply@quickcv.app>";
  if (!key || !email) return null;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "קוד אימות QuickCV",
      text: messageBody(code),
    }),
  });
  if (!res.ok) {
    return { delivered: false, channel: "email", error: "email_error" };
  }
  return { delivered: true, channel: "email", error: null };
}

/**
 * Hebrew purchase confirmation via Resend, content depends on pack.
 * @param {{ email?: string, code: string, pack?: string, customerName?: string, amountIls?: number }} input
 */
export async function sendPurchaseConfirmationEmail(input) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "QuickCV <noreply@quickcv.app>";
  const email = normalizeContact(input.email);
  const code = String(input.code || "").trim();
  const pack = input.pack === "complete" ? "complete" : "basic";
  if (!key) return { delivered: false, channel: "email", error: "not_configured" };
  if (!email || !email.includes("@")) return { delivered: false, channel: "email", error: "missing_email" };
  if (!code) return { delivered: false, channel: "email", error: "missing_code" };

  const name = String(input.customerName || "").trim() || "לקוח/ה יקר/ה";
  const benefits = packBenefits(pack)
    .map((line) => `• ${line}`)
    .join("\n");
  const amount =
    input.amountIls != null && Number.isFinite(Number(input.amountIls))
      ? `${Number(input.amountIls).toFixed(2)} ₪`
      : "";
  const url = siteUrl();

  const text =
    `שלום ${name},\n\n` +
    `התשלום אושר ב-QuickCV.\n` +
    `חבילה: ${packLabel(pack)}${amount ? ` (${amount})` : ""}\n\n` +
    `מה כלול:\n${benefits}\n\n` +
    `קוד הגישה להורדה: ${code}\n\n` +
    `איך מורידים:\n` +
    `1. היכנסו ל-${url}\n` +
    `2. פתחו את הסטודיו → הורדה\n` +
    `3. הזינו את הקוד וקבלו את הקבצים\n\n` +
    `אין לשתף את הקוד. הוא לשימוש חד־פעמי.\n\n` +
    `צוות QuickCV`;

  const html =
    `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a">` +
    `<h2 style="margin:0 0 12px">התשלום אושר — QuickCV</h2>` +
    `<p>שלום ${escapeHtml(name)},</p>` +
    `<p>חבילה: <strong>${escapeHtml(packLabel(pack))}</strong>` +
    (amount ? ` · ${escapeHtml(amount)}` : "") +
    `</p>` +
    `<p><strong>מה כלול:</strong></p>` +
    `<ul>${packBenefits(pack)
      .map((line) => `<li>${escapeHtml(line)}</li>`)
      .join("")}</ul>` +
    `<p style="font-size:18px;margin:18px 0"><strong>קוד הגישה:</strong> ` +
    `<code style="letter-spacing:0.12em;background:#f1f5f9;padding:4px 8px;border-radius:6px">${escapeHtml(code)}</code></p>` +
    `<p>היכנסו ל-<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>, פתחו הורדה והזינו את הקוד.</p>` +
    `<p style="color:#64748b;font-size:13px">אין לשתף את הקוד. הוא לשימוש חד־פעמי.</p>` +
    `<p>צוות QuickCV</p></div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `אישור הזמנה QuickCV — ${packLabel(pack)}`,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return { delivered: false, channel: "email", error: err.slice(0, 200) || "email_error" };
    }
    return { delivered: true, channel: "email", error: null };
  } catch {
    return { delivered: false, channel: "email", error: "send_failed" };
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendVerificationCode({ phone, email, code }) {
  const intlPhone = normalizeContact(phone);
  const mail = normalizeContact(email);

  try {
    const wa = await sendWhatsApp(intlPhone, code);
    if (wa?.delivered) return wa;
    const em = await sendEmail(mail, code);
    if (em?.delivered) return em;
    return wa || em || FAIL;
  } catch {
    return { delivered: false, channel: null, error: "send_failed" };
  }
}
