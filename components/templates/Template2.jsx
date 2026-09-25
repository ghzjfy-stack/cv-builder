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
 * Template 2: Modern Executive Single-Column Layout
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
 *    - Bold title on start side (Right for RTL, Left for LTR).
 *    - Dates on opposite side on the exact same line (Left for RTL, Right for LTR).
 *
 * 3. DUAL-LANGUAGE (RTL & LTR) DYNAMIC DIRECTION:
 *    - Uses `dir={isEnglish ? 'ltr' : 'rtl'}`.
 */
export default function Template2({
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
      className={`template-2 layout-executive p-6 md:p-8 bg-preview-white text-slate-800 ${className}`.trim()}
      dir={dir}
      {...props}
    >
      {/* Centered / Clean Header */}
      <header className="text-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          {data.name || (isEnglish ? 'Israel Israeli' : 'ישראל ישראלי')}
        </h1>
        {(data.title || data.role) && (
          <p className="text-sm font-semibold tracking-wide text-slate-500 mt-1 uppercase">
            {data.title || data.role}
          </p>
        )}

        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
          <ContactRow icon="📞" value={data.phone} />
          <ContactRow icon="✉️" value={data.email} href={data.email ? `mailto:${data.email}` : undefined} />
          <ContactRow icon="📍" value={data.location} />
          <ContactRow icon="🔗" value={data.linkedin} href={data.linkedin ? `https://${data.linkedin.replace(/^https?:\/\//, '')}` : undefined} />
        </div>
      </header>

      {/* 1. Summary / Profile */}
      {data.summary && (
        <section className="cv-section cv-section-summary mb-5">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
            {isEnglish ? 'Executive Profile' : 'פרופיל מקצועי'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {data.summary}
          </p>
        </section>
      )}

      {/* 2. Experience */}
      {jobs.length > 0 && (
        <section className="cv-section cv-section-experience mb-5">
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
        <section className="cv-section cv-section-education mb-5">
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
        <section className="cv-section cv-section-military mb-5">
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
        <section className="cv-section cv-section-skills mb-5">
          <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
            {isEnglish ? 'Skills & Languages' : 'כישורים ושפות'}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium"
              >
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
            {languages.map((lang, idx) => (
              <span
                key={`lang-${idx}`}
                className="px-2 py-1 rounded bg-slate-200 text-slate-800 font-medium"
              >
                {typeof lang === 'string' ? lang : lang.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 6. Recommendations (MUST ALWAYS BE THE VERY LAST SECTION AT THE BOTTOM) */}
      {references.length > 0 && (
        <section className="cv-section cv-section-references mt-5 pt-2 border-t">
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
