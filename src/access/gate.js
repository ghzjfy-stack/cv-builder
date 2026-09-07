import { isValidAccessCode } from "../config/accessCodes.js";

export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const PAYMENT_TOKEN_KEY = "quickcv.paymentToken";
export const WRONG_CODE_MSG = "קוד שגוי! נא לבדוק את הקוד שסופק לאחר התשלום ב-Bit";

let memoryUnlocked = false;

function storage() {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function isUnlocked() {
  if (memoryUnlocked) return true;
  try {
    return storage()?.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock() {
  memoryUnlocked = true;
  try {
    storage()?.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function unlockWithPaymentToken(token) {
  unlock();
  try {
    if (token) storage()?.setItem(PAYMENT_TOKEN_KEY, token);
  } catch {
    /* private mode */
  }
}

export function getPaymentToken() {
  try {
    return storage()?.getItem(PAYMENT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function validateCode(input) {
  return isValidAccessCode(input);
}

/** Drop leftover localStorage unlocks so a prior visit cannot skip payment. */
export function clearPersistedUnlock() {
  try {
    localStorage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
