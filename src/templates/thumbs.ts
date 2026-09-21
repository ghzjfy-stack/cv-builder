import type { CvTemplate } from "../data/templates";

export type ThumbLang = "he" | "en";

export type BadgeKind =
  | "popular"
  | "minimal"
  | "executive"
  | "ats"
  | "modern"
  | "creative"
  | "photo"
  | "sidebar"
  | "student"
  | "healthcare"
  | "finance"
  | "tech"
  | "professional"
  | "compact"
  | "colorful"
  | "split"
  | "academic"
  | "entry"
  | "sales"
  | "legal"
  | "europe"
  | "people"
  | "consulting"
  | "elegant"
  | "timeline"
  | "corporate";

type BadgeSpec = { kind: BadgeKind; he: string; en: string };

const BADGES: Record<string, BadgeSpec> = {
  simple: { kind: "popular", he: "פופולרי", en: "Popular" },
  ink: { kind: "minimal", he: "נקי ומינימליסטי", en: "Minimal" },
  harvard: { kind: "ats", he: "מותאם ל-ATS", en: "ATS Friendly" },
  swiss: { kind: "modern", he: "מודרני", en: "Modern" },
  compact: { kind: "compact", he: "עמוד אחד", en: "One Page" },
  intern: { kind: "student", he: "סטודנט", en: "Student" },
  academic: { kind: "academic", he: "אקדמי", en: "Academic" },
  pearl: { kind: "modern", he: "מודרני", en: "Modern" },
  cobalt: { kind: "tech", he: "הייטק", en: "Tech" },
  "entry-clean": { kind: "entry", he: "כניסה", en: "Entry" },
  "heebo-ats": { kind: "ats", he: "מותאם ל-ATS", en: "ATS Friendly" },
  "assistant-ats": { kind: "minimal", he: "נקי", en: "Soft" },
  "rubik-pro": { kind: "professional", he: "מקצועי", en: "Professional" },
  "finance-ats": { kind: "finance", he: "כספים", en: "Finance" },
  "legal-ats": { kind: "legal", he: "משפטים", en: "Legal" },
  "health-ats": { kind: "healthcare", he: "בריאות", en: "Healthcare" },
  "student-ats": { kind: "student", he: "סטודנט", en: "Student" },
  "mgmt-ats": { kind: "executive", he: "הנהלה", en: "Executive" },
  charcoal: { kind: "photo", he: "עם תמונה", en: "Photo" },
  navy: { kind: "corporate", he: "עסקי", en: "Business" },
  petra: { kind: "timeline", he: "כרונולוגי", en: "Chronological" },
  midnight: { kind: "executive", he: "הנהלה", en: "Executive" },
  emerald: { kind: "colorful", he: "צבעוני", en: "Colorful" },
  azure: { kind: "popular", he: "פופולרי", en: "Popular" },
  mint: { kind: "modern", he: "מודרני", en: "Modern" },
  blush: { kind: "creative", he: "יצירתי", en: "Creative" },
  terracotta: { kind: "creative", he: "יצירתי", en: "Creative" },
  cream: { kind: "elegant", he: "אלגנטי", en: "Elegant" },
  clinic: { kind: "healthcare", he: "בריאות", en: "Healthcare" },
  europass: { kind: "europe", he: "אירופה", en: "Europe" },
  ivory: { kind: "executive", he: "הנהלה", en: "Executive" },
  gold: { kind: "finance", he: "פיננסי", en: "Finance" },
  espresso: { kind: "professional", he: "מקצועי", en: "Professional" },
  sage: { kind: "professional", he: "מקצועי", en: "Professional" },
  slate: { kind: "tech", he: "הייטק", en: "Tech" },
  wine: { kind: "creative", he: "יצירתי", en: "Creative" },
  forest: { kind: "consulting", he: "ייעוץ", en: "Consulting" },
  sand: { kind: "sidebar", he: "עיצוב פנים", en: "Interior" },
  split: { kind: "split", he: "משפטים", en: "Legal" },
  "teal-sidebar": { kind: "sidebar", he: "שירות", en: "Service" },
  "ink-exec": { kind: "executive", he: "הנהלה", en: "Executive" },
  "student-modern": { kind: "student", he: "סטודנט", en: "Student" },
  "dev-navy": { kind: "tech", he: "הייטק", en: "Tech" },
  "sales-azure": { kind: "sales", he: "מכירות", en: "Sales" },
  "creative-split": { kind: "creative", he: "יצירתי", en: "Creative" },
  "entry-mint": { kind: "entry", he: "כניסה", en: "Entry" },
  "product-slate": { kind: "tech", he: "מוצר", en: "Product" },
  "consult-forest": { kind: "consulting", he: "ייעוץ", en: "Consulting" },
  "bank-gold": { kind: "finance", he: "בנקאות", en: "Banking" },
  "nurse-clean": { kind: "healthcare", he: "סיעוד", en: "Nursing" },
  "grad-compact": { kind: "compact", he: "עמוד אחד", en: "One Page" },
  "hr-blush": { kind: "people", he: "משאבי אנוש", en: "People" },
  "ops-midnight": { kind: "executive", he: "הנהלה", en: "Executive" },
  "marketing-wine": { kind: "creative", he: "שיווק", en: "Marketing" },
  "designer-terra": { kind: "creative", he: "עיצוב", en: "Design" },
};

const W = 72;
const H = 96;

function hex(value: string | undefined, fallback: string): string {
  const v = String(value || "").trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ? v : fallback;
}

function salt(id: string): number {
  let n = 2166136261;
  for (let i = 0; i < id.length; i++) {
    n ^= id.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function paperOf(_tpl: CvTemplate): string {
  return "#ffffff";
}

function inkOf(tpl: CvTemplate): string {
  return hex(tpl.colorPalette?.text, "#1c1917");
}

function charcoalTone(tpl: CvTemplate): string {
  switch (tpl.skin) {
    case "espresso":
      return "#3e342c";
    case "sage":
      return "#4d5d52";
    case "slate":
      return "#3e4c58";
    case "wine":
      return "#5a3640";
    case "forest":
      return "#31443b";
    default:
      return hex(tpl.accent, "#4c4c4c");
  }
}

function navyTone(tpl: CvTemplate): string {
  switch (tpl.skin) {
    case "midnight":
      return "#0b1020";
    case "emerald":
      return "#1a3c34";
    default:
      return hex(tpl.accent, "#12192b");
  }
}

function azureHead(tpl: CvTemplate): string {
  if (tpl.id === "europass") return "#1e4b8c";
  if (tpl.id === "clinic") return "#cfe8e4";
  switch (tpl.skin) {
    case "mint":
      return "#d7ece8";
    case "blush":
      return "#ead9d4";
    case "terracotta":
      return "#f0ddd3";
    case "cream":
      return "#f3eadc";
    default:
      return "#dce8f0";
  }
}

function r(x: number, y: number, w: number, h: number, fill: string, extra = ""): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
}

function lines(x: number, y: number, w: number, n: number, gap: number, fill: string, opacity: number, saltN = 0): string {
  let out = "";
  for (let i = 0; i < n; i++) {
    const shorten = (saltN + i * 17) % 5;
    const ww = +(w * (shorten === 0 ? 0.58 : shorten === 1 ? 0.78 : shorten === 2 ? 0.92 : 1)).toFixed(2);
    out += r(x, +(y + i * gap).toFixed(2), ww, 1.35, fill, `rx="0.45" opacity="${opacity}"`);
  }
  return out;
}

function sectionRule(x: number, y: number, w: number, fill: string): string {
  return r(x, y, w, 1.1, fill, `rx="0.4" opacity="0.85"`);
}

function photoCircle(cx: number, cy: number, rad: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}"/>`;
}

function photoSquare(x: number, y: number, size: number, fill: string): string {
  return r(x, y, size, size, fill, `rx="1.2"`);
}

function classicInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number): string {
  const centered = tpl.layout === "classic" || tpl.id === "harvard" || tpl.id === "academic";
  const nameW = centered ? 38 : 44;
  const nameX = centered ? (W - nameW) / 2 : 8;
  const ruleW = centered ? 22 : 28;
  const ruleX = centered ? (W - ruleW) / 2 : 8;
  const dense = tpl.layout === "compact" || tpl.id.includes("compact");
  const gap = dense ? 3.1 : 3.6;
  const bodyY = dense ? 22 : 26;
  const n = dense ? 16 : 12;
  return (
    r(0, 0, W, H, paper) +
    r(nameX, 8, nameW, 4.2, ink, `rx="0.6"`) +
    r(ruleX, 14.4, ruleW, 1.2, accent, `rx="0.4"`) +
    r(centered ? 24 : 8, 17.2, centered ? 24 : 20, 1.6, ink, `rx="0.4" opacity="0.35"`) +
    sectionRule(8, bodyY, 18, accent) +
    lines(8, bodyY + 4, 56, n, gap, ink, 0.22, s)
  );
}

function minimalInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number): string {
  const teal = tpl.accent !== "#1c1917";
  return (
    r(0, 0, W, H, paper) +
    r(16, 10, 40, 3.2, ink, `rx="0.5"`) +
    r(22, 15.4, 28, 1.4, ink, `rx="0.4" opacity="0.32"`) +
    r(26, 19, 20, 0.9, accent, `rx="0.4"`) +
    lines(12, 28, 48, 10, 5.2, ink, teal ? 0.2 : 0.16, s)
  );
}

function modernInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number): string {
  const cobalt = tpl.id === "cobalt";
  const bar = cobalt ? "#1e3a5f" : accent;
  return (
    r(0, 0, W, H, paper) +
    r(0, 7, 3.2, 16, bar) +
    r(8, 8, 42, 4, ink, `rx="0.5"`) +
    r(8, 14, 26, 1.6, ink, `rx="0.4" opacity="0.35"`) +
    r(8, 24, 16, 3.4, bar, `rx="1.2" opacity="0.22"`) +
    r(8, 30, 48, 1.2, ink, `opacity="0.16"`) +
    r(8, 34, 40, 1.2, ink, `opacity="0.16"`) +
    r(8, 42, 14, 3.4, bar, `rx="1.2" opacity="0.22"`) +
    lines(8, 48, 50, 9, 4.2, ink, 0.2, s)
  );
}

function compactInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number): string {
  return (
    r(0, 0, W, H, paper) +
    r(6, 6, 60, 3.4, accent, `rx="0.4"`) +
    r(6, 11.2, 34, 1.5, ink, `opacity="0.35"`) +
    r(6, 16, W - 12, 0.7, accent, `opacity="0.35"`) +
    lines(6, 20, 60, 18, 3.6, ink, 0.2, s)
  );
}

function executiveInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number): string {
  const gold = tpl.id === "gold" || tpl.id === "bank-gold";
  const headH = 22;
  return (
    r(0, 0, W, H, paper) +
    r(0, 0, W, headH, accent) +
    r(8, 6, 36, 4, "#ffffff", `rx="0.5"`) +
    r(8, 12, 22, 1.6, "#ffffff", `opacity="0.7"`) +
    (gold ? r(0, headH, W, 2.4, "#c4a574") : "") +
    sectionRule(8, headH + (gold ? 8 : 6), 16, accent) +
    lines(8, headH + (gold ? 12 : 10), 56, 12, 4, ink, 0.2, s)
  );
}

function azureInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number): string {
  const head = azureHead(tpl);
  const headH = tpl.id === "europass" ? 20 : 16;
  const darkHead = tpl.id === "europass";
  const nameFill = darkHead ? "#ffffff" : accent;
  const rule = darkHead ? "#9bb7e0" : "#d4d8dd";
  const clinic =
    tpl.id === "clinic"
      ? r(58, 5, 7, 2.2, accent, `rx="0.4"`) + r(60.4, 2.6, 2.2, 7, accent, `rx="0.4"`)
      : "";
  return (
    r(0, 0, W, H, paper) +
    r(0, 0, W, headH, head) +
    r(8, 5, 32, 3.4, nameFill, `rx="0.45"`) +
    r(8, 10, 20, 1.4, nameFill, `opacity="0.55"`) +
    clinic +
    r(26, headH + 4, 1, H - headH - 8, rule) +
    r(8, headH + 6, 14, 1.8, accent, `opacity="0.85"`) +
    lines(8, headH + 11, 14, 8, 6.2, ink, 0.22, s) +
    r(31, headH + 6, 18, 1.8, accent, `opacity="0.7"`) +
    lines(31, headH + 11, 33, 11, 5.4, ink, 0.2, s + 3)
  );
}

function charcoalInner(tpl: CvTemplate, paper: string, ink: string, s: number): string {
  const side = charcoalTone(tpl);
  const sw = 24;
  return (
    r(0, 0, W, H, paper) +
    r(0, 0, sw, H, side) +
    r(sw, 0, W - sw, 16, side) +
    photoSquare(5, 6, 14, "#d8d0c8") +
    r(5, 23, 14, 1.5, "#ffffff", `opacity="0.55"`) +
    lines(5, 28, 14, 8, 6, "#ffffff", 0.38, s) +
    r(sw + 6, 20, 28, 3.2, ink, `rx="0.4"`) +
    r(sw + 6, 25, 18, 1.3, side) +
    lines(sw + 6, 32, 36, 11, 4.6, ink, 0.2, s + 5)
  );
}

function navyInner(tpl: CvTemplate, paper: string, ink: string, s: number): string {
  const side = navyTone(tpl);
  const sw = 25;
  const timeline = tpl.id === "petra";
  return (
    r(0, 0, W, H, paper) +
    r(0, 0, sw, H, side) +
    photoCircle(sw / 2, 14, 7.2, "#c9cdd6") +
    r(4, 24, sw - 8, 2.2, "#ffffff", `opacity="0.7"`) +
    lines(4, 30, sw - 8, 8, 6.4, "#ffffff", 0.4, s) +
    r(sw + 6, 8, 30, 3.4, side, `rx="0.4"`) +
    r(sw + 6, 13.4, 20, 1.4, ink, `opacity="0.35"`) +
    (timeline
      ? `<circle cx="${sw + 8}" cy="24" r="1.35" fill="${side}"/>` +
        `<circle cx="${sw + 8}" cy="40" r="1.35" fill="${side}"/>` +
        `<circle cx="${sw + 8}" cy="56" r="1.35" fill="${side}"/>` +
        r(sw + 7.6, 25.4, 0.8, 30, side, `opacity="0.35"`) +
        lines(sw + 12, 22, 28, 12, 5.2, ink, 0.2, s)
      : sectionRule(sw + 6, 22, 16, side) + lines(sw + 6, 27, 35, 12, 4.6, ink, 0.2, s))
  );
}

function sidebarInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number, rtl: boolean): string {
  const sw = 22;
  const sideX = rtl ? W - sw : 0;
  const mainX = rtl ? 6 : sw + 5;
  return (
    r(0, 0, W, H, paper) +
    r(sideX, 0, sw, H, accent, `opacity="0.16"`) +
    r(rtl ? W - 3.2 : 0, 0, 3.2, H, accent) +
    photoCircle(sideX + sw / 2, 12, 5.5, accent) +
    lines(sideX + 3, 22, sw - 6, 8, 6.4, accent, 0.55, s) +
    r(mainX, 8, 32, 3.4, ink, `rx="0.4"`) +
    r(mainX, 13, 18, 1.3, accent) +
    lines(mainX, 22, 38, 12, 5, ink, 0.2, s + 2)
  );
}

function splitInner(tpl: CvTemplate, paper: string, ink: string, accent: string, s: number, rtl: boolean): string {
  const sw = 22;
  const sideX = rtl ? 0 : W - sw;
  const mainX = rtl ? sw + 5 : 6;
  return (
    r(0, 0, W, H, paper) +
    r(sideX, 4, sw, H - 8, accent, `rx="1.4"`) +
    lines(sideX + 3, 12, sw - 6, 9, 7, "#ffffff", 0.55, s) +
    r(mainX, 8, 32, 3.6, ink, `rx="0.4"`) +
    r(mainX, 14, 20, 1.2, accent) +
    lines(mainX, 22, 38, 12, 5, ink, 0.2, s + 4)
  );
}

function innerFor(tpl: CvTemplate, lang: ThumbLang): string {
  const paper = paperOf(tpl);
  const ink = inkOf(tpl);
  const accent = hex(tpl.accent, "#1c1917");
  const s = salt(tpl.id);
  const rtl = lang !== "en";
  const layout = tpl.layout;
  const style = tpl.layoutStyle;

  if (layout === "navy") return navyInner(tpl, paper, ink, s);
  if (layout === "charcoal") return charcoalInner(tpl, paper, ink, s);
  if (layout === "sidebar" || style === "two-column-left") return sidebarInner(tpl, paper, ink, accent, s, rtl);
  if (layout === "split" || style === "two-column-right") return splitInner(tpl, paper, ink, accent, s, rtl);
  if (layout === "azure") return azureInner(tpl, paper, ink, accent, s);
  if (layout === "executive") return executiveInner(tpl, paper, ink, accent, s);
  if (layout === "modern" || style === "header-accent") return modernInner(tpl, paper, ink, accent, s);
  if (layout === "compact") return compactInner(tpl, paper, ink, accent, s);
  if (layout === "minimal") return minimalInner(tpl, paper, ink, accent, s);
  return classicInner(tpl, paper, ink, accent, s);
}

export function badgeOf(tpl: CvTemplate): BadgeSpec {
  if (BADGES[tpl.id]) return BADGES[tpl.id];
  if (tpl.styleTags.includes("executive")) return { kind: "executive", he: "הנהלה", en: "Executive" };
  if (tpl.styleTags.includes("creative")) return { kind: "creative", he: "יצירתי", en: "Creative" };
  if (tpl.styleTags.includes("minimal")) return { kind: "minimal", he: "נקי ומינימליסטי", en: "Minimal" };
  if (tpl.atsOptimized) return { kind: "ats", he: "מותאם ל-ATS", en: "ATS Friendly" };
  if (tpl.styleTags.includes("modern")) return { kind: "modern", he: "מודרני", en: "Modern" };
  if (tpl.styleTags.includes("colorful")) return { kind: "colorful", he: "צבעוני", en: "Colorful" };
  return { kind: "professional", he: "מקצועי", en: "Professional" };
}

export function badgeHtml(tpl: CvTemplate, lang: ThumbLang): string {
  const badge = badgeOf(tpl);
  const label = lang === "en" ? badge.en : badge.he;
  const aria =
    badge.kind === "ats"
      ? lang === "en"
        ? "ATS optimized template"
        : "תבנית מותאמת ל-ATS"
      : label;
  return `<span class="tpl-badge tpl-badge-${badge.kind}" aria-label="${aria}">${label}</span>`;
}

export function thumbHtml(tpl: CvTemplate, lang: ThumbLang): string {
  const paper = paperOf(tpl);
  return `<div class="template-thumb tpl-mini" data-thumb-id="${tpl.id}" data-thumb-layout="${tpl.layout}" aria-hidden="true">
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${paper}">
      ${innerFor(tpl, lang)}
    </svg>
  </div>`;
}

export function homeThumbHtml(tpl: CvTemplate, lang: ThumbLang): string {
  const paper = paperOf(tpl);
  return `<span class="home-layout-frame tpl-mini" data-thumb-id="${tpl.id}" aria-hidden="true">
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:${paper}">
      ${innerFor(tpl, lang)}
    </svg>
  </span>`;
}
