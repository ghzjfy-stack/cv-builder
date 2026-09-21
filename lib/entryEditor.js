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
        var adding = false;
        var lastAddAt = 0;
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

        function parseItems(text) {
            var lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
            var groups = [];
            var current = [];
            lines.forEach(function (raw) {
                var line = raw.trim();
                if (!line) {
                    if (current.length) {
                        groups.push(current);
                        current = [];
                    }
                    return;
                }
                var isHeader = looksLikeDates(line) && line.indexOf('|') >= 0;
                if (isHeader && current.length) {
                    groups.push(current);
                    current = [line];
                    return;
                }
                current.push(line);
            });
            if (current.length) groups.push(current);
            var out = [];
            groups.forEach(function (groupLines) {
                var parsed = parseHeader(groupLines[0]);
                var rest = groupLines.slice(1);
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
            return (list || []).map(function (item) {
                var dates = sanitize(item.dates || '');
                var title = sanitize(item.title || item.role || '');
                var org = sanitize(item.org || item.employer || '');
                var bullets = bulletsFromText(item.notes || item.description || '');
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
            if (!items.length) items = [emptyItem()];
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
            if (!items.length) items = [emptyItem()];
            host.innerHTML = '';
            host.setAttribute('role', 'list');
            items.forEach(function (item, index) {
                var id = item.id || nextId(name);
                item.id = id;
                var card = document.createElement('article');
                card.className = 'experience-card entry-card';
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
                fields.append(
                    labeled(pack.title, makeInput('data-entry-title', pack.titlePh, item.title)),
                    labeled(pack.org, makeInput('data-entry-org', pack.orgPh, item.org)),
                    labeled(pack.dates, makeInput('data-entry-dates', pack.datesPh, item.dates)),
                    labeled(pack.notes, notes)
                );
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
            if (filled.length) items = filled.concat(extras);
            else items = extras.length ? extras : parsed;
            if (!items.length) items = [emptyItem()];
            if (!rawMode) render();
        }

        function applyRawUi() {
            var el = fieldEl();
            var host = document.getElementById(config.hostId);
            var addBtn = document.getElementById(config.addBtnId);
            var toggle = document.getElementById(config.rawBtnId);
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
            if (host) host.hidden = !!rawMode;
            if (addBtn) addBtn.hidden = !!rawMode;
            if (toggle) {
                toggle.type = 'button';
                toggle.disabled = false;
                toggle.removeAttribute('disabled');
                toggle.setAttribute('aria-pressed', rawMode ? 'true' : 'false');
                toggle.textContent = rawMode ? pack.rawCards : pack.rawEdit;
                toggle.style.setProperty('pointer-events', 'auto', 'important');
                toggle.style.setProperty('cursor', 'pointer', 'important');
                toggle.onclick = toggleRaw;
            }
        }

        function toggleRaw(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            if (rawMode) {
                rawMode = false;
                refreshFromTextarea();
            } else {
                collectCards();
                writeField(false);
                items = parseItems(fieldEl() ? fieldEl().value : '');
                if (!items.length) items = [emptyItem()];
                rawMode = true;
            }
            applyRawUi();
            logSection();
            return false;
        }

        function addItem(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            var now = Date.now();
            if (adding || now - lastAddAt < 250) return false;
            adding = true;
            lastAddAt = now;
            try {
                collectCards();
                items.push(emptyItem());
                render();
                writeField(true);
                var host = document.getElementById(config.hostId);
                var last = host && host.querySelector('.entry-card:last-child input');
                if (last && typeof last.focus === 'function') last.focus();
            } finally {
                adding = false;
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
            if (!items.length) items = [emptyItem()];
            render();
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
            if (addBtn) {
                addBtn.type = 'button';
                addBtn.disabled = false;
                addBtn.removeAttribute('disabled');
                addBtn.style.setProperty('pointer-events', 'auto', 'important');
                addBtn.style.setProperty('cursor', 'pointer', 'important');
                addBtn.onclick = addItem;
            }
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
            if (!items.length) items = [emptyItem()];
            render();
            applyI18n();

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

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
        else bind();

        return {
            refresh: refreshFromTextarea,
            applyI18n: applyI18n,
            addItem: addItem,
            toggleRaw: toggleRaw,
            parse: parseItems
        };
    }

    var education = createSectionEditor({
        name: 'education',
        fieldId: 'in-education',
        hostId: 'education-items',
        addBtnId: 'btn-add-education',
        addLabelId: 'btn-add-education-label',
        rawBtnId: 'btn-education-raw',
        copy: {
            he: {
                add: 'הוסף השכלה',
                remove: 'מחק השכלה',
                itemN: 'השכלה',
                title: 'תואר / קורס',
                org: 'מוסד לימודים',
                dates: 'שנים / תאריכים',
                notes: 'פירוט (לא חובה)',
                titlePh: 'BA במנהל עסקים',
                orgPh: 'שם המוסד',
                datesPh: '2015 - 2018',
                notesPh: 'פרויקט גמר, התמחות או קורס משלים',
                rawEdit: 'עריכת טקסט מלא',
                rawCards: 'חזרה לכרטיסים'
            },
            en: {
                add: 'Add education',
                remove: 'Delete education',
                itemN: 'Education',
                title: 'Degree / course',
                org: 'Institution',
                dates: 'Years / dates',
                notes: 'Details (optional)',
                titlePh: 'BA in Business Administration',
                orgPh: 'Institution name',
                datesPh: '2015 - 2018',
                notesPh: 'Capstone, internship, or extra course',
                rawEdit: 'Full text edit',
                rawCards: 'Back to cards'
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
        copy: {
            he: {
                add: 'הוסף שירות',
                remove: 'מחק שירות',
                itemN: 'שירות',
                title: 'תפקיד / תיאור',
                org: 'יחידה / מסגרת',
                dates: 'שנים / תאריכים',
                notes: 'פירוט (לא חובה)',
                titlePh: 'שירות פיקודי',
                orgPh: 'חיל האוויר',
                datesPh: '2012 - 2015',
                notesPh: 'אחריות, הובלת צוות או הכשרה',
                rawEdit: 'עריכת טקסט מלא',
                rawCards: 'חזרה לכרטיסים'
            },
            en: {
                add: 'Add service',
                remove: 'Delete service',
                itemN: 'Service',
                title: 'Role / description',
                org: 'Unit / framework',
                dates: 'Years / dates',
                notes: 'Details (optional)',
                titlePh: 'Command role',
                orgPh: 'Air Force',
                datesPh: '2012 - 2015',
                notesPh: 'Responsibility, team leadership, or training',
                rawEdit: 'Full text edit',
                rawCards: 'Back to cards'
            }
        }
    });

    global.QCEducation = education;
    global.QCMilitary = military;
    global.handleAddEducation = education.addItem;
    global.handleAddMilitary = military.addItem;
    global.toggleEducationRaw = education.toggleRaw;
    global.toggleMilitaryRaw = military.toggleRaw;
    global.toggleExperienceRaw = global.toggleExperienceRaw || function (e) {
        if (global.QCExperience && typeof QCExperience.toggleRaw === 'function') return QCExperience.toggleRaw(e);
        return false;
    };
})(typeof window !== 'undefined' ? window : globalThis);
