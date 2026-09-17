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

/** Poll every 3s until PAID (or abort / timeout). */
export async function waitForManualOrderPaid(
  orderId: string,
  options: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number } = {},
): Promise<ManualOrderStatusResponse> {
  const intervalMs = Math.max(1000, options.intervalMs || 3000);
  const timeoutMs = Math.max(intervalMs, options.timeoutMs || 20 * 60 * 1000);
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (options.signal?.aborted) {
      return { ok: false, paid: false, error: "cancelled" };
    }
    const status = await fetchManualOrderStatus(orderId);
    if (status.paid === true && status.token) return status;
    // Soft-wait on missing/pending — never break the UX for storage lag.
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
    await new Promise((resolve) => {
      const timer = window.setTimeout(resolve, intervalMs);
      options.signal?.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timer);
          resolve(undefined);
        },
        { once: true },
      );
    });
  }
  return { ok: false, paid: false, error: "לא קיבלנו אישור בזמן. אם שילמתם, פנו אלינו." };
}
