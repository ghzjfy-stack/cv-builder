import React, { useState, useMemo } from 'react';

/**
 * ExamplesModal component for QuickCV.
 *
 * Implements:
 * 1. MODAL HEADINGS:
 *    - Title: {isEnglish ? "Ready Templates & Examples" : "תבניות ודוגמאות מוכנות"}
 *    - Subtitle: {isEnglish ? "Choose the best template for your domain. Colors and fonts can be customized anytime." : "בחרו את התבנית המתאימה לתחום שלכם. ניתן לשנות את הצבעים והפונטים בכל שלב."}
 *
 * 2. FILTER BUTTON CATEGORIES:
 *    - "הכל" -> "All"
 *    - "הייטק" -> "High-Tech"
 *    - "ניהול" -> "Management"
 *    - "סטודנטים" -> "Students"
 *    - "ATS" -> "ATS-Friendly"
 */

export const CATEGORY_FILTERS = [
  { id: 'all', labelHe: 'הכל', labelEn: 'All' },
  { id: 'hi-tech', labelHe: 'הייטק', labelEn: 'High-Tech' },
  { id: 'management', labelHe: 'ניהול', labelEn: 'Management' },
  { id: 'students', labelHe: 'סטודנטים', labelEn: 'Students' },
  { id: 'ats', labelHe: 'ATS', labelEn: 'ATS-Friendly' },
];

export default function ExamplesModal({
  isOpen = true,
  onClose,
  language = 'he',
  isEnglish: isEnglishProp,
  onSelectTemplate,
  selectedTemplate = '',
  templates = [],
  className = '',
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTemplates = useMemo(() => {
    if (!templates || templates.length === 0) return [];
    if (activeCategory === 'all') return templates;
    if (activeCategory === 'ats') {
      return templates.filter((t) => Boolean(t.atsOptimized || t.ats));
    }
    return templates.filter((t) => {
      if (t.category === activeCategory) return true;
      if (Array.isArray(t.categories) && t.categories.includes(activeCategory)) return true;
      return false;
    });
  }, [templates, activeCategory]);

  if (!isOpen) return null;

  const titleText = isEnglish
    ? 'Ready Templates & Examples'
    : 'תבניות ודוגמאות מוכנות';

  const subtitleText = isEnglish
    ? 'Choose the best template for your domain. Colors and fonts can be customized anytime.'
    : 'בחרו את התבנית המתאימה לתחום שלכם. ניתן לשנות את הצבעים והפונטים בכל שלב.';

  const closeAriaLabel = isEnglish ? 'Close examples' : 'סגור דוגמאות';
  const filterGroupLabel = isEnglish ? 'Filter by category' : 'סינון לפי קטגוריה';
  const useTemplateLabel = isEnglish ? 'Use This Template' : 'השתמש בתבנית זו';
  const noTemplatesText = isEnglish ? 'No templates match these filters.' : 'לא נמצאו תבניות לסינון הזה.';

  return (
    <div
      id="examples-modal"
      className={`qc-modal no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="examples-title"
      dir={dir}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="examples-backdrop fixed inset-0 bg-transparent border-0 cursor-default"
        onClick={onClose}
        aria-label={closeAriaLabel}
      />

      {/* Modal Dialog Panel */}
      <div className="examples-panel qc-modal-panel relative z-10 bg-slate-900 text-slate-100 rounded-3xl max-w-5xl w-full mx-auto p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="qc-modal-close absolute top-4 end-4 text-slate-400 hover:text-white transition p-2 rounded-xl text-lg font-bold"
          aria-label={closeAriaLabel}
        >
          ✕
        </button>

        {/* Headings */}
        <div className="pe-10">
          <h3 id="examples-title" className="text-lg sm:text-xl font-extrabold text-white">
            {titleText}
          </h3>
          <p id="examples-lead" className="text-xs text-slate-400 mt-1">
            {subtitleText}
          </p>
        </div>

        {/* Category Filters Toolbar */}
        <div className="tpl-toolbar pt-1" data-tpl-toolbar>
          <div
            className="tpl-cats flex flex-wrap gap-2"
            role="tablist"
            aria-label={filterGroupLabel}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const isSelected = activeCategory === cat.id;
              const label = isEnglish ? cat.labelEn : cat.labelHe;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  className={`tpl-chip px-3.5 py-1.5 rounded-full text-xs font-semibold border transition ${
                    isSelected
                      ? 'is-active bg-blue-600 border-blue-500 text-white shadow'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                  data-tpl-category={cat.id}
                  aria-pressed={isSelected}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Grid */}
        <div className="template-grid canva-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2" data-template-gallery>
          {filteredTemplates.length === 0 ? (
            <p className="template-empty text-slate-400 text-sm py-8 col-span-full text-center">
              {noTemplatesText}
            </p>
          ) : (
            filteredTemplates.map((tpl) => {
              const id = tpl.id;
              const isSelected = selectedTemplate === id;
              const title = isEnglish ? tpl.titleEn || tpl.title : tpl.titleHe || tpl.title;
              const sub = isEnglish ? tpl.subEn || tpl.subHe : tpl.subHe || tpl.subEn;

              return (
                <article
                  key={id}
                  className={`template-card relative group rounded-2xl border p-3 flex flex-col justify-between transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-slate-800 ring-2 ring-blue-500/50'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                  }`}
                  data-example={id}
                  data-ats={tpl.atsOptimized ? '1' : '0'}
                  aria-pressed={isSelected}
                  onClick={() => onSelectTemplate && onSelectTemplate(id)}
                >
                  {/* Badge */}
                  {tpl.atsOptimized && (
                    <span className="absolute top-2 start-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      ATS
                    </span>
                  )}

                  {/* Thumbnail / Preview image */}
                  <div className="w-full aspect-[210/297] bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800 flex items-center justify-center">
                    {tpl.previewUrl || tpl.thumb ? (
                      <img
                        src={tpl.previewUrl || tpl.thumb}
                        alt={title}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="text-slate-600 text-xs text-center p-2">
                        {title}
                      </div>
                    )}
                  </div>

                  {/* Meta Info */}
                  <div className="template-card-meta flex flex-col gap-0.5 mb-2">
                    <span className="template-card-title text-sm font-bold text-white">
                      {title}
                    </span>
                    {sub && (
                      <span className="template-card-sub text-xs text-slate-400">
                        {sub}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="template-card-hover mt-1" aria-hidden="true">
                    <button
                      type="button"
                      className="template-use-btn w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                      data-use-template={id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTemplate) onSelectTemplate(id);
                      }}
                    >
                      {useTemplateLabel}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
