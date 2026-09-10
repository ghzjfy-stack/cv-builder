const DEFAULT_RATE_MAX = 8;
const DEFAULT_RATE_WINDOW_MS = 10 * 60 * 1000;

/** @type {Map<string, number[]>} */
const rateBuckets = new Map();

export function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export function rateLimited(ip, max = DEFAULT_RATE_MAX, windowMs = DEFAULT_RATE_WINDOW_MS) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

export function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(payload);
}

export function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) {
      if (Buffer.isBuffer(req.body)) {
        resolve(req.body);
        return;
      }
      if (typeof req.body === "string") {
        resolve(Buffer.from(req.body, "utf8"));
        return;
      }
      if (typeof req.body === "object") {
        resolve(Buffer.from(JSON.stringify(req.body), "utf8"));
        return;
      }
      resolve(null);
      return;
    }
    if (req.readableEnded || req.complete) {
      resolve(Buffer.alloc(0));
      return;
    }
    const chunks = [];
    let size = 0;
    const timer = setTimeout(() => {
      reject(Object.assign(new Error("body_timeout"), { code: "BODY_TIMEOUT" }));
    }, 20000);
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        clearTimeout(timer);
        reject(Object.assign(new Error("payload_too_large"), { code: "PAYLOAD_TOO_LARGE" }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
    req.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function parseBody(raw, contentType) {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw || "");
  const type = String(contentType || "").toLowerCase();
  if (!text.trim()) return {};
  if (type.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
