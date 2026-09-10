import { normalizeContact } from "./codes.js";

const FAIL = { delivered: false, channel: null, error: "not_configured" };

function messageBody(code) {
  return `קוד האימות של QuickCV: ${code}\nהקוד תקף לזמן מוגבל. אין לשתף אותו.`;
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

async function sendTwilioSms(phone, code) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !auth || !from || !phone) return null;

  const body = new URLSearchParams({
    To: `+${phone}`,
    From: from,
    Body: messageBody(code),
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    return { delivered: false, channel: "sms", error: "twilio_error" };
  }
  return { delivered: true, channel: "sms", error: null };
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

export async function sendVerificationCode({ phone, email, code }) {
  const intlPhone = normalizeContact(phone);
  const mail = normalizeContact(email);

  try {
    const wa = await sendWhatsApp(intlPhone, code);
    if (wa?.delivered) return wa;
    const sms = await sendTwilioSms(intlPhone, code);
    if (sms?.delivered) return sms;
    const em = await sendEmail(mail, code);
    if (em?.delivered) return em;
    return wa || sms || em || FAIL;
  } catch {
    return { delivered: false, channel: null, error: "send_failed" };
  }
}
