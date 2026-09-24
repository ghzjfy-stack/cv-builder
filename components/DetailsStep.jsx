import React, { useCallback } from 'react';
import { useFormData } from './FormDataContext';

/**
 * DetailsStep — Step 2 experience (jobs) form.
 * Reads/writes the shared form state via FormDataContext (backed by window.QCCvData).
 */

export default function DetailsStep({
  language = 'he',
  isEnglish: isEnglishProp,
  className = '',
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';
  const { formData, setFormData, addExperience } = useFormData();
  const experience = Array.isArray(formData.experience) ? formData.experience : [];

  const removeExperience = useCallback(
    (idToDelete) => {
      setFormData((prev) => ({
        ...prev,
        experience: (prev.experience || []).filter((item) => item && item.id !== idToDelete),
      }));
    },
    [setFormData]
  );

  const updateExperience = useCallback(
    (id, field, value) => {
      setFormData((prev) => ({
        ...prev,
        experience: (prev.experience || []).map((item) =>
          item && item.id === id
            ? { ...item, [field]: value == null ? '' : String(value) }
            : item
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
        const title = exp.title || exp.role || '';
        const dates = exp.dates || exp.years || '';
        const description = exp.description || '';
        return (
          <article
            key={key}
            className="experience-card is-open rounded-xl border border-slate-600 bg-slate-900/40 p-3"
          >
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
                placeholder={isEnglish ? 'Role / Title' : 'תפקיד'}
                value={title}
                onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
              />
              <input
                type="text"
                className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                placeholder={isEnglish ? 'Dates' : 'תאריכים/שנים'}
                value={dates}
                onChange={(e) => updateExperience(exp.id, 'dates', e.target.value)}
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
        <span aria-hidden="true">+ </span>
        {isEnglish ? 'Add Another Job' : 'הוסף משרה נוספת'}
      </button>
    </div>
  );
}
