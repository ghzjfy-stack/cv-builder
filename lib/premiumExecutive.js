/**
 * Executive Split (premium) — paint helpers for the shared CV DOM.
 * Keeps layout-specific rendering out of core updateCV paths.
 */
(function (global) {
  'use strict';

  var NUM_RE = /(?:\d+(?:[.,]\d+)?\s*%|\d[\d,]{0,6}|\b(?:SLA|KPI|ROI)\b)/i;

  function text(v) {
    return String(v == null ? '' : v).trim();
  }

  function splitList(raw) {
    return text(raw)
      .split(/[\n,،;؛]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function jobLines(job) {
    var fromBullets = Array.isArray(job && job.bullets)
      ? job.bullets
          .map(function (b) {
            return text(b).replace(/^[•\-*\u2022·]+\s*/, '');
          })
          .filter(Boolean)
      : [];
    if (fromBullets.length) return fromBullets;
    return text(job && job.description)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(function (line) {
        return line.replace(/^[•\-*\u2022·]+\s*/, '').trim();
      })
      .filter(Boolean);
  }

  function skillPct(label, index) {
    var t = text(label).toLowerCase();
    if (/expert|מומחה|native|אם/.test(t)) return 96;
    if (/advanced|מתקדם|high|גבוה|שוטפ|fluent/.test(t)) return 88;
    if (/proficient|טוב|good|מקצוע/.test(t)) return 76;
    if (/intermediate|בינונ/.test(t)) return 58;
    if (/basic|בסיס|beginner/.test(t)) return 38;
    var hash = 0;
    for (var i = 0; i < t.length; i++) hash = (hash * 31 + t.charCodeAt(i)) >>> 0;
    return 62 + ((hash + index * 17) % 31);
  }

  function normalizeLangLevel(levelLabel, isEnglish) {
    var raw = text(levelLabel);
    var low = raw.toLowerCase();
    if (!low) return '';
    var id = '';
    if (/אם נוספת|bilingual/.test(low)) id = 'bilingual';
    else if (/אם|native|mother/.test(low)) id = 'native';
    else if (/מקצוע|professional|c2|full professional|שליטה מקצועית|טכני|technical/.test(low)) id = 'professional';
    else if (/שוטפ|fluent|גבוה|advanced|high|c1|רמה גבוהה|שליטה גבוהה/.test(low)) id = 'fluent';
    else if (/בינונ|intermediate|b1|b2|טוב|good|רמה בינונית|שליטה בינונית/.test(low)) id = 'intermediate';
    else if (/בסיס|basic|a1|a2|beginner|רמה בסיסית|שליטה בסיסית/.test(low)) id = 'basic';
    else return raw;

    var labels = {
      native: { he: 'שפת אם', en: 'Native' },
      bilingual: { he: 'שפת אם נוספת', en: 'Bilingual' },
      professional: { he: 'שליטה מקצועית', en: 'Professional' },
      fluent: { he: 'שליטה גבוהה', en: 'Fluent' },
      intermediate: { he: 'שליטה בינונית', en: 'Intermediate' },
      basic: { he: 'שליטה בסיסית', en: 'Basic' }
    };
    var pack = labels[id];
    return isEnglish ? pack.en : pack.he;
  }

  function paintLanguageLevels(container, raw, opts) {
    if (!container) return;
    container.replaceChildren();
    var isEnglish = !!(opts && opts.isEnglish);
    var parseLang = (opts && opts.parseLangEntry) || function (entry) {
      var rawEntry = text(entry);
      var dash = rawEntry.match(/^(.*?)\s+[—–\-]\s+(.+)$/);
      if (dash) return { name: dash[1].trim(), levelLabel: dash[2].trim() };
      var m = rawEntry.match(/^(.*?)(?:\((.*)\))?$/);
      return {
        name: (m && m[1] ? m[1] : entry).trim(),
        levelLabel: (m && m[2] ? m[2] : '').trim(),
      };
    };
    var items = splitList(raw);
    if (!items.length) return;
    var list = document.createElement('div');
    list.className = 'exs-lang-list';
    items.forEach(function (entry) {
      var parsed = parseLang(entry);
      var row = document.createElement('div');
      row.className = 'exs-lang-row';
      var name = document.createElement('span');
      name.className = 'exs-lang-name';
      name.setAttribute('dir', 'auto');
      name.textContent = parsed.name;
      row.appendChild(name);
      var levelText = normalizeLangLevel(parsed.levelLabel, isEnglish);
      if (levelText) {
        var level = document.createElement('span');
        level.className = 'exs-lang-level';
        level.setAttribute('dir', 'auto');
        level.textContent = levelText;
        row.appendChild(level);
      }
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function boldMetrics(line) {
    var frag = document.createDocumentFragment();
    var re = /(\d+(?:[.,]\d+)?\s*%|\d[\d,]{0,6})/g;
    var last = 0;
    var m;
    var str = String(line);
    while ((m = re.exec(str))) {
      if (m.index > last) frag.appendChild(document.createTextNode(str.slice(last, m.index)));
      var strong = document.createElement('strong');
      strong.className = 'exs-metric';
      strong.textContent = m[0];
      frag.appendChild(strong);
      last = m.index + m[0].length;
    }
    if (last < str.length) frag.appendChild(document.createTextNode(str.slice(last)));
    if (!frag.childNodes.length) frag.appendChild(document.createTextNode(str));
    return frag;
  }

  function splitAchievements(lines) {
    var scored = [];
    var rest = [];
    lines.forEach(function (line) {
      if (NUM_RE.test(line)) scored.push(line);
      else rest.push(line);
    });
    var achievements = scored.slice(0, 3);
    if (achievements.length < 2) {
      var need = 2 - achievements.length;
      achievements = achievements.concat(rest.slice(0, need));
      rest = rest.slice(need);
    }
    if (!achievements.length && lines.length) {
      achievements = lines.slice(0, Math.min(3, lines.length));
      rest = lines.slice(achievements.length);
    }
    return { achievements: achievements, rest: rest };
  }

  function setDate(el, raw, setDateRangeEl) {
    if (!el) return;
    if (typeof setDateRangeEl === 'function') {
      setDateRangeEl(el, raw || '');
      return;
    }
    el.textContent = text(raw);
  }

  function paintSkillBars(container, raw) {
    if (!container) return;
    container.replaceChildren();
    var items = splitList(raw);
    if (!items.length) return;
    var list = document.createElement('div');
    list.className = 'exs-skill-list';
    items.forEach(function (label, i) {
      var row = document.createElement('div');
      row.className = 'exs-skill-row';
      var name = document.createElement('span');
      name.className = 'exs-skill-name';
      name.setAttribute('dir', 'auto');
      name.textContent = label;
      var track = document.createElement('span');
      track.className = 'exs-skill-track';
      track.setAttribute('role', 'meter');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      var pct = skillPct(label, i);
      track.setAttribute('aria-valuenow', String(pct));
      track.setAttribute('aria-label', label);
      var fill = document.createElement('span');
      fill.className = 'exs-skill-fill';
      fill.style.width = pct + '%';
      track.appendChild(fill);
      row.append(name, track);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function paintExperience(container, jobs, opts) {
    if (!container) return;
    container.classList.remove('whitespace-pre-line');
    container.replaceChildren();
    var isEnglish = !!(opts && opts.isEnglish);
    var listDir = isEnglish ? 'ltr' : 'rtl';
    var achieveLabel = isEnglish ? 'Key Achievements' : 'הישגים מרכזיים';
    var setDateRangeEl = opts && opts.setDateRangeEl;

    (jobs || []).forEach(function (job) {
      var wrap = document.createElement('article');
      wrap.className = 'cv-job exs-job';
      wrap.setAttribute('data-exp-company', job.company || '');
      wrap.setAttribute('data-exp-position', job.position || '');
      wrap.setAttribute('data-exp-dates', job.dates || '');

      var position = text(job.position || job.title);
      var company = text(job.company || job.role);
      var dates = text(job.dates || job.date);
      if (position) {
        var inline = position.match(/^((?:\d{4}|\b(?:19|20)\d{2}\b)(?:\s*[-–—]\s*[^\|]+)?)\s*\|\s*(.+)$/);
        if (inline) {
          if (!dates) dates = inline[1].trim();
          position = inline[2].trim();
        }
      }

      var band = document.createElement('div');
      band.className = 'exs-job-band';
      if (position) {
        var title = document.createElement('h4');
        title.className = 'cv-job-title exs-job-title';
        title.textContent = position;
        band.appendChild(title);
      }
      if (dates) {
        var date = document.createElement('span');
        date.className = 'cv-job-date exs-job-date';
        setDate(date, dates, setDateRangeEl);
        band.appendChild(date);
      }
      wrap.appendChild(band);

      if (company) {
        var role = document.createElement('p');
        role.className = 'cv-job-role exs-job-company';
        role.textContent = company;
        wrap.appendChild(role);
      }

      var lines = jobLines(job);
      var parts = splitAchievements(lines);

      if (parts.rest.length) {
        var ul = document.createElement('ul');
        ul.className = 'cv-job-list exs-job-list';
        ul.setAttribute('dir', listDir);
        parts.rest.forEach(function (line) {
          var li = document.createElement('li');
          li.setAttribute('dir', listDir);
          li.appendChild(document.createTextNode('\u2022\u00A0'));
          li.appendChild(boldMetrics(line));
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
      }

      if (parts.achievements.length) {
        var ach = document.createElement('div');
        ach.className = 'exs-achievements';
        var head = document.createElement('p');
        head.className = 'exs-achievements-title';
        var ico = document.createElement('span');
        ico.className = 'exs-achievements-ico';
        ico.setAttribute('aria-hidden', 'true');
        ico.textContent = '★';
        var label = document.createElement('span');
        label.textContent = achieveLabel;
        head.append(ico, label);
        ach.appendChild(head);

        var aul = document.createElement('ul');
        aul.className = 'exs-achievements-list';
        aul.setAttribute('dir', listDir);
        parts.achievements.forEach(function (line) {
          var li = document.createElement('li');
          li.setAttribute('dir', listDir);
          li.appendChild(document.createTextNode('\u2022\u00A0'));
          li.appendChild(boldMetrics(line));
          aul.appendChild(li);
        });
        ach.appendChild(aul);
        wrap.appendChild(ach);
      }

      container.appendChild(wrap);
    });
  }

  function applyLabels(root, isEnglish) {
    var scope = root || document.getElementById('cv-target');
    if (!scope) return;
    var contact = scope.querySelector('[data-i18n="contact"]');
    var skills = scope.querySelector('[data-i18n="skills"]');
    var languages = scope.querySelector('[data-i18n="languages"]');
    var summary = scope.querySelector('[data-i18n="summary"]');
    var experience = scope.querySelector('[data-i18n="experience"]');
    if (contact) contact.textContent = isEnglish ? 'Contact' : 'פרטי קשר';
    if (skills) skills.textContent = isEnglish ? 'Skills' : 'מיומנויות';
    if (languages) languages.textContent = isEnglish ? 'Languages' : 'שפות';
    if (summary) summary.textContent = isEnglish ? 'Professional Summary' : 'תקציר מקצועי';
    if (experience) experience.textContent = isEnglish ? 'Work Experience' : 'ניסיון תעסוקתי';
  }

  /**
   * Render premium-specific fields into the live CV DOM.
   * Expects helpers from the host page for education / dates / skeletons.
   */
  function render(ctx) {
    ctx = ctx || {};
    var isEnglish = !!ctx.isEnglish;
    applyLabels(ctx.root, isEnglish);

    var showSec = ctx.showSec || function (sec, on) {
      if (sec) sec.style.display = on ? 'block' : 'none';
    };
    var markSecSkel = ctx.markSecSkel || function () {};
    var paintEducationItems = ctx.paintEducationItems;
    var paintPreviewSkeleton = ctx.paintPreviewSkeleton;
    var renderReferences = ctx.renderReferences;

    var jobs = ctx.jobs || [];
    var hasExp = jobs.length > 0;
    var eduVal = ctx.education || '';
    var skillVal = ctx.skills || '';
    var langVal = ctx.languages || '';

    if (ctx.expOut) {
      if (hasExp) {
        paintExperience(ctx.expOut, jobs, {
          isEnglish: isEnglish,
          setDateRangeEl: ctx.setDateRangeEl,
        });
      } else if (typeof paintPreviewSkeleton === 'function') {
        paintPreviewSkeleton(ctx.expOut, 'job');
      } else {
        ctx.expOut.replaceChildren();
      }
    }
    showSec(ctx.expSec, true);
    markSecSkel(ctx.expSec, !hasExp);

    if (ctx.eduOut && typeof paintEducationItems === 'function') {
      paintEducationItems(ctx.eduOut, eduVal);
    }
    if (ctx.eduSide) ctx.eduSide.replaceChildren();
    showSec(ctx.eduSec, true);
    markSecSkel(ctx.eduSec, !eduVal);
    showSec(ctx.eduSideSec, false);
    markSecSkel(ctx.eduSideSec, false);

    paintSkillBars(ctx.skillOut, skillVal);
    showSec(ctx.skillSec, !!skillVal);

    paintLanguageLevels(ctx.langOut, langVal, {
      isEnglish: isEnglish,
      parseLangEntry: ctx.parseLangEntry,
    });
    showSec(ctx.langSec, !!langVal);

    if (ctx.extrasOut) ctx.extrasOut.replaceChildren();
    showSec(ctx.extrasSec, false);
    if (typeof renderReferences === 'function') renderReferences(false);
  }

  global.QCPremiumExecutive = {
    paintSkillBars: paintSkillBars,
    paintLanguageLevels: paintLanguageLevels,
    paintExperience: paintExperience,
    applyLabels: applyLabels,
    render: render,
    splitAchievements: splitAchievements,
  };
})(typeof window !== 'undefined' ? window : this);
