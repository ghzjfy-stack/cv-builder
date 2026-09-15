/**
 * Order persistence without mandatory Vercel KV.
 * Prefer remote KV when configured; otherwise use process memory + /tmp mirror
 * so Telegram approve and client poll can share state on the same instance.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { kvGet, kvIsRemote, kvSet, kvSetNx } from "./kv.js";

const memory = new Map();
const TMP_FILE = path.join("/tmp", "quickcv-manual-orders.json");
let tmpCache = null;
let tmpWriteChain = Promise.resolve();

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

async function readTmpFile() {
  if (tmpCache) return tmpCache;
  try {
    const raw = await fs.readFile(TMP_FILE, "utf8");
    const parsed = JSON.parse(raw);
    tmpCache = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    tmpCache = {};
  }
  return tmpCache;
}

async function writeTmpFile(next) {
  tmpCache = next;
  tmpWriteChain = tmpWriteChain.then(async () => {
    try {
      await fs.writeFile(TMP_FILE, JSON.stringify(next), "utf8");
    } catch (err) {
      console.warn("[quickcv] /tmp order mirror write failed:", err?.message || err);
    }
  });
  return tmpWriteChain;
}

async function tmpGet(key) {
  const all = await readTmpFile();
  const row = all[key];
  if (!row) return null;
  if (row.exp && Date.now() > row.exp) {
    delete all[key];
    await writeTmpFile(all);
    return null;
  }
  return row.value ?? null;
}

async function tmpSet(key, value, ttlSec) {
  const all = await readTmpFile();
  all[key] = {
    value,
    exp: ttlSec ? Date.now() + ttlSec * 1000 : 0,
  };
  await writeTmpFile(all);
  return true;
}

async function tmpSetNx(key, value, ttlSec) {
  const existing = await tmpGet(key);
  if (existing != null) return false;
  if (memoryGet(key) != null) return false;
  memorySet(key, value, ttlSec);
  await tmpSet(key, value, ttlSec);
  return true;
}

export function orderStorageMode() {
  return kvIsRemote() ? "kv" : "memory";
}

export async function orderGet(key) {
  if (kvIsRemote()) {
    try {
      const remote = await kvGet(key);
      if (remote != null) {
        memorySet(key, remote, 24 * 3600);
        return remote;
      }
    } catch (err) {
      console.warn("[quickcv] KV get failed, using local store:", err?.message || err);
    }
  }
  const local = memoryGet(key);
  if (local != null) return local;
  return tmpGet(key);
}

export async function orderSet(key, value, ttlSec) {
  memorySet(key, value, ttlSec);
  await tmpSet(key, value, ttlSec).catch(() => {});
  if (kvIsRemote()) {
    try {
      await kvSet(key, value, ttlSec);
    } catch (err) {
      console.warn("[quickcv] KV set failed, kept local store:", err?.message || err);
    }
  }
  return true;
}

export async function orderSetNx(key, value, ttlSec) {
  if (kvIsRemote()) {
    try {
      const ok = await kvSetNx(key, value, ttlSec);
      if (ok) {
        memorySet(key, value, ttlSec);
        await tmpSet(key, value, ttlSec).catch(() => {});
      }
      return ok;
    } catch (err) {
      console.warn("[quickcv] KV setNx failed, using local store:", err?.message || err);
    }
  }
  return tmpSetNx(key, value, ttlSec);
}

/** No-op — KV is optional. Kept for call-site compatibility. */
export function assertKvReadyForOrders() {
  /* intentionally empty */
}
