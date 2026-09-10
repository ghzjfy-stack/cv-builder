(function (global) {
    var copy = {
        he: {
            addJob: 'הוסף משרה',
            addBullet: 'הוסף נקודה',
            removeJob: 'הסר משרה',
            jobHeader: 'תקופה | תפקיד | חברה',
            bulletPh: 'מה עשיתם, עם תוצאה אם יש',
            rawToggle: 'עריכת טקסט מלא'
        },
        en: {
            addJob: 'Add role',
            addBullet: 'Add bullet',
            removeJob: 'Remove role',
            jobHeader: 'Dates | title | company',
            bulletPh: 'What you did, with an outcome if you have one',
            rawToggle: 'Edit full text'
        }
    };

    var jobs = [];
    var syncing = false;

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

    function parseJobs(text) {
        var chunks = String(text || '').replace(/\r\n/g, '\n').split(/\n{2,}/);
        var out = [];
        chunks.forEach(function (chunk) {
            var lines = chunk.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
            if (!lines.length) return;
            var header = lines[0];
            var bullets = lines.slice(1).map(function (line) {
                return line.replace(/^[•\-*\u2022]\s*/, '').trim();
            }).filter(Boolean);
            out.push({ header: header, bullets: bullets.length ? bullets : [''] });
        });
        return out.length ? out : [{ header: '', bullets: [''] }];
    }

    function serializeJobs(list) {
        return (list || []).map(function (job) {
            var header = sanitize(job.header || '');
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
        syncing = false;
        if (triggerUpdate && typeof global.updateCV === 'function') updateCV();
        if (global.QCDraft) QCDraft.save();
    }

    function readJobInputs(card, jobIndex) {
        var headerInput = card.querySelector('[data-job-header]');
        var bulletAreas = card.querySelectorAll('[data-job-bullet]');
        if (!jobs[jobIndex]) jobs[jobIndex] = { header: '', bullets: [''] };
        jobs[jobIndex].header = headerInput ? headerInput.value : '';
        jobs[jobIndex].bullets = Array.prototype.map.call(bulletAreas, function (area) {
            return area.value;
        });
        if (!jobs[jobIndex].bullets.length) jobs[jobIndex].bullets = [''];
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

            var headRow = document.createElement('div');
            headRow.className = 'experience-card-head';

            var headerInput = document.createElement('input');
            headerInput.type = 'text';
            headerInput.className = 'w-full bg-slate-900 border border-slate-700 p-2.5 text-sm rounded-lg text-slate-100 outline-none min-h-11';
            headerInput.setAttribute('data-job-header', '1');
            headerInput.placeholder = pack.jobHeader;
            headerInput.value = job.header || '';
            headerInput.addEventListener('input', function () {
                readJobInputs(card, jobIndex);
                writeExperience(jobs, true);
            });

            var removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'experience-remove-job';
            removeBtn.setAttribute('data-remove-job', String(jobIndex));
            removeBtn.textContent = pack.removeJob;

            headRow.append(headerInput, removeBtn);

            var bulletsWrap = document.createElement('div');
            bulletsWrap.className = 'experience-bullets';
            (job.bullets || ['']).forEach(function (bullet, bulletIndex) {
                var row = document.createElement('div');
                row.className = 'experience-bullet-row';
                var area = document.createElement('textarea');
                area.rows = 2;
                area.className = 'w-full bg-slate-900 border border-slate-700 p-2.5 text-sm rounded-lg text-slate-100 outline-none';
                area.setAttribute('data-job-bullet', String(bulletIndex));
                area.placeholder = pack.bulletPh;
                area.value = bullet || '';
                area.addEventListener('input', function () {
                    readJobInputs(card, jobIndex);
                    writeExperience(jobs, true);
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

    function refreshJobsFromTextarea() {
        if (syncing) return;
        var el = experienceEl();
        jobs = parseJobs(el ? el.value : '');
        renderJobs();
    }

    function applyI18n() {
        var pack = t();
        var addJob = document.getElementById('btn-add-experience');
        if (addJob) addJob.textContent = pack.addJob;
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
                if (!jobs.length) jobs.push({ header: '', bullets: [''] });
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

    function bind() {
        bindExperienceHost();
        refreshJobsFromTextarea();
        applyI18n();
        document.getElementById('btn-add-experience')?.addEventListener('click', function () {
            jobs.push({ header: '', bullets: [''] });
            writeExperience(jobs, false);
            renderJobs();
        });
        document.getElementById('btn-experience-raw')?.addEventListener('click', function () {
            var raw = document.getElementById('in-experience');
            if (!raw) return;
            var hidden = raw.classList.toggle('experience-raw-hidden');
            raw.classList.toggle('sr-only', hidden);
            raw.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        });
        var raw = document.getElementById('in-experience');
        if (raw && document.getElementById('experience-items')) {
            raw.classList.add('experience-raw-hidden', 'sr-only');
            raw.setAttribute('aria-hidden', 'true');
            raw.addEventListener('input', function () {
                if (syncing) return;
                refreshJobsFromTextarea();
            });
        }
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
        ['insertBullet', 'fillCvSample', 'loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang'].forEach(function (name) {
            wrap(name, function () {
                refreshJobsFromTextarea();
                applyI18n();
            });
        });
        window.setTimeout(function () {
            ['insertBullet', 'fillCvSample', 'loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang'].forEach(function (name) {
                wrap(name, function () {
                    refreshJobsFromTextarea();
                    applyI18n();
                });
            });
        }, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    global.QCExperience = {
        refresh: refreshJobsFromTextarea,
        applyI18n: applyI18n
    };
})(typeof window !== 'undefined' ? window : globalThis);
