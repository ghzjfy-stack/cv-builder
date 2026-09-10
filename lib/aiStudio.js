(function (global) {
    var FIELD_MAP = {
        name: 'in-name',
        title: 'in-title',
        phone: 'in-phone',
        email: 'in-email',
        location: 'in-location',
        linkedin: 'in-linkedin',
        summary: 'in-summary',
        experience: 'in-experience',
        education: 'in-education',
        military: 'in-military',
        skills: 'in-skills',
        languages: 'in-languages',
        references: 'in-references'
    };

    var copy = {
        he: {
            createBtn: 'יצירה מהירה ב-AI',
            createBtnEn: 'Create with AI',
            modalTitle: 'יצירה מהירה ב-AI',
            modalLead: 'כתבו או הדביקו חופשי מי אתם — נמלא את השדות ונעדכן את התצוגה החייה.',
            placeholder: 'לדוגמה: עבדתי כמנהל חנות שנתיים, שירות בלוגיסטיקה, עברית שפת אם ואנגלית שוטפת.',
            generate: 'מלאו את הטופס',
            generating: 'מפענח את הטקסט...',
            cancel: 'ביטול',
            polish: '✨ שדרג ניסוח',
            polishing: 'משדרג...',
            addJob: 'הוסף משרה',
            addBullet: 'הוסף נקודה',
            removeJob: 'הסר משרה',
            jobHeader: 'תקופה | תפקיד | חברה',
            bulletPh: 'מה עשיתם, עם תוצאה אם יש',
            rawToggle: 'עריכת טקסט מלא',
            errEmpty: 'כתבו או הדביקו כמה משפטים על הרקע שלכם.',
            saved: 'הטופס עודכן. אפשר לערוך כל שדה.',
            polishEmpty: 'כתבו משפט קודם, ואז שדרגו ניסוח.',
            voiceLabel: 'הקלטה קולית',
            voiceListening: 'מקשיבים... דברו על הרקע שלכם',
            voiceUnsupported: 'הדפדפן לא תומך בהקלטה קולית. הקלידו או הדביקו טקסט.',
            voiceDenied: 'אין הרשאה למיקרופון. אפשר להקליד במקום.'
        },
        en: {
            createBtn: 'Create with AI',
            createBtnEn: 'יצירה מהירה ב-AI',
            modalTitle: 'Create with AI',
            modalLead: 'Type or paste a free-text background — we fill the form and refresh the live preview.',
            placeholder: 'e.g. I worked as a store manager for 2 years, army service in logistics, native Hebrew and fluent English.',
            generate: 'Fill the form',
            generating: 'Reading your notes...',
            cancel: 'Cancel',
            polish: '✨ Polish wording',
            polishing: 'Polishing...',
            addJob: 'Add role',
            addBullet: 'Add bullet',
            removeJob: 'Remove role',
            jobHeader: 'Dates | title | company',
            bulletPh: 'What you did, with an outcome if you have one',
            rawToggle: 'Edit full text',
            errEmpty: 'Type or paste a few sentences about your background.',
            saved: 'The form is filled. You can edit any field.',
            polishEmpty: 'Write a line first, then polish it.',
            voiceLabel: 'Voice input',
            voiceListening: 'Listening... tell us your background',
            voiceUnsupported: 'Voice input is not supported here. Type or paste instead.',
            voiceDenied: 'Microphone permission was denied. You can type instead.'
        }
    };

    var jobs = [];
    var syncing = false;
    var lastFocus = null;
    var recognition = null;
    var voiceBase = '';
    var voiceShouldParse = false;

    function t() {
        return copy[global.QCCvLang === 'en' ? 'en' : 'he'];
    }

    function isEn() {
        return global.QCCvLang === 'en';
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
            var header = '';
            var bullets = [];
            lines.forEach(function (line, i) {
                var body = line.replace(/^[•\-\*]\s+/, '');
                var isBullet = /^[•\-\*]\s+/.test(line);
                if (!header && !isBullet) header = line;
                else bullets.push(isBullet ? body : body);
            });
            out.push({ header: header, bullets: bullets.length ? bullets : [''] });
        });
        if (!out.length) out.push({ header: '', bullets: [''] });
        return out;
    }

    function serializeJobs(list) {
        return (list || []).map(function (job) {
            var lines = [];
            if (job.header && String(job.header).trim()) lines.push(String(job.header).trim());
            (job.bullets || []).forEach(function (b) {
                var body = String(b || '').replace(/^[•\-\*]\s+/, '').trim();
                if (body) lines.push('• ' + body);
            });
            return lines.join('\n');
        }).filter(Boolean).join('\n\n');
    }

    function writeExperience(list, triggerPreview) {
        var el = experienceEl();
        if (!el) return;
        syncing = true;
        el.value = serializeJobs(list);
        if (triggerPreview && typeof global.updateCV === 'function') global.updateCV();
        else if (global.QCDraft) QCDraft.saveSoon();
        syncing = false;
    }

    function setBusy(node, on) {
        if (!node) return;
        node.classList.toggle('ai-busy', !!on);
        node.setAttribute('aria-busy', on ? 'true' : 'false');
    }

    function polishButton(label) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ai-polish-btn';
        btn.setAttribute('data-ai-polish', '1');
        btn.textContent = label;
        return btn;
    }

    function renderJobs() {
        var host = document.getElementById('experience-items');
        if (!host) return;
        var pack = t();
        host.replaceChildren();
        jobs.forEach(function (job, jobIndex) {
            var card = document.createElement('div');
            card.className = 'experience-item';
            card.setAttribute('data-job', String(jobIndex));

            var headRow = document.createElement('div');
            headRow.className = 'experience-item-head';
            var header = document.createElement('input');
            header.type = 'text';
            header.className = 'experience-item-header';
            header.value = job.header || '';
            header.placeholder = pack.jobHeader;
            header.setAttribute('aria-label', pack.jobHeader);
            header.addEventListener('input', function () {
                jobs[jobIndex].header = header.value;
                writeExperience(jobs, true);
            });
            var remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'experience-item-remove';
            remove.setAttribute('data-remove-job', String(jobIndex));
            remove.setAttribute('aria-label', pack.removeJob);
            remove.textContent = '×';
            headRow.append(header, remove);

            var bulletsWrap = document.createElement('div');
            bulletsWrap.className = 'experience-bullets';
            (job.bullets || ['']).forEach(function (bullet, bulletIndex) {
                var row = document.createElement('div');
                row.className = 'experience-bullet-row';
                var area = document.createElement('textarea');
                area.rows = 2;
                area.className = 'experience-bullet-input';
                area.value = bullet || '';
                area.placeholder = pack.bulletPh;
                area.addEventListener('input', function () {
                    jobs[jobIndex].bullets[bulletIndex] = area.value;
                    writeExperience(jobs, true);
                });
                var polish = polishButton(pack.polish);
                polish.setAttribute('data-job', String(jobIndex));
                polish.setAttribute('data-bullet', String(bulletIndex));
                row.append(area, polish);
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

    function applyCv(cv) {
        if (!cv || typeof cv !== 'object') return;
        Object.keys(FIELD_MAP).forEach(function (key) {
            var value = cv[key];
            if (value == null || String(value).trim() === '') return;
            var el = document.getElementById(FIELD_MAP[key]);
            if (el) el.value = sanitize(value);
        });
        if (typeof global.hydrateLanguagePicker === 'function') hydrateLanguagePicker();
        refreshJobsFromTextarea();
        if (typeof global.updateCV === 'function') updateCV();
        if (typeof global.updateCvScore === 'function') updateCvScore();
        if (global.QCDraft) QCDraft.save();
    }

    async function callAi(action, payload) {
        var lang = isEn() ? 'en' : 'he';
        var body = { text: payload.text, lang: lang, context: payload.context || '' };
        if (global.QCCvAi && typeof QCCvAi.request === 'function') {
            return QCCvAi.request(action, body);
        }
        var res = await fetch('/api/cv-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, text: body.text, lang: lang, context: body.context })
        });
        var data = null;
        try { data = await res.json(); } catch (e) { data = null; }
        if (!data) return { ok: false, error: t().generating };
        return data;
    }

    function speechCtor() {
        return global.SpeechRecognition || global.webkitSpeechRecognition || null;
    }

    function setVoicePressed(on) {
        var btn = document.getElementById('btn-voice-input');
        if (!btn) return;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('aria-label', on ? t().voiceListening : t().voiceLabel);
    }

    function stopVoice(parseAfter) {
        voiceShouldParse = !!parseAfter;
        if (recognition) {
            try { recognition.stop(); } catch (e) { /* ignore */ }
        }
        setVoicePressed(false);
    }

    function startVoice() {
        var Ctor = speechCtor();
        var area = document.getElementById('ai-create-text');
        if (!Ctor) {
            setModalFeedback(t().voiceUnsupported, false);
            return;
        }
        if (recognition) {
            stopVoice(false);
            return;
        }
        recognition = new Ctor();
        recognition.lang = isEn() ? 'en-US' : 'he-IL';
        recognition.continuous = true;
        recognition.interimResults = true;
        voiceBase = area && 'value' in area ? String(area.value).trim() : '';
        voiceShouldParse = false;
        recognition.onresult = function (event) {
            var finalText = '';
            var interim = '';
            var i;
            for (i = 0; i < event.results.length; i++) {
                var chunk = event.results[i][0] && event.results[i][0].transcript ? event.results[i][0].transcript : '';
                if (event.results[i].isFinal) finalText += chunk + ' ';
                else interim += chunk;
            }
            if (area) {
                var parts = [voiceBase, (finalText + interim).trim()].filter(Boolean);
                area.value = parts.join(voiceBase && (finalText || interim) ? '\n' : '');
            }
            setModalFeedback(t().voiceListening, true);
        };
        recognition.onerror = function (event) {
            var err = event && event.error;
            if (err === 'not-allowed' || err === 'service-not-allowed') {
                setModalFeedback(t().voiceDenied, false);
            } else if (err !== 'aborted' && err !== 'no-speech') {
                setModalFeedback(t().voiceUnsupported, false);
            }
        };
        recognition.onend = function () {
            recognition = null;
            setVoicePressed(false);
            if (voiceShouldParse) {
                voiceShouldParse = false;
                void runParse();
            }
        };
        try {
            recognition.start();
            setVoicePressed(true);
            setModalFeedback(t().voiceListening, true);
        } catch (e) {
            recognition = null;
            setVoicePressed(false);
            setModalFeedback(t().voiceUnsupported, false);
        }
    }

    function toggleVoice() {
        if (recognition) stopVoice(true);
        else startVoice();
    }

    function modalEl() {
        return document.getElementById('ai-create-modal');
    }

    function setModalFeedback(text, ok) {
        var el = document.getElementById('ai-create-feedback');
        if (!el) return;
        el.textContent = text || '';
        el.className = 'text-sm min-h-5 font-semibold ' + (ok ? 'text-emerald-300' : 'text-rose-300');
    }

    function setModalBusy(on) {
        if (on) stopVoice(false);
        var overlay = document.getElementById('ai-create-skeleton');
        var submit = document.getElementById('btn-ai-create-run');
        var area = document.getElementById('ai-create-text');
        if (overlay) overlay.classList.toggle('hidden', !on);
        if (submit) {
            submit.disabled = !!on;
            submit.textContent = on ? t().generating : t().generate;
        }
        if (area) {
            if (on) area.setAttribute('disabled', 'true');
            else area.removeAttribute('disabled');
        }
        setBusy(document.getElementById('ai-create-panel'), on);
    }

    function openModal() {
        var el = modalEl();
        if (!el) return;
        lastFocus = document.activeElement;
        el.classList.remove('hidden');
        el.classList.add('flex');
        el.setAttribute('aria-hidden', 'false');
        el.setAttribute('dir', isEn() ? 'ltr' : 'rtl');
        document.body.classList.add('qc-ai-modal-open');
        setModalFeedback('', true);
        setModalBusy(false);
        applyI18n();
        window.setTimeout(function () {
            document.getElementById('ai-create-text')?.focus();
        }, 30);
    }

    function closeModal() {
        var el = modalEl();
        if (!el) return;
        stopVoice(false);
        el.classList.add('hidden');
        el.classList.remove('flex');
        el.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('qc-ai-modal-open');
        setModalBusy(false);
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    async function runParse() {
        var area = document.getElementById('ai-create-text');
        var raw = area && 'value' in area ? String(area.value) : '';
        if (!raw.trim()) {
            setModalFeedback(t().errEmpty, false);
            return;
        }
        setModalBusy(true);
        setModalFeedback('', true);
        try {
            var result = await callAi('parse', { text: raw.trim() });
            if (!result || result.ok !== true || !result.cv) {
                setModalFeedback((result && result.error) || t().errEmpty, false);
                return;
            }
            applyCv(result.cv);
            setModalFeedback(t().saved, true);
            closeModal();
        } catch (e) {
            setModalFeedback(t().errEmpty, false);
        } finally {
            setModalBusy(false);
        }
    }

    async function polishNode(btn, getText, setText, context) {
        var pack = t();
        var text = String(getText() || '').trim();
        if (!text) {
            if (global.QCLog) QCLog.add('ai_polish_empty', context);
            btn.textContent = pack.polishEmpty;
            window.setTimeout(function () { btn.textContent = pack.polish; }, 1800);
            return;
        }
        var row = btn.closest('.experience-bullet-row, .ai-field-wrap, .space-y-2, div');
        btn.disabled = true;
        btn.textContent = pack.polishing;
        setBusy(row, true);
        try {
            var result = await callAi('polish', { text: text, context: context });
            if (result && result.ok && result.text) {
                setText(sanitize(result.text));
                if (typeof global.updateCV === 'function') updateCV();
                if (global.QCDraft) QCDraft.save();
            } else {
                btn.textContent = (result && result.error) || pack.polishEmpty;
                window.setTimeout(function () { btn.textContent = pack.polish; }, 2200);
                return;
            }
        } catch (e) {
            btn.textContent = pack.polishEmpty;
            window.setTimeout(function () { btn.textContent = pack.polish; }, 2200);
            return;
        } finally {
            btn.disabled = false;
            btn.textContent = pack.polish;
            setBusy(row, false);
        }
    }

    function applyI18n() {
        var pack = t();
        var create = document.getElementById('btn-ai-create');
        if (create) {
            create.innerHTML = '<span class="ai-create-main">' + pack.createBtn + '</span><span class="ai-create-sub">' + pack.createBtnEn + '</span>';
        }
        var title = document.getElementById('ai-create-title');
        if (title) title.textContent = pack.modalTitle;
        var lead = document.getElementById('ai-create-lead');
        if (lead) lead.textContent = pack.modalLead;
        var area = document.getElementById('ai-create-text');
        if (area) area.placeholder = pack.placeholder;
        var run = document.getElementById('btn-ai-create-run');
        if (run && !run.disabled) run.textContent = pack.generate;
        var cancel = document.getElementById('btn-ai-create-cancel');
        if (cancel) cancel.textContent = pack.cancel;
        var addJob = document.getElementById('btn-add-experience');
        if (addJob) addJob.textContent = pack.addJob;
        var raw = document.getElementById('btn-experience-raw');
        if (raw) raw.textContent = pack.rawToggle;
        document.querySelectorAll('[data-ai-polish]').forEach(function (btn) {
            if (!btn.disabled) btn.textContent = pack.polish;
        });
        var voice = document.getElementById('btn-voice-input');
        if (voice) voice.setAttribute('aria-label', pack.voiceLabel);
        var modal = modalEl();
        if (modal) modal.setAttribute('dir', isEn() ? 'ltr' : 'rtl');
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
                applyI18n();
                return;
            }
            if (btn.hasAttribute('data-add-bullet')) {
                var jobIdx = Number(btn.getAttribute('data-add-bullet'));
                if (!jobs[jobIdx]) return;
                jobs[jobIdx].bullets.push('');
                writeExperience(jobs, false);
                renderJobs();
                applyI18n();
                return;
            }
            if (btn.hasAttribute('data-ai-polish')) {
                var j = Number(btn.getAttribute('data-job'));
                var b = Number(btn.getAttribute('data-bullet'));
                var area = btn.parentElement && btn.parentElement.querySelector('textarea');
                polishNode(btn, function () { return area ? area.value : (jobs[j] && jobs[j].bullets[b]) || ''; }, function (next) {
                    if (jobs[j]) jobs[j].bullets[b] = next;
                    if (area) area.value = next;
                    writeExperience(jobs, true);
                }, 'experience_bullet');
            }
        });
    }

    function bindFieldPolish() {
        document.querySelectorAll('[data-ai-polish-field]').forEach(function (btn) {
            if (btn.dataset.qcBound) return;
            btn.dataset.qcBound = '1';
            btn.addEventListener('click', function () {
                var id = btn.getAttribute('data-ai-polish-field');
                var el = document.getElementById(id);
                if (!el) return;
                polishNode(btn, function () {
                    if (el.selectionStart !== el.selectionEnd) return String(el.value).slice(el.selectionStart, el.selectionEnd);
                    return el.value;
                }, function (next) {
                    if (el.selectionStart !== el.selectionEnd) {
                        el.setRangeText(next, el.selectionStart, el.selectionEnd, 'end');
                    } else {
                        el.value = next;
                    }
                }, id.replace('in-', ''));
            });
        });
    }

    function ensureVoiceButton() {
        var area = document.getElementById('ai-create-text');
        if (!area) return null;
        var existing = document.getElementById('btn-voice-input');
        if (existing) return existing;
        var wrap = document.createElement('div');
        wrap.className = 'relative';
        area.parentNode.insertBefore(wrap, area);
        wrap.appendChild(area);
        area.classList.add('ps-14');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'btn-voice-input';
        btn.className = 'absolute bottom-3 start-3 inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', t().voiceLabel);
        btn.title = t().voiceLabel;
        btn.innerHTML = '<span aria-hidden="true">🎤</span>';
        wrap.appendChild(btn);
        return btn;
    }

    function bind() {
        bindExperienceHost();
        bindFieldPolish();
        refreshJobsFromTextarea();
        applyI18n();
        document.querySelectorAll('[data-ai-open]').forEach(function (btn) {
            btn.addEventListener('click', openModal);
        });
        document.getElementById('btn-ai-create-run')?.addEventListener('click', function (e) {
            e.preventDefault();
            void runParse();
        });
        document.getElementById('btn-ai-create-cancel')?.addEventListener('click', closeModal);
        document.getElementById('btn-ai-create-close')?.addEventListener('click', closeModal);
        var voiceBtn = ensureVoiceButton();
        if (voiceBtn) {
            voiceBtn.addEventListener('click', function (e) {
                e.preventDefault();
                toggleVoice();
            });
        }
        document.getElementById('ai-create-backdrop')?.addEventListener('click', closeModal);
        document.getElementById('ai-create-modal')?.addEventListener('click', function (e) {
            if (e.target && (e.target.id === 'ai-create-modal' || e.target.id === 'ai-create-backdrop')) closeModal();
        });
        document.getElementById('ai-create-text')?.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                void runParse();
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalEl() && !modalEl().classList.contains('hidden')) {
                e.preventDefault();
                closeModal();
            }
        });
        document.getElementById('btn-add-experience')?.addEventListener('click', function () {
            jobs.push({ header: '', bullets: [''] });
            writeExperience(jobs, false);
            renderJobs();
            applyI18n();
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
            if (typeof fn !== 'function' || fn.__qcAiWrapped) return;
            var wrapped = function () {
                var result = fn.apply(this, arguments);
                after();
                return result;
            };
            wrapped.__qcAiWrapped = true;
            global[name] = wrapped;
        }
        wrap('insertBullet', refreshJobsFromTextarea);
        wrap('fillCvSample', refreshJobsFromTextarea);
        wrap('loadExample', refreshJobsFromTextarea);
        wrap('loadRoleExample', refreshJobsFromTextarea);
        wrap('replaceRoleExample', refreshJobsFromTextarea);
        window.setTimeout(function () {
            wrap('insertBullet', refreshJobsFromTextarea);
            wrap('fillCvSample', refreshJobsFromTextarea);
            wrap('loadExample', refreshJobsFromTextarea);
            wrap('loadRoleExample', refreshJobsFromTextarea);
            wrap('replaceRoleExample', refreshJobsFromTextarea);
        }, 0);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    global.QCExperienceEditor = {
        refresh: function () {
            refreshJobsFromTextarea();
            applyI18n();
        },
        applyCv: applyCv,
        open: openModal,
        close: closeModal
    };
    global.applyCvI18nAi = applyI18n;
})(window);
