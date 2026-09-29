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
    container.classList.remove('text-slate-700', 'whitespace-pre-line');
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
    var localize = opts && opts.localizeLangEntry;
    var items = [];
    if (Array.isArray(raw)) {
      raw.forEach(function (row) {
        if (!row) return;
        if (typeof localize === 'function') {
          var localized = localize(row, isEnglish);
          if (localized && localized.name) items.push(localized);
          return;
        }
        var name = text(row.name || row.language || row.customName);
        var levelLabel = text(row.levelLabel || row.proficiency || row.level || '');
        if (name) items.push({ name: name, levelLabel: levelLabel });
      });
    } else {
      splitList(raw).forEach(function (entry) {
        var parsed = parseLang(entry);
        if (typeof localize === 'function') {
          var mapped = localize(parsed, isEnglish);
          if (mapped && mapped.name) {
            items.push(mapped);
            return;
          }
        }
        if (parsed && parsed.name) items.push(parsed);
      });
    }
    if (!items.length) return;
    var list = document.createElement('div');
    list.className = 'exs-lang-list';
    items.forEach(function (parsed) {
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

  function paintReferences(container, raw, opts) {
    if (!container) return;
    container.replaceChildren();
    container.classList.remove('text-slate-700', 'whitespace-pre-line');
    var val = text(raw);
    if (!val) return;
    var isEnglish = !!(opts && opts.isEnglish);
    var parseBlocks = opts && opts.parseReferenceBlocks;
    var blocks = typeof parseBlocks === 'function'
      ? parseBlocks(val)
      : val.split(/\n\s*\n/).map(function (block) {
          var lines = String(block || '').split('\n').map(function (line) {
            return line.trim();
          }).filter(Boolean);
          return { name: lines[0] || '', role: lines[1] || '', lines: lines.slice(2) };
        }).filter(function (ref) {
          return ref.name || ref.role || (ref.lines && ref.lines.length);
        });

    if (!blocks.length) {
      var plain = document.createElement('div');
      plain.className = 'exs-ref-plain';
      plain.setAttribute('dir', 'auto');
      plain.textContent = val;
      container.appendChild(plain);
      return;
    }

    var list = document.createElement('div');
    list.className = 'exs-ref-list';
    list.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    blocks.forEach(function (ref) {
      var box = document.createElement('div');
      box.className = 'exs-ref-item';
      if (ref.name) {
        var nameEl = document.createElement('p');
        nameEl.className = 'exs-ref-name';
        nameEl.setAttribute('dir', 'auto');
        nameEl.textContent = ref.name;
        box.appendChild(nameEl);
      }
      if (ref.role) {
        var roleEl = document.createElement('p');
        roleEl.className = 'exs-ref-role';
        roleEl.setAttribute('dir', 'auto');
        roleEl.textContent = ref.role;
        box.appendChild(roleEl);
      }
      (ref.lines || []).forEach(function (line) {
        var p = document.createElement('p');
        p.className = 'exs-ref-line';
        p.setAttribute('dir', 'auto');
        p.textContent = line;
        box.appendChild(p);
      });
      list.appendChild(box);
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
    container.classList.remove('text-slate-700', 'whitespace-pre-line');
    var items = splitList(raw);
    if (!items.length) return;
    var list = document.createElement('ul');
    list.className = 'exs-skill-list';
    items.forEach(function (label) {
      var li = document.createElement('li');
      li.className = 'exs-skill-item';
      li.setAttribute('dir', 'auto');
      li.textContent = label;
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  function paintExperience(container, jobs, opts) {
    if (!container) return;
    container.classList.remove('whitespace-pre-line');
    container.replaceChildren();
    var isEnglish = !!(opts && opts.isEnglish);
    var listDir = isEnglish ? 'ltr' : 'rtl';
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
        role.className = 'cv-job-role cv-job-company exs-job-company';
        role.textContent = company;
        wrap.appendChild(role);
      }

      var lines = jobLines(job);
      if (lines.length) {
        var ul = document.createElement('ul');
        ul.className = 'cv-job-list exs-job-list';
        ul.setAttribute('dir', listDir);
        lines.forEach(function (line) {
          var li = document.createElement('li');
          li.setAttribute('dir', listDir);
          li.appendChild(document.createTextNode('\u2022\u00A0'));
          li.appendChild(boldMetrics(line));
          ul.appendChild(li);
        });
        wrap.appendChild(ul);
      }

      container.appendChild(wrap);
    });
  }

  function applyLabels(root, isEnglish) {
    var scope = root || document.getElementById('cv-target');
    if (!scope) return;
    var dir = isEnglish ? 'ltr' : 'rtl';
    var contact = scope.querySelector('[data-i18n="contact"]');
    var skills = scope.querySelector('[data-i18n="skills"]');
    var languages = scope.querySelector('[data-i18n="languages"]');
    var references = scope.querySelector('[data-i18n="references"]');
    var summary = scope.querySelector('[data-i18n="summary"]');
    var experience = scope.querySelector('[data-i18n="experience"]');
    var educationSide = scope.querySelector('#sec-education-side [data-i18n="educationSide"], #sec-education-side .cv-section-title');
    var extrasTitle = scope.querySelector('#sec-extras-side .cv-section-title, #sec-extras-side [data-i18n="military"]');
    var pack = (global.CV_I18N && global.CV_I18N[isEnglish ? 'en' : 'he']) || {};
    var i18n = pack.i18n || {};
    if (contact) contact.textContent = i18n.contact || (isEnglish ? 'Contact' : 'יצירת קשר');
    if (skills) skills.textContent = i18n.skills || (isEnglish ? 'Skills' : 'כישורים');
    if (languages) languages.textContent = i18n.languages || (isEnglish ? 'Languages' : 'שפות');
    if (references) references.textContent = i18n.references || (isEnglish ? 'References' : 'המלצות');
    if (summary) summary.textContent = i18n.summary || (isEnglish ? 'Professional Summary' : 'תקציר מקצועי');
    if (experience) experience.textContent = i18n.experience || (isEnglish ? 'Work Experience' : 'ניסיון תעסוקתי');
    if (educationSide) educationSide.textContent = i18n.educationSide || (isEnglish ? 'Education' : 'השכלה');
    if (extrasTitle) extrasTitle.textContent = i18n.military || (isEnglish ? 'Military / National Service' : 'שירות צבאי / לאומי');

    scope.classList.toggle('cv-lang-en', !!isEnglish);
    scope.setAttribute('dir', isEnglish ? 'ltr' : 'rtl');
    ['.cv-sidebar', '.cv-sidebar-inner', '.cv-main', '#cv-header'].forEach(function (sel) {
      var el = scope.querySelector(sel);
      if (el) el.setAttribute('dir', dir);
    });
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
    var paintMilitaryPreview = ctx.paintMilitaryPreview;

    var jobs = ctx.jobs || [];
    var hasExp = jobs.length > 0;
    var eduVal = ctx.education || '';
    var skillVal = ctx.skills || '';
    var langEntries = Array.isArray(ctx.languageEntries) ? ctx.languageEntries : null;
    var langVal = ctx.languages || '';
    var hasLangEntries = !!(langEntries && langEntries.length);
    var hasLang = hasLangEntries || !!text(langVal);
    var langPaintSource = hasLangEntries ? langEntries : langVal;
    var milVal = ctx.military || '';
    var refVal = ctx.references || '';
    var root = ctx.root || document.getElementById('cv-target');

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

    /* Sidebar: languages, skills, education, military, recommendations — main: summary, experience */
    if (ctx.eduSide && typeof paintEducationItems === 'function') {
      paintEducationItems(ctx.eduSide, eduVal);
    }
    if (ctx.eduOut) ctx.eduOut.replaceChildren();
    showSec(ctx.eduSec, false);
    markSecSkel(ctx.eduSec, false);
    showSec(ctx.eduSideSec, !!eduVal);
    markSecSkel(ctx.eduSideSec, !eduVal);

    paintSkillBars(ctx.skillOut, skillVal);
    showSec(ctx.skillSec, !!skillVal);

    paintLanguageLevels(ctx.langOut, langPaintSource, {
      isEnglish: isEnglish,
      parseLangEntry: ctx.parseLangEntry,
      localizeLangEntry: ctx.localizeLangEntry,
    });
    showSec(ctx.langSec, hasLang);

    if (ctx.extrasOut && typeof paintMilitaryPreview === 'function') {
      paintMilitaryPreview(ctx.extrasOut, milVal);
      showSec(ctx.extrasSec, !!ctx.extrasOut.childElementCount);
    } else if (ctx.extrasOut) {
      ctx.extrasOut.replaceChildren();
      showSec(ctx.extrasSec, false);
    } else {
      showSec(ctx.extrasSec, false);
    }
    if (ctx.milOut) ctx.milOut.replaceChildren();
    showSec(ctx.milSec, false);
    markSecSkel(ctx.milSec, false);

    /* Keep recommendations in the premium rail (not the main column). */
    var sidebarInner = root && root.querySelector('.cv-sidebar-inner');
    var refSec = ctx.refSec || (root && root.querySelector('#sec-references'));
    var refOut = ctx.refOut || (root && root.querySelector('#out-references'));
    if (sidebarInner && refSec && refSec.parentElement !== sidebarInner) {
      sidebarInner.appendChild(refSec);
    }
    if (refOut) {
      paintReferences(refOut, refVal, {
        isEnglish: isEnglish,
        parseReferenceBlocks: ctx.parseReferenceBlocks,
      });
    }
    showSec(refSec, !!text(refVal));
  }

  global.QCPremiumExecutive = {
    paintSkillBars: paintSkillBars,
    paintLanguageLevels: paintLanguageLevels,
    paintReferences: paintReferences,
    paintExperience: paintExperience,
    applyLabels: applyLabels,
    render: render,
    splitAchievements: splitAchievements,
  };
})(typeof window !== 'undefined' ? window : this);
