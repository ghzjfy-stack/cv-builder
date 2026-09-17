import { SUPABASE_ANON_KEY, SUPABASE_PUBLIC_URL } from "../config/supabasePublic.js";

export type ManualOrderSessionResponse = {
  ok?: boolean;
  order_id?: string;
  status?: string;
  amount_ils?: number;
  pack?: string;
  telegram_sent?: boolean;
  error?: string;
};

export type ManualOrderStatusResponse = {
  ok?: boolean;
  order_id?: string;
  status?: string;
  paid?: boolean;
  confirm?: string;
  token?: string;
  error?: string;
};

const FAIL_CREATE = "לא הצלחנו לפתוח הזמנה. נסו שוב.";
const FAIL_STATUS = "עדיין ממתינים לאישור התשלום.";
const POLL_MS = 2000;

/** Exact status strings written after Telegram Yes. */
const APPROVED_STATUSES = new Set(["paid", "approved", "confirmed"]);

export function isExactApprovedStatus(status?: string | null): boolean {
  return APPROVED_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function isManualOrderApproved(status: ManualOrderStatusResponse, expectedOrderId?: string): boolean {
  const expected = String(expectedOrderId || "").trim().toUpperCase();
  const got = String(status.order_id || "").trim().toUpperCase();
  if (expected && got && got !== expected) return false;
  if (status.paid === true) return true;
  if (isExactApprovedStatus(status.status)) return true;
  const confirm = String(status.confirm || "").trim().toLowerCase();
  return confirm === "yes";
}

export async function createManualOrderSession(input: {
  pack: string;
  contact?: string;
  paymentMethod: "bit" | "paybox";
  customerName?: string;
  amountIls?: number;
  orderId?: string;
}): Promise<ManualOrderSessionResponse> {
  const payload = {
    pack: input.pack,
    contact: String(input.contact || "").trim(),
    payment_method: input.paymentMethod,
    customer_name: String(input.customerName || "").trim(),
    amount_ils: input.amountIls,
    order_id: String(input.orderId || "").trim(),
  };
  const tryNotify = async (url: string) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  let res;
  try {
    res = await tryNotify("/api/telegram-notify");
    if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 501)) {
      res = await tryNotify("/api/order-session");
    }
  } catch {
    try {
      res = await tryNotify("/api/order-session");
    } catch {
      return { ok: false, error: FAIL_CREATE };
    }
  }
  let data: ManualOrderSessionResponse | null = null;
  try {
    data = (await res.json()) as ManualOrderSessionResponse;
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: FAIL_CREATE };
  }
  if (res.status === 429) {
    return { ok: false, error: data.error || "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." };
  }
  if (!res.ok || data.ok !== true || !data.order_id) {
    return { ok: false, error: data.error || FAIL_CREATE };
  }
  return data;
}

export async function fetchManualOrderStatus(orderId: string): Promise<ManualOrderStatusResponse> {
  const id = String(orderId || "").trim().toUpperCase();
  if (!id) return { ok: false, paid: false, error: FAIL_STATUS };
  const res = await fetch(`/api/order-status?order=${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  let data: ManualOrderStatusResponse | null = null;
  try {
    data = (await res.json()) as ManualOrderStatusResponse;
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") {
    return { ok: false, paid: false, error: FAIL_STATUS };
  }
  return data;
}

async function fetchSupabaseOrderStatus(orderId: string): Promise<ManualOrderStatusResponse | null> {
  const id = String(orderId || "").trim().toUpperCase();
  const url = String(SUPABASE_PUBLIC_URL || "").replace(/\/$/, "");
  const key = String(SUPABASE_ANON_KEY || "").trim();
  if (!id || !url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(id)}&select=order_id,status,confirm,exp_date&limit=1`,
      {
        method: "GET",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      order_id?: string;
      status?: string;
      confirm?: string;
      exp_date?: string;
    }>;
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.order_id) return null;
    const expired = row.exp_date && Number.isFinite(Date.parse(row.exp_date)) && Date.parse(row.exp_date) <= Date.now();
    const approved = isExactApprovedStatus(row.status) || String(row.confirm || "").toLowerCase() === "yes";
    if (expired && approved) {
      return { ok: true, order_id: String(row.order_id).toUpperCase(), status: "EXPIRED", paid: false, confirm: "yes" };
    }
    if (String(row.status || "").toLowerCase() === "rejected") {
      return { ok: true, order_id: String(row.order_id).toUpperCase(), status: "CANCELLED", paid: false, confirm: "no" };
    }
    return {
      ok: true,
      order_id: String(row.order_id).toUpperCase(),
      status: String(row.status || "pending"),
      paid: approved,
      confirm: approved ? "yes" : String(row.confirm || "no"),
    };
  } catch {
    return null;
  }
}

async function fetchCombinedOrderStatus(orderId: string): Promise<ManualOrderStatusResponse> {
  const id = String(orderId || "").trim().toUpperCase();
  const [api, supabase] = await Promise.all([
    fetchManualOrderStatus(id).catch(() => ({ ok: false, paid: false, error: FAIL_STATUS }) as ManualOrderStatusResponse),
    fetchSupabaseOrderStatus(id),
  ]);
  if (isManualOrderApproved(api, id)) return { ...api, paid: true, order_id: api.order_id || id };
  if (supabase && isManualOrderApproved(supabase, id)) {
    return { ...api, ...supabase, paid: true, token: api.token, order_id: id };
  }
  if (supabase?.status === "CANCELLED" || api.status === "CANCELLED") {
    return { ok: true, order_id: id, status: "CANCELLED", paid: false };
  }
  if (supabase?.status === "EXPIRED" || api.status === "EXPIRED") {
    return { ok: true, order_id: id, status: "EXPIRED", paid: false, confirm: "yes" };
  }
  return { ...api, order_id: api.order_id || id };
}

/** Poll every 2s until paid/approved/confirmed for this exact order_id. */
export async function waitForManualOrderPaid(
  orderId: string,
  options: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number } = {},
): Promise<ManualOrderStatusResponse> {
  const id = String(orderId || "").trim().toUpperCase();
  const intervalMs = Math.max(1000, options.intervalMs || POLL_MS);
  const timeoutMs = Math.max(intervalMs, options.timeoutMs || 20 * 60 * 1000);
  const started = Date.now();

  const sleepUntilWake = () =>
    new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        document.removeEventListener("visibilitychange", onWake);
        window.removeEventListener("focus", onWake);
        window.removeEventListener("pageshow", onWake);
        options.signal?.removeEventListener("abort", finish);
        resolve(undefined);
      };
      const onWake = () => {
        if (document.visibilityState === "hidden") return;
        finish();
      };
      const timer = window.setTimeout(finish, intervalMs);
      document.addEventListener("visibilitychange", onWake);
      window.addEventListener("focus", onWake);
      window.addEventListener("pageshow", onWake);
      options.signal?.addEventListener("abort", finish, { once: true });
    });

  while (Date.now() - started < timeoutMs) {
    if (options.signal?.aborted) {
      return { ok: false, paid: false, error: "cancelled" };
    }
    const status = await fetchCombinedOrderStatus(id);
    if (isManualOrderApproved(status, id)) {
      return { ...status, paid: true, order_id: id };
    }
    if (status.status === "CANCELLED") {
      return { ok: false, paid: false, status: "CANCELLED", error: "ההזמנה בוטלה." };
    }
    if (status.status === "EXPIRED") {
      return {
        ok: false,
        paid: false,
        status: "EXPIRED",
        error: "פג תוקף הגישה. יש לבצע הזמנה חדשה.",
      };
    }
    await sleepUntilWake();
  }
  return { ok: false, paid: false, error: "לא קיבלנו אישור בזמן. אם שילמתם, פנו אלינו." };
}
