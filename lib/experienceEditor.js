(function (global) {
    var copy = {
        he: {
            addJob: 'הוסף משרה נוספת',
            removeJob: 'מחק משרה',
            moveUp: 'העבר למעלה',
            moveDown: 'העבר למטה',
            jobN: 'משרה',
            role: 'תפקיד / כותרת',
            employer: 'שם החברה / ארגון',
            dates: 'שנים / תאריכים',
            description: 'תיאור תפקיד והישגים',
            present: 'נוכחי',
            datesPh: '2021 - נוכחי',
            rolePh: 'מנהל/ת מכירות',
            employerPh: 'שם החברה / ארגון',
            descPh: '• ניהול שוטף של קשרי לקוחות והגדלת מחזור המכירות\n• עבודה תחת לחץ ופתרון בעיות בזמן אמת',
            presetsTitle: '💡 דוגמאות מוכנות — לחצו למילוי המשרה',
            rawEdit: 'עריכת טקסט מלא',
            rawCards: 'חזרה לכרטיסים'
        },
        en: {
            addJob: 'Add another job',
            removeJob: 'Delete job',
            moveUp: 'Move up',
            moveDown: 'Move down',
            jobN: 'Job',
            role: 'Job title',
            employer: 'Company name',
            dates: 'Years / dates',
            description: 'Role description and achievements',
            present: 'Present',
            datesPh: '2021 - Present',
            rolePh: 'Sales manager',
            employerPh: 'Company name',
            descPh: '• Ongoing client relationships and growing sales volume\n• Worked under pressure and solved problems in real time',
            presetsTitle: '💡 Ready examples — tap to fill this job',
            rawEdit: 'Full text edit',
            rawCards: 'Back to cards'
        }
    };

    var PRESETS = {
        he: [
            {
                id: 'sales',
                label: 'מכירות ושירות',
                role: 'נציג/ת מכירות',
                employer: 'חברת שירות ולקוחות',
                dates: '2022 - נוכחי',
                bullets: [
                    'ניהול שוטף של קשרי לקוחות והגדלת מחזור המכירות ב-25%',
                    'עמידה ביעדים חודשיים וזיהוי הזדמנויות מכירה נוספות',
                    'טיפול בפניות לקוחות מורכבות ושמירה על שביעות רצון גבוהה'
                ]
            },
            {
                id: 'ops',
                label: 'ניהול ותפעול',
                role: 'מנהל/ת תפעול',
                employer: 'חברת שירותים',
                dates: '2020 - נוכחי',
                bullets: [
                    'ניהול צוות של 8 עובדים והובלת תהליכי עבודה יומיומיים',
                    'שיפור תהליכים תפעוליים והפחתת זמני טיפול ב-20%',
                    'עבודה תחת לחץ ופתרון בעיות בזמן אמת'
                ]
            },
            {
                id: 'admin',
                label: 'אדמיניסטרציה',
                role: 'רכז/ת משרד',
                employer: 'משרד מקצועי',
                dates: '2019 - 2023',
                bullets: [
                    'ניהול יומן, התכתבות ותיעוד שוטף מול לקוחות וספקים',
                    'הפקת דוחות, הזמנות ורכישות ותפעול משרד מקצה לקצה',
                    'קליטת עובדים חדשים ותמיכה במנהלים בפרויקטים שוטפים'
                ]
            },
            {
                id: 'support',
                label: 'תמיכה טכנית',
                role: 'נציג/ת תמיכה',
                employer: 'חברת תוכנה',
                dates: '2021 - נוכחי',
                bullets: [
                    'טיפול בפניות תמיכה ואבחון תקלות עד לפתרון מלא',
                    'תיעוד תהליכים ושיפור זמני מענה לפי SLA',
                    'הדרכת משתמשים והעברת משוב לצוות המוצר'
                ]
            },
            {
                id: 'tech',
                label: 'הייטק / פיתוח',
                role: 'מפתח/ת Full Stack',
                employer: 'סטארטאפ טכנולוגי',
                dates: '2021 - נוכחי',
                bullets: [
                    'פיתוח פיצ\'רים במערכת SaaS מקצה לקצה',
                    'שיפור ביצועים ויציבות בשיתוף צוות המוצר',
                    'כתיבת בדיקות, תיעוד והעברת ידע לצוות'
                ]
            }
        ],
        en: [
            {
                id: 'sales',
                label: 'Sales & service',
                role: 'Sales representative',
                employer: 'Retail / customer company',
                dates: '2022 - Present',
                bullets: [
                    'Managed ongoing client relationships and grew sales volume by 25%',
                    'Hit monthly targets and spotted extra sales opportunities',
                    'Handled complex customer cases while keeping satisfaction high'
                ]
            },
            {
                id: 'ops',
                label: 'Ops & management',
                role: 'Operations manager',
                employer: 'Services company',
                dates: '2020 - Present',
                bullets: [
                    'Led a team of 8 and ran day-to-day operations',
                    'Improved processes and reduced handling time by 20%',
                    'Solved problems in real time under pressure'
                ]
            },
            {
                id: 'admin',
                label: 'Administration',
                role: 'Office coordinator',
                employer: 'Professional office',
                dates: '2019 - 2023',
                bullets: [
                    'Ran calendars, correspondence, and records with clients and vendors',
                    'Prepared reports, orders, and end-to-end office operations',
                    'Onboarded new hires and supported managers on live projects'
                ]
            },
            {
                id: 'support',
                label: 'Technical support',
                role: 'Support specialist',
                employer: 'Software company',
                dates: '2021 - Present',
                bullets: [
                    'Handled support tickets and diagnosed issues through to a full fix',
                    'Documented processes and improved response times against SLA',
                    'Trained users and passed product feedback to the team'
                ]
            },
            {
                id: 'tech',
                label: 'Tech / development',
                role: 'Full Stack developer',
                employer: 'Tech startup',
                dates: '2021 - Present',
                bullets: [
                    'Shipped SaaS features end to end with the product team',
                    'Improved performance and reliability in production',
                    'Wrote tests, docs, and handed knowledge to the team'
                ]
            }
        ]
    };

    /** @type {{ id: string, dates: string, title: string, role: string, company: string, employer: string, description: string, bullets: string[] }[]} */
    var jobs = [];
    var syncing = false;
    var bound = false;
    var adding = false;
    var lastAddAt = 0;
    var rawMode = false;

    function logSection() {
        try { console.log('Section updated:', 'experience'); } catch (err) { /* ignore */ }
    }

    function nextJobId() {
        try {
            if (global.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
        } catch (err) { /* older browsers */ }
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

    function looksLikeDates(value) {
        var text = String(value || '').trim();
        if (!text) return false;
        if (/(?:^|\b)(?:19|20)\d{2}\b/.test(text)) return true;
        if (/נוכחי|בהווה|היום|present|current/i.test(text)) return true;
        return /\d{1,2}\s*[\/.\-]\s*(?:19|20)\d{2}/.test(text);
    }

    function parseHeader(headerLine) {
        var parts = String(headerLine || '').split('|').map(function (p) {
            return p.trim();
        }).filter(Boolean);
        var dates = '';
        var role = '';
        var employer = '';
        var dateIndex = -1;
        var rest = [];
        var i;
        for (i = 0; i < parts.length; i++) {
            if (dateIndex < 0 && looksLikeDates(parts[i])) {
                dates = parts[i];
                dateIndex = i;
            } else {
                rest.push(parts[i]);
            }
        }
        if (rest.length === 1) {
            role = rest[0];
        } else if (rest.length >= 2) {
            role = rest[0];
            employer = rest.slice(1).join(' | ');
        } else if (!dates && parts[0]) {
            role = parts[0];
        }
        return { dates: dates, role: role, employer: employer };
    }

    function parseJobs(text) {
        var chunks = String(text || '').replace(/\r\n/g, '\n').split(/\n{2,}/);
        var out = [];
        chunks.forEach(function (chunk) {
            var lines = chunk.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
            if (!lines.length) return;
            var parsed = parseHeader(lines[0]);
            var rest = lines.slice(1);
            if (!parsed.dates && rest.length && looksLikeDates(rest[0])) {
                parsed.dates = rest[0];
                rest = rest.slice(1);
            }
            if (!parsed.employer && rest.length && !/^[•\-*\u2022]/.test(rest[0]) && !looksLikeDates(rest[0])) {
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

    function jobIndexById(id) {
        var i;
        for (i = 0; i < jobs.length; i++) {
            if (jobs[i] && jobs[i].id === id) return i;
        }
        return -1;
    }

    function trailingBlankJobs() {
        var extras = [];
        var i;
        for (i = jobs.length - 1; i >= 0; i--) {
            if (isBlankJob(jobs[i])) extras.unshift(jobs[i]);
            else break;
        }
        return extras;
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
        logSection();
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

    function labeledField(labelText, control, fieldId) {
        var wrap = document.createElement('div');
        wrap.className = 'experience-field';
        var caption = document.createElement('label');
        caption.className = 'experience-field-label';
        caption.textContent = labelText;
        if (fieldId) {
            caption.setAttribute('for', fieldId);
            if (control && !control.id) control.id = fieldId;
            if (control && control.querySelector) {
                var inner = control.matches && control.matches('input, textarea, select')
                    ? control
                    : control.querySelector('input, textarea, select');
                if (inner) inner.id = fieldId;
            }
        }
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
        host.setAttribute('role', 'list');
        jobs.forEach(function (job, jobIndex) {
            var jobId = job.id || nextJobId();
            job.id = jobId;
            var card = document.createElement('article');
            card.className = 'experience-card';
            card.setAttribute('role', 'listitem');
            card.setAttribute('data-job-id', jobId);
            card.setAttribute('data-job-index', String(jobIndex));

            var toolbar = document.createElement('div');
            toolbar.className = 'experience-card-toolbar';
            var badge = document.createElement('span');
            badge.className = 'experience-card-badge';
            badge.textContent = pack.jobN + ' ' + (jobIndex + 1);
            var actions = document.createElement('div');
            actions.className = 'experience-card-actions';
            var upBtn = iconBtn(chevronSvg('up'), 'experience-icon-btn', {
                'data-move-job': jobId,
                'data-move-dir': '-1',
                title: pack.moveUp,
                'aria-label': pack.moveUp
            });
            var downBtn = iconBtn(chevronSvg('down'), 'experience-icon-btn', {
                'data-move-job': jobId,
                'data-move-dir': '1',
                title: pack.moveDown,
                'aria-label': pack.moveDown
            });
            var removeBtn = iconBtn(trashSvg(), 'experience-icon-btn is-danger', {
                'data-remove-job': jobId,
                title: pack.removeJob,
                'aria-label': pack.removeJob
            });
            removeBtn.style.setProperty('pointer-events', 'auto', 'important');
            if (jobs.length <= 1) {
                removeBtn.disabled = true;
                removeBtn.setAttribute('aria-disabled', 'true');
            }
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
                    var idx = jobIndexById(jobId);
                    if (idx < 0) idx = jobIndex;
                    onJobFieldInput(card, idx);
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
            presentBtn.setAttribute('data-present-job', jobId);
            presentBtn.textContent = pack.present;
            datesRow.append(datesInput, presentBtn);

            var desc = document.createElement('textarea');
            desc.rows = 5;
            desc.className = 'studio-field experience-desc w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none';
            desc.setAttribute('data-job-desc', '1');
            desc.setAttribute('aria-describedby', 'tip-experience');
            desc.placeholder = pack.descPh;
            desc.value = job.description || descriptionFromBullets(job.bullets);
            desc.addEventListener('input', function () {
                var idx = jobIndexById(jobId);
                if (idx < 0) idx = jobIndex;
                onJobFieldInput(card, idx);
            });

            var fields = document.createElement('div');
            fields.className = 'experience-card-fields';
            fields.append(
                labeledField(pack.role, roleInput, 'job-role-' + jobId),
                labeledField(pack.employer, employerInput, 'job-employer-' + jobId),
                labeledField(pack.dates, datesRow, 'job-dates-' + jobId),
                labeledField(pack.description, desc, 'job-desc-' + jobId)
            );

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
                chip.setAttribute('data-preset-job', jobId);
                chip.setAttribute('data-preset-id', preset.id);
                chip.textContent = preset.label;
                chipRow.appendChild(chip);
            });
            presetsWrap.append(presetsTitle, chipRow);

            card.append(toolbar, fields, presetsWrap);
            host.appendChild(card);
        });
    }

    function collectCardsIntoJobs() {
        var host = document.getElementById('experience-items');
        if (!host) return;
        Array.prototype.forEach.call(host.querySelectorAll('.experience-card'), function (card) {
            var id = card.getAttribute('data-job-id');
            var idx = jobIndexById(id);
            if (idx < 0) idx = Number(card.getAttribute('data-job-index'));
            if (Number.isFinite(idx) && idx >= 0) readJobFromCard(card, idx);
        });
    }

    function refreshJobsFromTextarea() {
        if (syncing) return;
        var extras = trailingBlankJobs();
        var el = experienceEl();
        var parsed = parseJobs(el ? el.value : '');
        var filled = parsed.filter(function (job) { return !isBlankJob(job); });
        if (filled.length) jobs = filled.concat(extras);
        else jobs = extras.length ? extras : parsed;
        if (!jobs.length) jobs = [emptyJob()];
        if (!rawMode) renderJobs();
    }

    function jobCardEl(index) {
        var host = document.getElementById('experience-items');
        if (!host) return null;
        if (jobs[index] && jobs[index].id) {
            var byId = host.querySelector('.experience-card[data-job-id="' + jobs[index].id + '"]');
            if (byId) return byId;
        }
        return host.querySelector('.experience-card[data-job-index="' + index + '"]');
    }

    function focusJobCard(index) {
        var card = jobCardEl(index);
        if (!card) return;
        var focusEl = card.querySelector('[data-job-role]') || card.querySelector('input');
        if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
        if (typeof card.scrollIntoView === 'function') {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function resolveJobIndex(idOrIndex) {
        var byId = jobIndexById(idOrIndex);
        if (byId >= 0) return byId;
        var idx = Number(idOrIndex);
        return Number.isFinite(idx) ? idx : -1;
    }

    function handleAddJob(e) {
        console.log('Add Job clicked', Date.now());
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        var now = Date.now();
        if (adding || now - lastAddAt < 250) return false;
        adding = true;
        lastAddAt = now;
        try {
            collectCardsIntoJobs();
            jobs.push(emptyJob());
            renderJobs();
            writeExperience(jobs, true);
            focusJobCard(jobs.length - 1);
        } finally {
            adding = false;
        }
        return false;
    }

    function addJob(e) {
        return handleAddJob(e);
    }

    function removeJob(idOrIndex) {
        collectCardsIntoJobs();
        var index = resolveJobIndex(idOrIndex);
        if (index < 0 || index >= jobs.length) return;
        if (jobs.length <= 1) {
            jobs = [emptyJob()];
            renderJobs();
            writeExperience(jobs, true);
            return;
        }
        jobs.splice(index, 1);
        if (!jobs.length) jobs = [emptyJob()];
        renderJobs();
        writeExperience(jobs, true);
    }

    function moveJob(idOrIndex, dir) {
        collectCardsIntoJobs();
        var index = resolveJobIndex(idOrIndex);
        var next = index + Number(dir);
        if (index < 0 || next < 0 || next >= jobs.length) return;
        var swap = jobs[index];
        jobs[index] = jobs[next];
        jobs[next] = swap;
        writeExperience(jobs, true);
        renderJobs();
    }

    function applyPresent(idOrIndex) {
        collectCardsIntoJobs();
        var index = resolveJobIndex(idOrIndex);
        if (!jobs[index]) return;
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
        var card = jobCardEl(index);
        var dates = card && card.querySelector('[data-job-dates]');
        if (dates && typeof dates.focus === 'function') dates.focus();
    }

    var lastPresetKey = '';
    var lastPresetAt = 0;

    function applyPreset(idOrIndex, presetId) {
        var list = presets();
        var preset = null;
        var i;
        var now = Date.now();
        var key = String(idOrIndex) + ':' + String(presetId);
        if (key === lastPresetKey && now - lastPresetAt < 280) return;
        lastPresetKey = key;
        lastPresetAt = now;
        for (i = 0; i < list.length; i++) {
            if (list[i].id === presetId) preset = list[i];
        }
        collectCardsIntoJobs();
        var index = resolveJobIndex(idOrIndex);
        if (!preset || !jobs[index]) return;
        var job = jobs[index];
        var blank = isBlankJob(job);
        if (blank || !sanitize(job.role || job.title || '')) {
            job.role = preset.role || job.role;
            job.title = job.role;
        }
        if (blank || !sanitize(job.employer || job.company || '')) {
            job.employer = preset.employer || job.employer;
            job.company = job.employer;
        }
        if (blank || !sanitize(job.dates || '')) {
            job.dates = preset.dates || job.dates;
        }
        var incoming = descriptionFromBullets(preset.bullets);
        var current = String(job.description || '').replace(/\s+$/, '');
        job.description = current ? current + '\n' + incoming : incoming;
        job.bullets = bulletsFromText(job.description);
        writeExperience(jobs, true);
        renderJobs();
        var card = jobCardEl(index);
        var desc = card && card.querySelector('[data-job-desc]');
        if (desc && typeof desc.focus === 'function') desc.focus();
        var chips = card ? card.querySelectorAll('.experience-preset-chip') : [];
        Array.prototype.forEach.call(chips, function (chip) {
            chip.classList.toggle('is-active', chip.getAttribute('data-preset-id') === presetId);
        });
    }

    function applyRawUi() {
        var el = experienceEl();
        var items = document.getElementById('experience-items');
        var addBtn = document.getElementById('btn-add-experience');
        var toggle = document.getElementById('btn-experience-raw');
        var pack = t();
        if (el) {
            if (rawMode) {
                el.classList.remove('experience-raw-hidden', 'sr-only', 'section-raw-hidden');
                el.removeAttribute('aria-hidden');
                el.tabIndex = 0;
                el.style.setProperty('pointer-events', 'auto', 'important');
            } else {
                el.classList.add('experience-raw-hidden', 'sr-only');
                el.setAttribute('aria-hidden', 'true');
                el.tabIndex = -1;
            }
        }
        if (items) items.hidden = !!rawMode;
        if (addBtn) addBtn.hidden = !!rawMode;
        if (toggle) {
            toggle.type = 'button';
            toggle.disabled = false;
            toggle.removeAttribute('disabled');
            toggle.setAttribute('aria-pressed', rawMode ? 'true' : 'false');
            toggle.textContent = rawMode ? pack.rawCards : pack.rawEdit;
            toggle.style.setProperty('pointer-events', 'auto', 'important');
            toggle.style.setProperty('cursor', 'pointer', 'important');
            toggle.onclick = toggleExperienceRaw;
        }
    }

    function toggleExperienceRaw(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (rawMode) {
            rawMode = false;
            refreshJobsFromTextarea();
        } else {
            collectCardsIntoJobs();
            writeExperience(jobs, false);
            jobs = parseJobs(experienceEl() ? experienceEl().value : '');
            if (!jobs.length) jobs = [emptyJob()];
            rawMode = true;
        }
        applyRawUi();
        logSection();
        return false;
    }

    function applyI18n() {
        var pack = t();
        var addJobLabel = document.getElementById('btn-add-experience-label');
        if (addJobLabel) addJobLabel.textContent = pack.addJob;
        applyRawUi();
        if (rawMode) return;
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
            e.preventDefault();
            if (btn.hasAttribute('data-remove-job')) {
                removeJob(btn.getAttribute('data-remove-job'));
                return;
            }
            if (btn.hasAttribute('data-move-job')) {
                moveJob(btn.getAttribute('data-move-job'), btn.getAttribute('data-move-dir'));
                return;
            }
            if (btn.hasAttribute('data-present-job')) {
                applyPresent(btn.getAttribute('data-present-job'));
                return;
            }
            if (btn.hasAttribute('data-preset-id')) {
                applyPreset(btn.getAttribute('data-preset-job'), btn.getAttribute('data-preset-id'));
            }
        });
    }

    function bindRawToggle() {
        applyRawUi();
    }

    function bindAddButton() {
        var addJobBtn = document.getElementById('btn-add-experience');
        if (!addJobBtn) return;
        addJobBtn.type = 'button';
        addJobBtn.disabled = false;
        addJobBtn.removeAttribute('disabled');
        addJobBtn.removeAttribute('aria-disabled');
        addJobBtn.setAttribute('aria-controls', 'experience-items');
        addJobBtn.style.setProperty('pointer-events', 'auto', 'important');
        addJobBtn.style.setProperty('cursor', 'pointer', 'important');
        addJobBtn.style.setProperty('z-index', '20', 'important');
        addJobBtn.onclick = function (e) {
            if (e && e.preventDefault) e.preventDefault();
            handleAddJob(e);
        };
    }

    function bind() {
        if (bound) {
            bindAddButton();
            collectCardsIntoJobs();
            if (!jobs.length) jobs = [emptyJob()];
            applyI18n();
            return;
        }
        bound = true;
        bindExperienceHost();
        bindAddButton();

        var raw = experienceEl();
        if (raw) {
            if (!rawMode) {
                raw.classList.add('experience-raw-hidden', 'sr-only');
                raw.setAttribute('aria-hidden', 'true');
                raw.tabIndex = -1;
            }
            raw.addEventListener('input', function () {
                if (syncing) return;
                refreshJobsFromTextarea();
                if (rawMode && typeof global.updateCV === 'function') {
                    try { global.updateCV(); } catch (err) { /* keep typing */ }
                }
                logSection();
            });
        }

        jobs = parseJobs(raw ? raw.value : '');
        if (!jobs.length) jobs = [emptyJob()];
        renderJobs();
        applyI18n();
        bindRawToggle();

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
                rawMode = false;
                refreshJobsFromTextarea();
                applyI18n();
            });
        });
        window.setTimeout(function () {
            names.forEach(function (name) {
                wrap(name, function () {
                    rawMode = false;
                    refreshJobsFromTextarea();
                    applyI18n();
                });
            });
            bindAddButton();
            bindRawToggle();
        }, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    var api = {
        refresh: refreshJobsFromTextarea,
        applyI18n: applyI18n,
        addJob: handleAddJob,
        handleAddJob: handleAddJob,
        toggleRaw: toggleExperienceRaw,
        parse: parseJobs,
        getJobs: function () { return jobs.slice(); }
    };
    global.QCExperience = api;
    global.QCExperienceEditor = api;
    global.handleAddJob = handleAddJob;
    global.addExperienceJob = handleAddJob;
    global.toggleExperienceRaw = toggleExperienceRaw;
})(typeof window !== 'undefined' ? window : globalThis);
