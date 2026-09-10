import { createHash, randomInt } from "node:crypto";
import { getSigningSecret } from "./unlockToken.js";
import { kvDel, kvGet, kvSet, kvSetNx } from "./kv.js";

const DEFAULT_TTL_SEC = 30 * 24 * 60 * 60;
const CODE_TTL_SEC = () => Math.max(60, Number(process.env.CODE_TTL_SECONDS || DEFAULT_TTL_SEC));
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function hashCode(code) {
  return createHash("sha256")
    .update(`${getSigningSecret()}:${normalizeRedemptionCode(code)}`)
    .digest("hex");
}

export function generateSixDigitCode() {
  return String(randomInt(100000, 1000000));
}

/** 6-character alphanumeric code (ambiguous 0/O/1/I omitted). */
export function generateRedemptionCode() {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

export function normalizeRedemptionCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function codeKey(hash) {
  return `qc:code:${hash}`;
}

function txKey(provider, txId) {
  return `qc:tx:${provider}:${txId}`;
}

function usedKey(hash) {
  return `qc:used:${hash}`;
}

export function normalizeContact(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return raw.toLowerCase();
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = `972${digits.slice(1)}`;
  if (digits.startsWith("972")) return digits;
  return digits;
}

export async function issuePaidCode({
  userPhone = "",
  userEmail = "",
  provider = "unknown",
  transactionId = "",
  sessionId = "",
}) {
  const ttl = CODE_TTL_SEC();
  const providerId = String(provider || "unknown").slice(0, 40);
  const txId = String(transactionId || "").slice(0, 120);
  const phone = normalizeContact(userPhone);
  const email = normalizeContact(userEmail);

  if (txId) {
    const existingHash = await kvGet(txKey(providerId, txId));
    if (typeof existingHash === "string" && existingHash) {
      const existing = await kvGet(codeKey(existingHash));
      if (existing && existing.is_used) {
        return { reused: true, alreadyUsed: true, record: existing, code: null };
      }
      if (existingHash) await kvDel(codeKey(existingHash));
    }
  }

  const code = generateRedemptionCode();
  const codeHash = hashCode(code);
  const now = Date.now();
  const record = {
    code_hash: codeHash,
    user_phone: phone || "",
    user_email: email || "",
    is_paid: true,
    is_used: false,
    status: "active",
    expires_at: new Date(now + ttl * 1000).toISOString(),
    provider: providerId,
    transaction_id: txId,
    session_id: String(sessionId || "").slice(0, 80),
    created_at: new Date(now).toISOString(),
  };

  await kvSet(codeKey(codeHash), record, ttl);
  if (txId) await kvSet(txKey(providerId, txId), codeHash, ttl);

  return { reused: false, alreadyUsed: false, record, code };
}

export async function consumeCode(rawCode, contact = "") {
  const code = normalizeRedemptionCode(rawCode);
  if (code.length !== 6) {
    return { ok: false, reason: "invalid" };
  }

  const codeHash = hashCode(code);
  const record = await kvGet(codeKey(codeHash));
  if (!record || typeof record !== "object") {
    return { ok: false, reason: "invalid" };
  }
  if (!record.is_paid) {
    return { ok: false, reason: "invalid" };
  }
  if (record.is_used) {
    return { ok: false, reason: "used" };
  }
  const exp = Date.parse(record.expires_at);
  if (!Number.isFinite(exp) || exp <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const expectedContact = record.user_phone || record.user_email || "";
  const given = normalizeContact(contact);
  if (process.env.VERIFY_REQUIRE_CONTACT === "1" && given && expectedContact && given !== expectedContact) {
    return { ok: false, reason: "contact" };
  }

  const marked = await kvSetNx(usedKey(codeHash), "1", CODE_TTL_SEC());
  if (!marked) {
    return { ok: false, reason: "used" };
  }

  const usedRecord = {
    ...record,
    is_used: true,
    status: "used",
    used_at: new Date().toISOString(),
  };
  const remaining = Math.max(30, Math.floor((exp - Date.now()) / 1000));
  await kvSet(codeKey(codeHash), usedRecord, remaining);
  return { ok: true, record: usedRecord };
}
