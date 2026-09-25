import React from 'react';

const PRESENT_ANY = /^(present|current|today|now|היום|נוכחי|בהווה)$/i;
const YEAR_RE = /^(?:19|20)\d{2}$/;

/**
 * Normalize a present-tense end token for the active language.
 * Keeps Hebrew "נוכחי" (does not rewrite to היום).
 */
function normalizePresentToken(token, isEnglish) {
  const t = String(token || '').trim();
  if (!t) return '';
  if (PRESENT_ANY.test(t)) return isEnglish ? 'Present' : 'נוכחי';
  return t;
}

/**
 * Split a date-range string into { start, end } with chronological year-first order.
 * Fixes reversed RTL forms like "נוכחי - 2023" → start=2023, end=נוכחי.
 */
export function parseDateRangeParts(rawDates) {
  if (!rawDates) return { start: '', end: '' };
  let str = String(rawDates).trim();
  if (str.includes('\n')) str = str.split('\n')[0].trim();
  str = str.replace(/^[•\-–—*\u2022|·\s]+/, '').replace(/[•\-–—*\u2022|·\s]+$/, '').trim();

  const range = str.match(
    /^(.+?)\s*[-–—]\s*(.+)$/
  );
  if (!range) {
    return { start: str, end: '' };
  }

  let a = range[1].trim();
  let b = range[2].trim();

  // If end looks like a year and start is "נוכחי"/Present, swap to year-first.
  if (PRESENT_ANY.test(a) && YEAR_RE.test(b)) {
    return { start: b, end: a };
  }
  // If start is present-like text and end is a year-ish token
  if (PRESENT_ANY.test(a) && /\d{4}/.test(b) && !YEAR_RE.test(a)) {
    return { start: b.replace(/.*?((?:19|20)\d{2}).*/, '$1'), end: a };
  }

  return { start: a, end: b };
}

/**
 * Normalizes date range strings (e.g., "2010-2015" -> "2010 - 2015", "2020-present" -> "2020 - Present").
 * Always keeps chronological order: YEAR - end. Preserves Hebrew "נוכחי".
 */
export function formatCleanDates(rawDates, isEnglish) {
  if (!rawDates) return '';
  let str = String(rawDates).trim();
  if (str.includes('\n')) str = str.split('\n')[0].trim();
  str = str.replace(/^[•\-–—*\u2022|·\s]+/, '').replace(/[•\-–—*\u2022|·\s]+$/, '').trim();

  // Normalize "YYYY - YYYY|present|נוכחי" and also reversed "נוכחי - YYYY"
  str = str.replace(
    /(\d{4})\s*[-–—]\s*(\d{4}|present|current|today|now|היום|נוכחי|בהווה)/i,
    (_, y1, y2) => `${y1} - ${normalizePresentToken(y2, isEnglish)}`
  );
  str = str.replace(
    /(present|current|today|now|היום|נוכחי|בהווה)\s*[-–—]\s*(\d{4})/i,
    (_, present, y) => `${y} - ${normalizePresentToken(present, isEnglish)}`
  );

  const parts = parseDateRangeParts(str);
  if (!parts.start) return '';
  if (!parts.end) return parts.start;
  const end = normalizePresentToken(parts.end, isEnglish) || parts.end;
  return `${parts.start} - ${end}`;
}

/**
 * Removes inline merges and double dashes such as "2010-2015 - Institution",
 * "2010-2015 -- Institution", or "2010-2015 | BA במנהל עסקים".
 * Returns { dates, text } cleanly separated.
 */
export function splitInlineMergedDate(rawText, fallbackDates, isEnglish) {
  if (!rawText) return { dates: formatCleanDates(fallbackDates, isEnglish), text: '' };

  let str = String(rawText).trim();
  // Strip leading dashes, double dashes, or bullet artifacts
  str = str.replace(/^[•\-–—*\u2022|·\s]+/, '').trim();

  // Pattern matching: "2010-2015 - Institution", "2010-2015 -- Institution", "2010-2015 | Institution"
  const headerRe = /^((?:\d{4}|\b(?:19|20)\d{2}\b)(?:\s*[-–—]\s*(?:\d{4}|present|current|today|now|היום|נוכחי|בהווה|שנה [א-ד]))?)\s*(?:[\|·•]|\-{1,2}|[–—])\s*(.+)$/i;
  const match = str.match(headerRe);

  if (match) {
    const extractedDates = match[1].trim();
    const remainingText = match[2]
      .replace(/^[•\-–—*\u2022|·\s]+/, '')
      .replace(/[•\-–—*\u2022|·\s]+$/, '')
      .trim();
    return {
      dates: formatCleanDates(fallbackDates || extractedDates, isEnglish),
      text: remainingText,
    };
  }

  // Reverse pattern: "Institution - 2010-2015" or "Institution | 2010-2015"
  const reverseRe = /^(.+?)\s*(?:[\|·•]|\-{1,2}|[–—])\s*((?:\d{4}|\b(?:19|20)\d{2}\b)(?:\s*[-–—]\s*(?:\d{4}|present|current|today|now|היום|נוכחי|בהווה))?)$/i;
  const revMatch = str.match(reverseRe);
  if (revMatch) {
    const remainingText = revMatch[1]
      .replace(/^[•\-–—*\u2022|·\s]+/, '')
      .replace(/[•\-–—*\u2022|·\s]+$/, '')
      .trim();
    const extractedDates = revMatch[2].trim();
    return {
      dates: formatCleanDates(fallbackDates || extractedDates, isEnglish),
      text: remainingText,
    };
  }

  return {
    dates: formatCleanDates(fallbackDates, isEnglish),
    text: str.replace(/^[•\-–—*\u2022|·\s]+/, '').trim(),
  };
}

/**
 * Normalizes work experience item.
 */
export function normalizeJobItem(item, isEnglish) {
  if (!item) return null;
  if (typeof item === 'string') {
    const lines = item.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const { dates, text } = splitInlineMergedDate(lines[0], '', isEnglish);
    const company = (lines[1] || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim();
    const descriptions = lines
      .slice(company ? 2 : 1)
      .map((l) => l.replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
    return { title: text, company, dates, descriptions };
  }

  const rawTitle = item.position || item.title || '';
  const rawDates = item.dates || item.date || item.years || '';
  const rawCompany = item.company || item.role || item.employer || '';

  const { dates: cleanDates, text: cleanTitle } = splitInlineMergedDate(rawTitle, rawDates, isEnglish);
  const { text: cleanCompany } = splitInlineMergedDate(rawCompany, '', isEnglish);

  let descriptions = [];
  if (Array.isArray(item.bullets) && item.bullets.length) {
    descriptions = item.bullets
      .map((b) => String(b || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  } else if (Array.isArray(item.description)) {
    descriptions = item.description
      .map((b) => String(b || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  } else if (typeof item.description === 'string' && item.description.trim()) {
    descriptions = item.description
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  }

  return {
    id: item.id,
    title: cleanTitle,
    company: cleanCompany,
    dates: cleanDates,
    descriptions,
  };
}

/**
 * Normalizes education item.
 */
export function normalizeEducationItem(item, isEnglish) {
  if (!item) return null;
  if (typeof item === 'string') {
    const lines = item.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;

    const firstLineParsed = splitInlineMergedDate(lines[0], '', isEnglish);
    const secondLine = lines[1] || '';
    const secondLineParsed = splitInlineMergedDate(secondLine, '', isEnglish);

    let dates = firstLineParsed.dates || secondLineParsed.dates || '';
    let partA = firstLineParsed.text;
    let partB = secondLineParsed.text;

    const isDegreeLike = (s) =>
      /תואר|תעודת|תעודה|לימודי|b\.?a|b\.?sc|m\.?a|m\.?ba|ph\.?d|ll\.?b|b\.?ed|b\.?des|degree|bachelor|master|certificate/i.test(s);

    let title = partA;
    let subtitle = partB;

    if (partB && isDegreeLike(partB) && !isDegreeLike(partA)) {
      title = partB;
      subtitle = partA;
    } else if (partA && !partB) {
      title = partA;
      subtitle = '';
    }

    const descriptions = lines
      .slice(partB ? 2 : 1)
      .map((l) => l.replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);

    return { title, subtitle, dates, descriptions };
  }

  const rawDegree = item.degree || item.degreeName || item.field || '';
  const rawSchool = item.school || item.institution || item.college || item.university || '';
  const rawTitle = item.title || '';
  const rawRole = item.role || '';
  const rawDates = item.dates || item.year || item.date || item.years || '';

  let { dates: cleanDates, text: cleanDegree } = splitInlineMergedDate(rawDegree || rawTitle, rawDates, isEnglish);
  let { text: cleanSchool } = splitInlineMergedDate(rawSchool || rawRole, '', isEnglish);

  const isDegreeLike = (s) =>
    /תואר|תעודת|תעודה|לימודי|b\.?a|b\.?sc|m\.?a|m\.?ba|ph\.?d|ll\.?b|b\.?ed|b\.?des|degree|bachelor|master|certificate/i.test(s);

  let primaryTitle = cleanDegree;
  let subtitle = cleanSchool;

  if (rawRole && isDegreeLike(rawRole) && !isDegreeLike(primaryTitle)) {
    subtitle = primaryTitle;
    primaryTitle = cleanSchool;
  } else if (!primaryTitle && subtitle) {
    primaryTitle = subtitle;
    subtitle = '';
  }

  let descriptions = [];
  if (Array.isArray(item.bullets) && item.bullets.length) {
    descriptions = item.bullets
      .map((b) => String(b || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  } else if (Array.isArray(item.description)) {
    descriptions = item.description
      .map((b) => String(b || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  } else if (typeof item.description === 'string' && item.description.trim()) {
    descriptions = item.description
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  }

  return {
    id: item.id,
    title: primaryTitle,
    subtitle,
    dates: cleanDates,
    descriptions,
  };
}

/**
 * Normalizes military / army item.
 */
export function normalizeMilitaryItem(item, isEnglish) {
  if (!item) return null;
  if (typeof item === 'string') {
    const lines = item.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const { dates, text } = splitInlineMergedDate(lines[0], '', isEnglish);
    const subtitle = (lines[1] || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim();
    const descriptions = lines
      .slice(subtitle ? 2 : 1)
      .map((l) => l.replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);

    const roleOrUnit = text || (isEnglish ? 'Military Service' : 'שירות צבאי / לאומי');

    return {
      title: roleOrUnit,
      role: roleOrUnit,
      subtitle: subtitle && !text.includes(subtitle) ? subtitle : '',
      dates,
      descriptions,
    };
  }

  const rawRole = item.role || item.position || item.title || '';
  const rawDates = item.dates || item.years || item.date || '';
  const rawBranch = item.branch || item.unit || item.organization || item.org || '';

  const { dates: cleanDates, text: cleanRole } = splitInlineMergedDate(rawRole, rawDates, isEnglish);
  const { text: cleanBranch } = splitInlineMergedDate(rawBranch, '', isEnglish);

  let descriptions = [];
  if (Array.isArray(item.bullets) && item.bullets.length) {
    descriptions = item.bullets
      .map((b) => String(b || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  } else if (Array.isArray(item.description)) {
    descriptions = item.description
      .map((b) => String(b || '').replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  } else if (typeof item.description === 'string' && item.description.trim()) {
    descriptions = item.description
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.replace(/^[•\-–—*\u2022|·\s]+/, '').trim())
      .filter(Boolean);
  }

  const title =
    cleanRole ||
    cleanBranch ||
    (isEnglish ? 'Military Service' : 'שירות צבאי / לאומי');
  const subtitle =
    cleanRole && cleanBranch && !cleanRole.includes(cleanBranch) ? cleanBranch : '';

  return {
    id: item.id,
    title,
    role: title,
    subtitle,
    dates: cleanDates,
    descriptions,
  };
}

/**
 * Normalizes recommendation items.
 */
export function normalizeReferenceItem(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    const lines = item.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    return {
      name: lines[0],
      role: lines[1] || '',
      contact: lines.slice(2).join(' · '),
    };
  }
  return {
    name: item.name || item.title || '',
    role: item.role || item.position || item.company || '',
    contact: item.contact || item.phone || item.email || '',
  };
}

/**
 * Date range chip: forced LTR isolate so "2023 - נוכחי" never becomes "נוכחי - 2023"
 * and Hebrew end-tokens are not visually reversed.
 */
/**
 * Date range chip: forced LTR isolate so "2023 - נוכחי" never becomes "נוכחי - 2023"
 * and Hebrew end-tokens are not visually reversed.
 * Expects dates already language-normalized by formatCleanDates / normalize* helpers.
 */
export function DateRangeText({ dates, className = '' }) {
  const raw = String(dates || '').trim();
  if (!raw) return null;
  // Year-first only — do not rewrite Present/נוכחי (callers already cleaned language).
  const yearFirst = raw.replace(
    /(present|current|today|now|היום|נוכחי|בהווה)\s*[-–—]\s*(\d{4})/i,
    (_, present, y) => `${y} - ${present}`
  );
  const parts = parseDateRangeParts(yearFirst);
  const start = parts.start;
  const end = parts.end;
  return (
    <span
      className={`cv-job-date text-sm font-medium text-slate-500 whitespace-nowrap shrink-0 ${className}`.trim()}
      dir="ltr"
      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
    >
      {end ? (
        <>
          <bdi>{start}</bdi>
          <span className="cv-date-sep" aria-hidden="true">
            {' – '}
          </span>
          <bdi>{end}</bdi>
        </>
      ) : (
        <bdi>{start}</bdi>
      )}
    </span>
  );
}

/**
 * Reusable Unified Flex Header component for entry titles and dates.
 * Wraps title and dates inside:
 * `<div className="flex justify-between items-baseline w-full">`
 * - In RTL (Hebrew): Title automatically aligns Right, Dates align Left on the exact same line.
 * - In LTR (English): Title automatically aligns Left, Dates align Right on the exact same line.
 */
export function EntryFlexHeader({ title, dates, className = '' }) {
  if (!title && !dates) return null;
  return (
    <div className={`cv-job-head flex justify-between items-baseline w-full gap-x-3 ${className}`.trim()}>
      {title ? (
        <span className="cv-job-title font-bold text-base text-slate-800 leading-snug min-w-0">
          {title}
        </span>
      ) : (
        <span />
      )}
      <DateRangeText dates={dates} />
    </div>
  );
}

/**
 * Unified entry block used by Experience / Education / Military so headers match.
 */
export function CvEntryItem({
  title,
  subtitle,
  dates,
  descriptions = [],
  className = '',
  listClassName = 'cv-job-list',
}) {
  return (
    <div className={`cv-job ${className}`.trim()}>
      <EntryFlexHeader title={title} dates={dates} />
      {subtitle ? (
        <p className="cv-job-role text-sm text-slate-600 mt-0.5">{subtitle}</p>
      ) : null}
      {descriptions?.length > 0 ? (
        <ul className={`${listClassName} mt-2 text-sm text-slate-700`}>
          {descriptions.map((desc, dIdx) => (
            <li key={dIdx}>{desc}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export const SKILL_BADGE_CLASS =
  'cv-skill-badge bg-white/10 px-2.5 py-1 rounded text-xs inline-block m-0.5 border border-white/20';

/**
 * Sleek sidebar skill pill. `dir="auto"` keeps mixed Hebrew/English
 * (e.g. "מתקדם Excel", "CRM") from flipping order.
 */
export function SkillBadge({ children, className = '' }) {
  const text = children == null ? '' : String(children).trim();
  if (!text) return null;
  return (
    <span dir="auto" className={`${SKILL_BADGE_CLASS} ${className}`.trim()}>
      {text}
    </span>
  );
}

export function SkillBadgeList({ skills = [], className = '' }) {
  const items = (Array.isArray(skills) ? skills : [skills])
    .map((skill) => (typeof skill === 'string' ? skill : skill && skill.name))
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={`cv-skill-badges flex flex-wrap items-center ${className}`.trim()}>
      {items.map((skill, idx) => (
        <SkillBadge key={`${skill}-${idx}`}>{skill}</SkillBadge>
      ))}
    </div>
  );
}

/**
 * Reusable contact information renderer with long-text breaking (`break-all`)
 * so URLs and emails never clip awkwardly.
 */
export function ContactRow({ icon, value, href, isSidebar = false }) {
  if (!value) return null;

  const content = (
    <span className={isSidebar ? 'break-all overflow-wrap-anywhere' : 'break-words'}>
      {value}
    </span>
  );

  return (
    <div className={`flex items-start gap-1.5 min-w-0 ${isSidebar ? 'w-full' : ''}`}>
      {icon && (
        <span className="cv-contact-ico shrink-0 text-slate-400 select-none self-baseline leading-none mt-[0.15em]">
          {icon}
        </span>
      )}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-inherit hover:underline break-all overflow-wrap-anywhere min-w-0"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
