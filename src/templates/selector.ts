import {
  CATEGORY_FILTERS,
  TEMPLATE_LIST,
  TEMPLATES,
  TEMPLATE_ORDER,
  registerQcTemplates,
  type CvTemplate,
} from "../data/templates";
import { badgeHtml, badgeOf, homeThumbHtml, thumbHtml } from "./thumbs";

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

const RETIRED_LAYOUTS = new Set(["azure", "classic", "minimal", "compact", "modern", "executive"]);

function isListed(tpl: CvTemplate): boolean {
  return !RETIRED_LAYOUTS.has(tpl.layout);
}

function matchesFilters(tpl: CvTemplate): boolean {
  if (!isListed(tpl)) return false;
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
  const L = lang();
  const useLabel = L === "en" ? "Use This Template" : "השתמש בתבנית זו";
  const title = titleOf(tpl);
  const badge = badgeOf(tpl);
  const badgeLabel = L === "en" ? badge.en : badge.he;
  const badgeMark = title.trim() === badgeLabel.trim() ? "" : badgeHtml(tpl, L);
  return `<article class="template-card" data-example="${esc(tpl.id)}" data-ats="${tpl.atsOptimized ? "1" : "0"}" aria-pressed="false">
    ${badgeMark}
    ${thumbHtml(tpl, L)}
    <div class="template-card-meta">
      <span class="template-card-title">${esc(titleOf(tpl))}</span>
      <span class="template-card-sub">${esc(subOf(tpl))}</span>
    </div>
    <div class="template-card-hover" aria-hidden="true">
      <button type="button" class="template-use-btn" data-use-template="${esc(tpl.id)}">${esc(useLabel)}</button>
    </div>
  </article>`;
}

function updateCountCopy(_n: number): void {
  const L = lang();
  const he = {
    home: "תבניות מודרניות המותאמות למערכות סינון (ATS). ממלאים את הפרטים, רואים את התצוגה המקדימה בזמן אמת והקובץ מוכן להגשה.",
    studio: "בחרו עיצוב לקורות החיים",
  };
  const en = {
    home: "Designed templates optimized for ATS screening. Pick a design, fill in your details, and the preview updates live.",
    studio: "Choose a design for your CV",
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
  ensureModalChrome();
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
      const studioList = TEMPLATE_ORDER.map((id) => TEMPLATES[id]).filter((t): t is CvTemplate => !!t && isListed(t));
      el.innerHTML = studioList.map(cardHtml).join("");
    }
  });

  const home = document.querySelector("[data-home-templates]");
  if (home) {
    const featured = TEMPLATE_ORDER.map((id) => TEMPLATES[id])
      .filter((t): t is CvTemplate => !!t && isListed(t))
      .slice(0, 8);
    home.innerHTML = featured
      .map(
        (tpl) =>
          `<button type="button" class="home-layout" data-example="${esc(tpl.id)}">
            ${homeThumbHtml(tpl, lang())}
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
  const isEn = lang() === "en";
  document.querySelectorAll("[data-tpl-category]").forEach((btn) => {
    const id = btn.getAttribute("data-tpl-category");
    btn.setAttribute("aria-pressed", id === filters.category ? "true" : "false");
    btn.classList.toggle("is-active", id === filters.category);
    const filterDef = CATEGORY_FILTERS.find((c) => c.id === id);
    if (filterDef) {
      btn.textContent = isEn ? filterDef.labelEn : filterDef.labelHe;
    }
  });
  const cats = document.querySelector(".tpl-cats");
  if (cats) {
    cats.setAttribute("aria-label", isEn ? "Filter by category" : "סינון לפי קטגוריה");
  }

  const modalTitle = document.getElementById("examples-title");
  if (modalTitle) {
    modalTitle.textContent = isEn ? "Ready Templates & Examples" : "תבניות ודוגמאות מוכנות";
  }
  const modalLead = document.getElementById("examples-lead");
  if (modalLead) {
    modalLead.textContent = isEn
      ? "Choose the best template for your domain. Colors and fonts can be customized anytime."
      : "בחרו את התבנית המתאימה לתחום שלכם. ניתן לשנות את הצבעים והפונטים בכל שלב.";
  }
}

function ensureModalChrome(): void {
  const panel = document.querySelector("#examples-modal .examples-panel");
  if (!panel) return;
  const existingToolbar = panel.querySelector("[data-tpl-toolbar]");
  if (existingToolbar) {
    syncFilterUi();
    return;
  }

  const isEn = lang() === "en";
  const toolbar = document.createElement("div");
  toolbar.className = "tpl-toolbar";
  toolbar.setAttribute("data-tpl-toolbar", "");
  toolbar.innerHTML = `
    <div class="tpl-cats" role="tablist" aria-label="${isEn ? "Filter by category" : "סינון לפי קטגוריה"}">
      ${CATEGORY_FILTERS.map(
        (c) =>
          `<button type="button" class="tpl-chip" role="tab" data-tpl-category="${c.id}" aria-pressed="${c.id === "all" ? "true" : "false"}">${isEn ? c.labelEn : c.labelHe}</button>`
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
  syncFilterUi();
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
  document.documentElement.style.setProperty("--tpl-primary", tpl.colorPalette.primary);
  document.documentElement.style.setProperty("--tpl-secondary", tpl.colorPalette.secondary);
  document.documentElement.style.setProperty("--tpl-text", tpl.colorPalette.text);
  document.documentElement.style.setProperty("--tpl-bg", "#ffffff");
  if (tpl.font && w.setCvFont) w.setCvFont(tpl.font);
  else if (tpl.font) {
    const serif = tpl.font === "Frank Ruhl Libre" || tpl.font === "Frank Ruhl Hofshi";
    document.documentElement.style.setProperty("--cv-font", `'${tpl.font}', ${serif ? "serif" : "sans-serif"}`);
  }
  if (w.setPreviewBg) w.setPreviewBg("bg-preview-white");
}

function applyTemplate(key: string): void {
  const aliases = (window as Window & { TEMPLATE_ALIASES?: Record<string, string> }).TEMPLATE_ALIASES || {};
  if (aliases[key]) key = aliases[key];
  let tpl = TEMPLATES[key] || ((window as Window & { QCTemplates?: Record<string, CvTemplate> }).QCTemplates || {})[key];
  if (tpl && RETIRED_LAYOUTS.has(tpl.layout)) {
    key = "lagoon";
    tpl = TEMPLATES.lagoon;
  }
  if (!tpl) return;

  const fromHome = document.body.classList.contains("on-home");
  const w = window as Window & {
    updateCV?: () => void;
    QCDraft?: { save?: () => void };
    closeExamplesModal?: () => void;
    showStudio?: (opts?: { keepStep?: boolean }) => void;
    applyStudioStep?: (n: number, opts?: { silent?: boolean }) => void;
    markStep?: (n: number) => void;
    openMobilePreview?: () => void;
  };

  // Design/layout only — never overwrite the user's form text or language.
  applyDesign(tpl);

  markSelected(key);
  w.updateCV?.();
  w.QCDraft?.save?.();
  w.closeExamplesModal?.();
  w.showStudio?.({ keepStep: true });
  if (w.applyStudioStep) w.applyStudioStep(2, { silent: true });
  else w.markStep?.(2);
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
    __qcTsGalleries?: () => void;
    qcTemplateCardHtml?: (tpl: CvTemplate) => string;
    loadExample?: (key: string) => void;
    applyCvTemplate?: (key: string) => void;
    QCTemplates?: Record<string, CvTemplate>;
    QCTemplateOrder?: string[];
  };
  w.QCTemplates = TEMPLATES;
  w.QCTemplateOrder = TEMPLATE_ORDER;
  w.renderTemplateGalleries = renderTemplateGalleries;
  w.__qcTsGalleries = renderTemplateGalleries;
  w.qcTemplateCardHtml = cardHtml;
  w.applyCvTemplate = applyTemplate;
  w.loadExample = (key: string) => applyTemplate(key);

  renderTemplateGalleries();
}
