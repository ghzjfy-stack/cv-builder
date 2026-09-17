import { clientIp, json, parseBody, rateLimited, readBody } from "./http.js";
import { orderStorageMode } from "./orderStore.js";
import { packAmount } from "../src/config/checkout.js";
import {
  approveManualOrder,
  createManualOrder,
  getManualOrder,
  normalizeOrderId,
  sendManualOrderTelegram,
  updateManualOrder,
} from "./manualOrders.js";
import {
  getSupabaseOrder,
  isAccessExpired,
  isApprovedPaymentStatus,
  isDownloadAllowed,
  isRejectedRow,
  isSupabaseConfigured,
} from "./supabaseOrders.js";

const MAX_BYTES = 32 * 1024;

function parseContact(raw) {
  const contact = String(raw || "").trim().slice(0, 120);
  if (!contact) return { contact: "", phone: "", email: "" };
  if (contact.includes("@")) return { contact, phone: "", email: contact };
  return { contact, phone: contact, email: "" };
}

function friendlyError(err) {
  const msg = String(err?.message || err || "");
  if (/kv|redis|upstash|storage|database/i.test(msg)) {
    return "לא הצלחנו לפתוח הזמנה. נסו שוב בעוד רגע.";
  }
  return "לא הצלחנו לפתוח הזמנה. נסו שוב.";
}

/**
 * POST /api/order-session and POST /api/telegram-notify
 * Create or reuse a PENDING manual checkout order and notify Telegram
 * with order id, customer phone, and Bit/PayBox method.
 */
export async function handleOrderSessionRequest(req, res) {
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

  const ip = clientIp(req);
  if (rateLimited(`order-session:${ip}`, 12, 10 * 60 * 1000)) {
    json(res, 429, { ok: false, error: "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." });
    return;
  }

  let body;
  try {
    const raw = await readBody(req, MAX_BYTES);
    body = parseBody(raw, req.headers["content-type"]) || {};
  } catch {
    json(res, 400, { ok: false, error: "bad_request" });
    return;
  }

  const pack = "basic";
  const methodRaw = String(body.payment_method || body.method || "bit").toLowerCase();
  const paymentMethod = methodRaw === "paybox" ? "paybox" : "bit";
  const contacts = parseContact(body.contact || body.phone || body.email);
  if (!contacts.phone) {
    json(res, 400, { ok: false, error: "נא למלא מספר טלפון לזיהוי ההעברה." });
    return;
  }
  const amountIls = Number(process.env.PAYMENT_AMOUNT_ILS || 10) || packAmount(pack);
  const requestedId = normalizeOrderId(body.order_id || body.orderId);
  const customerName = String(body.customer_name || body.name || "").trim();

  try {
    let order = requestedId ? await getManualOrder(requestedId) : null;
    if (order && order.status === "PENDING") {
      order = await updateManualOrder(order.order_id, {
        customer_name: customerName || order.customer_name,
        phone: contacts.phone || order.phone,
        email: contacts.email || order.email,
        contact: contacts.contact || order.contact,
        payment_method: paymentMethod,
        amount_ils: amountIls,
        pack,
      });
    } else if (order && (order.status === "PAID" || order.status === "CANCELLED")) {
      order = await createManualOrder({
        customerName,
        phone: contacts.phone || body.phone || "",
        email: contacts.email || body.email || "",
        contact: contacts.contact,
        paymentMethod,
        amountIls,
        pack,
      });
    } else {
      order = await createManualOrder({
        orderId: requestedId || undefined,
        customerName,
        phone: contacts.phone || body.phone || "",
        email: contacts.email || body.email || "",
        contact: contacts.contact,
        paymentMethod,
        amountIls,
        pack,
      });
    }
    if (!order || !order.order_id) throw new Error("order_missing");

    const shouldNotify = !order.telegram_message_id;
    const notify = shouldNotify
      ? await sendManualOrderTelegram(order)
      : { sent: true };
    if (shouldNotify && !notify.sent && notify.error && notify.error !== "not_configured") {
      console.error("[quickcv] manual order telegram failed:", notify.error);
    }
    if (shouldNotify && !notify.sent && notify.error === "not_configured") {
      console.warn("[quickcv] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing. Order alert not sent.");
    }

    json(res, 200, {
      ok: true,
      order_id: order.order_id,
      status: order.status,
      amount_ils: order.amount_ils,
      pack: order.pack,
      payment_method: order.payment_method,
      telegram_sent: Boolean(notify.sent),
      storage: orderStorageMode(),
    });
  } catch (err) {
    console.error("[quickcv] order-session failed:", err?.message || err);
    json(res, 500, { ok: false, error: friendlyError(err) });
  }
}

function publicOrderStatus(order, supabaseRow, paid) {
  const raw = String(supabaseRow?.status || order?.status || "").trim();
  if (paid) {
    if (isApprovedPaymentStatus(raw)) return raw.toLowerCase();
    return "approved";
  }
  return raw || "PENDING";
}

/**
 * GET /api/order-status?order=CV-8492
 * Client polls this exact order_id until Telegram writes paid/approved/confirmed.
 */
export async function handleOrderStatusRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, OPTIONS");
    res.end();
    return;
  }
  if (req.method !== "GET") {
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const orderId = normalizeOrderId(url.searchParams.get("order") || url.searchParams.get("id"));
  if (!orderId) {
    json(res, 400, { ok: false, error: "missing_order_id" });
    return;
  }

  let order = null;
  try {
    order = await getManualOrder(orderId);
  } catch (err) {
    console.warn("[quickcv] order-status read failed:", err?.message || err);
  }

  let supabaseRow = null;
  if (isSupabaseConfigured()) {
    try {
      supabaseRow = await getSupabaseOrder(orderId);
    } catch (err) {
      console.warn("[quickcv] supabase order-status read failed:", err?.message || err);
    }
  }

  if (isRejectedRow(supabaseRow) || order?.status === "CANCELLED") {
    json(res, 200, {
      ok: true,
      order_id: orderId,
      status: "CANCELLED",
      paid: false,
      confirm: "no",
    });
    return;
  }

  if (isAccessExpired(supabaseRow)) {
    json(res, 200, {
      ok: true,
      order_id: orderId,
      status: "EXPIRED",
      paid: false,
      confirm: "yes",
    });
    return;
  }

  const confirmedYes =
    isDownloadAllowed(supabaseRow) || isApprovedPaymentStatus(supabaseRow?.status);
  if (confirmedYes && order?.status !== "PAID") {
    try {
      const approved = await approveManualOrder(orderId);
      if (approved.ok) order = approved.order;
    } catch (err) {
      console.warn("[quickcv] supabase confirm sync failed:", err?.message || err);
    }
  }

  const supabaseBlocks = isRejectedRow(supabaseRow) || isAccessExpired(supabaseRow);
  const kvPaid = order?.status === "PAID" || isApprovedPaymentStatus(order?.status);
  const paid = Boolean((confirmedYes || kvPaid) && !supabaseBlocks);

  if (!order && !paid) {
    json(res, 200, { ok: true, order_id: orderId, status: "PENDING", paid: false, confirm: "no" });
    return;
  }

  json(res, 200, {
    ok: true,
    order_id: order?.order_id || orderId,
    status: publicOrderStatus(order, supabaseRow, paid),
    paid,
    confirm: paid ? "yes" : supabaseRow?.confirm || order?.confirm || "no",
    amount_ils: order?.amount_ils,
    pack: order?.pack,
    ...(paid && order?.unlock_token ? { token: order.unlock_token } : {}),
  });
}

/** Used by Telegram webhook approve button. */
export async function releaseManualOrderDownload(orderId) {
  const { approveManualOrder } = await import("./manualOrders.js");
  return approveManualOrder(orderId);
}
