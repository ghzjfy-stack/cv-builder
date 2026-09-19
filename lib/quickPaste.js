(function (global) {
    var FIELD_IDS = [
        'in-name', 'in-title', 'in-phone', 'in-email', 'in-location', 'in-linkedin',
        'in-summary', 'in-experience', 'in-education', 'in-military', 'in-skills', 'in-languages'
    ];

    var HEADER_MAP = [
        { key: 'summary', re: /^(professional\s+summary|career\s+summary|summary|profile|about(\s+me)?|תקציר( מקצועי| הקריירה)?|אודות|פרופיל)$/i },
        { key: 'experience', re: /^(work(\s+experience)?|professional\s+experience|employment(\s+history)?|experience|ניסיון( תעסוקתי| מקצועי)?|היסטוריית תעסוקה)$/i },
        { key: 'education', re: /^(education(\s+and\s+courses)?|academic(\s+background)?|השכלה( וקורסים| אקדמית)?|לימודים|קורסים)$/i },
        { key: 'military', re: /^(military|national service|שירות( צבאי| לאומי)?)$/i },
        { key: 'skills', re: /^(skills|כישורים( מקצועיים)?|יכולות|מיומנויות)$/i },
        { key: 'languages', re: /^(languages|שפות)$/i },
        { key: 'references', re: /^(references|המלצות)$/i }
    ];

    var INLINE_HEADERS = [
        'professional summary', 'work experience', 'professional experience', 'national service',
        'personal details', 'contact details', 'about me',
        'תקציר מקצועי', 'תקציר הקריירה', 'ניסיון תעסוקתי', 'ניסיון מקצועי', 'השכלה וקורסים', 'השכלה אקדמית',
        'שירות צבאי', 'שירות לאומי', 'פרטים אישיים', 'כישורים מקצועיים', 'היסטוריית תעסוקה',
        'employment history', 'work experience', 'professional experience', 'academic background',
        'employment', 'education', 'experience', 'references', 'languages', 'military',
        'summary', 'profile', 'skills', 'contact', 'about',
        'תקציר', 'השכלה', 'כישורים', 'המלצות', 'שפות', 'אודות', 'פרופיל', 'יכולות', 'קורסים', 'לימודים'
    ];

    var INLINE_HEADER_RE = new RegExp(
        '(?:^|[\\s/|•·\\-–—])(' +
        INLINE_HEADERS.map(function (h) {
            return h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        }).join('|') +
        ')\\s*[:：]?\\s*(?=\\S|$)',
        'gi'
    );

    function clean(value) {
        if (global.QCSanitize && typeof QCSanitize.text === 'function') {
            return QCSanitize.text(value);
        }
        return String(value || '').trim();
    }

    function normalizeResumeText(raw) {
        var text = String(raw || '')
            .replace(/\r\n/g, '\n')
            .replace(/\u00a0/g, ' ')
            .replace(/[ \t]+\n/g, '\n')
            .trim();
        if (!text) return '';
        if (text.indexOf('\n') < 0 || text.split('\n').length < 4) {
            text = (' ' + text + ' ').replace(INLINE_HEADER_RE, '\n$1\n').trim();
        }
        return text.replace(/\n{3,}/g, '\n\n');
    }

    function looksHeader(line) {
        var i;
        var cleaned = String(line || '')
            .replace(/[:：|–—•·]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        for (i = 0; i < HEADER_MAP.length; i++) {
            if (HEADER_MAP[i].re.test(cleaned)) return HEADER_MAP[i].key;
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

    function guessIdentity(pre, text, parsed) {
        var blob = String((pre[0] || text || '')).replace(/\s+/g, ' ').trim();
        if (!parsed.name) {
            var he = blob.match(/^([\u0590-\u05FF]{2,}(?:\s+[\u0590-\u05FF]{2,}){0,1})/);
            var en = blob.match(/^([A-Z][a-zA-Z'’\-]+(?:\s+[A-Z][a-zA-Z'’\-]+){0,3})/);
            parsed.name = (he && he[1]) || (en && en[1]) || '';
            if (!parsed.name && pre[0] && pre[0].length < 80 && pre[0].indexOf('@') < 0) parsed.name = pre[0];
        }
        var rest = blob;
        if (parsed.name && blob.indexOf(parsed.name) === 0) {
            rest = blob.slice(parsed.name.length).replace(/^[\s,|–—-]+/, '');
        }
        if (!parsed.title) {
            var titleBits = rest.split(/(?:\s{2,}|[|•·]|(?:050|052|053|054|055|058)\b|\+972|@)/)[0] || '';
            titleBits = titleBits.replace(parsed.phone || '', '').replace(parsed.email || '', '').trim();
            if (titleBits && titleBits.length < 70 && !/@/.test(titleBits) && !/linkedin/i.test(titleBits) && !/\d{5,}/.test(titleBits)) {
                parsed.title = titleBits;
            } else if (pre[1] && pre[1].length < 90 && pre[1].indexOf('@') < 0 && !/linkedin\.com/i.test(pre[1])) {
                parsed.title = pre[1];
            }
        }
        if (!parsed.location && pre[2] && pre[2].length < 60 && !/@/.test(pre[2]) && !/\d{3}/.test(pre[2])) {
            parsed.location = pre[2].replace(/^·\s*/, '');
        }
    }

    function parseResumePaste(raw) {
        var text = normalizeResumeText(raw);
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
            key = looksHeader(line);
            if (key) {
                current = key;
                buckets[current] = buckets[current] || [];
                continue;
            }
            buckets[current] = buckets[current] || [];
            buckets[current].push(line);
        }

        var pre = (buckets.preamble || []).filter(Boolean);
        guessIdentity(pre, text, parsed);
        if (pre.length > 3 && !buckets.summary) {
            parsed.summary = pre.slice(parsed.title ? 2 : 1).filter(function (row) {
                return row.indexOf('@') < 0 && !/linkedin\.com/i.test(row) && row !== parsed.phone && row !== parsed.name;
            }).join('\n');
        }

        Object.keys(buckets).forEach(function (bucket) {
            if (bucket === 'preamble' || !parsed.hasOwnProperty(bucket)) return;
            parsed[bucket] = buckets[bucket].join('\n').replace(/\n{3,}/g, '\n\n').trim();
        });

        if (!parsed.experience) {
            var leftover = pre.join('\n');
            if (parsed.name) leftover = leftover.split(parsed.name).join('');
            if (parsed.email) leftover = leftover.split(parsed.email).join('');
            if (parsed.phone) leftover = leftover.split(parsed.phone).join('');
            leftover = leftover.replace(/\s+/g, ' ').trim();
            if (leftover.length > 40) parsed.experience = leftover;
        }

        if (!parsed.education) {
            var eduBits = [];
            lines.forEach(function (row) {
                if (/השכלה|education|לימודים|תואר|B\.?A\.?|B\.?Sc|M\.?A\.?|M\.?Sc|MBA|Ph\.?D/i.test(row)
                    && !/experience|ניסיון/i.test(row)) {
                    eduBits.push(row);
                }
            });
            if (eduBits.length) parsed.education = eduBits.join('\n').trim();
        }

        Object.keys(parsed).forEach(function (field) {
            parsed[field] = clean(parsed[field]);
        });
        return parsed;
    }

    function applyParsed(parsed, opts) {
        var replace = !!(opts && opts.replace);
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
            if (!map[id] && !replace) return;
            var el = document.getElementById(id);
            if (!el) return;
            el.value = map[id] || '';
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) { /* ignore */ }
        });
        if (typeof global.updateCV === 'function') global.updateCV();
        if (global.QCExperience && typeof QCExperience.refresh === 'function') {
            QCExperience.refresh();
            window.setTimeout(function () {
                if (global.QCExperience && typeof QCExperience.refresh === 'function') QCExperience.refresh();
            }, 0);
        }
        if (typeof global.hydrateLanguagePicker === 'function') global.hydrateLanguagePicker();
        if (global.QCDraft) global.QCDraft.save();
    }

    function setPasteFeedback(text, ok) {
        var el = document.getElementById('quick-paste-feedback');
        if (!el) return;
        el.textContent = text || '';
        el.className = 'text-sm min-h-5 font-semibold ' + (ok ? 'text-emerald-300' : 'text-rose-300');
    }

    function openQuickPaste(e) {
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        var modal = document.getElementById('quick-paste-modal');
        if (!modal) {
            console.error('[QuickCV paste] modal missing');
            return;
        }
        console.log('[QuickCV paste] open modal');
        if (typeof window.lockQcModalScroll === 'function') window.lockQcModalScroll('quick-paste');
        else {
            document.documentElement.classList.add('qc-modal-open');
            document.body.classList.add('qc-modal-open');
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('aria-hidden', 'false');
        setPasteFeedback('', true);
        window.setTimeout(function () {
            var area = document.getElementById('quick-paste-text');
            if (area) area.focus();
        }, 30);
    }

    function closeQuickPaste() {
        var modal = document.getElementById('quick-paste-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.setAttribute('aria-hidden', 'true');
        if (typeof window.unlockQcModalScroll === 'function') window.unlockQcModalScroll('quick-paste');
        else {
            document.documentElement.classList.remove('qc-modal-open');
            document.body.classList.remove('qc-modal-open');
        }
    }

    function applyQuickPaste() {
        try {
            var area = document.getElementById('quick-paste-text');
            var raw = area && 'value' in area ? String(area.value) : '';
            console.log('[QuickCV paste] apply', raw.length, 'chars');
            if (!raw.trim()) {
                setPasteFeedback(global.QCCvLang === 'en' ? 'Paste some text first.' : 'הדביקו טקסט קודם.', false);
                return false;
            }
            var parsed = parseResumePaste(raw);
            console.log('[QuickCV paste] parsed', {
                name: parsed.name,
                email: parsed.email,
                phone: parsed.phone,
                experience: !!(parsed.experience),
                education: !!(parsed.education)
            });
            if (!parsed.name && !parsed.experience && !parsed.education && !parsed.email && !parsed.phone) {
                setPasteFeedback(global.QCCvLang === 'en'
                    ? 'Could not detect name, experience, or education. Check the text and try again.'
                    : 'לא זוהו שם, ניסיון או השכלה. בדקו את הטקסט ונסו שוב.', false);
                return false;
            }
            applyParsed(parsed, { replace: true });
            closeQuickPaste();
            if (global.QCCvImport && typeof QCCvImport.afterSuccess === 'function') {
                QCCvImport.afterSuccess();
            }
            return true;
        } catch (err) {
            console.error('[QuickCV paste] apply failed', err);
            setPasteFeedback(global.QCCvLang === 'en'
                ? 'Error reading the text. Please try again or edit the fields manually.'
                : 'שגיאה בקריאת הקובץ. אנא נסה קובץ אחר או השתמש בהדבקת טקסט', false);
            return false;
        }
    }

    function bind() {
        var pasteBtn = document.getElementById('btn-quick-paste');
        if (pasteBtn && !pasteBtn.__qcPasteBound) {
            pasteBtn.__qcPasteBound = true;
            pasteBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                openQuickPaste(e);
            });
        }
        document.getElementById('btn-quick-paste-apply')?.addEventListener('click', applyQuickPaste);
        document.getElementById('btn-quick-paste-close')?.addEventListener('click', closeQuickPaste);
        document.getElementById('quick-paste-modal')?.addEventListener('click', function (e) {
            if (e.target && e.target.id === 'quick-paste-modal') closeQuickPaste();
        });
        var area = document.getElementById('quick-paste-text');
        if (area && !area.__qcPasteBound) {
            area.__qcPasteBound = true;
            area.addEventListener('paste', function () {
                window.setTimeout(function () {
                    console.log('[QuickCV paste] clipboard landed, parsing instantly');
                    applyQuickPaste();
                }, 0);
            });
            area.addEventListener('keydown', function (e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    applyQuickPaste();
                }
            });
        }
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
