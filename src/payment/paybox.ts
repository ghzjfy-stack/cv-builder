export type PayboxMethod = "paybox" | "card";

export type PayboxSessionResponse = {
  ok?: boolean;
  session_id?: string;
  status?: string;
  amount_ils?: number;
  expires_at?: string;
  pay_url?: string;
  method?: PayboxMethod;
  error?: string;
};

export type PayboxStatusResponse = {
  ok?: boolean;
  paid?: boolean;
  status?: string;
  token?: string;
  error?: string;
  download?: {
    authorized?: boolean;
    mode?: string;
  };
};

const FAIL_SESSION = "לא הצלחנו לפתוח תשלום PayBox. נסו שוב בעוד רגע.";
const FAIL_STATUS = "עדיין לא קיבלנו אישור תשלום. השלימו את התשלום ב-PayBox.";

export async function createPayboxSession(input: {
  pack: string;
  contact?: string;
  method: PayboxMethod;
}): Promise<PayboxSessionResponse> {
  const res = await fetch("/api/paybox-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pack: input.pack,
      contact: String(input.contact || "").trim(),
      method: input.method,
    }),
  });
  let data: PayboxSessionResponse | null = null;
  try {
    data = (await res.json()) as PayboxSessionResponse;
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: FAIL_SESSION };
  }
  if (res.status === 429) {
    return { ok: false, error: data.error || "יותר מדי ניסיונות. נסו שוב בעוד כמה דקות." };
  }
  if (!res.ok || data.ok !== true || !data.session_id) {
    return { ok: false, error: data.error || FAIL_SESSION };
  }
  return data;
}

export async function fetchPayboxStatus(sessionId: string): Promise<PayboxStatusResponse> {
  const id = String(sessionId || "").trim();
  if (!id) return { ok: false, paid: false, error: FAIL_STATUS };
  const res = await fetch(`/api/paybox-status?session=${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  let data: PayboxStatusResponse | null = null;
  try {
    data = (await res.json()) as PayboxStatusResponse;
  } catch {
    data = null;
  }
  if (!data || typeof data !== "object") {
    return { ok: false, paid: false, error: FAIL_STATUS };
  }
  return data;
}

export async function waitForPayboxPayment(
  sessionId: string,
  options: { signal?: AbortSignal; intervalMs?: number; timeoutMs?: number } = {},
): Promise<PayboxStatusResponse> {
  const intervalMs = Math.max(1200, options.intervalMs || 2200);
  const timeoutMs = Math.max(intervalMs, options.timeoutMs || 8 * 60 * 1000);
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (options.signal?.aborted) {
      return { ok: false, paid: false, error: "cancelled" };
    }
    const status = await fetchPayboxStatus(sessionId);
    if (status.paid === true && status.token) return status;
    if (status.status === "expired") {
      return { ok: false, paid: false, error: "פג תוקף לסשן התשלום. פתחו שוב את PayBox." };
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
  return { ok: false, paid: false, error: "לא קיבלנו אישור בזמן. אם שילמתם, הזינו את הקוד מההודעה." };
}
