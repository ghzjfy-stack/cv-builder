export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const PAYMENT_TOKEN_KEY = "quickcv.paymentToken";
/** 24-hour paid session expiry (epoch ms). */
export const PAID_UNTIL_KEY = "quickcv_paid_until";
export const PAID_SESSION_MS = 24 * 60 * 60 * 1000;
export const WRONG_CODE_MSG = "קוד שגוי או שפג תוקפו. בדקו את ההודעה שקיבלתם לאחר התשלום.";

let memoryUnlocked = false;
let memoryPaidUntil = 0;

function localStore(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

function sessionStore(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

function readPaidUntilFromStorage(): number {
  try {
    const raw = localStore()?.getItem(PAID_UNTIL_KEY);
    const until = Number(raw || 0);
    if (Number.isFinite(until) && until > Date.now()) return until;
    if (raw) localStore()?.removeItem(PAID_UNTIL_KEY);
  } catch {
    /* private mode */
  }
  return 0;
}

/** Epoch ms when the paid session ends, or 0 if unpaid/expired. */
export function getPaidUntil(): number {
  if (memoryPaidUntil > Date.now()) return memoryPaidUntil;
  const until = readPaidUntilFromStorage();
  if (until > Date.now()) {
    memoryPaidUntil = until;
    memoryUnlocked = true;
    return until;
  }
  memoryPaidUntil = 0;
  memoryUnlocked = false;
  return 0;
}

export function isUnlocked(): boolean {
  return getPaidUntil() > Date.now();
}

/** Alias for app state: paid within the 24h window. */
export function isPaid(): boolean {
  return isUnlocked();
}

/** Milliseconds remaining in the paid session (0 if expired). */
export function getPaidRemainingMs(): number {
  const until = getPaidUntil();
  if (!until) return 0;
  return Math.max(0, until - Date.now());
}

export function unlock(): void {
  const until = Date.now() + PAID_SESSION_MS;
  memoryUnlocked = true;
  memoryPaidUntil = until;
  try {
    localStore()?.setItem(PAID_UNTIL_KEY, String(until));
    sessionStore()?.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode — memory flag still works this tab */
  }
  try {
    (window as Window & { QCIsPaid?: boolean; QCPaidUntil?: number }).QCIsPaid = true;
    (window as Window & { QCPaidUntil?: number }).QCPaidUntil = until;
  } catch {
    /* ignore */
  }
}

export function unlockWithPaymentToken(token: string): void {
  unlock();
  try {
    if (token) {
      localStore()?.setItem(PAYMENT_TOKEN_KEY, token);
      sessionStore()?.setItem(PAYMENT_TOKEN_KEY, token);
    }
  } catch {
    /* private mode */
  }
}

export function getPaymentToken(): string | null {
  try {
    return localStore()?.getItem(PAYMENT_TOKEN_KEY) || sessionStore()?.getItem(PAYMENT_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Drop expired / legacy unlock keys.
 * A still-valid `quickcv_paid_until` session is kept and restored into memory.
 */
export function clearPersistedUnlock(): void {
  try {
    localStore()?.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const until = readPaidUntilFromStorage();
  if (until > Date.now()) {
    memoryUnlocked = true;
    memoryPaidUntil = until;
    try {
      (window as Window & { QCIsPaid?: boolean; QCPaidUntil?: number }).QCIsPaid = true;
      (window as Window & { QCPaidUntil?: number }).QCPaidUntil = until;
    } catch {
      /* ignore */
    }
    return;
  }
  memoryUnlocked = false;
  memoryPaidUntil = 0;
  try {
    localStore()?.removeItem(PAID_UNTIL_KEY);
    sessionStore()?.removeItem(UNLOCK_STORAGE_KEY);
    (window as Window & { QCIsPaid?: boolean; QCPaidUntil?: number }).QCIsPaid = false;
    (window as Window & { QCPaidUntil?: number }).QCPaidUntil = 0;
  } catch {
    /* ignore */
  }
}
