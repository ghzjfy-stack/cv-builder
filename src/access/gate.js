import { isValidAccessCode } from "../config/accessCodes.js";

export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const WRONG_CODE_MSG = "קוד שגוי! נא לבדוק את הקוד שסופק לאחר התשלום ב-Bit";

function storage() {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function isUnlocked() {
  try {
    return storage()?.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock() {
  try {
    storage()?.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode */
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
