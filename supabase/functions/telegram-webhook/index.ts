import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const WEBHOOK_SECRET = "qc_tg_wh_v1_b7e1c4a08d3f9a2c6e5b1d8f0a4c7e29";
const VERCEL_FORWARD = "https://cv-builder-ghzjfy-stack.vercel.app/api/telegram-webhook";
const ACCESS_DAYS = 30;

type TelegramUpdate = {
  callback_query?: {
    id?: string;
    data?: string;
    message?: { text?: string; caption?: string };
  };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function normalizeOrderId(value: string) {
  const match = String(value || "")
    .toUpperCase()
    .match(/\bCV-\d{4}\b/);
  return match ? match[0] : "";
}

function parseAction(update: TelegramUpdate) {
  const data = String(update?.callback_query?.data || "").trim();
  const messageText = [
    update?.callback_query?.data,
    update?.callback_query?.message?.text,
    update?.callback_query?.message?.caption,
  ]
    .filter(Boolean)
    .join("\n");
  const orderId = normalizeOrderId(data) || normalizeOrderId(messageText);
  const label = data.replace(/[\u2705\u274c\u2716\u2714\ufe0f]/g, "").trim().toLowerCase();
  if (/^pay:/i.test(data) || label === "yes" || label === "approve" || label === "אישור") {
    return { approve: true as const, orderId };
  }
  if (/^deny:/i.test(data) || label === "no" || label === "reject" || label === "דחייה" || label === "סירוב") {
    return { approve: false as const, orderId };
  }
  return { approve: null, orderId };
}

function addDaysIso(days = ACCESS_DAYS) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

async function upsertOrder(orderId: string, approve: boolean) {
  const url = String(Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
  const key = String(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
  if (!url || !key || !orderId) return { ok: false, error: "not_configured" };

  const payload = {
    order_id: orderId,
    phone: "",
    name: "",
    order_date: new Date().toISOString(),
    exp_date: addDaysIso(),
    confirm: approve ? "yes" : "no",
    status: approve ? "approved" : "rejected",
    updated_at: new Date().toISOString(),
  };

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  };

  const upsert = await fetch(`${url}/rest/v1/orders?on_conflict=order_id`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (upsert.ok) return { ok: true };

  const patched = await fetch(`${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      confirm: payload.confirm,
      status: payload.status,
      updated_at: payload.updated_at,
      exp_date: payload.exp_date,
    }),
  });
  if (patched.ok) return { ok: true };

  const inserted = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (inserted.ok) return { ok: true };
  const text = await inserted.text().catch(() => "");
  return { ok: false, error: text.slice(0, 200) || `supabase_http_${inserted.status}` };
}

async function forwardToVercel(req: Request, raw: string) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token") || WEBHOOK_SECRET;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(VERCEL_FORWARD, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") || "application/json",
        "X-Telegram-Bot-Api-Secret-Token": secret,
      },
      body: raw,
      signal: controller.signal,
    });
  } catch {
    /* Vercel ACK is best-effort; the paid row is already in Postgres. */
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  }
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const expected = String(Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || WEBHOOK_SECRET).trim();
  const got = String(req.headers.get("x-telegram-bot-api-secret-token") || "").trim();
  if (!expected || got !== expected) return json({ ok: false, error: "unauthorized" }, 401);

  const raw = await req.text();
  let update: TelegramUpdate = {};
  try {
    update = raw ? (JSON.parse(raw) as TelegramUpdate) : {};
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  const parsed = parseAction(update);
  if (parsed.orderId && parsed.approve != null) {
    const written = await upsertOrder(parsed.orderId, parsed.approve);
    if (!written.ok) {
      console.error("telegram-webhook upsert failed", written.error || "");
    }
  }

  await forwardToVercel(req, raw);
  return json({ ok: true });
});
