import { isValidAccessCode } from "../config/accessCodes";

export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const WRONG_CODE_MSG = "קוד שגוי! נא לבדוק את הקוד שסופק לאחר התשלום ב-Bit";

export function isUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock(): void {
  try {
    localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function validateCode(input: string): boolean {
  return String(input || "").trim() === "1009" && isValidAccessCode(input);
}
