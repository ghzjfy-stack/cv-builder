import { isValidAccessCode } from "../config/accessCodes";

export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const PAYMENT_TOKEN_KEY = "quickcv.paymentToken";
export const WRONG_CODE_MSG = "קוד שגוי! נא לבדוק את הקוד שסופק לאחר התשלום ב-Bit";

let memoryUnlocked = false;

function storage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function isUnlocked(): boolean {
  if (memoryUnlocked) return true;
  try {
    return storage()?.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock(): void {
  memoryUnlocked = true;
  try {
    storage()?.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function unlockWithPaymentToken(token: string): void {
  unlock();
  try {
    if (token) storage()?.setItem(PAYMENT_TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function getPaymentToken(): string | null {
  try {
    return storage()?.getItem(PAYMENT_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function validateCode(input: string): boolean {
  return isValidAccessCode(input);
}

/** Drop leftover localStorage unlocks so a prior visit cannot skip payment. */
export function clearPersistedUnlock(): void {
  try {
    localStorage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
