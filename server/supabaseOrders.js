/**
 * Persist checkout rows in Supabase and use confirm=yes/no as the PDF gate.
 * Service role when available; otherwise signed confirm_manual_order RPC + anon reads.
 */

import { createHmac } from "node:crypto";
import { ORDER_CONFIRM_HMAC_SECRET } from "./orderConfirmSecret.js";

const TABLE = "orders";
const ACCESS_DAYS = 30;
const PUBLIC_URL = "https://ywzylohuyppykhzfscnz.supabase.co";
const PUBLIC_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3enlsb2h1eXBweWtoemZzY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxOTA2NjksImV4cCI6MjEwNDc2NjY2OX0.h1g9JtmB6QTSlbFOPIuB9frDy6YOETArEVkLtkFh3ag";
const PUBLIC_SELECT = "order_id,status,confirm,exp_date";

function envValue(name) {
  try {
    return String(process.env[name] || "").trim();
  } catch {
    return "";
  }
}

function supabaseUrl() {
  return (envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL") || PUBLIC_URL).replace(/\/$/, "");
}

function serviceRoleKey() {
  return envValue("SUPABASE_SERVICE_ROLE_KEY") || envValue("SUPABASE_SERVICE_KEY");
}

function anonKey() {
  return envValue("SUPABASE_ANON_KEY") || envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") || PUBLIC_ANON_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && (serviceRoleKey() || anonKey()));
}

function writeConfig() {
  const url = supabaseUrl();
  const key = serviceRoleKey();
  if (!url || !key) return null;
  return { url, key, role: "service" };
}

function readConfig() {
  const privileged = writeConfig();
  if (privileged) return privileged;
  const url = supabaseUrl();
  const key = anonKey();
  if (!url || !key) return null;
  return { url, key, role: "anon" };
}

function supabaseConfig() {
  return writeConfig() || readConfig();
}

function confirmHmacSecret() {
  return envValue("QC_ORDER_HMAC_SECRET") || ORDER_CONFIRM_HMAC_SECRET;
}

export function confirmManualOrderSignature(orderId, approve) {
  const id = String(orderId || "").trim().toUpperCase();
  const decision = approve ? "yes" : "no";
  return createHmac("sha256", confirmHmacSecret()).update(`${id}:${decision}`).digest("hex");
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

/** Exact Telegram / checkout strings that mean the transfer was approved. */
export function isApprovedPaymentStatus(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  return raw === "paid" || raw === "approved" || raw === "confirmed" || raw === "yes" || raw === "true";
}

export function normalizeConfirm(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (raw === "yes" || raw === "true" || raw === "1" || isApprovedPaymentStatus(raw)) return "yes";
  return "no";
}

function rowStatus(confirm, status) {
  const raw = String(status || "")
    .trim()
    .toLowerCase();
  if (raw === "rejected" || raw === "cancelled") return "rejected";
  if (confirm === "yes" || isApprovedPaymentStatus(status)) {
    if (raw === "paid" || raw === "confirmed" || raw === "approved") return raw;
    return "approved";
  }
  return "pending";
}

function mapRow(row) {
  if (!row || typeof row !== "object") return null;
  const status = String(row.status || "pending");
  const confirm =
    normalizeConfirm(row.confirm) === "yes" || isApprovedPaymentStatus(status) ? "yes" : "no";
  return {
    id: row.id,
    order_id: String(row.order_id || "").trim(),
    phone: String(row.phone || "").trim(),
    name: String(row.name || "").trim(),
    order_date: row.order_date,
    exp_date: row.exp_date,
    confirm,
    status,
    updated_at: row.updated_at,
  };
}

export function isDownloadAllowed(row) {
  const mapped = mapRow(row);
  if (!mapped) return false;
  if (mapped.confirm !== "yes" && !isApprovedPaymentStatus(mapped.status)) return false;
  if (!mapped.exp_date) return true;
  const exp = Date.parse(mapped.exp_date);
  if (!Number.isFinite(exp)) return true;
  return exp > Date.now();
}

export function isAccessExpired(row) {
  const mapped = mapRow(row);
  if (!mapped) return false;
  if (mapped.confirm !== "yes" && !isApprovedPaymentStatus(mapped.status)) return false;
  const exp = Date.parse(mapped.exp_date);
  return Number.isFinite(exp) && exp <= Date.now();
}

export function isRejectedRow(row) {
  const mapped = mapRow(row);
  return Boolean(mapped && mapped.status === "rejected");
}

async function supabaseRequest(path, { method = "GET", body, prefer, cfg } = {}) {
  const auth = cfg || supabaseConfig();
  if (!auth) return { ok: false, skipped: true, error: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${auth.url}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: auth.key,
        Authorization: `Bearer ${auth.key}`,
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
  const cfg = readConfig();
  if (!id || !cfg) return null;
  const select = cfg.role === "anon" ? PUBLIC_SELECT : "*";
  const result = await supabaseRequest(
    `${TABLE}?order_id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`,
    { cfg },
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null;
  return mapRow(result.data[0]);
}

export async function getLatestSupabaseOrderByPhone(phone) {
  const value = String(phone || "").trim();
  const cfg = writeConfig();
  if (!value || !cfg) return null;
  const result = await supabaseRequest(
    `${TABLE}?phone=eq.${encodeURIComponent(value)}&select=*&order=order_date.desc&limit=1`,
    { cfg },
  );
  if (!result.ok || !Array.isArray(result.data) || !result.data[0]) return null;
  return mapRow(result.data[0]);
}

async function confirmViaSignedRpc(order, approve) {
  const url = supabaseUrl();
  const key = anonKey();
  const orderId = String(order?.order_id || "").trim().toUpperCase();
  if (!url || !key || !orderId) return { ok: false, skipped: true, error: "not_configured" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${url}/rest/v1/rpc/confirm_manual_order`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        p_order_id: orderId,
        p_sig: confirmManualOrderSignature(orderId, approve),
        p_approve: Boolean(approve),
        p_phone: String(order?.phone || "").slice(0, 40),
        p_name: String(order?.customer_name || order?.name || "").slice(0, 120),
      }),
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
        typeof data === "object"
          ? data?.message || data?.hint || data?.error
          : String(data || "").slice(0, 200);
      return { ok: false, error: hint || `rpc_http_${res.status}`, status: res.status };
    }
    return { ok: true, row: mapRow(data) || { order_id: orderId, confirm: approve ? "yes" : "no", status: approve ? "approved" : "rejected" }, rpc: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "rpc_failed" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Insert or merge the order row (phone, name, dates, confirm).
 */
export async function upsertSupabaseOrder(order, patch = {}) {
  const payload = payloadFromOrder(order, patch);
  if (!payload.order_id) return { ok: false, error: "missing_order_id" };

  const privileged = writeConfig();
  if (!privileged) {
    if (payload.confirm === "yes" || payload.status === "rejected") {
      return confirmViaSignedRpc(order, payload.confirm === "yes");
    }
    return { ok: false, skipped: true, error: "not_configured" };
  }

  const result = await supabaseRequest(`${TABLE}?on_conflict=order_id`, {
    cfg: privileged,
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: payload,
  });
  if (result.ok) {
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    return { ok: true, row: mapRow(row) || payload };
  }

  const patched = await supabaseRequest(
    `${TABLE}?order_id=eq.${encodeURIComponent(payload.order_id)}`,
    { method: "PATCH", body: payload, prefer: "return=representation", cfg: privileged },
  );
  if (patched.ok) {
    const row = Array.isArray(patched.data) ? patched.data[0] : patched.data;
    return { ok: true, row: mapRow(row) || payload, patched: true };
  }

  const inserted = await supabaseRequest(TABLE, {
    method: "POST",
    prefer: "return=representation",
    body: payload,
    cfg: privileged,
  });
  if (inserted.ok) {
    const row = Array.isArray(inserted.data) ? inserted.data[0] : inserted.data;
    return { ok: true, row: mapRow(row) || payload, inserted: true };
  }

  console.error("[quickcv] supabase upsert failed:", result.error || patched.error || inserted.error);
  return inserted.ok ? inserted : patched.ok ? patched : result;
}

/**
 * Telegram Yes/No → update the matching order row.
 * Match order_id first, then phone if the snapshot has it.
 */
export async function setSupabaseConfirm(order, confirmRaw) {
  const confirm = normalizeConfirm(confirmRaw);
  const orderId = String(order?.order_id || "").trim().toUpperCase();
  const phone = String(order?.phone || "").trim();

  if (!writeConfig()) {
    return confirmViaSignedRpc({ ...order, order_id: orderId, phone }, confirm === "yes");
  }

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
