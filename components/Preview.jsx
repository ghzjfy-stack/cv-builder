import React from 'react';
import {
  EntryFlexHeader,
  ContactRow,
  formatCleanDates,
  splitInlineMergedDate,
  normalizeJobItem,
  normalizeEducationItem,
  normalizeMilitaryItem,
  normalizeReferenceItem,
} from './templates/common';
import { getTemplateComponent } from './templates';

export {
  formatCleanDates,
  splitInlineMergedDate,
  normalizeJobItem,
  normalizeEducationItem,
  normalizeMilitaryItem,
  normalizeReferenceItem,
  EntryFlexHeader,
  ContactRow,
};

/**
 * Preview component for CV Builder with dual-language (RTL / LTR) support.
 *
 * Requirements:
 * 1. CORRECT SECTION ORDER (CRITICAL):
 *    - Summary / Profile
 *    - Experience
 *    - Education
 *    - Military / National Service
 *    - Skills & Languages (or in Sidebar if applicable)
 *    - Recommendations (MUST ALWAYS BE THE VERY LAST SECTION AT THE BOTTOM)
 *
 * 2. UNIFIED FLEX HEADER FOR DATES:
 *    `<div className="flex justify-between items-baseline w-full">`
 *    - Title bold on start side (Right for RTL, Left for LTR).
 *    - Dates on opposite side on the exact same line (Left for RTL, Right for LTR).
 *    - Fix inline strings (remove double dashes like "2010-2015 - Institution").
 *
 * 3. SIDEBAR & CONTACT INFO FIXES:
 *    - Long text wrapping using `break-all` so URLs never clip awkwardly.
 *    - Dynamic direction `dir={isEnglish ? 'ltr' : 'rtl'}`.
 */
export default function Preview({
  data = {},
  language = 'he',
  isEnglish: isEnglishProp,
  template,
  layout,
  className = '',
  ...props
}) {
  const isEnglish = isEnglishProp !== undefined ? Boolean(isEnglishProp) : language === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';

  // If a specific template is requested, delegate to that template component
  const templateName = template || layout;
  if (templateName && templateName !== 'default') {
    const TemplateComp = getTemplateComponent(templateName);
    if (TemplateComp) {
      return (
        <TemplateComp
          data={data}
          isEnglish={isEnglish}
          className={className}
          {...props}
        />
      );
    }
  }

  // Parse Experience items
  const rawJobs = data.jobs || data.experience || data.work || [];
  const rawJobsList = Array.isArray(rawJobs)
    ? rawJobs
    : typeof rawJobs === 'string'
    ? rawJobs.split(/\n\s*\n/).filter(Boolean)
    : [];
  const jobs = rawJobsList.map((j) => normalizeJobItem(j, isEnglish)).filter(Boolean);

  // Parse Education items
  const rawEducation = data.education || data.edu || data.studies || [];
  const rawEduList = Array.isArray(rawEducation)
    ? rawEducation
    : typeof rawEducation === 'string'
    ? rawEducation.split(/\n(?=(?:\d{4}|\b(?:19|20)\d{2}\b))/).filter(Boolean)
    : [];
  const education = rawEduList.map((e) => normalizeEducationItem(e, isEnglish)).filter(Boolean);

  // Parse Military / Army items
  const rawMilitary = data.military || data.army || data.militaryService || data.service || null;
  let rawMilList = [];
  if (Array.isArray(rawMilitary)) {
    rawMilList = rawMilitary;
  } else if (rawMilitary && typeof rawMilitary === 'object') {
    rawMilList = [rawMilitary];
  } else if (typeof rawMilitary === 'string' && rawMilitary.trim()) {
    rawMilList = [rawMilitary.trim()];
  }
  const military = rawMilList.map((m) => normalizeMilitaryItem(m, isEnglish)).filter(Boolean);

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
      id="cv-preview-wrapper"
      className={`cv-preview-wrapper relative overflow-hidden bg-preview-white transition-all ${
        isEnglish ? 'cv-lang-en' : 'cv-lang-he'
      } ${className}`.trim()}
      dir={dir}
      {...props}
    >
      <div
        id="cv-target"
        className={`cv-target ${isEnglish ? 'cv-lang-en' : 'cv-lang-he'}`}
        dir={dir}
      >
        {/* Header / Personal Details */}
        <header id="cv-header" className="border-b-2 dynamic-border pb-4 mb-5">
          <h1 id="out-name" className="text-3xl font-bold">
            {data.name || (isEnglish ? 'John Doe' : 'יונתן אשל')}
          </h1>
          {(data.title || data.role) && (
            <p id="out-title" className="text-sm font-semibold text-slate-600 mt-1">
              {data.title || data.role}
            </p>
          )}

          {/* Contact Details with long text wrapping (break-all) */}
          <div className="cv-contact-header flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-slate-500">
            <ContactRow icon="📞" value={data.phone} />
            <ContactRow icon="✉️" value={data.email} href={data.email ? `mailto:${data.email}` : undefined} />
            <ContactRow icon="📍" value={data.location} />
            <ContactRow icon="🔗" value={data.linkedin} href={data.linkedin ? `https://${data.linkedin.replace(/^https?:\/\//, '')}` : undefined} />
          </div>
        </header>

        {/* 1. Summary / Profile */}
        {data.summary && (
          <section className="cv-section cv-section-summary mb-5">
            <h2 className="cv-section-title font-bold text-sm text-slate-900 border-b pb-1 mb-2">
              {isEnglish ? 'Professional Summary' : 'תמצית מקצועית'}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.summary}</p>
          </section>
        )}

        {/* 2. Work Experience */}
        {jobs.length > 0 && (
          <section className="cv-section cv-section-experience mb-5">
            <h2 className="cv-section-title font-bold text-sm text-slate-900 border-b pb-1 mb-3">
              {isEnglish ? 'Work Experience' : 'ניסיון תעסוקתי'}
            </h2>
            <div className="space-y-4">
              {jobs.map((job, idx) => (
                <div key={job.id || idx} className="cv-job">
                  {/* Unified flex header container wrapping role and dates */}
                  <EntryFlexHeader title={job.title} dates={job.dates} />

                  {/* Subtitle Row underneath: Company Name */}
                  {job.company && (
                    <p className="cv-job-role text-sm text-slate-600 mt-0.5">
                      {job.company}
                    </p>
                  )}

                  {/* Bullet descriptions underneath */}
                  {job.descriptions?.length > 0 && (
                    <ul className="cv-job-list list-disc mt-2 space-y-1 ps-5 text-sm text-slate-700">
                      {job.descriptions.map((desc, dIdx) => (
                        <li key={dIdx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Education Section */}
        {education.length > 0 && (
          <section className="cv-section cv-section-education mb-5">
            <h2 className="cv-section-title font-bold text-sm text-slate-900 border-b pb-1 mb-3">
              {isEnglish ? 'Education' : 'השכלה וקורסים'}
            </h2>
            <div className="space-y-4">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="cv-edu-item">
                  {/* Unified flex header container wrapping degree/title and dates */}
                  <EntryFlexHeader title={edu.title} dates={edu.dates} />

                  {/* Subtitle Row underneath: Institution / School */}
                  {edu.subtitle && (
                    <p className="cv-edu-meta text-sm text-slate-600 mt-0.5">
                      {edu.subtitle}
                    </p>
                  )}

                  {/* Bullet descriptions underneath (if any) */}
                  {edu.descriptions?.length > 0 && (
                    <ul className="cv-edu-list list-disc mt-2 space-y-1 ps-5 text-sm text-slate-700">
                      {edu.descriptions.map((desc, dIdx) => (
                        <li key={dIdx}>{desc}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Military / Army Section */}
        {military.length > 0 && (
          <section className="cv-section cv-section-military mb-5">
            <h2 className="cv-section-title font-bold text-sm text-slate-900 border-b pb-1 mb-3">
              {isEnglish ? 'Military / National Service' : 'שירות צבאי / לאומי'}
            </h2>
            <div className="space-y-4">
              {military.map((mil, idx) => {
                const roleOrUnit = mil.role || mil.title || (isEnglish ? 'Military Service' : 'שירות צבאי / לאומי');
                return (
                  <div key={mil.id || idx} className="cv-military-item">
                    {/* Unified flex header: Military role and dates on the exact same line */}
                    <EntryFlexHeader title={roleOrUnit} dates={mil.dates} />

                    {/* Bullet descriptions underneath (if any) */}
                    {mil.descriptions?.length > 0 && (
                      <ul className="cv-military-list list-disc mt-2 space-y-1 ps-5 text-sm text-slate-700">
                        {mil.descriptions.map((desc, dIdx) => (
                          <li key={dIdx}>{desc}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Skills & Languages */}
        {(skills.length > 0 || languages.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {skills.length > 0 && (
              <section className="cv-section cv-section-skills">
                <h2 className="cv-section-title font-bold text-sm text-slate-900 border-b pb-1 mb-2">
                  {isEnglish ? 'Skills' : 'כישורים ומיומנויות'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 font-medium break-all"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section className="cv-section cv-section-languages">
                <h2 className="cv-section-title font-bold text-sm text-slate-900 border-b pb-1 mb-2">
                  {isEnglish ? 'Languages' : 'שפות'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs rounded-md bg-slate-100 text-slate-700 font-medium break-all"
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
          <section className="cv-section cv-section-references mt-5 pt-3 border-t">
            <h2 className="cv-section-title font-bold text-sm text-slate-900 pb-1 mb-3">
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
    </div>
  );
}
