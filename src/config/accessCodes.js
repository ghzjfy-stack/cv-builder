/** The only valid verification PIN. */
export const VALID_ACCESS_CODE = "1009";

export function isValidAccessCode(input) {
  return String(input || "").trim() === "1009";
}
