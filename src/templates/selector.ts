import {
  CATEGORY_FILTERS,
  TEMPLATE_LIST,
  TEMPLATES,
  TEMPLATE_ORDER,
  registerQcTemplates,
  type CvTemplate,
} from "../data/templates";

type Lang = "he" | "en";

type FilterState = {
  category: string;
};

let filters: FilterState = { category: "all" };
let bound = false;

function lang(): Lang {
  return (window as Window & { QCCvLang?: string }).QCCvLang === "en" ? "en" : "he";
}

function esc(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleOf(tpl: CvTemplate): string {
  return lang() === "en" ? tpl.titleEn || tpl.title : tpl.titleHe || tpl.title;
}

function subOf(tpl: CvTemplate): string {
  return lang() === "en" ? tpl.subEn || tpl.subHe : tpl.subHe || tpl.subEn;
}

function matchesFilters(tpl: CvTemplate): boolean {
  if (filters.category === "all") return true;
  if (filters.category === "ats") return !!tpl.atsOptimized;
  if (tpl.category === filters.category) return true;
  const extra = tpl.categories || [];
  return extra.includes(filters.category as CvTemplate["category"]);
}

function filteredList(): CvTemplate[] {
  return TEMPLATE_ORDER.map((id) => TEMPLATES[id]).filter((t): t is CvTemplate => !!t && matchesFilters(t));
}

function cardHtml(tpl: CvTemplate): string {
  const ats = tpl.atsOptimized
    ? `<span class="ats-badge ats-badge-on-card" aria-label="${lang() === "en" ? "ATS optimized template" : "תבנית מותאמת ל-ATS"}">ATS</span>`
    : "";
  const useLabel = lang() === "en" ? "Use This Template" : "השתמש בתבנית זו";
  return `<article class="template-card" data-example="${esc(tpl.id)}" data-ats="${tpl.atsOptimized ? "1" : "0"}" aria-pressed="false">
    ${ats}
    <div class="template-thumb home-layout-frame ${esc(tpl.thumb)}" aria-hidden="true"><span></span><span></span><span></span></div>
    <div class="template-card-meta">
      <span class="template-card-title">${esc(titleOf(tpl))}</span>
      <span class="template-card-sub">${esc(subOf(tpl))}</span>
    </div>
    <div class="template-card-hover" aria-hidden="true">
      <button type="button" class="template-use-btn" data-use-template="${esc(tpl.id)}">${esc(useLabel)}</button>
    </div>
  </article>`;
}

function updateCountCopy(n: number): void {
  const L = lang();
  const he = {
    home: `${n} תבניות מוכנות בסגנון Canva. בחרו עיצוב, מלאו פרטים, והתצוגה מתעדכנת בזמן אמת.`,
    studio: `${n} עיצובים בסגנון Canva — בחירה ממלאת בזמן אמת`,
  };
  const en = {
    home: `${n} ready-made Canva-style templates. Pick a design, fill in your details, and the preview updates live.`,
    studio: `${n} Canva-style designs — selecting one fills the preview live`,
  };
  const pack = L === "en" ? en : he;
  document.querySelectorAll("[data-template-count-copy]").forEach((el) => {
    const key = el.getAttribute("data-template-count-copy") as keyof typeof pack | null;
    if (key && pack[key]) el.textContent = pack[key];
  });
}

function markSelected(key: string): void {
  (window as Window & { QCExample?: string }).QCExample = key || "";
  document.querySelectorAll(".template-card[data-example]").forEach((el) => {
    el.setAttribute("aria-pressed", el.getAttribute("data-example") === key ? "true" : "false");
  });
}

export function renderTemplateGalleries(): void {
  const list = filteredList();
  const cards = list.map(cardHtml).join("");
  const empty =
    lang() === "en"
      ? `<p class="template-empty">No templates match these filters.</p>`
      : `<p class="template-empty">לא נמצאו תבניות לסינון הזה.</p>`;

  document.querySelectorAll("[data-template-gallery]").forEach((el) => {
    const isModal = !!el.closest("#examples-modal");
    if (isModal) {
      el.innerHTML = list.length ? cards : empty;
    } else {
      const studioList = TEMPLATE_ORDER.map((id) => TEMPLATES[id]).filter(Boolean) as CvTemplate[];
      el.innerHTML = studioList.map(cardHtml).join("");
    }
  });

  const home = document.querySelector("[data-home-templates]");
  if (home) {
    const featured = TEMPLATE_ORDER.slice(0, 8)
      .map((id) => TEMPLATES[id])
      .filter(Boolean) as CvTemplate[];
    home.innerHTML = featured
      .map(
        (tpl) =>
          `<button type="button" class="home-layout" data-example="${esc(tpl.id)}">
            <span class="home-layout-frame ${esc(tpl.thumb)}"><span></span><span></span><span></span></span>
            <span>${esc(titleOf(tpl))}${tpl.atsOptimized ? ' <span class="ats-badge ats-badge-home">ATS</span>' : ""}</span>
          </button>`
      )
      .join("");
  }

  updateCountCopy(TEMPLATE_LIST.length);
  markSelected((window as Window & { QCExample?: string }).QCExample || "");
  syncFilterUi();
}

function syncFilterUi(): void {
  document.querySelectorAll("[data-tpl-category]").forEach((btn) => {
    const id = btn.getAttribute("data-tpl-category");
    btn.setAttribute("aria-pressed", id === filters.category ? "true" : "false");
    btn.classList.toggle("is-active", id === filters.category);
  });
}

function ensureModalChrome(): void {
  const panel = document.querySelector("#examples-modal .examples-panel");
  if (!panel || panel.querySelector("[data-tpl-toolbar]")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "tpl-toolbar";
  toolbar.setAttribute("data-tpl-toolbar", "");
  toolbar.innerHTML = `
    <div class="tpl-cats" role="tablist" aria-label="סינון לפי קטגוריה">
      ${CATEGORY_FILTERS.map(
        (c) =>
          `<button type="button" class="tpl-chip" role="tab" data-tpl-category="${c.id}" aria-pressed="${c.id === "all" ? "true" : "false"}">${c.labelHe}</button>`
      ).join("")}
    </div>
  `;

  const title = panel.querySelector("#examples-title");
  const sub = title?.nextElementSibling;
  const insertAfter = sub || title;
  if (insertAfter && insertAfter.parentElement === panel) {
    insertAfter.insertAdjacentElement("afterend", toolbar);
  } else {
    panel.insertBefore(toolbar, panel.querySelector("[data-template-gallery]"));
  }
}

function applyDesign(tpl: CvTemplate): void {
  const w = window as Window & {
    setLayout?: (layout: string, btn?: unknown, opts?: { keepSkin?: boolean }) => void;
    setCvSkin?: (skin: string) => void;
    setAccent?: (color: string, btn?: Element | null) => void;
    setCvFont?: (font: string) => void;
    setPreviewBg?: (bg: string) => void;
  };
  if (tpl.layout && w.setLayout) w.setLayout(tpl.layout, null, { keepSkin: true });
  if (w.setCvSkin) w.setCvSkin(tpl.skin || "");
  if (tpl.accent && w.setAccent) {
    const swatch = document.querySelector(`.theme-swatch[data-color="${tpl.accent}"]`);
    w.setAccent(tpl.accent, swatch);
  }
  // CSS variables for live preview theming
  document.documentElement.style.setProperty("--accent", tpl.accent);
  document.documentElement.style.setProperty("--cv-font", `'${tpl.font}', sans-serif`);
  document.documentElement.style.setProperty("--tpl-primary", tpl.colorPalette.primary);
  document.documentElement.style.setProperty("--tpl-secondary", tpl.colorPalette.secondary);
  document.documentElement.style.setProperty("--tpl-text", tpl.colorPalette.text);
  document.documentElement.style.setProperty("--tpl-bg", tpl.colorPalette.background);
  if (tpl.font && w.setCvFont) w.setCvFont(tpl.font);
  if (tpl.bg && w.setPreviewBg) w.setPreviewBg(tpl.bg);
}

function applyTemplate(key: string): void {
  const aliases = (window as Window & { TEMPLATE_ALIASES?: Record<string, string> }).TEMPLATE_ALIASES || {};
  if (aliases[key]) key = aliases[key];
  const tpl = TEMPLATES[key] || ((window as Window & { QCTemplates?: Record<string, CvTemplate> }).QCTemplates || {})[key];
  if (!tpl) return;

  const fromHome = document.body.classList.contains("on-home");
  const w = window as Window & {
    setCvLang?: (l: string, o?: { restore?: boolean }) => void;
    updateCV?: () => void;
    QCDraft?: { save?: () => void };
    closeExamplesModal?: () => void;
    showStudio?: () => void;
    markStep?: (n: number) => void;
    openMobilePreview?: () => void;
  };

  // Design/layout only — never overwrite the user's form text.
  applyDesign(tpl);

  const preferred = tpl.preferredLang || "he";
  if (w.setCvLang) w.setCvLang(preferred, { restore: true });
  markSelected(key);
  w.updateCV?.();
  w.QCDraft?.save?.();
  w.closeExamplesModal?.();
  w.showStudio?.();
  w.markStep?.(1);
  if (fromHome && window.matchMedia("(max-width: 1023px)").matches) w.openMobilePreview?.();
}

function bindEvents(): void {
  if (bound) return;
  bound = true;

  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      const cat = t.closest("[data-tpl-category]") as HTMLElement | null;
      if (cat) {
        e.preventDefault();
        filters.category = cat.getAttribute("data-tpl-category") || "all";
        renderTemplateGalleries();
        return;
      }

      const useBtn = t.closest("[data-use-template]") as HTMLElement | null;
      if (useBtn) {
        e.preventDefault();
        e.stopPropagation();
        const key = useBtn.getAttribute("data-use-template");
        if (key) applyTemplate(key);
        return;
      }
    },
    true
  );
}

export function initTemplateSelector(): void {
  registerQcTemplates();
  ensureModalChrome();
  bindEvents();

  const w = window as Window & {
    renderTemplateGalleries?: () => void;
    loadExample?: (key: string) => void;
    applyCvTemplate?: (key: string) => void;
    QCTemplates?: Record<string, CvTemplate>;
    QCTemplateOrder?: string[];
  };
  w.QCTemplates = TEMPLATES;
  w.QCTemplateOrder = TEMPLATE_ORDER;
  w.renderTemplateGalleries = renderTemplateGalleries;
  w.applyCvTemplate = applyTemplate;
  w.loadExample = (key: string) => applyTemplate(key);

  renderTemplateGalleries();
}
