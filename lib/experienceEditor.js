(function (global) {
    var copy = {
        he: {
            addJob: 'הוסף משרה',
            addBullet: 'הוסף נקודה',
            removeJob: 'הסר משרה',
            datesPh: 'תקופה (לדוגמה: 2021 - נוכחי)',
            rolePh: 'תפקיד',
            employerPh: 'חברה / מעסיק',
            bulletPh: 'מה עשיתם, עם תוצאה אם יש',
            rawToggle: 'עריכת טקסט מלא',
            rawTitle: 'עריכת ניסיון תעסוקתי — טקסט מלא',
            rawHint: 'כל משרה בבלוק נפרד. שורה ראשונה: תקופה | תפקיד | חברה. שורות הבאות: נקודות.',
            save: 'שמירה',
            cancel: 'ביטול'
        },
        en: {
            addJob: 'Add role',
            addBullet: 'Add bullet',
            removeJob: 'Remove role',
            datesPh: 'Dates (e.g. 2021 – Present)',
            rolePh: 'Job title',
            employerPh: 'Company / employer',
            bulletPh: 'What you did, with an outcome if you have one',
            rawToggle: 'Edit full text',
            rawTitle: 'Edit work experience — full text',
            rawHint: 'One job per block. First line: Dates | Title | Company. Following lines: bullets.',
            save: 'Save',
            cancel: 'Cancel'
        }
    };

    /** @type {{ id: string, dates: string, title: string, role: string, company: string, employer: string, description: string, bullets: string[] }[]} */
    var jobs = [];
    var syncing = false;
    var bound = false;
    var rawDraft = '';
    var addJobLock = false;
    var rawOpenLock = false;

    function nextJobId() {
        return 'job-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function isBlankJob(job) {
        if (!job) return true;
        var bullets = job.bullets || [];
        var hasBullet = bullets.some(function (b) { return sanitize(b); });
        return !sanitize(job.dates || '') &&
            !sanitize(job.role || job.title || '') &&
            !sanitize(job.employer || job.company || '') &&
            !hasBullet;
    }

    function normalizeJob(job) {
            var role = String((job && (job.role || job.title)) || '');
            var employer = String((job && (job.employer || job.company)) || '');
        var bullets = job && Array.isArray(job.bullets) ? job.bullets.slice() : [];
        if (!bullets.length && job && job.description) {
            bullets = String(job.description).replace(/\r\n/g, '\n').split('\n');
        }
        bullets = bullets.map(function (b) { return String(b == null ? '' : b); });
        if (!bullets.length) bullets = [''];
        return {
            id: (job && job.id) || nextJobId(),
            dates: (job && job.dates) || '',
            role: role,
            title: role,
            employer: employer,
            company: employer,
            bullets: bullets,
            description: bullets.map(function (b) { return sanitize(b); }).filter(Boolean).join('\n')
        };
    }

    function t() {
        return copy[global.QCCvLang === 'en' ? 'en' : 'he'];
    }

    function experienceEl() {
        return document.getElementById('in-experience');
    }

    function sanitize(value) {
        if (global.QCSanitize && typeof QCSanitize.text === 'function') return QCSanitize.text(value);
        return String(value || '').trim();
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
            bullets: ['']
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

    function formatHeader(job) {
        var parts = [
            sanitize(job.dates || ''),
            sanitize(job.role || job.title || ''),
            sanitize(job.employer || job.company || '')
        ].filter(Boolean);
        return parts.join(' | ');
    }

    function parseJobs(text) {
        var chunks = String(text || '').replace(/\r\n/g, '\n').split(/\n{2,}/);
        var out = [];
        chunks.forEach(function (chunk) {
            var lines = chunk.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
            if (!lines.length) return;
            var parsed = parseHeader(lines[0]);
            var bullets = lines.slice(1).map(function (line) {
                return line.replace(/^[•\-*\u2022]\s*/, '').trim();
            }).filter(Boolean);
            out.push(normalizeJob({
                dates: parsed.dates,
                role: parsed.role,
                title: parsed.role,
                employer: parsed.employer,
                company: parsed.employer,
                bullets: bullets.length ? bullets : ['']
            }));
        });
        return out.length ? out : [emptyJob()];
    }

    function serializeJobs(list) {
        return (list || []).map(function (job) {
            var header = formatHeader(job);
            var bullets = (job.bullets || [])
                .map(function (b) { return sanitize(b); })
                .filter(Boolean)
                .map(function (b) { return '• ' + b; });
            if (!header && !bullets.length) return '';
            return [header].concat(bullets).filter(Boolean).join('\n');
        }).filter(Boolean).join('\n\n');
    }

    function writeExperience(list, triggerUpdate) {
        var el = experienceEl();
        if (!el) return;
        syncing = true;
        el.value = serializeJobs(list);
        try {
            el.dispatchEvent(new Event('input', { bubbles: true }));
        } catch (err) { /* old engines */ }
        syncing = false;
        // Keep in-memory cards (including empty new jobs) as source of truth.
        jobs = (list || []).map(normalizeJob);
        if (!jobs.length) jobs = [emptyJob()];
        if (triggerUpdate && typeof global.updateCV === 'function') global.updateCV();
        if (global.QCDraft && typeof QCDraft.saveSoon === 'function') QCDraft.saveSoon();
        else if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
    }

    function readJobFromCard(card, jobIndex) {
        if (!jobs[jobIndex]) jobs[jobIndex] = emptyJob();
        var dates = card.querySelector('[data-job-dates]');
        var role = card.querySelector('[data-job-role]');
        var employer = card.querySelector('[data-job-employer]');
        var bulletAreas = card.querySelectorAll('[data-job-bullet]');
        jobs[jobIndex].dates = dates ? dates.value : '';
        jobs[jobIndex].role = role ? role.value : '';
        jobs[jobIndex].title = jobs[jobIndex].role;
        jobs[jobIndex].employer = employer ? employer.value : '';
        jobs[jobIndex].company = jobs[jobIndex].employer;
        jobs[jobIndex].bullets = Array.prototype.map.call(bulletAreas, function (area) {
            return area.value;
        });
        if (!jobs[jobIndex].bullets.length) jobs[jobIndex].bullets = [''];
        jobs[jobIndex].description = jobs[jobIndex].bullets.map(function (b) {
            return sanitize(b);
        }).filter(Boolean).join('\n');
    }

    function onJobFieldInput(card, jobIndex) {
        readJobFromCard(card, jobIndex);
        writeExperience(jobs, true);
    }

    function renderJobs() {
        var host = document.getElementById('experience-items');
        if (!host) return;
        var pack = t();
        host.innerHTML = '';
        jobs.forEach(function (job, jobIndex) {
            var card = document.createElement('div');
            card.className = 'experience-card';
            card.setAttribute('data-job-index', String(jobIndex));

            var fields = document.createElement('div');
            fields.className = 'experience-card-fields';

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

            fields.append(
                makeInput('data-job-dates', pack.datesPh, job.dates),
                makeInput('data-job-role', pack.rolePh, job.role),
                makeInput('data-job-employer', pack.employerPh, job.employer)
            );

            var removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'experience-remove-job';
            removeBtn.setAttribute('data-remove-job', String(jobIndex));
            removeBtn.textContent = pack.removeJob;

            var headRow = document.createElement('div');
            headRow.className = 'experience-card-head';
            headRow.append(fields, removeBtn);

            var bulletsWrap = document.createElement('div');
            bulletsWrap.className = 'experience-bullets';
            (job.bullets || ['']).forEach(function (bullet, bulletIndex) {
                var row = document.createElement('div');
                row.className = 'experience-bullet-row';
                var area = document.createElement('textarea');
                area.rows = 2;
                area.className = 'studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none';
                area.setAttribute('data-job-bullet', String(bulletIndex));
                area.placeholder = pack.bulletPh;
                area.value = bullet || '';
                area.addEventListener('input', function () {
                    onJobFieldInput(card, jobIndex);
                });
                row.appendChild(area);
                bulletsWrap.appendChild(row);
            });

            var addBullet = document.createElement('button');
            addBullet.type = 'button';
            addBullet.className = 'experience-add-bullet';
            addBullet.setAttribute('data-add-bullet', String(jobIndex));
            addBullet.textContent = pack.addBullet;

            card.append(headRow, bulletsWrap, addBullet);
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
        trailing.forEach(function (job) { jobs.push(normalizeJob(job)); });
        renderJobs();
    }

    function addJob(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        if (addJobLock) return;
        addJobLock = true;
        try {
            collectCardsIntoJobs();
            jobs.push(emptyJob());
            // Keep empty jobs in memory; serialize drops blanks so they stay off the CV until filled.
            writeExperience(jobs, true);
            renderJobs();
            var cards = document.querySelectorAll('#experience-items .experience-card');
            var last = cards[cards.length - 1];
            if (last) {
                var focusEl = last.querySelector('[data-job-role]') || last.querySelector('input');
                if (focusEl && typeof focusEl.focus === 'function') focusEl.focus();
                last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } finally {
            window.setTimeout(function () { addJobLock = false; }, 0);
        }
    }

    function ensureRawModal() {
        var existing = document.getElementById('experience-raw-modal');
        if (existing) return existing;

        var modal = document.createElement('div');
        modal.id = 'experience-raw-modal';
        modal.className = 'experience-raw-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'experience-raw-title');
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML =
            '<div class="experience-raw-dialog">' +
            '  <h3 id="experience-raw-title" class="experience-raw-title"></h3>' +
            '  <p id="experience-raw-hint" class="experience-raw-hint"></p>' +
            '  <textarea id="experience-raw-textarea" class="experience-raw-textarea" rows="14" dir="auto"></textarea>' +
            '  <div class="experience-raw-actions">' +
            '    <button type="button" id="experience-raw-cancel" class="experience-raw-btn experience-raw-btn-secondary"></button>' +
            '    <button type="button" id="experience-raw-save" class="experience-raw-btn experience-raw-btn-primary"></button>' +
            '  </div>' +
            '</div>';
        document.body.appendChild(modal);

        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeRawModal(false);
        });
        document.getElementById('experience-raw-cancel').addEventListener('click', function (e) {
            if (e) e.preventDefault();
            closeRawModal(false);
        });
        document.getElementById('experience-raw-save').addEventListener('click', function (e) {
            if (e) e.preventDefault();
            closeRawModal(true);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                e.preventDefault();
                closeRawModal(false);
            }
        });
        return modal;
    }

    function openRawModal(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        if (rawOpenLock) return;
        var existing = document.getElementById('experience-raw-modal');
        if (existing && existing.classList.contains('is-open')) return;
        rawOpenLock = true;
        try {
            collectCardsIntoJobs();
            var pack = t();
            var modal = ensureRawModal();
            var area = document.getElementById('experience-raw-textarea');
            var title = document.getElementById('experience-raw-title');
            var hint = document.getElementById('experience-raw-hint');
            var saveBtn = document.getElementById('experience-raw-save');
            var cancelBtn = document.getElementById('experience-raw-cancel');
            var source = experienceEl();

            if (title) title.textContent = pack.rawTitle;
            if (hint) hint.textContent = pack.rawHint;
            if (saveBtn) saveBtn.textContent = pack.save;
            if (cancelBtn) cancelBtn.textContent = pack.cancel;

            rawDraft = source ? source.value : serializeJobs(jobs);
            if (area) {
                area.value = rawDraft;
                area.focus();
                if (typeof area.setSelectionRange === 'function') {
                    area.setSelectionRange(area.value.length, area.value.length);
                }
            }

            modal.classList.remove('hidden');
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('qc-experience-raw-open');
        } finally {
            window.setTimeout(function () { rawOpenLock = false; }, 0);
        }
    }

    function closeRawModal(save) {
        var modal = document.getElementById('experience-raw-modal');
        if (!modal) return;
        if (save) {
            var area = document.getElementById('experience-raw-textarea');
            var text = area ? area.value : rawDraft;
            jobs = parseJobs(text);
            renderJobs();
            writeExperience(jobs, true);
        }
        modal.classList.remove('is-open');
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('qc-experience-raw-open');
        var reopen = document.getElementById('btn-experience-raw');
        if (reopen && typeof reopen.focus === 'function') reopen.focus();
    }

    function applyI18n() {
        var pack = t();
        var addJobBtn = document.getElementById('btn-add-experience');
        if (addJobBtn) addJobBtn.textContent = pack.addJob;
        var raw = document.getElementById('btn-experience-raw');
        if (raw) raw.textContent = pack.rawToggle;
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
                var idx = Number(btn.getAttribute('data-remove-job'));
                jobs.splice(idx, 1);
                if (!jobs.length) jobs.push(emptyJob());
                writeExperience(jobs, true);
                renderJobs();
                return;
            }
            if (btn.hasAttribute('data-add-bullet')) {
                var jobIdx = Number(btn.getAttribute('data-add-bullet'));
                if (!jobs[jobIdx]) return;
                jobs[jobIdx].bullets.push('');
                writeExperience(jobs, false);
                renderJobs();
            }
        });
    }

    function onToolbarClick(e) {
        var btn = e.target && e.target.closest && e.target.closest('button');
        if (!btn) return;
        if (btn.id === 'btn-add-experience') {
            addJob(e);
            return;
        }
        if (btn.id === 'btn-experience-raw') {
            openRawModal(e);
        }
    }

    function bindToolbarButtons() {
        var addJobBtn = document.getElementById('btn-add-experience');
        var rawBtn = document.getElementById('btn-experience-raw');
        if (addJobBtn && !addJobBtn.dataset.qcExpBound) {
            addJobBtn.dataset.qcExpBound = '1';
            addJobBtn.addEventListener('click', addJob);
        }
        if (rawBtn && !rawBtn.dataset.qcExpBound) {
            rawBtn.dataset.qcExpBound = '1';
            rawBtn.addEventListener('click', openRawModal);
        }
    }

    function bind() {
        if (bound) {
            bindToolbarButtons();
            refreshJobsFromTextarea();
            applyI18n();
            return;
        }
        bound = true;
        bindExperienceHost();
        bindToolbarButtons();
        document.addEventListener('click', onToolbarClick, true);

        var raw = experienceEl();
        if (raw) {
            raw.classList.add('experience-raw-hidden', 'sr-only');
            raw.setAttribute('aria-hidden', 'true');
            raw.addEventListener('input', function () {
                if (syncing) return;
                refreshJobsFromTextarea();
            });
        }

        refreshJobsFromTextarea();
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
        }, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    var api = {
        refresh: refreshJobsFromTextarea,
        applyI18n: applyI18n,
        addJob: addJob,
        openRawEditor: openRawModal
    };
    global.QCExperience = api;
    global.QCExperienceEditor = api;
    global.addExperienceJob = addJob;
    global.openExperienceRawEditor = openRawModal;
})(typeof window !== 'undefined' ? window : globalThis);
