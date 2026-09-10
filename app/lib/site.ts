export const SITE_NAME = "QuickCV";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://quickcv.app").replace(/\/$/, "");

export function absUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${suffix}`;
}
