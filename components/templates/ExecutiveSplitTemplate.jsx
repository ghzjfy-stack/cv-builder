import React from 'react';
import {
  ContactRow,
  normalizeJobItem,
  normalizeEducationItem,
  normalizeMilitaryItem,
  normalizeReferenceItem,
  formatCleanDates,
} from './common';

const NUM_RE = /(?:\d+(?:[.,]\d+)?\s*%|\d[\d,]{0,6}|\b(?:SLA|KPI|ROI)\b)/i;

function splitList(value) {
  if (Array.isArray(value)) return value.map((s) => String(s || '').trim()).filter(Boolean);
  return String(value || '')
    .split(/[\n,،;؛]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLang(entry) {
  const raw = String(entry || '').trim();
  const dash = raw.match(/^(.*?)\s+[—–]\s+(.+)$/);
  if (dash) return { name: dash[1].trim(), level: dash[2].trim() };
  const m = raw.match(/^(.*?)(?:\((.*)\))?$/);
  return { name: (m?.[1] || entry).trim(), level: (m?.[2] || '').trim() };
}

function skillPct(label, index) {
  const t = String(label || '').toLowerCase();
  if (/expert|מומחה|native|אם/.test(t)) return 96;
  if (/advanced|מתקדם|high|גבוה|שוטפ|fluent/.test(t)) return 88;
  if (/proficient|טוב|good|מקצוע/.test(t)) return 76;
  if (/intermediate|בינונ/.test(t)) return 58;
  if (/basic|בסיס|beginner/.test(t)) return 38;
  let hash = 0;
  for (let i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
  return 62 + ((hash + index * 17) % 31);
}

function langStars(level) {
  const low = String(level || '').toLowerCase();
  let pct = 70;
  if (/אם|native|mother/.test(low)) pct = 100;
  else if (/מקצוע|c2|full professional/.test(low)) pct = 92;
  else if (/fluent|שוטפת|גבוה|advanced|high/.test(low)) pct = 86;
  else if (/טוב|good/.test(low)) pct = 68;
  else if (/בינונ|intermediate/.test(low)) pct = 52;
  else if (/בסיס|basic/.test(low)) pct = 34;
  return Math.max(1, Math.min(5, Math.round(pct / 20)));
}

function boldMetrics(line) {
  const parts = [];
  const re = /(\d+(?:[.,]\d+)?\s*%|\d[\d,]{0,6})/g;
  let last = 0;
  let m;
  const str = String(line);
  while ((m = re.exec(str))) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    parts.push(
      <strong key={`${m.index}-${m[0]}`} className="exs-metric">
        {m[0]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts.length ? parts : str;
}

function splitAchievements(lines) {
  const scored = [];
  const rest = [];
  lines.forEach((line) => {
    if (NUM_RE.test(line)) scored.push(line);
    else rest.push(line);
  });
  let achievements = scored.slice(0, 3);
  if (achievements.length < 2) {
    const need = 2 - achievements.length;
    achievements = achievements.concat(rest.slice(0, need));
    rest.splice(0, need);
  }
  if (!achievements.length && lines.length) {
    achievements = lines.slice(0, Math.min(3, lines.length));
    return { achievements, rest: lines.slice(achievements.length) };
  }
  return { achievements, rest };
}

function jobLines(job) {
  if (Array.isArray(job.bullets) && job.bullets.length) {
    return job.bullets.map((b) => String(b || '').replace(/^[•\-*\u2022·]+\s*/, '').trim()).filter(Boolean);
  }
  return String(job.description || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^[•\-*\u2022·]+\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Executive Split — premium two-column CV.
 * Dark-grey left rail (contact / languages / skills) + spacious white main column.
 */
export default function ExecutiveSplitTemplate({
  data = {},
  isEnglish = false,
  className = '',
  ...props
}) {
  const dir = isEnglish ? 'ltr' : 'rtl';
  const jobs = (Array.isArray(data.jobs || data.experience) ? data.jobs || data.experience : [])
    .map((j) => normalizeJobItem(j, isEnglish))
    .filter(Boolean);
  const education = (Array.isArray(data.education) ? data.education : data.education ? [data.education] : [])
    .map((e) => normalizeEducationItem(e, isEnglish))
    .filter(Boolean);
  const military = (Array.isArray(data.military || data.militaryService)
    ? data.military || data.militaryService
    : data.military
      ? [data.military]
      : []
  )
    .map((m) => normalizeMilitaryItem(m, isEnglish))
    .filter(Boolean);
  const references = (Array.isArray(data.references || data.recommendations)
    ? data.references || data.recommendations
    : data.references
      ? [data.references]
      : []
  )
    .map((r) => normalizeReferenceItem(r))
    .filter(Boolean);

  const skills = splitList(data.skills);
  const languages = splitList(data.languages).map(parseLang);
  const photo = data.photo || data.photoUrl || '';

  return (
    <div
      className={`layout-premium exs-root ${isEnglish ? 'cv-lang-en' : ''} ${className}`.trim()}
      dir={dir}
      {...props}
    >
      <aside className="cv-sidebar exs-sidebar" aria-label={isEnglish ? 'Profile sidebar' : 'סרגל פרופיל'}>
        <div className="cv-photo-block exs-photo-block">
          <div className="cv-photo exs-photo">
            {photo ? (
              <img src={photo} alt="" />
            ) : (
              <div className="exs-photo-fallback" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="cv-sidebar-inner exs-sidebar-inner">
          <section className="exs-side-sec">
            <h3 className="cv-section-title">{isEnglish ? 'Contact' : 'פרטי קשר'}</h3>
            <div className="cv-contact-sidebar">
              {data.phone ? <ContactRow isSidebar icon="☎" value={data.phone} /> : null}
              {data.email ? (
                <ContactRow
                  isSidebar
                  icon="✉"
                  value={data.email}
                  href={data.email ? `mailto:${data.email}` : undefined}
                />
              ) : null}
              {data.location ? <ContactRow isSidebar icon="⌖" value={data.location} /> : null}
              {data.linkedin ? (
                <ContactRow
                  isSidebar
                  icon="in"
                  value={data.linkedin}
                  href={
                    data.linkedin
                      ? `https://${String(data.linkedin).replace(/^https?:\/\//, '')}`
                      : undefined
                  }
                />
              ) : null}
            </div>
          </section>

          {languages.length ? (
            <section className="exs-side-sec">
              <h3 className="cv-section-title">{isEnglish ? 'Languages' : 'שפות'}</h3>
              <div className="exs-lang-list">
                {languages.map((lang) => {
                  const filled = langStars(lang.level || lang.name);
                  return (
                    <div key={lang.name} className="exs-lang-row">
                      <span className="exs-lang-name" dir="auto">
                        {lang.name}
                      </span>
                      <span className="exs-lang-stars" aria-label={lang.level || lang.name}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={`exs-star${i < filled ? ' is-on' : ''}`} aria-hidden="true">
                            ★
                          </span>
                        ))}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {skills.length ? (
            <section className="exs-side-sec">
              <h3 className="cv-section-title">{isEnglish ? 'Skills' : 'מיומנויות'}</h3>
              <div className="exs-skill-list">
                {skills.map((skill, i) => {
                  const pct = skillPct(skill, i);
                  return (
                    <div key={skill} className="exs-skill-row">
                      <span className="exs-skill-name" dir="auto">
                        {skill}
                      </span>
                      <span
                        className="exs-skill-track"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pct}
                        aria-label={skill}
                      >
                        <span className="exs-skill-fill" style={{ width: `${pct}%` }} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </aside>

      <header className="exs-header" id="cv-header">
        <h1 className="exs-name" id="out-name">
          {data.name || (isEnglish ? 'Jonathan Cohen' : 'יונתן כהן')}
        </h1>
        <p className="exs-title" id="out-title">
          {data.title || ''}
        </p>
      </header>

      <div className="cv-main exs-main">
        {data.summary ? (
          <section className="exs-sec">
            <h3 className="cv-section-title">{isEnglish ? 'Professional Summary' : 'תקציר מקצועי'}</h3>
            <p className="exs-summary whitespace-pre-line">{data.summary}</p>
          </section>
        ) : null}

        {jobs.length ? (
          <section className="exs-sec">
            <h3 className="cv-section-title">{isEnglish ? 'Work Experience' : 'ניסיון תעסוקתי'}</h3>
            {jobs.map((job, idx) => {
              const lines = jobLines(job);
              const { achievements, rest } = splitAchievements(lines);
              return (
                <article key={`${job.company}-${job.position}-${idx}`} className="cv-job exs-job">
                  <div className="exs-job-band">
                    <h4 className="cv-job-title exs-job-title">{job.position || job.title}</h4>
                    {job.dates ? (
                      <span className="cv-job-date exs-job-date" dir="ltr">
                        {formatCleanDates(job.dates, isEnglish)}
                      </span>
                    ) : null}
                  </div>
                  {job.company ? <p className="cv-job-role exs-job-company">{job.company}</p> : null}
                  {rest.length ? (
                    <ul className="cv-job-list exs-job-list" dir={dir}>
                      {rest.map((line) => (
                        <li key={line}>•&nbsp;{boldMetrics(line)}</li>
                      ))}
                    </ul>
                  ) : null}
                  {achievements.length ? (
                    <div className="exs-achievements">
                      <p className="exs-achievements-title">
                        <span className="exs-achievements-ico" aria-hidden="true">
                          ★
                        </span>
                        <span>{isEnglish ? 'Key Achievements' : 'הישגים מרכזיים'}</span>
                      </p>
                      <ul className="exs-achievements-list" dir={dir}>
                        {achievements.map((line) => (
                          <li key={line}>•&nbsp;{boldMetrics(line)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        ) : null}

        {education.length ? (
          <section className="exs-sec">
            <h3 className="cv-section-title">{isEnglish ? 'Education' : 'השכלה'}</h3>
            {education.map((edu, idx) => (
              <div key={`${edu.school}-${idx}`} className="cv-job cv-edu-item">
                <div className="cv-job-head flex justify-between items-baseline w-full">
                  <p className="cv-job-title cv-edu-school font-bold">{edu.school || edu.title}</p>
                  {edu.dates ? (
                    <span className="cv-job-date cv-edu-date" dir="ltr">
                      {formatCleanDates(edu.dates, isEnglish)}
                    </span>
                  ) : null}
                </div>
                {edu.degree || edu.meta ? (
                  <p className="cv-job-role cv-edu-meta">{edu.degree || edu.meta}</p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {military.length ? (
          <section className="exs-sec">
            <h3 className="cv-section-title">{isEnglish ? 'Military / National Service' : 'שירות צבאי / לאומי'}</h3>
            {military.map((m, idx) => (
              <div key={`${m.role}-${idx}`} className="cv-job">
                <div className="cv-job-head flex justify-between items-baseline w-full">
                  <p className="cv-job-title">{m.role || m.title}</p>
                  {m.dates || m.years ? (
                    <span className="cv-job-date" dir="ltr">
                      {formatCleanDates(m.dates || m.years, isEnglish)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {references.length ? (
          <section className="exs-sec">
            <h3 className="cv-section-title">{isEnglish ? 'References' : 'המלצות'}</h3>
            {references.map((ref, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {[ref.name, ref.title, ref.contact].filter(Boolean).join(' · ')}
              </p>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
