/**
 * Standalone add-job boot — binds the CTA without relying on form submit.
 * Loaded after experienceEditor.js. Safe to call repeatedly.
 */
(function (global) {
    'use strict';

    function cardCount() {
        var host = document.getElementById('experience-items');
        return host ? host.querySelectorAll('.experience-card').length : 0;
    }

    function announce(n) {
        var status = document.getElementById('experience-add-status');
        if (!status) return;
        status.textContent = 'משרה ' + n + ' ✓';
        status.classList.add('is-visible');
        global.clearTimeout(announce._t);
        announce._t = global.setTimeout(function () {
            status.classList.remove('is-visible');
        }, 2200);
    }

    function domAppendJob() {
        var host = document.getElementById('experience-items');
        if (!host) return 0;
        var n = host.querySelectorAll('.experience-card').length + 1;
        var id = 'job-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        var card = document.createElement('article');
        card.className = 'experience-card exp-block is-open is-just-added';
        card.setAttribute('role', 'listitem');
        card.setAttribute('data-job-id', id);
        card.setAttribute('data-job-index', String(n - 1));
        card.innerHTML =
            '<div class="exp-block-head">' +
            '<span class="experience-card-badge exp-block-num">משרה ' + n + '</span>' +
            '<div class="experience-card-actions">' +
            '<button type="button" class="exp-block-remove" data-remove-job="' + id + '">הסר</button>' +
            '</div></div>' +
            '<div class="experience-card-fields exp-block-fields">' +
            '<div class="experience-field"><label class="experience-field-label">שם חברה/ארגון</label>' +
            '<input type="text" data-job-employer="1" data-job-field="company" class="studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11" value=""></div>' +
            '<div class="experience-field"><label class="experience-field-label">תפקיד</label>' +
            '<input type="text" data-job-role="1" data-job-field="position" class="studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11" value=""></div>' +
            '<div class="experience-field"><label class="experience-field-label">תאריכים/שנים</label>' +
            '<input type="text" data-job-dates="1" data-job-field="years" class="studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11" value=""></div>' +
            '<div class="experience-field"><label class="experience-field-label">תיאור תפקיד / הישגים</label>' +
            '<textarea rows="4" data-job-desc="1" data-job-field="description" class="studio-field experience-desc w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none"></textarea></div>' +
            '</div>';
        host.appendChild(card);
        announce(n);
        try {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) { /* ignore */ }
        global.QCCvData = global.QCCvData || {};
        if (!Array.isArray(QCCvData.experience)) QCCvData.experience = [];
        while (QCCvData.experience.length < n - 1) {
            QCCvData.experience.push({ id: 'job-pad-' + QCCvData.experience.length, title: '', company: '', dates: '', description: '' });
        }
        QCCvData.experience.push({ id: id, title: '', company: '', dates: '', description: '' });
        var raw = document.getElementById('in-experience');
        if (raw) {
            var blanks = 0;
            var i;
            for (i = QCCvData.experience.length - 1; i >= 0; i--) {
                var row = QCCvData.experience[i] || {};
                if (!(row.title || row.role || row.company || row.dates || row.description)) blanks += 1;
                else break;
            }
            raw.setAttribute('data-qc-blank-jobs', String(blanks));
        }
        if (typeof global.updateCV === 'function') {
            try { global.updateCV(); } catch (err2) { /* ignore */ }
        }
        return n;
    }

    var lastAt = 0;

    function clickAddJob(e) {
        try {
            if (e && e.__qcJobHandled) return false;
            if (e) e.__qcJobHandled = true;
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            var now = Date.now();
            if (now - lastAt < 400) return false;
            lastAt = now;
            var before = cardCount();
            if (global.QCExperience && typeof QCExperience.addExperience === 'function') {
                try {
                    QCExperience.addExperience({ __qcForceAdd: true });
                } catch (err) { /* fall through */ }
            }
            var after = cardCount();
            if (after > before) {
                announce(after);
                return false;
            }
            domAppendJob();
            if (global.QCExperience && typeof QCExperience.ensure === 'function') {
                try { QCExperience.ensure(); } catch (err2) { /* keep DOM card */ }
            }
            return false;
        } catch (err) {
            try { console.error('clickAddJob failed', err); } catch (e2) { /* ignore */ }
            try { domAppendJob(); } catch (e3) { /* ignore */ }
            return false;
        }
    }

    global.__qcClickAddJob = clickAddJob;
    global.addExperience = clickAddJob;
    global.handleAddJob = clickAddJob;
    global.addExperienceJob = clickAddJob;

    function wireButton(btn) {
        if (!btn) return;
        btn.type = 'button';
        btn.setAttribute('type', 'button');
        btn.disabled = false;
        btn.hidden = false;
        btn.removeAttribute('disabled');
        btn.removeAttribute('hidden');
        btn.style.setProperty('pointer-events', 'auto', 'important');
        btn.style.setProperty('cursor', 'pointer', 'important');
        btn.style.setProperty('z-index', '200', 'important');
        if (btn.__qcBootWired) return;
        btn.__qcBootWired = true;
        btn.addEventListener('click', clickAddJob, false);
    }

    function bind() {
        wireButton(document.getElementById('btn-add-experience'));
        var form = document.getElementById('experience-add-form');
        if (form && !form.__qcBootBound) {
            form.__qcBootBound = true;
            form.addEventListener('submit', function (e) {
                if (e && e.preventDefault) e.preventDefault();
                clickAddJob(e);
                return false;
            });
        }
    }

    function start() {
        bind();
        // Re-wire if another script replaces the button node.
        if (!global.__qcAddJobBootTimer) {
            global.__qcAddJobBootTimer = global.setInterval(bind, 1500);
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})(typeof window !== 'undefined' ? window : globalThis);
