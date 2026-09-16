"""One-off local/prod order + env check. Do not print secret values."""

from __future__ import annotations

import json
import os
import re
import ssl
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
ENV_LOCAL_PATH = ROOT / ".env.local"
CTX = ssl.create_default_context()


def parse_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        out[key.strip()] = value
    return out


def env_presence(keys: dict[str, str], name: str) -> str:
    val = (keys.get(name) or "").strip()
    if not val:
        return f"{name}: missing_or_empty"
    placeholder = "xxxx" in val or val.endswith("your-key-here")
    return f"{name}: present empty=False placeholder={placeholder} len={len(val)}"


def fetch(url: str, method: str = "GET", data: bytes | None = None, headers: dict | None = None, timeout: int = 30):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, context=CTX, timeout=timeout) as res:
            return res.status, dict(res.headers), res.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def summarize_env() -> dict[str, str]:
    merged = {}
    merged.update(parse_env(ENV_PATH))
    merged.update(parse_env(ENV_LOCAL_PATH))
    return merged


def upsert_env_keys(path: Path, updates: dict[str, str]) -> list[str]:
    """Insert or replace keys while keeping all other lines intact."""
    original = path.read_text(encoding="utf-8") if path.exists() else ""
    lines = original.splitlines()
    changed: list[str] = []
    seen: set[str] = set()
    new_lines: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key in updates:
                new_lines.append(f"{key}={updates[key]}")
                seen.add(key)
                changed.append(key)
                continue
        new_lines.append(line)
    missing = [k for k in updates if k not in seen]
    if missing:
        if new_lines and new_lines[-1].strip():
            new_lines.append("")
        new_lines.append("# Supabase — order rows (server only)")
        for key in missing:
            new_lines.append(f"{key}={updates[key]}")
            changed.append(key)
    text = "\n".join(new_lines)
    if not text.endswith("\n"):
        text += "\n"
    path.write_text(text, encoding="utf-8")
    return changed


def inspect_production_html():
    status, headers, body = fetch("https://quickcv.app/")
    text = body.decode("utf-8", "ignore")
    csp = headers.get("Content-Security-Policy") or headers.get("content-security-policy") or ""
    print("HOME_STATUS", status)
    print("CSP_HAS_SUPABASE", "supabase" in csp.lower())
    print("HTML_HAS_SUPABASE", "supabase.co" in text.lower())
    srcs = re.findall(r'src=["\']([^"\']+)["\']', text)
    print("SCRIPT_COUNT", len(srcs))
    found_urls = set()
    for src in srcs:
        if src.startswith("/"):
            url = "https://quickcv.app" + src
        elif src.startswith("http"):
            url = src
        else:
            continue
        if not re.search(r"\.(js|mjs)(\?|$)", src):
            continue
        st, _, js = fetch(url)
        js_text = js.decode("utf-8", "ignore")
        hits = re.findall(r"https://[a-z0-9-]+\.supabase\.co", js_text)
        if hits:
            found_urls.update(hits)
        print("JS", st, src, "supabase_hits", len(hits), "size", len(js))
    print("FOUND_SUPABASE_URLS", len(found_urls))
    return found_urls


def create_order(base: str, contact: str, name: str) -> dict:
    payload = json.dumps(
        {
            "pack": "basic",
            "contact": contact,
            "payment_method": "bit",
            "customer_name": name,
        }
    ).encode("utf-8")
    status, _, body = fetch(
        f"{base}/api/order-session",
        method="POST",
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        timeout=45,
    )
    text = body.decode("utf-8", "ignore")
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {"raw": text[:300]}
    print("ORDER_HTTP", status)
    print("ORDER_OK", data.get("ok"))
    print("ORDER_ID", data.get("order_id"))
    print("ORDER_STATUS", data.get("status"))
    print("TELEGRAM_SENT", data.get("telegram_sent"))
    print("STORAGE", data.get("storage"))
    if data.get("error"):
        print("ORDER_ERROR", data.get("error"))
    return data


def get_order_status(base: str, order_id: str) -> dict:
    status, _, body = fetch(
        f"{base}/api/order-status?order={order_id}",
        headers={"Accept": "application/json"},
        timeout=30,
    )
    data = json.loads(body.decode("utf-8", "ignore"))
    print("STATUS_HTTP", status)
    print("STATUS_BODY_KEYS", sorted(data.keys()))
    print("STATUS_ORDER", data.get("order_id"))
    print("STATUS_STATUS", data.get("status"))
    print("STATUS_CONFIRM", data.get("confirm"))
    print("STATUS_PAID", data.get("paid"))
    return data


def supabase_get(url: str, key: str, order_id: str) -> dict | None:
    api = url.rstrip("/") + f"/rest/v1/orders?order_id=eq.{order_id}&select=*"
    status, _, body = fetch(
        api,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
        },
        timeout=20,
    )
    text = body.decode("utf-8", "ignore")
    print("SUPABASE_HTTP", status)
    if status == 404:
        print("SUPABASE_HINT missing table public.orders — run supabase/schema.sql")
        print("SUPABASE_BODY", text[:200])
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        print("SUPABASE_BODY", text[:200])
        return None
    if isinstance(data, list) and data:
        row = data[0]
        print("SUPABASE_ORDER_ID", row.get("order_id"))
        print("SUPABASE_CONFIRM", row.get("confirm"))
        print("SUPABASE_STATUS", row.get("status"))
        print("SUPABASE_NAME", bool(row.get("name")))
        print("SUPABASE_PHONE", bool(row.get("phone")))
        print("SUPABASE_ORDER_DATE", row.get("order_date"))
        print("SUPABASE_EXP_DATE", row.get("exp_date"))
        if row.get("order_date") and row.get("exp_date"):
            try:
                start = datetime.fromisoformat(str(row["order_date"]).replace("Z", "+00:00"))
                exp = datetime.fromisoformat(str(row["exp_date"]).replace("Z", "+00:00"))
                days = (exp - start).total_seconds() / 86400
                print("SUPABASE_EXP_DAYS", round(days, 2))
            except Exception as exc:
                print("SUPABASE_EXP_PARSE_ERROR", type(exc).__name__)
        return row
    print("SUPABASE_NO_ROW", data if not isinstance(data, list) else "empty_list")
    return None


def telegram_bot_ok(token: str) -> None:
    status, _, body = fetch(f"https://api.telegram.org/bot{token}/getMe", timeout=20)
    data = json.loads(body.decode("utf-8", "ignore"))
    print("TELEGRAM_GETME_HTTP", status)
    print("TELEGRAM_GETME_OK", data.get("ok"))
    print("TELEGRAM_BOT_USERNAME", (data.get("result") or {}).get("username"))


def main() -> None:
    mode = (os.environ.get("QC_CHECK_MODE") or "inspect").strip().lower()
    env = summarize_env()
    print("MODE", mode)
    print("ENV_FILE_EXISTS", ENV_PATH.exists())
    print("ENV_LOCAL_EXISTS", ENV_LOCAL_PATH.exists())
    for name in (
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_KEY",
        "TELEGRAM_BOT_TOKEN",
        "TELEGRAM_CHAT_ID",
    ):
        print(env_presence(env, name))

    if mode == "inspect":
        inspect_production_html()
        return

    supabase_url = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL") or "").strip()
    supabase_key = (env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_KEY") or "").strip()
    token = (env.get("TELEGRAM_BOT_TOKEN") or "").strip()
    if token:
        telegram_bot_ok(token)

    base = (os.environ.get("QC_ORDER_BASE") or "http://127.0.0.1:5173").rstrip("/")
    contact = "0509988771"
    name = "Local Env Test"
    data = create_order(base, contact, name)
    order_id = str(data.get("order_id") or "")
    if order_id:
        get_order_status(base, order_id)
        if supabase_url and supabase_key:
            supabase_get(supabase_url, supabase_key, order_id)
        else:
            print("SUPABASE_SKIPPED_LOCAL_ENV_EMPTY")


if __name__ == "__main__":
    main()
