import { isValidAccessCode } from "../config/accessCodes";

export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const WRONG_CODE_MSG = "קוד שגוי! נא לבדוק את הקוד שסופק לאחר התשלום ב-Bit";

function storage(): Storage | null {
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}

export function isUnlocked(): boolean {
  try {
    return storage()?.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock(): void {
  try {
    storage()?.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode */
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
