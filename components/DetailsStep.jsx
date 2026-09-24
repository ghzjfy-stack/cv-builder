import React, { useCallback } from 'react';
import { useFormData } from './FormDataContext';

/**
 * DetailsStep — Step 2 experience + education form.
 * Reads/writes the shared form state via FormDataContext (backed by window.QCCvData).
 */

function TrashIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/** Shared delete control — same look for experience and education cards. */
function DeleteEntryButton({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      className="entry-delete-btn inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-400/45 bg-rose-950/40 px-2.5 py-1 text-xs font-bold text-rose-300 transition-colors hover:border-rose-400 hover:bg-rose-900/50 hover:text-rose-100 disabled:cursor-default disabled:opacity-35"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <TrashIcon />
      <span>{label}</span>
    </button>
  );
}

export default function DetailsStep({
  language = 'he',
  isEnglish: isEnglishProp,
  className = '',
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';
  const { formData, setFormData, addExperience, addEducation } = useFormData();
  // Always read fresh array copies so React sees new references after add.
  const experience = Array.isArray(formData.experience) ? formData.experience.slice() : [];
  const education = Array.isArray(formData.education) ? formData.education.slice() : [];
  const formRev = formData._formRev || `${experience.length}-${education.length}`;

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

  const removeEducation = useCallback(
    (idToDelete) => {
      setFormData((prev) => ({
        ...prev,
        education: (prev.education || []).filter((item) => item && item.id !== idToDelete),
      }));
    },
    [setFormData]
  );

  const updateEducation = useCallback(
    (id, field, value) => {
      setFormData((prev) => ({
        ...prev,
        education: (prev.education || []).map((item) =>
          item && item.id === id
            ? { ...item, [field]: value == null ? '' : String(value) }
            : item
        ),
      }));
    },
    [setFormData]
  );

  return (
    <div
      dir={dir}
      className={`details-step space-y-6 ${className}`.trim()}
      data-form-rev={formRev}
    >
      <section key={`exp-${formRev}-${experience.length}`} className="details-step-experience space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          {isEnglish ? 'Work Experience' : 'ניסיון תעסוקתי'}
        </h3>
        {experience.map((exp, index) => {
          const key = exp.id || index;
          const company = exp.company || '';
          const role = exp.role || exp.title || '';
          const dates = exp.dates || exp.years || '';
          const description = exp.description || '';
          const deleteLabel = isEnglish ? 'Delete job' : 'מחק משרה';
          return (
            <article
              key={key}
              className="experience-card is-open rounded-xl border border-slate-600 bg-slate-900/40 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  {isEnglish ? `Job ${index + 1}` : `משרה ${index + 1}`}
                </span>
                <DeleteEntryButton
                  label={deleteLabel}
                  disabled={experience.length <= 1}
                  onClick={() => removeExperience(exp.id)}
                />
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
      </section>

      <section key={`edu-${formRev}-${education.length}`} className="details-step-education space-y-3">
        <h3 className="text-sm font-bold text-slate-200">
          {isEnglish ? 'Education' : 'השכלה'}
        </h3>
        {education.map((edu, index) => {
          const key = edu.id || index;
          const institution = edu.institution || edu.org || edu.company || '';
          const degree = edu.degree || edu.title || '';
          const years = edu.years || edu.dates || '';
          const details = edu.details || edu.notes || edu.description || '';
          const deleteLabel = isEnglish ? 'Delete education' : 'מחק השכלה';
          return (
            <article
              key={key}
              className="entry-card experience-card is-open rounded-xl border border-slate-600 bg-slate-900/40 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  {isEnglish ? `Education ${index + 1}` : `השכלה ${index + 1}`}
                </span>
                <DeleteEntryButton
                  label={deleteLabel}
                  disabled={education.length <= 1}
                  onClick={() => removeEducation(edu.id)}
                />
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                  placeholder={isEnglish ? 'Institution' : 'מוסד לימודים'}
                  value={institution}
                  onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                />
                <input
                  type="text"
                  className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                  placeholder={isEnglish ? 'Degree' : 'תואר / תעודה / מגמה'}
                  value={degree}
                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                />
                <input
                  type="text"
                  className="studio-field w-full min-h-11 rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                  placeholder={isEnglish ? 'Years' : 'שנים/שנת סיום'}
                  value={years}
                  onChange={(e) => updateEducation(edu.id, 'years', e.target.value)}
                />
                <textarea
                  rows={3}
                  className="studio-field w-full rounded-lg border border-slate-600 bg-slate-900/60 p-2.5 text-sm text-white outline-none"
                  placeholder={isEnglish ? 'Details (optional)' : 'פירוט (לא חובה)'}
                  value={details}
                  onChange={(e) => updateEducation(edu.id, 'details', e.target.value)}
                />
              </div>
            </article>
          );
        })}

        <button
          type="button"
          id="btn-add-education-react"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-500/40 bg-teal-500/10 px-4 text-sm font-bold text-teal-200 hover:bg-teal-500/20"
          onClick={addEducation}
        >
          <span aria-hidden="true">+ </span>
          {isEnglish ? 'Add Another Education' : 'הוסף השכלה נוספת'}
        </button>
      </section>
    </div>
  );
}
