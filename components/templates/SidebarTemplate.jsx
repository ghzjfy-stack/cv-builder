import React from 'react';
import {
  CvEntryItem,
  ContactRow,
  SkillBadgeList,
  normalizeJobItem,
  normalizeEducationItem,
  normalizeMilitaryItem,
  normalizeReferenceItem,
} from './common';

/**
 * Sidebar Template: Two-column layout with fixed sidebar for contact & skills.
 *
 * Adheres strictly to:
 * 1. CORRECT SECTION ORDER:
 *    - Main Column:
 *      * Summary / Profile
 *      * Experience
 *      * Education
 *      * Military / National Service
 *      * Recommendations (MUST ALWAYS BE THE VERY LAST SECTION AT THE BOTTOM)
 *    - Sidebar:
 *      * Contact Info (with break-all for LinkedIn URLs)
 *      * Skills
 *      * Languages
 *
 * 2. UNIFIED FLEX HEADER FOR DATES:
 *    `<div className="flex justify-between items-baseline w-full">`
 *    - Title bold on start side (Right for RTL, Left for LTR).
 *    - Dates on opposite side on the exact same line (Left for RTL, Right for LTR).
 *
 * 3. SIDEBAR & CONTACT INFO FIXES:
 *    - Long text wrapping with `break-all` so URLs never clip awkwardly.
 *    - Military dates aligned cleanly on opposite side.
 */
export default function SidebarTemplate({
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
      className={`sidebar-template layout-sidebar p-6 md:p-8 bg-preview-white text-slate-800 ${className}`.trim()}
      dir={dir}
      {...props}
    >
      {/* Top Header */}
      <header className="border-b-2 dynamic-border pb-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {data.name || (isEnglish ? 'John Doe' : 'יונתן אשל')}
        </h1>
        {(data.title || data.role) && (
          <p className="text-base font-semibold text-slate-600 mt-1">
            {data.title || data.role}
          </p>
        )}
      </header>

      {/* Two-Column Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column (2/3 width): Summary -> Experience -> Education -> Military -> Recommendations */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Summary / Profile */}
          {data.summary && (
            <section className="cv-section cv-section-summary">
              <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
                {isEnglish ? 'Professional Summary' : 'תקציר מקצועי'}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {data.summary}
              </p>
            </section>
          )}

          {/* 2. Experience */}
          {jobs.length > 0 && (
            <section className="cv-section cv-section-experience">
              <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
                {isEnglish ? 'Work Experience' : 'ניסיון תעסוקתי'}
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
            <section className="cv-section cv-section-education">
              <h2 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-3">
                {isEnglish ? 'Education' : 'השכלה וקורסים'}
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
            <section className="cv-section cv-section-military">
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

          {/* 6. Recommendations (MUST ALWAYS BE THE VERY LAST SECTION AT THE BOTTOM) */}
          {references.length > 0 && (
            <section className="cv-section cv-section-references pt-3 border-t">
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

        {/* Sidebar Column (1/3 width): Contact info & Skills & Languages */}
        <aside className="cv-sidebar bg-slate-50 p-4 rounded-xl space-y-5 text-sm self-start overflow-hidden">
          {/* Contact Details with long text wrapping (break-all) */}
          <div className="space-y-2">
            <h3 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
              {isEnglish ? 'Contact Information' : 'פרטי התקשרות'}
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <ContactRow isSidebar icon="📞" value={data.phone} />
              <ContactRow isSidebar icon="✉️" value={data.email} href={data.email ? `mailto:${data.email}` : undefined} />
              <ContactRow isSidebar icon="📍" value={data.location} />
              <ContactRow isSidebar icon="🔗" value={data.linkedin} href={data.linkedin ? `https://${data.linkedin.replace(/^https?:\/\//, '')}` : undefined} />
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
                {isEnglish ? 'Skills' : 'כישורים'}
              </h3>
              <SkillBadgeList skills={skills} className="pt-1" />
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="space-y-2">
              <h3 className="cv-section-title font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
                {isEnglish ? 'Languages' : 'שפות'}
              </h3>
              <ul className="space-y-1 text-xs text-slate-700 pt-1">
                {languages.map((lang, idx) => (
                  <li key={idx} className="break-words">
                    {typeof lang === 'string' ? lang : lang.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
