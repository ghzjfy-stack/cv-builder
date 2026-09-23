(function (global) {
    function nextId(prefix) {
        try {
            if (global.crypto && typeof crypto.randomUUID === 'function') return prefix + '-' + crypto.randomUUID();
        } catch (err) { /* older browsers */ }
        return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function sanitize(value) {
        if (global.QCSanitize && typeof QCSanitize.text === 'function') return QCSanitize.text(value);
        return String(value || '').trim();
    }

    function stripBullet(line) {
        return String(line || '').replace(/^[•\-*\u2022]\s*/, '').trim();
    }

    function bulletsFromText(text) {
        return String(text || '').replace(/\r\n/g, '\n').split('\n').map(stripBullet).filter(Boolean);
    }

    function descriptionFromBullets(list) {
        return (list || []).map(stripBullet).filter(Boolean).map(function (b) { return '• ' + b; }).join('\n');
    }

    function looksLikeDates(value) {
        var text = String(value || '').trim();
        if (!text) return false;
        if (/(?:^|\b)(?:19|20)\d{2}\b/.test(text)) return true;
        if (/נוכחי|בהווה|היום|present|current/i.test(text)) return true;
        return /\d{1,2}\s*[\/.\-]\s*(?:19|20)\d{2}/.test(text);
    }

    function parseHeader(headerLine) {
        var parts = String(headerLine || '').split('|').map(function (p) { return p.trim(); }).filter(Boolean);
        var dates = '';
        var title = '';
        var org = '';
        var rest = [];
        var i;
        var dateIndex = -1;
        for (i = 0; i < parts.length; i++) {
            if (dateIndex < 0 && looksLikeDates(parts[i])) {
                dates = parts[i];
                dateIndex = i;
            } else {
                rest.push(parts[i]);
            }
        }
        if (rest.length === 1) title = rest[0];
        else if (rest.length >= 2) {
            title = rest[0];
            org = rest.slice(1).join(' | ');
        } else if (!dates && parts[0]) title = parts[0];
        return { dates: dates, title: title, org: org };
    }

    function createSectionEditor(config) {
        var items = [];
        var syncing = false;
        var bound = false;
        var rawMode = false;
        var name = config.name;

        function t() {
            var pack = config.copy[global.QCCvLang === 'en' ? 'en' : 'he'] || config.copy.he;
            return pack;
        }

        function logSection() {
            try { console.log('Section updated:', name); } catch (err) { /* ignore */ }
        }

        function fieldEl() {
            return document.getElementById(config.fieldId);
        }

        function emptyItem() {
            return {
                id: nextId(name),
                dates: '',
                title: '',
                role: '',
                org: '',
                employer: '',
                notes: '',
                description: '',
                bullets: []
            };
        }

        function ensureItems() {
            if (!Array.isArray(items) || items.length < 1) items = [emptyItem()];
            return items;
        }

        function normalize(item) {
            var title = String((item && (item.title || item.role)) || '');
            var org = String((item && (item.org || item.employer || item.company)) || '');
            var notes = item && item.notes != null ? String(item.notes) : String((item && item.description) || '');
            var bullets = item && Array.isArray(item.bullets) ? item.bullets.slice() : [];
            if (!bullets.length && notes) bullets = bulletsFromText(notes);
            if (!notes && bullets.length) notes = descriptionFromBullets(bullets);
            return {
                id: (item && item.id) || nextId(name),
                dates: (item && item.dates) || '',
                title: title,
                role: title,
                org: org,
                employer: org,
                notes: notes,
                description: notes,
                bullets: bullets
            };
        }

        function isBlank(item) {
            if (!item) return true;
            return !sanitize(item.dates) && !sanitize(item.title || item.role) && !sanitize(item.org || item.employer) && !sanitize(item.notes || item.description);
        }

        function looksLikeEntryHeader(line) {
            var text = String(line || '').trim();
            if (!text) return false;
            if (/\|/.test(text) && looksLikeDates(text)) return true;
            return /(?:19|20)\d{2}\s*[-–—]\s*/.test(text);
        }

        function splitEntryChunks(raw) {
            var text = String(raw || '').replace(/\r\n/g, '\n');
            if (!text.replace(/[\u200b\u200c\u200d\s|]/g, '')) return [];
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

        function parseItems(text) {
            var chunks = splitEntryChunks(text);
            if (!chunks.length) return [emptyItem()];
            var out = [];
            chunks.forEach(function (chunk) {
                var cleaned = String(chunk || '').replace(/[\u200b]/g, '').trim();
                if (!cleaned || cleaned === '|') return;
                var lines = cleaned.split('\n').map(function (line) { return line.trim(); }).filter(Boolean);
                if (!lines.length) return;
                var parsed = parseHeader(lines[0]);
                var rest = lines.slice(1);
                if (!parsed.dates && rest.length && looksLikeDates(rest[0])) {
                    parsed.dates = rest[0];
                    rest = rest.slice(1);
                }
                if (!parsed.org && rest.length && !/^[•\-*\u2022]/.test(rest[0]) && !looksLikeDates(rest[0])) {
                    parsed.org = rest[0];
                    rest = rest.slice(1);
                }
                var bullets = rest.map(stripBullet).filter(Boolean);
                out.push(normalize({
                    dates: parsed.dates,
                    title: parsed.title,
                    org: parsed.org,
                    bullets: bullets,
                    notes: descriptionFromBullets(bullets)
                }));
            });
            return out.length ? out : [emptyItem()];
        }

        function serializeItems(list) {
            var military = config.layout === 'military';
            return (list || []).map(function (item) {
                if (isBlank(item)) return '';
                var dates = sanitize(item.dates || '');
                var title = sanitize(item.title || item.role || '');
                var org = military ? '' : sanitize(item.org || item.employer || '');
                var bullets = config.includeNotes === false ? [] : bulletsFromText(item.notes || item.description || '');
                var header = [dates, title].filter(Boolean).join(' | ');
                var lines = [];
                if (header) lines.push(header);
                if (org) lines.push(org);
                bullets.forEach(function (b) { lines.push('• ' + b); });
                return lines.join('\n');
            }).filter(Boolean).join('\n\n');
        }

        function trailingBlanks() {
            var extras = [];
            var i;
            for (i = items.length - 1; i >= 0; i--) {
                if (isBlank(items[i])) extras.unshift(items[i]);
                else break;
            }
            return extras;
        }

        function writeField(triggerUpdate) {
            var el = fieldEl();
            ensureItems();
            if (!el) return;
            syncing = true;
            el.value = serializeItems(items);
            syncing = false;
            if (triggerUpdate && typeof global.updateCV === 'function') {
                try { global.updateCV(); } catch (err) { /* keep cards */ }
            }
            if (global.QCDraft && typeof QCDraft.saveSoon === 'function') QCDraft.saveSoon();
            logSection();
        }

        function itemIndexById(id) {
            var i;
            for (i = 0; i < items.length; i++) {
                if (items[i] && items[i].id === id) return i;
            }
            return -1;
        }

        function trashSvg() {
            return '<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
        }

        function readCard(card, index) {
            if (!items[index]) items[index] = emptyItem();
            var dates = card.querySelector('[data-entry-dates]');
            var title = card.querySelector('[data-entry-title]');
            var org = card.querySelector('[data-entry-org]');
            var notes = card.querySelector('[data-entry-notes]');
            items[index].dates = dates ? dates.value : '';
            items[index].title = title ? title.value : '';
            items[index].role = items[index].title;
            items[index].org = org ? org.value : '';
            items[index].employer = items[index].org;
            items[index].notes = notes ? notes.value : '';
            items[index].description = items[index].notes;
            items[index].bullets = bulletsFromText(items[index].notes);
        }

        function collectCards() {
            var host = document.getElementById(config.hostId);
            if (!host) return;
            Array.prototype.forEach.call(host.querySelectorAll('.entry-card'), function (card) {
                var id = card.getAttribute('data-entry-id');
                var idx = itemIndexById(id);
                if (idx < 0) idx = Number(card.getAttribute('data-entry-index'));
                if (Number.isFinite(idx) && idx >= 0) readCard(card, idx);
            });
        }

        function render() {
            var host = document.getElementById(config.hostId);
            if (!host) return;
            var pack = t();
            ensureItems();
            host.innerHTML = '';
            host.setAttribute('role', 'list');
            items.forEach(function (item, index) {
                var id = item.id || nextId(name);
                item.id = id;
                var card = document.createElement('article');
                card.className = 'experience-card entry-card is-open';
                card.setAttribute('role', 'listitem');
                card.setAttribute('data-entry-id', id);
                card.setAttribute('data-entry-index', String(index));

                var toolbar = document.createElement('div');
                toolbar.className = 'experience-card-toolbar';
                var badge = document.createElement('span');
                badge.className = 'experience-card-badge';
                badge.textContent = pack.itemN + ' ' + (index + 1);
                var remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'experience-icon-btn is-danger';
                remove.setAttribute('data-remove-entry', id);
                remove.setAttribute('aria-label', pack.remove);
                remove.title = pack.remove;
                remove.style.setProperty('pointer-events', 'auto', 'important');
                remove.innerHTML = trashSvg();
                if (items.length <= 1) {
                    remove.disabled = true;
                    remove.setAttribute('aria-disabled', 'true');
                }
                toolbar.append(badge, remove);

                function makeInput(attr, placeholder, value) {
                    var input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11';
                    input.setAttribute(attr, '1');
                    input.placeholder = placeholder;
                    input.value = value || '';
                    input.addEventListener('input', function () {
                        var idx = itemIndexById(id);
                        if (idx < 0) idx = index;
                        readCard(card, idx);
                        writeField(true);
                    });
                    return input;
                }

                function labeled(labelText, control) {
                    var wrap = document.createElement('div');
                    wrap.className = 'experience-field';
                    var caption = document.createElement('label');
                    caption.className = 'experience-field-label';
                    caption.textContent = labelText;
                    wrap.append(caption, control);
                    return wrap;
                }

                var notes = document.createElement('textarea');
                notes.rows = 3;
                notes.className = 'studio-field experience-desc w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none';
                notes.setAttribute('data-entry-notes', '1');
                notes.placeholder = pack.notesPh;
                notes.value = item.notes || '';
                notes.addEventListener('input', function () {
                    var idx = itemIndexById(id);
                    if (idx < 0) idx = index;
                    readCard(card, idx);
                    writeField(true);
                });

                var fields = document.createElement('div');
                fields.className = 'experience-card-fields';
                var orgField = labeled(pack.org, makeInput('data-entry-org', pack.orgPh, item.org));
                var titleField = labeled(pack.title, makeInput('data-entry-title', pack.titlePh, item.title));
                var datesField = labeled(pack.dates, makeInput('data-entry-dates', pack.datesPh, item.dates));
                if (config.layout === 'military') fields.append(titleField, datesField);
                else if (config.orgFirst === false) fields.append(titleField, orgField, datesField);
                else fields.append(orgField, titleField, datesField);
                if (config.includeNotes !== false) fields.append(labeled(pack.notes, notes));
                card.append(toolbar, fields);
                host.appendChild(card);
            });
        }

        function refreshFromTextarea() {
            if (syncing) return;
            var extras = trailingBlanks();
            var el = fieldEl();
            var parsed = parseItems(el ? el.value : '');
            var filled = parsed.filter(function (row) { return !isBlank(row); });
            items = filled.length ? filled.concat(extras) : (extras.length ? extras : [emptyItem()]);
            ensureItems();
            if (!rawMode) render();
        }

        function applyRawUi() {
            var el = fieldEl();
            var host = document.getElementById(config.hostId);
            var addBtn = document.getElementById(config.addBtnId);
            var toggle = document.getElementById(config.rawBtnId);
            rawMode = false;
            if (el) {
                el.classList.add('experience-raw-hidden', 'sr-only');
                el.setAttribute('aria-hidden', 'true');
                el.tabIndex = -1;
            }
            if (host) host.hidden = false;
            if (addBtn) {
                addBtn.hidden = false;
                addBtn.removeAttribute('hidden');
            }
            if (toggle) toggle.hidden = true;
        }

        function toggleRaw(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            rawMode = false;
            applyRawUi();
            return false;
        }

        function ensureAddButtonVisible() {
            var host = document.getElementById(config.hostId);
            var addBtn = document.getElementById(config.addBtnId);
            if (host && addBtn && addBtn.previousElementSibling !== host) {
                host.insertAdjacentElement('afterend', addBtn);
            }
            bindAddButton();
        }

        function bindAddButton() {
            var addBtn = document.getElementById(config.addBtnId);
            if (!addBtn) return;
            addBtn.type = 'button';
            addBtn.disabled = false;
            addBtn.hidden = false;
            addBtn.removeAttribute('disabled');
            addBtn.removeAttribute('hidden');
            addBtn.style.setProperty('pointer-events', 'auto', 'important');
            addBtn.style.setProperty('cursor', 'pointer', 'important');
            addBtn.style.setProperty('color', '#38bdf8', 'important');
            addBtn.style.setProperty('z-index', '30', 'important');
            if (addBtn.dataset.qcAddBound === '1') return;
            addBtn.dataset.qcAddBound = '1';
            addBtn.addEventListener('click', addItem);
        }

        function addItem(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
            if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            collectCards();
            ensureItems();
            items = items.concat([emptyItem()]);
            render();
            writeField(true);
            ensureAddButtonVisible();
            var host = document.getElementById(config.hostId);
            var lastCard = host && host.querySelector('.entry-card:last-child');
            var last = lastCard && lastCard.querySelector('input, textarea');
            if (last && typeof last.focus === 'function') last.focus();
            if (lastCard && typeof lastCard.scrollIntoView === 'function') {
                lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return false;
        }

        function removeItem(id) {
            collectCards();
            var index = itemIndexById(id);
            if (index < 0) return;
            if (items.length <= 1) {
                items = [emptyItem()];
            } else {
                items.splice(index, 1);
                if (!items.length) items = [emptyItem()];
            }
            render();
            writeField(true);
        }

        function applyI18n() {
            var pack = t();
            var addLabel = document.getElementById(config.addLabelId);
            if (addLabel) addLabel.textContent = pack.add;
            applyRawUi();
            if (rawMode) return;
            collectCards();
            ensureItems();
            render();
            ensureAddButtonVisible();
        }

        function bind() {
            if (bound) {
                applyI18n();
                return;
            }
            bound = true;
            var host = document.getElementById(config.hostId);
            if (host && !host.dataset.qcBound) {
                host.dataset.qcBound = '1';
                host.addEventListener('click', function (e) {
                    var btn = e.target && e.target.closest && e.target.closest('button');
                    if (!btn || !host.contains(btn)) return;
                    e.preventDefault();
                    if (btn.hasAttribute('data-remove-entry') && !btn.disabled) {
                        removeItem(btn.getAttribute('data-remove-entry'));
                    }
                });
            }
            var addBtn = document.getElementById(config.addBtnId);
            bindAddButton();
            ensureAddButtonVisible();
            var raw = fieldEl();
            if (raw) {
                if (!rawMode) {
                    raw.classList.add('experience-raw-hidden', 'sr-only');
                    raw.setAttribute('aria-hidden', 'true');
                    raw.tabIndex = -1;
                }
                raw.addEventListener('input', function () {
                    if (syncing) return;
                    refreshFromTextarea();
                    if (rawMode && typeof global.updateCV === 'function') {
                        try { global.updateCV(); } catch (err) { /* keep typing */ }
                    }
                    logSection();
                });
            }
            items = parseItems(raw ? raw.value : '');
            ensureItems();
            render();
            applyI18n();
            ensureAddButtonVisible();

            function wrap(fnName) {
                var fn = global[fnName];
                if (typeof fn !== 'function' || fn['__qc' + name + 'Wrapped']) return;
                var wrapped = function () {
                    var result = fn.apply(this, arguments);
                    rawMode = false;
                    refreshFromTextarea();
                    applyI18n();
                    return result;
                };
                wrapped['__qc' + name + 'Wrapped'] = true;
                global[fnName] = wrapped;
            }
            ['loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang', 'clearCvForm', 'resetForm', 'fillCvSample'].forEach(wrap);
            window.setTimeout(function () {
                ['loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang', 'clearCvForm', 'resetForm', 'fillCvSample'].forEach(wrap);
            }, 0);
        }

        var api = {
            refresh: refreshFromTextarea,
            applyI18n: applyI18n,
            addItem: addItem,
            toggleRaw: toggleRaw,
            parse: parseItems,
            ensure: function () {
                ensureItems();
                render();
                ensureAddButtonVisible();
                return items.slice();
            }
        };
        items = [emptyItem()];
        function start() {
            try {
                bind();
            } catch (err) {
                try { console.error(name + ' editor bind failed', err); } catch (logErr) { /* ignore */ }
                ensureItems();
                try { render(); } catch (renderErr) { /* keep fallback HTML */ }
                ensureAddButtonVisible();
            }
        }
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
        else start();
        return api;
    }

    var education = createSectionEditor({
        name: 'education',
        fieldId: 'in-education',
        hostId: 'education-items',
        addBtnId: 'btn-add-education',
        addLabelId: 'btn-add-education-label',
        rawBtnId: 'btn-education-raw',
        includeNotes: false,
        copy: {
            he: {
                add: 'הוסף השכלה',
                remove: 'מחק השכלה',
                itemN: 'השכלה',
                title: 'תואר / תעודה / מגמה',
                org: 'מוסד לימודים',
                dates: 'שנים/שנת סיום',
                notes: 'פירוט (לא חובה)',
                titlePh: 'לדוגמה: BA במנהל עסקים',
                orgPh: 'לדוגמה: אוניברסיטת תל אביב',
                datesPh: 'לדוגמה: 2015 - 2018',
                notesPh: '',
                rawEdit: '',
                rawCards: ''
            },
            en: {
                add: 'Add education',
                remove: 'Delete education',
                itemN: 'Education',
                title: 'Degree / certificate / major',
                org: 'Institution',
                dates: 'Years / graduation',
                notes: 'Details (optional)',
                titlePh: 'e.g. BA in Business Administration',
                orgPh: 'e.g. Tel Aviv University',
                datesPh: 'e.g. 2015 - 2018',
                notesPh: '',
                rawEdit: '',
                rawCards: ''
            }
        }
    });

    var military = createSectionEditor({
        name: 'military',
        fieldId: 'in-military',
        hostId: 'military-items',
        addBtnId: 'btn-add-military',
        addLabelId: 'btn-add-military-label',
        rawBtnId: 'btn-military-raw',
        includeNotes: false,
        orgFirst: false,
        layout: 'military',
        copy: {
            he: {
                add: 'הוסף שירות צבאי / לאומי',
                remove: 'מחק שירות',
                itemN: 'שירות',
                title: 'תפקיד / מסגרת',
                org: 'יחידה / מסגרת',
                dates: 'פירוט קצר / שנים',
                notes: 'פירוט (לא חובה)',
                titlePh: 'לדוגמה: מפקד כיתה, חיל האוויר',
                orgPh: 'לדוגמה: חיל האוויר',
                datesPh: 'לדוגמה: 2012 - 2015',
                notesPh: '',
                rawEdit: '',
                rawCards: ''
            },
            en: {
                add: 'Add military / national service',
                remove: 'Delete service',
                itemN: 'Service',
                title: 'Role / unit',
                org: 'Unit / framework',
                dates: 'Short details / years',
                notes: 'Details (optional)',
                titlePh: 'e.g. Squad commander, Air Force',
                orgPh: 'e.g. Air Force',
                datesPh: 'e.g. 2012 - 2015',
                notesPh: '',
                rawEdit: '',
                rawCards: ''
            }
        }
    });

    global.QCEducation = education;
    global.QCMilitary = military;
    global.handleAddEducation = education.addItem;
    global.handleAddMilitary = military.addItem;
    global.toggleEducationRaw = education.toggleRaw;
    global.toggleMilitaryRaw = military.toggleRaw;
    if (!document.documentElement.dataset.qcSectionAdd) {
        document.documentElement.dataset.qcSectionAdd = '1';
        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('#btn-add-education, #btn-add-military');
            if (!btn) return;
            if (btn.id === 'btn-add-education') education.addItem(e);
            else if (btn.id === 'btn-add-military') military.addItem(e);
        }, true);
    }
    global.toggleExperienceRaw = global.toggleExperienceRaw || function (e) {
        if (global.QCExperience && typeof QCExperience.toggleRaw === 'function') return QCExperience.toggleRaw(e);
        return false;
    };
})(typeof window !== 'undefined' ? window : globalThis);
