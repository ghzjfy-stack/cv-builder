(function (global) {
    var copy = {
        he: {
            addJob: 'הוסף משרה',
            removeJob: 'מחק משרה',
            moveUp: 'העבר למעלה',
            moveDown: 'העבר למטה',
            jobN: 'משרה',
            role: 'תפקיד',
            employer: 'שם חברה/ארגון',
            dates: 'תאריכים/שנים',
            description: 'תיאור תפקיד / הישגים',
            present: 'נוכחי',
            datesPh: 'לדוגמה: 2021 - היום',
            rolePh: 'לדוגמה: מנהל פרויקטים',
            employerPh: 'לדוגמה: חברת דמו',
            descPh: '• הובלתי צוות והגדלתי יעדים ב-35%\n• בניתי תהליכי עבודה מול לקוחות מפתח',
            presetsTitle: 'דוגמאות',
            rawEdit: '',
            rawCards: ''
        },
        en: {
            addJob: 'Add job',
            removeJob: 'Delete job',
            moveUp: 'Move up',
            moveDown: 'Move down',
            jobN: 'Job',
            role: 'Job title',
            employer: 'Company',
            dates: 'Dates / years',
            description: 'Role description / achievements',
            present: 'Present',
            datesPh: 'e.g. 2021 - Present',
            rolePh: 'e.g. Project manager',
            employerPh: 'e.g. Demo Ltd',
            descPh: '• Led a team and grew targets by 35%\n• Built processes with key accounts',
            presetsTitle: 'Examples',
            rawEdit: '',
            rawCards: ''
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
                role: 'מפתח/ת Full-Stack',
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
                role: 'Full-Stack developer',
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
            !sanitize(job.role || job.title || job.position || '') &&
            !sanitize(job.employer || job.company || '') &&
            !hasBullet;
    }

    function normalizeJob(job) {
        var role = String((job && (job.role || job.title || job.position)) || '');
        var employer = String((job && (job.employer || job.company)) || '');
        var bullets = job && Array.isArray(job.bullets) ? job.bullets.slice() : [];
        var description = job && job.description != null ? String(job.description) : '';
        if (!bullets.length && description) bullets = bulletsFromText(description);
        if (!description && bullets.length) description = descriptionFromBullets(bullets);
        bullets = bullets.map(function (b) { return String(b == null ? '' : b); });
        var dates = String((job && (job.dates || job.years)) || '');
        return {
            id: (job && job.id) || nextJobId(),
            dates: dates,
            years: dates,
            role: role,
            title: role,
            position: role,
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
            position: '',
            company: '',
            employer: '',
            description: '',
            bullets: []
        });
    }

    function ensureJobs() {
        if (!Array.isArray(jobs) || jobs.length < 1) jobs = [emptyJob()];
        return jobs;
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

    function isBlankChunk(chunk) {
        return !String(chunk || '').replace(/[\u200b\u200c\u200d\s|]/g, '');
    }

    function looksLikeEntryHeader(line) {
        var text = String(line || '').trim();
        if (!text) return false;
        if (/\|/.test(text) && looksLikeDates(text)) return true;
        return /(?:19|20)\d{2}\s*[-–—]\s*/.test(text);
    }

    function splitEntryChunks(raw) {
        var text = String(raw || '').replace(/\r\n/g, '\n');
        if (isBlankChunk(text)) return [];
        var chunks = [];
        var current = [];
        text.split('\n').forEach(function (line) {
            var trimmed = line.replace(/\u200b/g, '').trim();
            if (!trimmed) {
                if (current.length) {
                    chunks.push(current.join('\n'));
                    current = [];
                }
                return;
            }
            if (current.length && looksLikeEntryHeader(trimmed)) {
                chunks.push(current.join('\n'));
                current = [trimmed];
                return;
            }
            current.push(trimmed);
        });
        if (current.length) chunks.push(current.join('\n'));
        return chunks;
    }

    function parseJobs(text) {
        var chunks = splitEntryChunks(text);
        if (!chunks.length) return [emptyJob()];
        var out = [];
        chunks.forEach(function (chunk) {
            if (isBlankChunk(chunk)) return;
            var lines = chunk.split('\n').map(function (line) { return line.replace(/\u200b/g, '').trim(); }).filter(Boolean);
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
            if (isBlankJob(job)) return '';
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

    function publishExperience() {
        global.QCCvData = global.QCCvData || {};
        global.QCCvData.experience = jobs.map(toPreviewJob);
    }

    function writeExperience(list, triggerUpdate) {
        if (list) jobs = list.map(normalizeJob);
        ensureJobs();
        publishExperience();
        var el = experienceEl();
        if (el) {
            syncing = true;
            el.value = serializeJobs(jobs);
            syncing = false;
        }
        if (triggerUpdate && typeof global.updateCV === 'function') {
            try { global.updateCV(); } catch (err) { /* keep cards on screen */ }
        }
        if (global.QCDraft && typeof QCDraft.saveSoon === 'function') QCDraft.saveSoon();
        else if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
        logSection();
    }

    function readJobFromCard(card, jobIndex) {
        if (!card) return;
        if (!jobs[jobIndex]) jobs[jobIndex] = emptyJob();
        var dates = card.querySelector('[data-job-dates]');
        var role = card.querySelector('[data-job-role]');
        var employer = card.querySelector('[data-job-employer]');
        var desc = card.querySelector('[data-job-desc]');
        if (!dates && !role && !employer && !desc) return;
        jobs[jobIndex].dates = dates ? dates.value : '';
        jobs[jobIndex].role = role ? role.value : '';
        jobs[jobIndex].title = jobs[jobIndex].role;
        jobs[jobIndex].position = jobs[jobIndex].role;
        jobs[jobIndex].employer = employer ? employer.value : '';
        jobs[jobIndex].company = jobs[jobIndex].employer;
        jobs[jobIndex].description = desc ? desc.value : '';
        jobs[jobIndex].bullets = bulletsFromText(jobs[jobIndex].description);
    }

    function setJobField(job, field, value) {
        var val = value == null ? '' : String(value);
        if (field === 'company' || field === 'employer') {
            job.company = val;
            job.employer = val;
            return;
        }
        if (field === 'position' || field === 'role' || field === 'title') {
            job.position = val;
            job.role = val;
            job.title = val;
            return;
        }
        if (field === 'dates' || field === 'date' || field === 'years') {
            job.dates = val;
            return;
        }
        if (field === 'description' || field === 'desc') {
            job.description = val;
            job.bullets = bulletsFromText(val);
        }
    }

    function handleExperienceChange(idOrIndex, field, value) {
        ensureJobs();
        var index = resolveJobIndex(idOrIndex);
        if (index < 0) {
            var numeric = Number(idOrIndex);
            if (Number.isFinite(numeric) && numeric >= 0) index = numeric;
        }
        if (index < 0) return;
        while (jobs.length <= index) jobs = jobs.concat([emptyJob()]);
        var nextVal = value == null ? '' : String(value);
        jobs = jobs.map(function (job, i) {
            if (i !== index) return job;
            var copy = normalizeJob(job || emptyJob());
            setJobField(copy, field, nextVal);
            return copy;
        });
        writeExperience(jobs, true);
    }

    function onJobFieldInput(card, jobIndex) {
        var index = jobIndex;
        if (card) {
            var id = card.getAttribute('data-job-id');
            var byId = jobIndexById(id);
            if (byId >= 0) index = byId;
            else if (!Number.isFinite(Number(index)) || Number(index) < 0) {
                index = Number(card.getAttribute('data-job-index'));
            }
        }
        readJobFromCard(card, index);
        writeExperience(jobs, true);
    }

    function fieldNameFromInput(el) {
        if (!el) return '';
        var named = el.getAttribute('data-job-field');
        if (named) return named;
        if (el.hasAttribute('data-job-employer')) return 'company';
        if (el.hasAttribute('data-job-role')) return 'position';
        if (el.hasAttribute('data-job-dates')) return 'dates';
        if (el.hasAttribute('data-job-desc')) return 'description';
        return '';
    }

    function toPreviewJob(job) {
        var company = String((job && (job.company || job.employer)) || '').trim();
        var position = String((job && (job.position || job.role || job.title)) || '').trim();
        var dates = String((job && (job.dates || job.date || job.years)) || '').trim();
        var description = String((job && job.description) || '').trim();
        var bullets = bulletsFromText(description);
        if (!bullets.length && job && Array.isArray(job.bullets)) {
            bullets = job.bullets.map(function (b) { return String(b == null ? '' : b).trim(); }).filter(Boolean);
        }
        return {
            company: company,
            position: position,
            dates: dates,
            description: description,
            date: dates,
            title: position,
            role: company,
            bullets: bullets
        };
    }

    function previewJobs() {
        collectCardsIntoJobs();
        publishExperience();
        return jobs.map(toPreviewJob).filter(function (job) {
            return job.company || job.position || job.dates || job.description || job.bullets.length;
        });
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
        ensureJobs();
        host.innerHTML = '';
        host.setAttribute('role', 'list');
        jobs.forEach(function (job, jobIndex) {
            var jobId = job.id || nextJobId();
            job.id = jobId;
            var card = document.createElement('article');
            card.className = 'experience-card is-open';
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

            function makeInput(attr, placeholder, value, fieldName) {
                var input = document.createElement('input');
                input.type = 'text';
                input.className = 'studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11';
                input.setAttribute(attr, '1');
                if (fieldName) input.setAttribute('data-job-field', fieldName);
                input.placeholder = placeholder;
                input.value = value == null ? '' : String(value);
                input.addEventListener('input', function () {
                    handleExperienceChange(jobId, fieldName, input.value || '');
                });
                input.addEventListener('change', function () {
                    handleExperienceChange(jobId, fieldName, input.value || '');
                });
                return input;
            }

            var roleInput = makeInput('data-job-role', pack.rolePh, job.role || job.position || '', 'position');
            var employerInput = makeInput('data-job-employer', pack.employerPh, job.employer || job.company || '', 'company');

            var datesRow = document.createElement('div');
            datesRow.className = 'experience-dates-row';
            var datesInput = makeInput('data-job-dates', pack.datesPh, job.dates || job.years || '', 'years');
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
            desc.setAttribute('data-job-field', 'description');
            desc.placeholder = pack.descPh;
            desc.value = (job.description || descriptionFromBullets(job.bullets) || '');
            desc.addEventListener('input', function () {
                handleExperienceChange(jobId, 'description', desc.value || '');
            });
            desc.addEventListener('change', function () {
                handleExperienceChange(jobId, 'description', desc.value || '');
            });

            var fields = document.createElement('div');
            fields.className = 'experience-card-fields';
            fields.append(
                labeledField(pack.employer, employerInput, 'job-employer-' + jobId),
                labeledField(pack.role, roleInput, 'job-role-' + jobId),
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
            if (!card.querySelector('[data-job-employer], [data-job-role], [data-job-dates], [data-job-desc]')) return;
            var id = card.getAttribute('data-job-id');
            var idx = jobIndexById(id);
            if (idx < 0) idx = Number(card.getAttribute('data-job-index'));
            if (Number.isFinite(idx) && idx >= 0) readJobFromCard(card, idx);
        });
    }

    function refreshJobsFromTextarea() {
        if (syncing) return;
        collectCardsIntoJobs();
        var fromCards = jobs.slice();
        var el = experienceEl();
        var parsed = parseJobs(el ? el.value : '');
        var filled = parsed.filter(function (job) { return !isBlankJob(job); });
        if (rawMode) {
            jobs = filled.length ? filled : (fromCards.length ? fromCards : [emptyJob()]);
        } else if (filled.length) {
            jobs = filled.concat(trailingBlankJobs());
        } else {
            jobs = fromCards.length ? fromCards : [emptyJob()];
        }
        ensureJobs();
        if (!rawMode) renderJobs();
        ensureAddButtonVisible();
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
        var focusEl = card.querySelector('[data-job-employer]') || card.querySelector('[data-job-role]') || card.querySelector('input');
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

    function addExperience(e) {
        if (e) {
            if (typeof e.preventDefault === 'function') e.preventDefault();
            if (typeof e.stopPropagation === 'function') e.stopPropagation();
        }
        collectCardsIntoJobs();
        var prev = Array.isArray(jobs) ? jobs.slice() : [];
        jobs = prev.concat([normalizeJob({
            id: nextJobId(),
            company: '',
            position: '',
            dates: '',
            years: '',
            description: ''
        })]);
        renderJobs();
        writeExperience(jobs, true);
        ensureAddButtonVisible();
        focusJobCard(jobs.length - 1);
        return false;
    }

    function handleAddJob(e) {
        return addExperience(e);
    }

    function addJob(e) {
        return addExperience(e);
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
        rawMode = false;
        if (el) {
            el.classList.add('experience-raw-hidden', 'sr-only');
            el.setAttribute('aria-hidden', 'true');
            el.tabIndex = -1;
        }
        if (items) items.hidden = false;
        if (addBtn) {
            addBtn.hidden = false;
            addBtn.removeAttribute('hidden');
        }
        if (toggle) toggle.hidden = true;
    }

    function toggleExperienceRaw(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        rawMode = false;
        applyRawUi();
        return false;
    }

    function patchCardI18n() {
        var pack = t();
        var host = document.getElementById('experience-items');
        if (!host) return;
        var cards = host.querySelectorAll('.experience-card');
        if (!cards.length) return;
        Array.prototype.forEach.call(cards, function (card, jobIndex) {
            var badge = card.querySelector('.experience-card-badge');
            if (badge) badge.textContent = pack.jobN + ' ' + (jobIndex + 1);
            Array.prototype.forEach.call(card.querySelectorAll('.experience-field'), function (wrap) {
                var caption = wrap.querySelector('.experience-field-label');
                if (!caption) return;
                if (wrap.querySelector('[data-job-employer]')) caption.textContent = pack.employer;
                else if (wrap.querySelector('[data-job-role]')) caption.textContent = pack.role;
                else if (wrap.querySelector('[data-job-dates]')) caption.textContent = pack.dates;
                else if (wrap.querySelector('[data-job-desc]')) caption.textContent = pack.description;
            });
            var emp = card.querySelector('[data-job-employer]');
            var role = card.querySelector('[data-job-role]');
            var dates = card.querySelector('[data-job-dates]');
            var desc = card.querySelector('[data-job-desc]');
            if (emp) emp.placeholder = pack.employerPh;
            if (role) role.placeholder = pack.rolePh;
            if (dates) dates.placeholder = pack.datesPh;
            if (desc) desc.placeholder = pack.descPh;
            var up = card.querySelector('[data-move-dir="-1"]');
            var down = card.querySelector('[data-move-dir="1"]');
            var remove = card.querySelector('[data-remove-job]');
            var present = card.querySelector('[data-present-job]');
            if (up) {
                up.title = pack.moveUp;
                up.setAttribute('aria-label', pack.moveUp);
            }
            if (down) {
                down.title = pack.moveDown;
                down.setAttribute('aria-label', pack.moveDown);
            }
            if (remove) {
                remove.title = pack.removeJob;
                remove.setAttribute('aria-label', pack.removeJob);
            }
            if (present) present.textContent = pack.present;
            var presetsTitle = card.querySelector('.experience-presets-title');
            if (presetsTitle) presetsTitle.textContent = pack.presetsTitle;
        });
    }

    function applyI18n() {
        var pack = t();
        var addJobLabel = document.getElementById('btn-add-experience-label');
        if (addJobLabel) addJobLabel.textContent = pack.addJob;
        applyRawUi();
        if (rawMode) return;
        var host = document.getElementById('experience-items');
        var hasBoundCards = host && host.querySelector('.experience-card [data-job-field], .experience-card [data-job-employer]');
        if (!hasBoundCards) {
            collectCardsIntoJobs();
            ensureJobs();
            renderJobs();
        } else {
            patchCardI18n();
        }
        ensureAddButtonVisible();
    }

    function bindExperienceHost() {
        var host = document.getElementById('experience-items');
        if (!host || host.dataset.qcBound) return;
        host.dataset.qcBound = '1';
        host.addEventListener('input', function (e) {
            var field = e.target;
            if (!field || !host.contains(field)) return;
            var card = field.closest('.experience-card');
            if (!card) return;
            var name = fieldNameFromInput(field);
            if (!name) return;
            var id = card.getAttribute('data-job-id');
            if (jobIndexById(id) < 0) id = card.getAttribute('data-job-index');
            handleExperienceChange(id, name, field.value);
        }, true);
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

    function ensureAddButtonVisible() {
        var items = document.getElementById('experience-items');
        var addJobBtn = document.getElementById('btn-add-experience');
        if (items && addJobBtn && addJobBtn.previousElementSibling !== items) {
            items.insertAdjacentElement('afterend', addJobBtn);
        }
        if (!addJobBtn || rawMode) return;
        addJobBtn.hidden = false;
        addJobBtn.removeAttribute('hidden');
        bindAddButton();
    }

    function bindAddButton() {
        var addJobBtn = document.getElementById('btn-add-experience');
        if (!addJobBtn) return;
        addJobBtn.type = 'button';
        addJobBtn.setAttribute('type', 'button');
        addJobBtn.disabled = false;
        addJobBtn.hidden = false;
        addJobBtn.removeAttribute('disabled');
        addJobBtn.removeAttribute('hidden');
        addJobBtn.removeAttribute('aria-disabled');
        addJobBtn.setAttribute('aria-controls', 'experience-items');
        addJobBtn.style.setProperty('pointer-events', 'auto', 'important');
        addJobBtn.style.setProperty('cursor', 'pointer', 'important');
        addJobBtn.style.setProperty('color', '#38bdf8', 'important');
        addJobBtn.style.setProperty('border-color', '#0284c7', 'important');
        addJobBtn.style.setProperty('opacity', '1', 'important');
        addJobBtn.style.setProperty('z-index', '30', 'important');
        if (addJobBtn.dataset.qcAddBound === '1') return;
        addJobBtn.dataset.qcAddBound = '1';
        addJobBtn.onclick = null;
        addJobBtn.removeAttribute('onclick');
        addJobBtn.addEventListener('click', function (e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            addExperience(e);
            return false;
        });
    }

    function bind() {
        if (bound) {
            bindAddButton();
            collectCardsIntoJobs();
            ensureJobs();
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
        ensureJobs();
        renderJobs();
        applyI18n();
        bindRawToggle();
        ensureAddButtonVisible();

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

    var api = {
        refresh: refreshJobsFromTextarea,
        applyI18n: applyI18n,
        addJob: addExperience,
        addExperience: addExperience,
        handleAddJob: addExperience,
        handleExperienceChange: handleExperienceChange,
        toggleRaw: toggleExperienceRaw,
        parse: parseJobs,
        previewJobs: previewJobs,
        ensure: function () {
            ensureJobs();
            renderJobs();
            ensureAddButtonVisible();
            return jobs.slice();
        },
        getJobs: function () { return jobs.map(normalizeJob); }
    };
    global.QCExperience = api;
    global.QCExperienceEditor = api;
    global.addExperience = addExperience;
    global.handleAddJob = addExperience;
    global.addExperienceJob = addExperience;
    global.handleExperienceChange = handleExperienceChange;
    global.toggleExperienceRaw = toggleExperienceRaw;

    jobs = [emptyJob()];
    function start() {
        try {
            bind();
        } catch (err) {
            try { console.error('experience editor bind failed', err); } catch (logErr) { /* ignore */ }
            ensureJobs();
            try { renderJobs(); } catch (renderErr) { /* keep fallback HTML */ }
            ensureAddButtonVisible();
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})(typeof window !== 'undefined' ? window : globalThis);
