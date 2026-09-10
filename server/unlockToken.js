import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TOKEN_TTL_MS = 30 * 60 * 1000;

let bootSecret = "";

export function getSigningSecret() {
  const fromEnv = process.env.PAYMENT_TOKEN_SECRET || process.env.OPENAI_API_KEY;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  if (!bootSecret) bootSecret = randomBytes(32).toString("hex");
  return bootSecret;
}

export function signUnlockToken() {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUnlockToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}
