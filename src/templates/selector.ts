import {
  ATS_TOOLTIP_HE,
  CATEGORY_FILTERS,
  STYLE_FILTERS,
  TEMPLATE_LIST,
  TEMPLATES,
  TEMPLATE_ORDER,
  registerQcTemplates,
  type CvTemplate,
  type StyleTag,
} from "../data/templates";

type Lang = "he" | "en";

type FilterState = {
  category: string;
  style: string;
  query: string;
};

const SAMPLE_FIELD_IDS = [
  "in-name",
  "in-title",
  "in-phone",
  "in-email",
  "in-location",
  "in-linkedin",
  "in-summary",
  "in-experience",
  "in-education",
  "in-military",
  "in-skills",
  "in-languages",
  "in-references",
] as const;

let filters: FilterState = { category: "all", style: "", query: "" };
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

function formField(id: string): HTMLInputElement | HTMLTextAreaElement | null {
  return document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
}

function getVal(id: string): string {
  const el = formField(id);
  return el ? String(el.value || "").trim() : "";
}

function defaultSamples(): Record<string, string> {
  const pack =
    (window as Window & { CV_SAMPLES?: Record<string, Record<string, string>> }).CV_SAMPLES?.[lang()] ||
    {};
  return pack;
}

function isEmptyOrDefaultContent(): boolean {
  const defaults = defaultSamples();
  let filled = 0;
  let custom = 0;
  for (const id of SAMPLE_FIELD_IDS) {
    if (id === "in-references") continue;
    const val = getVal(id);
    if (!val) continue;
    filled += 1;
    const def = defaults[id];
    if (def == null || val !== String(def).trim()) custom += 1;
  }
  if (filled === 0) return true;
  return custom === 0;
}

function titleOf(tpl: CvTemplate): string {
  return lang() === "en" ? tpl.titleEn || tpl.title : tpl.titleHe || tpl.title;
}

function subOf(tpl: CvTemplate): string {
  return lang() === "en" ? tpl.subEn || tpl.subHe : tpl.subHe || tpl.subEn;
}

function matchesFilters(tpl: CvTemplate): boolean {
  if (filters.category !== "all" && tpl.category !== filters.category) {
    const extra = tpl.categories || [];
    if (!extra.includes(filters.category as CvTemplate["category"])) return false;
  }
  if (filters.style === "ats") {
    if (!tpl.atsOptimized) return false;
  } else if (filters.style) {
    if (!tpl.styleTags.includes(filters.style as StyleTag)) return false;
  }
  const q = filters.query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    tpl.titleHe,
    tpl.titleEn,
    tpl.subHe,
    tpl.subEn,
    tpl.category,
    tpl.font,
    ...(tpl.styleTags || []),
    tpl.atsOptimized ? "ats" : "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
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
    modal: `${n} תבניות מוכנות בסגנון Canva. בחירה טוענת פריסה, צבעים ודוגמה — ואפשר לערוך הכל בזמן אמת.`,
  };
  const en = {
    home: `${n} ready-made Canva-style templates. Pick a design, fill in your details, and the preview updates live.`,
    studio: `${n} Canva-style designs — selecting one fills the preview live`,
    modal: `${n} ready-made Canva-style templates. A pick loads layout, colors, and a sample you can edit live.`,
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
  document.querySelectorAll("[data-tpl-style]").forEach((btn) => {
    const id = btn.getAttribute("data-tpl-style") || "";
    const on = filters.style === id;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-active", on);
  });
  const search = document.getElementById("tpl-search") as HTMLInputElement | null;
  if (search && search.value !== filters.query) search.value = filters.query;
}

function ensureModalChrome(): void {
  const panel = document.querySelector("#examples-modal .examples-panel");
  if (!panel || panel.querySelector("[data-tpl-toolbar]")) return;

  const toolbar = document.createElement("div");
  toolbar.className = "tpl-toolbar";
  toolbar.setAttribute("data-tpl-toolbar", "");
  toolbar.innerHTML = `
    <div class="tpl-ats-banner">
      <span class="tpl-ats-banner-text">תבניות שנבדקו מול מערכות סינון (ATS)</span>
      <button type="button" class="tpl-ats-help" id="tpl-ats-help" aria-label="מה זה ATS?" aria-describedby="tpl-ats-tooltip" aria-expanded="false">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
          <path d="M12 10.5v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="7.5" r="1.1" fill="currentColor"/>
        </svg>
      </button>
      <span id="tpl-ats-tooltip" class="tpl-ats-tooltip" role="tooltip">${esc(ATS_TOOLTIP_HE)}</span>
    </div>
    <div class="tpl-cats" role="tablist" aria-label="סינון לפי קטגוריה">
      ${CATEGORY_FILTERS.map(
        (c) =>
          `<button type="button" class="tpl-chip" role="tab" data-tpl-category="${c.id}" aria-pressed="${c.id === "all" ? "true" : "false"}">${c.labelHe}</button>`
      ).join("")}
    </div>
    <div class="tpl-styles" role="group" aria-label="תגיות סגנון">
      ${STYLE_FILTERS.map(
        (s) =>
          `<button type="button" class="tpl-chip tpl-chip-style" data-tpl-style="${s.id}" aria-pressed="false">${s.labelHe}</button>`
      ).join("")}
    </div>
    <label class="tpl-search-wrap" for="tpl-search">
      <span class="sr-only">חיפוש תבניות</span>
      <input type="search" id="tpl-search" class="tpl-search" placeholder="חיפוש תבנית, תפקיד או סגנון…" autocomplete="off" />
    </label>
  `;

  const title = panel.querySelector("#examples-title");
  const count = panel.querySelector("[data-template-count-copy]");
  const insertAfter = count || title;
  if (insertAfter && insertAfter.parentElement === panel) {
    insertAfter.insertAdjacentElement("afterend", toolbar);
  } else {
    panel.insertBefore(toolbar, panel.querySelector("[data-template-gallery]"));
  }

  const help = toolbar.querySelector("#tpl-ats-help") as HTMLButtonElement | null;
  const tip = toolbar.querySelector("#tpl-ats-tooltip") as HTMLElement | null;
  if (help && tip) {
    const open = () => {
      tip.classList.add("is-open");
      help.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      tip.classList.remove("is-open");
      help.setAttribute("aria-expanded", "false");
    };
    help.addEventListener("mouseenter", open);
    help.addEventListener("mouseleave", close);
    help.addEventListener("focus", open);
    help.addEventListener("blur", close);
    help.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (tip.classList.contains("is-open")) close();
      else open();
    });
    document.addEventListener("click", (e) => {
      if (!help.contains(e.target as Node) && !tip.contains(e.target as Node)) close();
    });
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

function applySampleContent(tpl: CvTemplate, force: boolean): void {
  const L = lang();
  const pack = (L === "en" ? tpl.en : tpl.he) || tpl.he || tpl.en;
  if (!pack) return;
  const map: Record<string, string> = {
    "in-name": pack.name,
    "in-title": pack.title,
    "in-phone": pack.phone,
    "in-email": pack.email,
    "in-location": pack.location,
    "in-linkedin": pack.linkedin,
    "in-summary": pack.summary,
    "in-experience": pack.experience,
    "in-education": pack.education,
    "in-military": pack.military,
    "in-skills": pack.skills,
    "in-languages": pack.languages,
    "in-references": pack.references || "",
  };
  Object.keys(map).forEach((id) => {
    const el = formField(id);
    if (!el) return;
    if (!force) {
      const cur = String(el.value || "").trim();
      const def = defaultSamples()[id];
      const isDefault = !cur || (def != null && cur === String(def).trim());
      if (!isDefault && id !== "in-references") return;
    }
    el.value = map[id] == null ? "" : map[id];
  });
  const phrase = document.getElementById("phrase-field") as HTMLSelectElement | null;
  if (phrase && tpl.field) phrase.value = tpl.field;
  const w = window as Window & {
    hydrateLanguagePicker?: () => void;
    renderPhrases?: () => void;
    renderRoleTitleChips?: () => void;
    QCExperience?: { refresh?: () => void };
  };
  w.hydrateLanguagePicker?.();
  w.renderPhrases?.();
  w.renderRoleTitleChips?.();
  w.QCExperience?.refresh?.();
}

function applyTemplate(key: string, opts?: { forceContent?: boolean }): void {
  const aliases = (window as Window & { TEMPLATE_ALIASES?: Record<string, string> }).TEMPLATE_ALIASES || {};
  if (aliases[key]) key = aliases[key];
  const tpl = TEMPLATES[key] || ((window as Window & { QCTemplates?: Record<string, CvTemplate> }).QCTemplates || {})[key];
  if (!tpl) return;

  const fromHome = document.body.classList.contains("on-home");
  const w = window as Window & {
    setCvLang?: (l: string, o?: { restore?: boolean }) => void;
    clearPhoto?: () => void;
    updateCV?: () => void;
    QCDraft?: { save?: () => void };
    closeExamplesModal?: () => void;
    showStudio?: () => void;
    markStep?: (n: number) => void;
    openMobilePreview?: () => void;
  };

  applyDesign(tpl);

  let loadContent = opts?.forceContent === true;
  if (!loadContent) {
    if (isEmptyOrDefaultContent()) {
      loadContent = true;
    } else {
      const msg =
        lang() === "en"
          ? "You already edited your CV text.\n\nOK = also load this template’s sample content\nCancel = apply design only (keep your text)"
          : "כבר ערכתם טקסט בקורות החיים.\n\nאישור = לטעון גם תוכן לדוגמה מהתבנית\nביטול = עיצוב בלבד (שומר על הטקסט שלכם)";
      loadContent = window.confirm(msg);
    }
  }
  if (loadContent) applySampleContent(tpl, true);

  const preferred = tpl.preferredLang || "he";
  if (w.setCvLang) w.setCvLang(preferred, { restore: true });
  w.clearPhoto?.();
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

      const style = t.closest("[data-tpl-style]") as HTMLElement | null;
      if (style) {
        e.preventDefault();
        const id = style.getAttribute("data-tpl-style") || "";
        filters.style = filters.style === id ? "" : id;
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

  document.addEventListener("input", (e) => {
    const t = e.target as HTMLElement | null;
    if (t && t.id === "tpl-search") {
      filters.query = (t as HTMLInputElement).value || "";
      renderTemplateGalleries();
    }
  });
}

export function initTemplateSelector(): void {
  registerQcTemplates();
  ensureModalChrome();
  bindEvents();

  const w = window as Window & {
    renderTemplateGalleries?: () => void;
    loadExample?: (key: string) => void;
    applyCvTemplate?: (key: string, opts?: { forceContent?: boolean }) => void;
    QCTemplates?: Record<string, CvTemplate>;
    QCTemplateOrder?: string[];
  };
  w.QCTemplates = TEMPLATES;
  w.QCTemplateOrder = TEMPLATE_ORDER;
  w.renderTemplateGalleries = renderTemplateGalleries;
  w.applyCvTemplate = applyTemplate;
  // Smart-merge override for existing click handlers / SEO presets
  w.loadExample = (key: string) => applyTemplate(key);

  renderTemplateGalleries();
}
