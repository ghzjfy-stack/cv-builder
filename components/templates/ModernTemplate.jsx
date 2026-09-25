import React from 'react';
import {
  CvEntryItem,
  ContactRow,
  normalizeJobItem,
  normalizeEducationItem,
  normalizeMilitaryItem,
  normalizeReferenceItem,
} from './common';

/**
 * Modern Template: Contemporary design with left/right accent bar and clean cards.
 *
 * Adheres strictly to:
 * 1. CORRECT SECTION ORDER:
 *    - Summary / Profile
 *    - Experience
 *    - Education
 *    - Military / National Service
 *    - Skills & Languages
 *    - Recommendations (MUST ALWAYS BE THE VERY LAST SECTION AT THE BOTTOM)
 *
 * 2. UNIFIED FLEX HEADER FOR DATES:
 *    `<div className="flex justify-between items-baseline w-full">`
 *    - Title bold on start side (Right for RTL, Left for LTR).
 *    - Dates on opposite side on the exact same line (Left for RTL, Right for LTR).
 *
 * 3. DUAL-LANGUAGE (RTL & LTR) DYNAMIC DIRECTION:
 *    - Uses `dir={isEnglish ? 'ltr' : 'rtl'}`.
 */
export default function ModernTemplate({
  data = {},
  isEnglish = false,
  className = '',
  ...props
}) {
  const dir = isEnglish ? 'ltr' : 'rtl';

  // Experience
  const rawJobs = data.jobs || data.experience || [];
  const jobs = (Array.isArray(rawJobs) ? rawJobs : [rawJobs])
    .map((j) => normalizeJobItem(j, isEnglish))
    .filter(Boolean);

  // Education
  const rawEdu = data.education || [];
  const education = (Array.isArray(rawEdu) ? rawEdu : [rawEdu])
    .map((e) => normalizeEducationItem(e, isEnglish))
    .filter(Boolean);

  // Military
  const rawMil = data.military || data.militaryService || [];
  const military = (Array.isArray(rawMil) ? rawMil : rawMil ? [rawMil] : [])
    .map((m) => normalizeMilitaryItem(m, isEnglish))
    .filter(Boolean);

  // Skills
  const skills = Array.isArray(data.skills)
    ? data.skills
    : typeof data.skills === 'string'
    ? data.skills.split(/[,\n•·]/).map((s) => s.trim()).filter(Boolean)
    : [];

  // Languages
  const languages = Array.isArray(data.languages)
    ? data.languages
    : typeof data.languages === 'string'
    ? data.languages.split(/[,\n•·]/).map((l) => l.trim()).filter(Boolean)
    : [];

  // Recommendations / References (MUST ALWAYS BE THE VERY LAST SECTION)
  const rawRefs = data.references || data.recommendations || [];
  const references = (Array.isArray(rawRefs) ? rawRefs : rawRefs ? [rawRefs] : [])
    .map((r) => normalizeReferenceItem(r))
    .filter(Boolean);

  return (
    <div
      className={`modern-template layout-modern p-6 md:p-8 bg-preview-white text-slate-800 ${className}`.trim()}
      dir={dir}
      {...props}
    >
      {/* Modern Banner Header */}
      <header className="bg-slate-900 text-white p-6 rounded-2xl mb-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {data.name || (isEnglish ? 'Israel Israeli' : 'ישראל ישראלי')}
        </h1>
        {(data.title || data.role) && (
          <p className="text-sm font-medium text-slate-300 mt-1">
            {data.title || data.role}
          </p>
        )}

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-xs text-slate-300 pt-3 border-t border-slate-700/60">
          <ContactRow icon="📞" value={data.phone} />
          <ContactRow icon="✉️" value={data.email} href={data.email ? `mailto:${data.email}` : undefined} />
          <ContactRow icon="📍" value={data.location} />
          <ContactRow icon="🔗" value={data.linkedin} href={data.linkedin ? `https://${data.linkedin.replace(/^https?:\/\//, '')}` : undefined} />
        </div>
      </header>

      {/* 1. Summary / Profile */}
      {data.summary && (
        <section className="cv-section cv-section-summary mb-6">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
            {isEnglish ? 'About Me' : 'אודות'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {data.summary}
          </p>
        </section>
      )}

      {/* 2. Experience */}
      {jobs.length > 0 && (
        <section className="cv-section cv-section-experience mb-6">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
            {isEnglish ? 'Experience' : 'ניסיון מקצועי'}
          </h2>
          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <CvEntryItem
                key={job.id || idx}
                title={job.title}
                subtitle={job.company}
                dates={job.dates}
                descriptions={job.descriptions}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Education */}
      {education.length > 0 && (
        <section className="cv-section cv-section-education mb-6">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
            {isEnglish ? 'Education' : 'השכלה'}
          </h2>
          <div className="space-y-4">
            {education.map((edu, idx) => (
              <CvEntryItem
                key={edu.id || idx}
                title={edu.title}
                subtitle={edu.subtitle}
                dates={edu.dates}
                descriptions={edu.descriptions}
                listClassName="cv-edu-list"
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Military / National Service */}
      {military.length > 0 && (
        <section className="cv-section cv-section-military mb-6">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
            {isEnglish ? 'Military / National Service' : 'שירות צבאי / לאומי'}
          </h2>
          <div className="space-y-4">
            {military.map((mil, idx) => (
              <CvEntryItem
                key={mil.id || idx}
                title={mil.title}
                subtitle={mil.subtitle}
                dates={mil.dates}
                descriptions={mil.descriptions}
                listClassName="cv-military-list"
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Skills & Languages */}
      {(skills.length > 0 || languages.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {skills.length > 0 && (
            <section className="cv-section cv-section-skills">
              <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
                {isEnglish ? 'Skills' : 'כישורים'}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-800 font-medium"
                  >
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section className="cv-section cv-section-languages">
              <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
                {isEnglish ? 'Languages' : 'שפות'}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-800 font-medium"
                  >
                    {typeof lang === 'string' ? lang : lang.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 6. Recommendations (MUST ALWAYS BE THE VERY LAST SECTION AT THE BOTTOM) */}
      {references.length > 0 && (
        <section className="cv-section cv-section-references mt-6 pt-3 border-t">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 pb-1 mb-3">
            {isEnglish ? 'References' : 'המלצות'}
          </h2>
          <div className="space-y-3">
            {references.map((ref, idx) => (
              <div key={idx} className="cv-ref-item text-sm">
                <span className="font-bold text-slate-800">{ref.name}</span>
                {ref.role && <span className="text-slate-600 ms-1">({ref.role})</span>}
                {ref.contact && (
                  <p className="text-xs text-slate-500 mt-0.5 break-all">{ref.contact}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
