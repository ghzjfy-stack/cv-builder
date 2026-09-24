import React from 'react';

/**
 * DesignStep component for Step 1 (Design & Theme) of the CV Builder.
 *
 * Implements:
 * 1. Spacing helper text:
 *    "מצב צפוף דוחס את התוכן לעמוד אחד, מצב מרווח מעניק מראה מאוורר יותר."
 * 2. Language button text:
 *    "אנגלית – יישור לשמאל" / "English (LTR)"
 *    "עברית – יישור לימין" / "Hebrew (RTL)"
 * 3. Color accents, typography, and density options.
 */

export const ACCENT_COLORS = [
  { id: 'emerald', label: 'אמרלד', labelEn: 'Emerald', color: '#059669' },
  { id: 'navy', label: 'נייבי', labelEn: 'Navy', color: '#12192b' },
  { id: 'charcoal', label: 'פחם', labelEn: 'Charcoal', color: '#4c4c4c' },
  { id: 'teal', label: 'טורקיז', labelEn: 'Teal', color: '#0f766e' },
  { id: 'burgundy', label: 'בורדו', labelEn: 'Burgundy', color: '#7f1d3a' },
  { id: 'slate', label: 'צפחה', labelEn: 'Slate', color: '#3e4c58' },
];

export const FONTS = [
  { value: 'Rubik', label: 'רוביק — מודרני וחד', labelEn: 'Rubik — Modern & Sharp', family: "'Rubik', sans-serif" },
  { value: 'Heebo', label: 'היבו — נקי ומקצועי', labelEn: 'Heebo — Clean & Professional', family: "'Heebo', sans-serif" },
  { value: 'Assistant', label: 'אסיסטנט — אלגנטי ונגיש', labelEn: 'Assistant — Elegant & Accessible', family: "'Assistant', sans-serif" },
  { value: 'Varela Round', label: 'ורלה — רך וידידותי', labelEn: 'Varela Round — Soft & Friendly', family: "'Varela Round', sans-serif" },
  { value: 'Frank Ruhl Libre', label: 'פרנק רול — קלאסי ומכובד', labelEn: 'Frank Ruhl Libre — Classic Serif', family: "'Frank Ruhl Libre', serif" },
];

export const DENSITY_OPTIONS = [
  { id: 'compact', label: 'צפוף', labelEn: 'Compact' },
  { id: 'regular', label: 'רגיל', labelEn: 'Regular' },
  { id: 'spacious', label: 'מרווח', labelEn: 'Spacious' },
];

export default function DesignStep({
  language = 'he',
  isEnglish: isEnglishProp,
  onLanguageChange,
  accentColor = '#4c4c4c',
  onAccentChange,
  font = 'Rubik',
  onFontChange,
  density = 'regular',
  onDensityChange,
  onContinue,
  className = '',
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';

  return (
    <div
      id="design-panel"
      dir={dir}
      className={`bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-5 shadow-xl text-slate-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-slate-200 text-sm">
          {isEnglish ? 'Theme & Design' : 'עיצוב וערכת נושא'}
        </h3>
        <span className="text-[10px] text-slate-400">
          {isEnglish ? 'Changes reflect immediately in preview' : 'השינויים מופיעים מיד בתצוגה'}
        </span>
      </div>

      {/* Language Selection */}
      <div>
        <p className="block text-xs text-slate-300 mb-2" id="cv-lang-legend">
          {isEnglish ? 'CV Language' : 'שפת קורות החיים'}
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="cv-lang-legend">
          <button
            type="button"
            id="design-lang-he"
            className={`lang-chip min-h-11 px-3 rounded-xl border text-xs font-semibold transition ${
              !isEnglish
                ? 'border-blue-500 bg-blue-600/20 text-white'
                : 'border-slate-600 text-slate-400 hover:border-slate-400'
            }`}
            data-lang="he"
            aria-pressed={!isEnglish}
            onClick={() => onLanguageChange && onLanguageChange('he')}
          >
            {isEnglish ? 'Hebrew (RTL)' : 'עברית – יישור לימין'}
          </button>
          <button
            type="button"
            id="design-lang-en"
            className={`lang-chip min-h-11 px-3 rounded-xl border text-xs font-semibold transition ${
              isEnglish
                ? 'border-blue-500 bg-blue-600/20 text-white'
                : 'border-slate-600 text-slate-400 hover:border-slate-400'
            }`}
            data-lang="en"
            aria-pressed={isEnglish}
            onClick={() => onLanguageChange && onLanguageChange('en')}
          >
            {isEnglish ? 'English (LTR)' : 'אנגלית – יישור לשמאל'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2" id="design-lang-hint">
          {isEnglish
            ? 'Headings, alignment, and samples update automatically based on language.'
            : 'הכותרות, היישור והדוגמאות מתעדכנים לפי השפה. טקסט שערכתם נשמר.'}
        </p>
      </div>

      {/* Accent Color */}
      <div>
        <p className="block text-xs text-slate-300 mb-2" id="accent-legend">
          {isEnglish ? 'Accent Color — Headers & Icons' : 'צבע הדגשה — כותרות ואייקונים'}
        </p>
        <div className="flex flex-wrap items-center gap-3" role="group" aria-labelledby="accent-legend">
          {ACCENT_COLORS.map((item) => {
            const isSelected = accentColor?.toLowerCase() === item.color.toLowerCase();
            return (
              <div key={item.id} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    isSelected ? 'ring-2 ring-blue-400 border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: item.color }}
                  aria-label={isEnglish ? item.labelEn : item.label}
                  aria-pressed={isSelected}
                  onClick={() => onAccentChange && onAccentChange(item.color)}
                />
                <span className="text-[10px] text-slate-400">
                  {isEnglish ? item.labelEn : item.label}
                </span>
              </div>
            );
          })}
          {/* Custom color picker */}
          <div className="flex flex-col items-center gap-1">
            <input
              type="color"
              id="custom-accent"
              value={accentColor || '#4c4c4c'}
              onChange={(e) => onAccentChange && onAccentChange(e.target.value)}
              className="w-8 h-8 rounded-full border border-slate-600 cursor-pointer bg-transparent"
              aria-label={isEnglish ? 'Custom color' : 'בחירת צבע מותאם'}
            />
            <span className="text-[10px] text-slate-400" id="custom-accent-caption">
              {isEnglish ? 'Custom' : 'מותאם'}
            </span>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="block text-xs text-slate-300 mb-1" htmlFor="font-select" id="font-select-label">
          {isEnglish ? 'Typography & Font' : 'טיפוגרפיה עברית'}
        </label>
        <select
          id="font-select"
          value={font}
          onChange={(e) => onFontChange && onFontChange(e.target.value)}
          className="w-full bg-slate-900/60 border border-slate-600 text-sm rounded-lg p-2.5 text-white outline-none min-h-11"
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.family }}>
              {isEnglish ? f.labelEn : f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Spacing / Density */}
      <div>
        <p className="block text-xs text-slate-300 mb-2" id="density-legend">
          {isEnglish ? 'Spacing / density — fit to one page' : 'ריווח / צפיפות — התאמה לעמוד אחד'}
        </p>
        <div className="flex gap-2" role="radiogroup" aria-labelledby="density-legend">
          {DENSITY_OPTIONS.map((opt) => {
            const isSelected = density === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-600/20 text-white'
                    : 'border-slate-600 text-slate-400 hover:border-slate-400'
                }`}
                data-density={opt.id}
                aria-pressed={isSelected}
                onClick={() => onDensityChange && onDensityChange(opt.id)}
              >
                {isEnglish ? opt.labelEn : opt.label}
              </button>
            );
          })}
        </div>
        {/* Helper text */}
        <p className="text-[11px] text-slate-400 mt-2" id="density-hint">
          {isEnglish
            ? 'Compact mode compresses content to fit one page; spacious mode provides more breathing room.'
            : 'מצב צפוף דוחס את התוכן לעמוד אחד, מצב מרווח מעניק מראה מאוורר יותר.'}
        </p>
      </div>

      {/* Continue button */}
      <button
        type="button"
        id="btn-continue-design"
        onClick={() => onContinue && onContinue()}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl shadow-lg transition text-base min-h-14 mt-4"
      >
        {isEnglish ? 'Continue to details →' : 'המשך למילוי פרטים ⬅️'}
      </button>
    </div>
  );
}
