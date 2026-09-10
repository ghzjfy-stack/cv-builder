import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseEnvFile(file) {
  /** @type {Record<string, string>} */
  const parsed = {};
  if (!existsSync(file)) return parsed;
  const text = readFileSync(file, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) parsed[key] = value;
  }
  return parsed;
}

/**
 * Load `.env` then `.env.local` into process.env.
 * `.env.local` overrides `.env`. Existing process.env values are not overridden.
 */
export function loadEnv(cwd = process.cwd()) {
  const fromFiles = {
    ...parseEnvFile(resolve(cwd, ".env")),
    ...parseEnvFile(resolve(cwd, ".env.local")),
  };
  for (const [key, value] of Object.entries(fromFiles)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
