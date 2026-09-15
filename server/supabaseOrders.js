/**
 * Persist checkout rows in Supabase and use confirm=yes/no as the PDF gate.
 * REST only (service role) — no extra npm client.
 */

const TABLE = "orders";
const ACCESS_DAYS = 30;

function envValue(name) {
  try {
    return String(process.env[name] || "").trim();
  } catch {
    return "";
  }
}

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig());
}

function supabaseConfig() {
  const url = (envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL")).replace(/\/$/, "");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY") || envValue("SUPABASE_SERVICE_KEY");
  if (!url || !key) return null;
  return { url, key };
}

export function addDaysIso(from, days = ACCESS_DAYS) {
  const d = from instanceof Date ? new Date(from.getTime()) : new Date(from || Date.now());
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() + days);
    return fallback.toISOString();
  }
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function normalizeConfirm(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (raw === "yes" || raw === "true" || raw === "1" || raw === "approved") return "yes";
  return "no";
}

function rowStatus(confirm, status) {
  if (status === "rejected" || status === "CANCELLED") return "rejected";
  if (confirm === "yes" || status === "approved" || status === "PAID") return "approved";
  return "pending";
}

function mapRow(row) {
  if (!row || typeof row !== "object") return null;
  return {
    id: row.id,
    order_id: String(row.order_id || "").trim(),
    phone: String(row.phone || "").trim(),
    name: String(row.name || "").trim(),
    order_date: row.order_date,
    exp_date: row.exp_date,
    confirm: normalizeConfirm(row.confirm),
    status: String(row.status || "pending"),
    updated_at: row.updated_at,
  };
}

export function isDownloadAllowed(row) {
  const mapped = mapRow(row);
  if (!mapped || mapped.confirm !== "yes") return false;
  if (!mapped.exp_date) return true;
  const exp = Date.parse(mapped.exp_date);
  if (!Number.isFinite(exp)) return true;
  return exp > Date.now();
}

export function isAccessExpired(row) {
  const mapped = mapRow(row);
  if (!mapped || mapped.confirm !== "yes") return false;
  const exp = Date.parse(mapped.exp_date);
  return Number.isFinite(exp) && exp <= Date.now();
}

export function isRejectedRow(row) {
  const mapped = mapRow(row);
  return Boolean(mapped && mapped.status === "rejected");
}

async function supabaseRequest(path, { method = "GET", body, prefer } = {}) {
  const cfg = supabaseConfig();
  if (!cfg) return { ok: false, skipped: true, error: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: prefer || "return=representation",
      },
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const hint =
        res.status === 404
          ? "missing table public.orders — run supabase/schema.sql"
          : typeof data === "object"
            ? data?.message || data?.hint || data?.error
            : String(data || "").slice(0, 200);
      return { ok: false, error: hint || `supabase_http_${res.status}`, status: res.status };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "supabase_failed" };
  } finally {
    clearTimeout(timer);
  }
}

function payloadFromOrder(order, patch = {}) {
  const confirm = normalizeConfirm(patch.confirm ?? order.confirm ?? "no");
  const orderDate = patch.order_date || order.order_date || order.created_at || new Date().toISOString();
  const kvStatus = patch.status || order.status;
  return {
    order_id: String(order.order_id || "").trim().toUpperCase(),
    phone: String(patch.phone ?? order.phone ?? "").slice(0, 40),
    name: String(patch.name ?? order.customer_name ?? order.name ?? "").slice(0, 120),
    order_date: orderDate,
    exp_date: patch.exp_date || order.exp_date || addDaysIso(orderDate, ACCESS_DAYS),
    confirm,
    status: rowStatus(confirm, kvStatus),
    updated_at: new Date().toISOString(),
  };
}

export async function getSupabaseOrder(orderId) {
  const id = String(orderId || "").trim().toUpperCase();
  if (!id || !isSupabaseConfigured()) return null;
  const result = await supabaseRequest(
    `${TABLE}?order_id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null;
  return mapRow(result.data[0]);
}

export async function getLatestSupabaseOrderByPhone(phone) {
  const value = String(phone || "").trim();
  if (!value || !isSupabaseConfigured()) return null;
  const result = await supabaseRequest(
    `${TABLE}?phone=eq.${encodeURIComponent(value)}&select=*&order=order_date.desc&limit=1`,
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null;
  return mapRow(result.data[0]);
}

/**
 * Insert or merge the order row (phone, name, dates, confirm).
 */
export async function upsertSupabaseOrder(order, patch = {}) {
  if (!isSupabaseConfigured()) return { ok: false, skipped: true, error: "not_configured" };
  const payload = payloadFromOrder(order, patch);
  if (!payload.order_id) return { ok: false, error: "missing_order_id" };

  const result = await supabaseRequest(`${TABLE}?on_conflict=order_id`, {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: payload,
  });
  if (!result.ok) {
    console.error("[quickcv] supabase upsert failed:", result.error);
    return result;
  }
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return { ok: true, row: mapRow(row) || payload };
}

/**
 * Telegram Yes/No → update the matching order row.
 * Match order_id first, then phone if the snapshot has it.
 */
export async function setSupabaseConfirm(order, confirmRaw) {
  const confirm = normalizeConfirm(confirmRaw);
  const orderId = String(order?.order_id || "").trim().toUpperCase();
  const phone = String(order?.phone || "").trim();

  let existing = orderId ? await getSupabaseOrder(orderId) : null;
  if (!existing && phone) existing = await getLatestSupabaseOrderByPhone(phone);

  const base = existing
    ? {
        ...existing,
        customer_name: existing.name,
        order_id: existing.order_id || orderId,
        phone: existing.phone || phone,
      }
    : order;

  const kvStatus = confirm === "yes" ? "approved" : "rejected";
  return upsertSupabaseOrder(
    { ...order, ...base, order_id: base.order_id || orderId },
    {
      confirm,
      status: kvStatus,
      phone: phone || base.phone,
      name: order?.customer_name || order?.name || base.name,
    },
  );
}
