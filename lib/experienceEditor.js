(function (global) {
    var copy = {
        he: {
            addJob: '+ הוסף משרה נוספת',
            removeJob: 'מחק משרה',
            moveUp: 'העבר למעלה',
            moveDown: 'העבר למטה',
            jobN: 'משרה',
            role: 'תפקיד',
            employer: 'שם החברה / מעסיק',
            dates: 'שנים / תאריכים',
            description: 'תיאור תפקיד והישגים',
            present: 'בהווה',
            datesPh: '2021 - 2024 / בהווה',
            rolePh: 'מנהל/ת מכירות',
            employerPh: 'שם החברה / מעסיק',
            descPh: '• ניהול שוטף של קשרי לקוחות והגדלת מחזור המכירות\n• עבודה תחת לחץ ופתרון בעיות בזמן אמת',
            presetsTitle: '💡 בולטים וניסוחים מוכנים'
        },
        en: {
            addJob: '+ Add another job',
            removeJob: 'Delete job',
            moveUp: 'Move up',
            moveDown: 'Move down',
            jobN: 'Job',
            role: 'Job title',
            employer: 'Company / employer',
            dates: 'Dates / years',
            description: 'Role description and achievements',
            present: 'Present',
            datesPh: '2021 - 2024 / Present',
            rolePh: 'Sales manager',
            employerPh: 'Company name',
            descPh: '• Ongoing client relationships and growing sales volume\n• Worked under pressure and solved problems in real time',
            presetsTitle: '💡 Ready-made bullets'
        }
    };

    var PRESETS = {
        he: [
            {
                id: 'sales',
                label: 'מכירות ושירות',
                bullets: [
                    'ניהול שוטף של קשרי לקוחות והגדלת מחזור המכירות ב-X%',
                    'עמידה ביעדים חודשיים וזיהוי הזדמנויות מכירה נוספות',
                    'טיפול בפניות לקוחות מורכבות ושמירה על שביעות רצון גבוהה'
                ]
            },
            {
                id: 'ops',
                label: 'ניהול ותפעול',
                bullets: [
                    'ניהול צוות והובלת תהליכי עבודה יומיומיים',
                    'שיפור תהליכים תפעוליים והפחתת זמני טיפול',
                    'עבודה תחת לחץ ופתרון בעיות בזמן אמת'
                ]
            },
            {
                id: 'admin',
                label: 'אדמיניסטרציה',
                bullets: [
                    'ניהול יומן, התכתבות ותיעוד שוטף מול לקוחות וספקים',
                    'הפקת דוחות, הזמנות ורכישות ותפעול משרד מקצה לקצה',
                    'קליטת עובדים חדשים ותמיכה במנהלים בפרויקטים שוטפים'
                ]
            },
            {
                id: 'support',
                label: 'תמיכה טכנית',
                bullets: [
                    'טיפול בפניות תמיכה ואבחון תקלות עד לפתרון מלא',
                    'תיעוד תהליכים ושיפור זמני מענה לפי SLA',
                    'הדרכת משתמשים והעברת משוב לצוות המוצר'
                ]
            }
        ],
        en: [
            {
                id: 'sales',
                label: 'Sales & service',
                bullets: [
                    'Managed ongoing client relationships and grew sales volume by X%',
                    'Hit monthly targets and spotted extra sales opportunities',
                    'Handled complex customer cases while keeping satisfaction high'
                ]
            },
            {
                id: 'ops',
                label: 'Ops & management',
                bullets: [
                    'Led a team and ran day-to-day operations',
                    'Improved processes and reduced handling time',
                    'Solved problems in real time under pressure'
                ]
            },
            {
                id: 'admin',
                label: 'Administration',
                bullets: [
                    'Ran calendars, correspondence, and records with clients and vendors',
                    'Prepared reports, orders, and end-to-end office operations',
                    'Onboarded new hires and supported managers on live projects'
                ]
            },
            {
                id: 'support',
                label: 'Technical support',
                bullets: [
                    'Handled support tickets and diagnosed issues through to a full fix',
                    'Documented processes and improved response times against SLA',
                    'Trained users and passed product feedback to the team'
                ]
            }
        ]
    };

    /** @type {{ id: string, dates: string, title: string, role: string, company: string, employer: string, description: string, bullets: string[] }[]} */
    var jobs = [];
    var syncing = false;
    var bound = false;

    function nextJobId() {
        return 'job-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function t() {
        return copy[global.QCCvLang === 'en' ? 'en' : 'he'];
    }

    function presets() {
        return PRESETS[global.QCCvLang === 'en' ? 'en' : 'he'];
    }

    function experienceEl() {
        return document.getElementById('in-experience');
    }

    function sanitize(value) {
        if (global.QCSanitize && typeof QCSanitize.text === 'function') return QCSanitize.text(value);
        return String(value || '').trim();
    }

    function stripBullet(line) {
        return String(line || '').replace(/^[•\-*\u2022]\s*/, '').trim();
    }

    function bulletsFromText(text) {
        return String(text || '')
            .replace(/\r\n/g, '\n')
            .split('\n')
            .map(stripBullet)
            .filter(Boolean);
    }

    function descriptionFromBullets(list) {
        return (list || [])
            .map(stripBullet)
            .filter(Boolean)
            .map(function (b) { return '• ' + b; })
            .join('\n');
    }

    function isBlankJob(job) {
        if (!job) return true;
        var bullets = job.bullets || [];
        var hasBullet = bullets.some(function (b) { return sanitize(b); }) ||
            bulletsFromText(job.description || '').length > 0;
        return !sanitize(job.dates || '') &&
            !sanitize(job.role || job.title || '') &&
            !sanitize(job.employer || job.company || '') &&
            !hasBullet;
    }

    function normalizeJob(job) {
        var role = String((job && (job.role || job.title)) || '');
        var employer = String((job && (job.employer || job.company)) || '');
        var bullets = job && Array.isArray(job.bullets) ? job.bullets.slice() : [];
        var description = job && job.description != null ? String(job.description) : '';
        if (!bullets.length && description) bullets = bulletsFromText(description);
        if (!description && bullets.length) description = descriptionFromBullets(bullets);
        bullets = bullets.map(function (b) { return String(b == null ? '' : b); });
        return {
            id: (job && job.id) || nextJobId(),
            dates: (job && job.dates) || '',
            role: role,
            title: role,
            employer: employer,
            company: employer,
            bullets: bullets,
            description: description
        };
    }

    function emptyJob() {
        return normalizeJob({
            id: nextJobId(),
            dates: '',
            title: '',
            role: '',
            company: '',
            employer: '',
            description: '',
            bullets: []
        });
    }

    function parseHeader(headerLine) {
        var parts = String(headerLine || '').split('|').map(function (p) {
            return p.trim();
        });
        if (parts.length >= 3) {
            return { dates: parts[0] || '', role: parts[1] || '', employer: parts.slice(2).join(' | ') };
        }
        if (parts.length === 2) {
            return { dates: parts[0] || '', role: parts[1] || '', employer: '' };
        }
        return { dates: '', role: parts[0] || '', employer: '' };
    }

    function parseJobs(text) {
        var chunks = String(text || '').replace(/\r\n/g, '\n').split(/\n{2,}/);
        var out = [];
        chunks.forEach(function (chunk) {
            var lines = chunk.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
            if (!lines.length) return;
            var parsed = parseHeader(lines[0]);
            var rest = lines.slice(1);
            if (!parsed.employer && rest.length && !/^[•\-*\u2022]/.test(rest[0])) {
                parsed.employer = rest[0];
                rest = rest.slice(1);
            }
            var bullets = rest.map(stripBullet).filter(Boolean);
            out.push(normalizeJob({
                dates: parsed.dates,
                role: parsed.role,
                title: parsed.role,
                employer: parsed.employer,
                company: parsed.employer,
                bullets: bullets,
                description: descriptionFromBullets(bullets)
            }));
        });
        return out.length ? out : [emptyJob()];
    }

    function serializeJobs(list) {
        return (list || []).map(function (job) {
            var dates = sanitize(job.dates || '');
            var role = sanitize(job.role || job.title || '');
            var employer = sanitize(job.employer || job.company || '');
            var bullets = bulletsFromText(job.description || '').length
                ? bulletsFromText(job.description || '')
                : (job.bullets || []).map(stripBullet).filter(Boolean);
            var header = [dates, role].filter(Boolean).join(' | ');
            var lines = [];
            if (header) lines.push(header);
            if (employer) lines.push(employer);
            bullets.forEach(function (b) { lines.push('• ' + b); });
            return lines.join('\n');
        }).filter(Boolean).join('\n\n');
    }

    function writeExperience(list, triggerUpdate) {
        var el = experienceEl();
        if (list) jobs = list.map(normalizeJob);
        if (!jobs.length) jobs = [emptyJob()];
        if (!el) return;
        syncing = true;
        el.value = serializeJobs(jobs);
        syncing = false;
        if (triggerUpdate && typeof global.updateCV === 'function') {
            try { global.updateCV(); } catch (err) { /* keep cards on screen */ }
        }
        if (global.QCDraft && typeof QCDraft.saveSoon === 'function') QCDraft.saveSoon();
        else if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
    }

    function readJobFromCard(card, jobIndex) {
        if (!jobs[jobIndex]) jobs[jobIndex] = emptyJob();
        var dates = card.querySelector('[data-job-dates]');
        var role = card.querySelector('[data-job-role]');
        var employer = card.querySelector('[data-job-employer]');
        var desc = card.querySelector('[data-job-desc]');
        jobs[jobIndex].dates = dates ? dates.value : '';
        jobs[jobIndex].role = role ? role.value : '';
        jobs[jobIndex].title = jobs[jobIndex].role;
        jobs[jobIndex].employer = employer ? employer.value : '';
        jobs[jobIndex].company = jobs[jobIndex].employer;
        jobs[jobIndex].description = desc ? desc.value : '';
        jobs[jobIndex].bullets = bulletsFromText(jobs[jobIndex].description);
    }

    function onJobFieldInput(card, jobIndex) {
        readJobFromCard(card, jobIndex);
        writeExperience(jobs, true);
    }

    function iconBtn(html, className, attrs) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = className;
        Object.keys(attrs || {}).forEach(function (key) {
            btn.setAttribute(key, attrs[key]);
        });
        btn.innerHTML = html;
        return btn;
    }

    function trashSvg() {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
    }

    function chevronSvg(dir) {
        var d = dir === 'up'
            ? 'M7 14l5-5 5 5'
            : 'M7 10l5 5 5-5';
        return '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + d + '"/></svg>';
    }

    function labeledField(labelText, control) {
        var wrap = document.createElement('div');
        wrap.className = 'experience-field';
        var caption = document.createElement('span');
        caption.className = 'experience-field-label';
        caption.textContent = labelText;
        wrap.append(caption, control);
        return wrap;
    }

    function renderJobs() {
        var host = document.getElementById('experience-items');
        if (!host) return;
        var pack = t();
        var chips = presets();
        if (!jobs.length) jobs = [emptyJob()];
        host.innerHTML = '';
        jobs.forEach(function (job, jobIndex) {
            var card = document.createElement('article');
            card.className = 'experience-card';
            card.setAttribute('data-job-index', String(jobIndex));

            var toolbar = document.createElement('div');
            toolbar.className = 'experience-card-toolbar';
            var badge = document.createElement('span');
            badge.className = 'experience-card-badge';
            badge.textContent = pack.jobN + ' ' + (jobIndex + 1);
            var actions = document.createElement('div');
            actions.className = 'experience-card-actions';
            var upBtn = iconBtn(chevronSvg('up'), 'experience-icon-btn', {
                'data-move-job': String(jobIndex),
                'data-move-dir': '-1',
                title: pack.moveUp,
                'aria-label': pack.moveUp
            });
            var downBtn = iconBtn(chevronSvg('down'), 'experience-icon-btn', {
                'data-move-job': String(jobIndex),
                'data-move-dir': '1',
                title: pack.moveDown,
                'aria-label': pack.moveDown
            });
            var removeBtn = iconBtn(trashSvg(), 'experience-icon-btn is-danger', {
                'data-remove-job': String(jobIndex),
                title: pack.removeJob,
                'aria-label': pack.removeJob
            });
            removeBtn.addEventListener('click', function (evt) {
                evt.preventDefault();
                evt.stopPropagation();
                removeJob(jobIndex);
            });
            if (jobIndex === 0) upBtn.disabled = true;
            if (jobIndex === jobs.length - 1) downBtn.disabled = true;
            actions.append(upBtn, downBtn, removeBtn);
            toolbar.append(badge, actions);

            function makeInput(attr, placeholder, value) {
                var input = document.createElement('input');
                input.type = 'text';
                input.className = 'studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11';
                input.setAttribute(attr, '1');
                input.placeholder = placeholder;
                input.value = value || '';
                input.addEventListener('input', function () {
                    onJobFieldInput(card, jobIndex);
                });
                return input;
            }

            var roleInput = makeInput('data-job-role', pack.rolePh, job.role);
            var employerInput = makeInput('data-job-employer', pack.employerPh, job.employer);

            var datesRow = document.createElement('div');
            datesRow.className = 'experience-dates-row';
            var datesInput = makeInput('data-job-dates', pack.datesPh, job.dates);
            var presentBtn = document.createElement('button');
            presentBtn.type = 'button';
            presentBtn.className = 'experience-present-btn';
            presentBtn.setAttribute('data-present-job', String(jobIndex));
            presentBtn.textContent = pack.present;
            datesRow.append(datesInput, presentBtn);

            var desc = document.createElement('textarea');
            desc.rows = 5;
            desc.className = 'studio-field experience-desc w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none';
            desc.setAttribute('data-job-desc', '1');
            desc.placeholder = pack.descPh;
            desc.value = job.description || descriptionFromBullets(job.bullets);
            desc.addEventListener('input', function () {
                onJobFieldInput(card, jobIndex);
            });

            var presetsWrap = document.createElement('div');
            presetsWrap.className = 'experience-presets';
            var presetsTitle = document.createElement('p');
            presetsTitle.className = 'experience-presets-title';
            presetsTitle.textContent = pack.presetsTitle;
            var chipRow = document.createElement('div');
            chipRow.className = 'experience-preset-row';
            chips.forEach(function (preset) {
                var chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'experience-preset-chip';
                chip.setAttribute('data-preset-job', String(jobIndex));
                chip.setAttribute('data-preset-id', preset.id);
                chip.textContent = preset.label;
                chipRow.appendChild(chip);
            });
            presetsWrap.append(presetsTitle, chipRow);

            card.append(
                toolbar,
                labeledField(pack.role, roleInput),
                labeledField(pack.employer, employerInput),
                labeledField(pack.dates, datesRow),
                labeledField(pack.description, desc),
                presetsWrap
            );
            host.appendChild(card);
        });
    }

    function collectCardsIntoJobs() {
        var host = document.getElementById('experience-items');
        if (!host) return;
        Array.prototype.forEach.call(host.querySelectorAll('.experience-card'), function (card) {
            var idx = Number(card.getAttribute('data-job-index'));
            if (Number.isFinite(idx)) readJobFromCard(card, idx);
        });
    }

    function refreshJobsFromTextarea() {
        if (syncing) return;
        var el = experienceEl();
        var trailing = [];
        for (var i = jobs.length - 1; i >= 0; i--) {
            if (isBlankJob(jobs[i]) && jobs[i].id) trailing.unshift(jobs[i]);
            else break;
        }
        jobs = parseJobs(el ? el.value : '');
        trailing.forEach(function (job) {
            var already = jobs.some(function (item) { return item.id === job.id; });
            if (!already) jobs.push(normalizeJob(job));
        });
        if (!jobs.length) jobs = [emptyJob()];
        renderJobs();
    }

    function focusJobCard(index) {
        var card = document.querySelector('#experience-items .experience-card[data-job-index="' + index + '"]');
        if (!card) return;
        var focusEl = card.querySelector('[data-job-role]') || card.querySelector('input');
        if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
        if (typeof card.scrollIntoView === 'function') {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function addJob(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        collectCardsIntoJobs();
        jobs.push(emptyJob());
        renderJobs();
        writeExperience(jobs, true);
        focusJobCard(jobs.length - 1);
        return false;
    }

    function removeJob(index) {
        collectCardsIntoJobs();
        if (!Number.isFinite(index) || index < 0 || index >= jobs.length) return;
        jobs.splice(index, 1);
        if (!jobs.length) jobs = [emptyJob()];
        renderJobs();
        writeExperience(jobs, true);
    }

    function moveJob(index, dir) {
        collectCardsIntoJobs();
        var next = index + dir;
        if (next < 0 || next >= jobs.length) return;
        var swap = jobs[index];
        jobs[index] = jobs[next];
        jobs[next] = swap;
        writeExperience(jobs, true);
        renderJobs();
    }

    function applyPresent(index) {
        if (!jobs[index]) return;
        collectCardsIntoJobs();
        var pack = t();
        var year = String(new Date().getFullYear());
        var current = sanitize(jobs[index].dates);
        if (!current) {
            jobs[index].dates = year + ' - ' + pack.present;
        } else if (/[-–—]/.test(current)) {
            jobs[index].dates = current.replace(/\s*[-–—]\s*[^\n]*$/, ' - ' + pack.present);
        } else {
            jobs[index].dates = current + ' - ' + pack.present;
        }
        writeExperience(jobs, true);
        renderJobs();
        var card = document.querySelector('#experience-items .experience-card[data-job-index="' + index + '"]');
        var dates = card && card.querySelector('[data-job-dates]');
        if (dates && typeof dates.focus === 'function') dates.focus();
    }

    function applyPreset(index, presetId) {
        var list = presets();
        var preset = null;
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === presetId) preset = list[i];
        }
        if (!preset || !jobs[index]) return;
        collectCardsIntoJobs();
        var incoming = descriptionFromBullets(preset.bullets);
        var current = String(jobs[index].description || '').replace(/\s+$/, '');
        jobs[index].description = current ? current + '\n' + incoming : incoming;
        jobs[index].bullets = bulletsFromText(jobs[index].description);
        writeExperience(jobs, true);
        var card = document.querySelector('#experience-items .experience-card[data-job-index="' + index + '"]');
        var desc = card && card.querySelector('[data-job-desc]');
        if (desc) {
            desc.value = jobs[index].description;
            if (typeof desc.focus === 'function') desc.focus();
        }
        var chips = card ? card.querySelectorAll('.experience-preset-chip') : [];
        Array.prototype.forEach.call(chips, function (chip) {
            chip.classList.toggle('is-active', chip.getAttribute('data-preset-id') === presetId);
        });
    }

    function applyI18n() {
        var pack = t();
        var addJobBtn = document.getElementById('btn-add-experience');
        if (addJobBtn) addJobBtn.textContent = pack.addJob;
        collectCardsIntoJobs();
        if (!jobs.length) jobs = [emptyJob()];
        renderJobs();
    }

    function bindExperienceHost() {
        var host = document.getElementById('experience-items');
        if (!host || host.dataset.qcBound) return;
        host.dataset.qcBound = '1';
        host.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('button');
            if (!btn || !host.contains(btn)) return;
            if (btn.hasAttribute('data-remove-job')) {
                removeJob(Number(btn.getAttribute('data-remove-job')));
                return;
            }
            if (btn.hasAttribute('data-move-job')) {
                moveJob(Number(btn.getAttribute('data-move-job')), Number(btn.getAttribute('data-move-dir')));
                return;
            }
            if (btn.hasAttribute('data-present-job')) {
                applyPresent(Number(btn.getAttribute('data-present-job')));
                return;
            }
            if (btn.hasAttribute('data-preset-id')) {
                applyPreset(Number(btn.getAttribute('data-preset-job')), btn.getAttribute('data-preset-id'));
            }
        });
    }

    function bindAddButton() {
        var addJobBtn = document.getElementById('btn-add-experience');
        if (!addJobBtn) return;
        addJobBtn.onclick = function (e) {
            addJob(e);
            return false;
        };
    }

    function bind() {
        if (bound) {
            bindAddButton();
            if (!jobs.length) jobs = [emptyJob()];
            refreshJobsFromTextarea();
            applyI18n();
            return;
        }
        bound = true;
        bindExperienceHost();
        bindAddButton();

        var raw = experienceEl();
        if (raw) {
            raw.classList.add('experience-raw-hidden', 'sr-only');
            raw.setAttribute('aria-hidden', 'true');
            raw.tabIndex = -1;
            raw.addEventListener('input', function () {
                if (syncing) return;
                refreshJobsFromTextarea();
            });
        }

        jobs = parseJobs(raw ? raw.value : '');
        if (!jobs.length) jobs = [emptyJob()];
        renderJobs();
        applyI18n();

        function wrap(name, after) {
            var fn = global[name];
            if (typeof fn !== 'function' || fn.__qcExpWrapped) return;
            var wrapped = function () {
                var result = fn.apply(this, arguments);
                after();
                return result;
            };
            wrapped.__qcExpWrapped = true;
            global[name] = wrapped;
        }
        var names = ['insertBullet', 'fillCvSample', 'loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang', 'clearCvForm', 'resetForm'];
        names.forEach(function (name) {
            wrap(name, function () {
                refreshJobsFromTextarea();
                applyI18n();
            });
        });
        window.setTimeout(function () {
            names.forEach(function (name) {
                wrap(name, function () {
                    refreshJobsFromTextarea();
                    applyI18n();
                });
            });
            bindAddButton();
        }, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    var api = {
        refresh: refreshJobsFromTextarea,
        applyI18n: applyI18n,
        addJob: addJob
    };
    global.QCExperience = api;
    global.QCExperienceEditor = api;
    global.addExperienceJob = addJob;
})(typeof window !== 'undefined' ? window : globalThis);
