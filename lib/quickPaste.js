(function (global) {
    var FIELD_IDS = [
        'in-name', 'in-title', 'in-phone', 'in-email', 'in-location', 'in-linkedin',
        'in-summary', 'in-experience', 'in-education', 'in-military', 'in-skills', 'in-languages'
    ];

    var HEADER_MAP = [
        { key: 'summary', re: /^(professional\s+summary|summary|profile|about(\s+me)?|תקציר( מקצועי)?|אודות)$/i },
        { key: 'experience', re: /^(work\s+experience|experience|employment|ניסיון( תעסוקתי)?)$/i },
        { key: 'education', re: /^(education|השכלה( וקורסים)?)$/i },
        { key: 'military', re: /^(military|national service|שירות( צבאי| לאומי)?)$/i },
        { key: 'skills', re: /^(skills|כישורים)$/i },
        { key: 'languages', re: /^(languages|שפות)$/i },
        { key: 'references', re: /^(references|המלצות)$/i }
    ];

    function clean(value) {
        if (global.QCSanitize && typeof QCSanitize.text === 'function') {
            return QCSanitize.text(value);
        }
        return String(value || '').trim();
    }

    function looksHeader(line) {
        var i;
        for (i = 0; i < HEADER_MAP.length; i++) {
            if (HEADER_MAP[i].re.test(line)) return HEADER_MAP[i].key;
        }
        return '';
    }

    function extractContacts(text, parsed) {
        var emails = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
        if (emails[0] && !parsed.email) parsed.email = emails[0];

        var phones = text.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?0?\d{2,3}\)?[\s-]?)?\d{3}[\s-]?\d{4}/g) || [];
        if (phones[0] && !parsed.phone) parsed.phone = phones[0].trim();

        var li = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+\/?/i);
        if (li && !parsed.linkedin) parsed.linkedin = li[0].replace(/^https?:\/\//i, '');
    }

    function parseResumePaste(raw) {
        var text = String(raw || '').replace(/\r\n/g, '\n').trim();
        var parsed = {
            name: '', title: '', phone: '', email: '', location: '', linkedin: '',
            summary: '', experience: '', education: '', military: '', skills: '', languages: '', references: ''
        };
        if (!text) return parsed;

        extractContacts(text, parsed);

        var lines = text.split('\n').map(function (line) { return line.trim(); });
        var buckets = { preamble: [] };
        var current = 'preamble';
        var i;
        var line;
        var key;

        for (i = 0; i < lines.length; i++) {
            line = lines[i];
            if (!line) {
                if (current !== 'preamble') {
                    buckets[current] = buckets[current] || [];
                    buckets[current].push('');
                }
                continue;
            }
            key = looksHeader(line.replace(/[:：]+$/, ''));
            if (key) {
                current = key;
                buckets[current] = buckets[current] || [];
                continue;
            }
            buckets[current] = buckets[current] || [];
            buckets[current].push(line);
        }

        var pre = (buckets.preamble || []).filter(Boolean);
        if (pre[0] && pre[0].length < 80 && pre[0].indexOf('@') < 0) parsed.name = pre[0];
        if (pre[1] && pre[1].length < 90 && pre[1].indexOf('@') < 0 && !/linkedin\.com/i.test(pre[1])) {
            parsed.title = pre[1];
        }
        if (pre[2] && pre[2].length < 60 && !parsed.location && !/@/.test(pre[2]) && !/\d{3}/.test(pre[2])) {
            parsed.location = pre[2].replace(/^·\s*/, '');
        }
        if (pre.length > 3 && !buckets.summary) {
            parsed.summary = pre.slice(parsed.title ? 2 : 1).filter(function (row) {
                return row.indexOf('@') < 0 && !/linkedin\.com/i.test(row) && row !== parsed.phone;
            }).join('\n');
        }

        Object.keys(buckets).forEach(function (bucket) {
            if (bucket === 'preamble' || !parsed.hasOwnProperty(bucket)) return;
            parsed[bucket] = buckets[bucket].join('\n').replace(/\n{3,}/g, '\n\n').trim();
        });

        Object.keys(parsed).forEach(function (field) {
            parsed[field] = clean(parsed[field]);
        });
        return parsed;
    }

    function applyParsed(parsed) {
        var map = {
            'in-name': parsed.name,
            'in-title': parsed.title,
            'in-phone': parsed.phone,
            'in-email': parsed.email,
            'in-location': parsed.location,
            'in-linkedin': parsed.linkedin,
            'in-summary': parsed.summary,
            'in-experience': parsed.experience,
            'in-education': parsed.education,
            'in-military': parsed.military,
            'in-skills': parsed.skills,
            'in-languages': parsed.languages,
            'in-references': parsed.references
        };
        Object.keys(map).forEach(function (id) {
            if (!map[id]) return;
            var el = document.getElementById(id);
            if (el) el.value = map[id];
        });
        if (typeof global.updateCV === 'function') global.updateCV();
        if (global.QCDraft) global.QCDraft.save();
    }

    function setPasteFeedback(text, ok) {
        var el = document.getElementById('quick-paste-feedback');
        if (!el) return;
        el.textContent = text || '';
        el.className = 'text-sm min-h-5 font-semibold ' + (ok ? 'text-emerald-300' : 'text-rose-300');
    }

    function openQuickPaste() {
        var modal = document.getElementById('quick-paste-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('aria-hidden', 'false');
        setPasteFeedback('', true);
        window.setTimeout(function () {
            document.getElementById('quick-paste-text')?.focus();
        }, 30);
    }

    function closeQuickPaste() {
        var modal = document.getElementById('quick-paste-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.setAttribute('aria-hidden', 'true');
    }

    function applyQuickPaste() {
        var area = document.getElementById('quick-paste-text');
        var raw = area && 'value' in area ? String(area.value) : '';
        if (!raw.trim()) {
            setPasteFeedback(global.QCCvLang === 'en' ? 'Paste some text first.' : 'הדביקו טקסט קודם.', false);
            return;
        }
        var parsed = parseResumePaste(raw);
        if (!parsed.name && !parsed.experience && !parsed.education && !parsed.email) {
            setPasteFeedback(global.QCCvLang === 'en'
                ? 'Could not detect name, experience, or education. Check the text and try again.'
                : 'לא זוהו שם, ניסיון או השכלה. בדקו את הטקסט ונסו שוב.', false);
            return;
        }
        applyParsed(parsed);
        closeQuickPaste();
    }

    function bind() {
        document.getElementById('btn-quick-paste')?.addEventListener('click', openQuickPaste);
        document.getElementById('btn-quick-paste-apply')?.addEventListener('click', applyQuickPaste);
        document.getElementById('btn-quick-paste-close')?.addEventListener('click', closeQuickPaste);
        document.getElementById('quick-paste-modal')?.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'quick-paste-modal') closeQuickPaste();
        });
        document.getElementById('quick-paste-text')?.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                applyQuickPaste();
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    global.QCQuickPaste = {
        parse: parseResumePaste,
        apply: applyParsed,
        open: openQuickPaste,
        close: closeQuickPaste,
        fields: FIELD_IDS
    };
    global.openQuickPaste = openQuickPaste;
    global.closeQuickPaste = closeQuickPaste;
})(window);
