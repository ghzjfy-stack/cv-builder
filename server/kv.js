/**
 * KV adapter for Vercel KV / Upstash Redis REST.
 * Falls back to in-memory storage for local `vite` / `node server`.
 */

const memory = new Map();

function restConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

function memoryGet(key) {
  const row = memory.get(key);
  if (!row) return null;
  if (row.exp && Date.now() > row.exp) {
    memory.delete(key);
    return null;
  }
  return row.value;
}

function memorySet(key, value, ttlSec) {
  memory.set(key, {
    value,
    exp: ttlSec ? Date.now() + ttlSec * 1000 : 0,
  });
}

async function restCommand(cfg, command) {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error("kv_error");
    err.code = "KV_ERROR";
    err.status = res.status;
    throw err;
  }
  return data;
}

function encode(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function decode(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function kvGet(key) {
  const cfg = restConfig();
  if (!cfg) return memoryGet(key);
  const data = await restCommand(cfg, ["GET", key]);
  return decode(data?.result);
}

export async function kvSet(key, value, ttlSec) {
  const cfg = restConfig();
  if (!cfg) {
    memorySet(key, value, ttlSec);
    return true;
  }
  const command = ttlSec
    ? ["SET", key, encode(value), "EX", String(ttlSec)]
    : ["SET", key, encode(value)];
  await restCommand(cfg, command);
  return true;
}

export async function kvDel(key) {
  const cfg = restConfig();
  if (!cfg) {
    memory.delete(key);
    return;
  }
  await restCommand(cfg, ["DEL", key]);
}

/** Returns true if the key was set (did not already exist). */
export async function kvSetNx(key, value, ttlSec) {
  const cfg = restConfig();
  if (!cfg) {
    if (memoryGet(key) != null) return false;
    memorySet(key, value, ttlSec);
    return true;
  }
  const command = ttlSec
    ? ["SET", key, encode(value), "EX", String(ttlSec), "NX"]
    : ["SET", key, encode(value), "NX"];
  const data = await restCommand(cfg, command);
  return data?.result === "OK";
}

/** Atomically increment a numeric key. Creates the key at 0 if missing. */
export async function kvIncr(key) {
  const cfg = restConfig();
  if (!cfg) {
    const current = Number(memoryGet(key) || 0);
    const next = (Number.isFinite(current) ? current : 0) + 1;
    memorySet(key, next);
    return next;
  }
  const data = await restCommand(cfg, ["INCR", key]);
  const next = Number(data?.result);
  if (!Number.isFinite(next)) {
    const err = new Error("kv_incr_error");
    err.code = "KV_ERROR";
    throw err;
  }
  return next;
}

export function kvIsRemote() {
  return Boolean(restConfig());
}
