import React, { useCallback } from 'react';

/**
 * DetailsStep — Step 2 form helpers for experience (jobs).
 * Mirrors the live studio experience editor with immutable state updates.
 *
 * The production studio currently drives experience via lib/experienceEditor.js;
 * this component is the React equivalent for add / edit / delete job cards.
 */

function emptyJob() {
  return {
    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
    company: '',
    role: '',
    years: '',
    description: '',
  };
}

export default function DetailsStep({
  formData = {},
  setFormData,
  language = 'he',
  isEnglish: isEnglishProp,
  className = '',
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';
  const experience = Array.isArray(formData.experience) ? formData.experience : [];

  const addExperience = useCallback(() => {
    if (typeof setFormData !== 'function') return;
    setFormData((prev) => ({
      ...prev,
      experience: [...(prev.experience || []), emptyJob()],
    }));
  }, [setFormData]);

  const removeExperience = useCallback(
    (idToDelete) => {
      if (typeof setFormData !== 'function') return;
      setFormData((prev) => ({
        ...prev,
        experience: (prev.experience || []).filter((item) => item && item.id !== idToDelete),
      }));
    },
    [setFormData]
  );

  const updateExperience = useCallback(
    (id, field, value) => {
      if (typeof setFormData !== 'function') return;
      setFormData((prev) => ({
        ...prev,
        experience: (prev.experience || []).map((item) =>
          item && item.id === id ? { ...item, [field]: value == null ? '' : String(value) } : item
        ),
      }));
    },
    [setFormData]
  );

  return (
    <div dir={dir} className={`details-step-experience space-y-3 ${className}`.trim()}>
      {experience.map((exp, index) => {
        const key = exp.id || index;
        const company = exp.company || '';
        const role = exp.role || '';
        const years = exp.years || '';
        const description = exp.description || '';
        return (
          <article key={key} className="experience-card is-open rounded-xl border border-slate-600 bg-slate-900/40 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                {isEnglish ? `Job ${index + 1}` : `משרה ${index + 1}`}
              </span>
              <button
                type="button"
                className="text-xs font-semibold text-rose-300 hover:text-rose-200 disabled:opacity-40"
                disabled={experience.length <= 1}
                onClick={() => removeExperience(exp.id)}
              >
                {isEnglish ? 'Delete job' : 'מחק משרה'}
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                placeholder={isEnglish ? 'Company' : 'שם חברה/ארגון'}
                value={company}
                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
              />
              <input
                type="text"
                className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                placeholder={isEnglish ? 'Role' : 'תפקיד'}
                value={role}
                onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
              />
              <input
                type="text"
                className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                placeholder={isEnglish ? 'Years' : 'תאריכים/שנים'}
                value={years}
                onChange={(e) => updateExperience(exp.id, 'years', e.target.value)}
              />
              <textarea
                rows={4}
                className="studio-field w-full rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                placeholder={isEnglish ? 'Description / achievements' : 'תיאור תפקיד / הישגים'}
                value={description}
                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
              />
            </div>
          </article>
        );
      })}

      <button
        type="button"
        id="btn-add-experience-react"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 text-sm font-bold text-teal-200 hover:bg-teal-500/20"
        onClick={addExperience}
      >
        {isEnglish ? 'Add Another Job' : 'הוסף משרה נוספת'}
      </button>
    </div>
  );
}

export { emptyJob };
