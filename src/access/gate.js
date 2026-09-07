import { isValidAccessCode } from "../config/accessCodes.js";

export const UNLOCK_STORAGE_KEY = "quickcv.highResUnlocked";
export const WRONG_CODE_MSG = "קוד שגוי! נא לבדוק את הקוד שסופק לאחר התשלום ב-Bit";

export function isUnlocked() {
  try {
    return localStorage.getItem(UNLOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock() {
  try {
    localStorage.setItem(UNLOCK_STORAGE_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function validateCode(input) {
  return String(input || "").trim() === "1009" && isValidAccessCode(input);
}
