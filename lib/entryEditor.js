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
        var MAX_SLOTS = config.maxSlots || (config.hideAdd ? 1 : 50);
        var DEFAULT_VISIBLE = config.defaultVisible || 1;
        var visibleCount = DEFAULT_VISIBLE;
        var addInFlight = false;
        var lastAddAt = 0;

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
            var id = name === 'education' ? Date.now().toString() : nextId(name);
            if (name === 'education' && (!items || !items.length)) id = 'education-seed-0';
            return {
                id: id,
                dates: '',
                years: '',
                title: '',
                degree: '',
                role: '',
                position: '',
                org: '',
                institution: '',
                employer: '',
                company: '',
                notes: '',
                description: '',
                bullets: []
            };
        }

        function ensureItems() {
            if (!Array.isArray(items) || items.length < 1) items = [emptyItem()];
            items = items.filter(Boolean).map(function (row) { return normalize(row); });
            if (config.hideAdd && items.length > 1) items = items.slice(0, 1);
            if (items.length > MAX_SLOTS) items = items.slice(0, MAX_SLOTS);
            visibleCount = items.length;
            return items;
        }

        function normalize(item) {
            var title = String((item && (item.title || item.role || item.degree)) || '');
            var org = String((item && (item.org || item.employer || item.company || item.institution)) || '');
            var notes = item && item.notes != null ? String(item.notes) : String((item && item.description) || '');
            var bullets = item && Array.isArray(item.bullets) ? item.bullets.slice() : [];
            if (!bullets.length && notes) bullets = bulletsFromText(notes);
            if (!notes && bullets.length) notes = descriptionFromBullets(bullets);
            var dates = String((item && (item.dates || item.years)) || '');
            return {
                id: (item && item.id) || nextId(name),
                dates: dates,
                years: dates,
                title: title,
                degree: title,
                role: title,
                position: title,
                org: org,
                institution: org,
                employer: org,
                company: org,
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

        function toPreviewItem(item) {
            var company = String((item && (item.company || item.org || item.employer || item.institution)) || '');
            var position = String((item && (item.position || item.title || item.role || item.degree)) || '');
            var years = String((item && (item.years || item.dates)) || '');
            var description = String((item && (item.description || item.notes)) || '');
            var military = config.layout === 'military';
            return {
                company: company,
                institution: company,
                position: position,
                degree: position,
                years: years,
                dates: years,
                description: description,
                title: position,
                role: military ? position : company,
                date: years
            };
        }

        function publishEntries() {
            global.QCCvData = global.QCCvData || {};
            if (name === 'military') {
                var mil = toPreviewItem(items[0] || emptyItem());
                var role = String(mil.role || mil.position || mil.title || '').trim();
                var years = String(mil.years || mil.dates || mil.date || '').trim();
                global.QCCvData.military = (role || years) ? { role: role, years: years } : null;
                global.QCCvData.militaryService = serializeItems(items);
            } else if (name === 'education') {
                // Keep every education slot (including empty) for form state + React context.
                global.QCCvData.education = items.map(function (item) {
                    var row = normalize(item || emptyItem());
                    return {
                        id: row.id,
                        degree: row.degree || row.title || row.position || '',
                        institution: row.institution || row.org || row.company || '',
                        years: row.years || row.dates || '',
                        details: row.notes || row.description || '',
                        title: row.title || row.degree || '',
                        org: row.org || row.institution || '',
                        company: row.company || row.institution || '',
                        dates: row.dates || row.years || '',
                        notes: row.notes || '',
                        description: row.description || row.notes || ''
                    };
                });
            } else {
                global.QCCvData[name] = items.map(toPreviewItem).filter(function (row) {
                    return row.company || row.position || row.years || row.description;
                });
            }
            if (typeof global.__qcNotifyFormData === 'function') {
                try { global.__qcNotifyFormData(global.QCCvData); } catch (err) { /* optional */ }
            }
        }

        function setEntryField(item, field, value) {
            var val = value == null ? '' : String(value);
            if (field === 'company' || field === 'org' || field === 'employer' || field === 'institution') {
                item.company = val;
                item.org = val;
                item.employer = val;
                item.institution = val;
                return;
            }
            if (field === 'position' || field === 'title' || field === 'role' || field === 'degree') {
                item.position = val;
                item.title = val;
                item.role = val;
                item.degree = val;
                return;
            }
            if (field === 'years' || field === 'dates' || field === 'date') {
                item.years = val;
                item.dates = val;
                return;
            }
            if (field === 'description' || field === 'notes' || field === 'desc') {
                item.description = val;
                item.notes = val;
                item.bullets = bulletsFromText(val);
            }
        }

        function militaryEls() {
            var host = document.getElementById(config.hostId);
            if (!host) return { host: null, card: null, roleEl: null, yearsEl: null };
            return {
                host: host,
                card: host.querySelector('.entry-card, .experience-card'),
                roleEl: host.querySelector('#in-military-role, [name="role"], [data-entry-field="position"], [data-entry-title]'),
                yearsEl: host.querySelector('#in-military-years, [name="dates"], [data-entry-field="years"], [data-entry-dates]')
            };
        }

        function readMilitaryDomIntoItems() {
            if (config.layout !== 'military') return;
            ensureItems();
            if (!items[0]) items[0] = emptyItem();
            items[0] = normalize(items[0]);
            var els = militaryEls();
            if (els.card) {
                els.card.setAttribute('data-entry-id', items[0].id);
                els.card.setAttribute('data-entry-index', '0');
                els.card.classList.add('is-open', 'entry-card');
            }
            if (!els.roleEl && !els.yearsEl) return;
            setEntryField(items[0], 'role', els.roleEl ? els.roleEl.value : '');
            setEntryField(items[0], 'years', els.yearsEl ? els.yearsEl.value : '');
        }

        function paintMilitaryDom() {
            if (config.layout !== 'military') return;
            ensureItems();
            var els = militaryEls();
            var row = items[0] || emptyItem();
            if (els.card) {
                els.card.setAttribute('data-entry-id', row.id);
                els.card.setAttribute('data-entry-index', '0');
                els.card.classList.add('is-open', 'entry-card');
            }
            if (els.roleEl && document.activeElement !== els.roleEl) {
                els.roleEl.value = row.role || row.title || row.position || '';
            }
            if (els.yearsEl && document.activeElement !== els.yearsEl) {
                els.yearsEl.value = row.years || row.dates || '';
            }
        }

        function updateMilitaryField(field, value) {
            readMilitaryDomIntoItems();
            ensureItems();
            if (!items[0]) items[0] = emptyItem();
            items[0] = normalize(items[0]);
            var mapped = (field === 'years' || field === 'dates' || field === 'date') ? 'years' : 'role';
            setEntryField(items[0], mapped, value == null ? '' : String(value));
            var els = militaryEls();
            if (els.card) {
                els.card.setAttribute('data-entry-id', items[0].id);
                els.card.setAttribute('data-entry-index', '0');
            }
            writeField(true);
        }

        function bindMilitaryInputs() {
            if (config.layout !== 'military') return;
            var els = militaryEls();
            if (els.roleEl && els.roleEl.dataset.qcMilBound !== '1') {
                els.roleEl.dataset.qcMilBound = '1';
                els.roleEl.addEventListener('input', function () {
                    updateMilitaryField('role', els.roleEl.value || '');
                });
                els.roleEl.addEventListener('change', function () {
                    updateMilitaryField('role', els.roleEl.value || '');
                });
            }
            if (els.yearsEl && els.yearsEl.dataset.qcMilBound !== '1') {
                els.yearsEl.dataset.qcMilBound = '1';
                els.yearsEl.addEventListener('input', function () {
                    updateMilitaryField('years', els.yearsEl.value || '');
                });
                els.yearsEl.addEventListener('change', function () {
                    updateMilitaryField('years', els.yearsEl.value || '');
                });
            }
        }

        function handleEntryChange(idOrIndex, field, value) {
            if (config.layout === 'military') {
                updateMilitaryField(field, value);
                return;
            }
            ensureItems();
            var index = itemIndexById(idOrIndex);
            if (index < 0) {
                var numeric = Number(idOrIndex);
                if (Number.isFinite(numeric) && numeric >= 0 && numeric < items.length && String(numeric) === String(idOrIndex)) {
                    index = numeric;
                }
            }
            var key = String(idOrIndex == null ? '' : idOrIndex);
            if (index < 0 && (key.indexOf('seed') !== -1 || key === '1' || key === '0')) index = 0;
            if (index < 0) return;
            ensureItems();
            var nextVal = value == null ? '' : String(value);
            items = items.map(function (item, i) {
                if (i !== index) return item;
                var copy = normalize(item || emptyItem());
                setEntryField(copy, field, nextVal);
                return copy;
            });
            writeField(true);
        }

        function writeField(triggerUpdate) {
            var el = fieldEl();
            ensureItems();
            publishEntries();
            if (!el) return;
            syncing = true;
            el.value = serializeItems(items);
            syncing = false;
            if (triggerUpdate && typeof global.updateCV === 'function') {
                try { global.updateCV(); } catch (err) { /* keep cards */ }
            }
            if (global.QCDraft) {
                if (name === 'military' && typeof QCDraft.save === 'function') QCDraft.save();
                else if (typeof QCDraft.saveSoon === 'function') QCDraft.saveSoon();
            }
            try {
                global.localStorage.setItem('quickcv_data', JSON.stringify(global.QCCvData || {}));
            } catch (storeErr) { /* private mode */ }
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
            if (config.layout === 'military') {
                readMilitaryDomIntoItems();
                return;
            }
            var host = document.getElementById(config.hostId);
            if (!host) return;
            var cards = host.querySelectorAll('.entry-card');
            var next = [];
            Array.prototype.forEach.call(cards, function (card) {
                var id = card.getAttribute('data-entry-id') || nextId(name);
                next.push(normalize({ id: id }));
            });
            items = next.length ? next : [emptyItem()];
            Array.prototype.forEach.call(host.querySelectorAll('.entry-card'), function (card, i) {
                if (!items[i]) return;
                var id = card.getAttribute('data-entry-id') || items[i].id;
                items[i].id = id;
                card.setAttribute('data-entry-id', id);
                card.setAttribute('data-entry-index', String(i));
                readCard(card, i);
            });
            if (items.length > MAX_SLOTS) items = items.slice(0, MAX_SLOTS);
            visibleCount = items.length;
        }

        function render() {
            if (config.layout === 'military') return;
            var host = document.getElementById(config.hostId);
            if (!host) return;
            var pack = t();
            ensureItems();
            var frag = document.createDocumentFragment();
            items.forEach(function (item, index) {
                var id = String((item && item.id) || (name + '-' + index));
                if (item && !item.id) item.id = id;
                var org = (item && (item.org || item.company || item.institution || item.employer)) || '';
                var title = (item && (item.title || item.position || item.degree || item.role)) || '';
                var dates = (item && (item.dates || item.years)) || '';
                var notesVal = (item && (item.notes || item.description)) || '';
                var card = document.createElement('article');
                card.className = 'experience-card entry-card is-open';
                card.setAttribute('role', 'listitem');
                card.setAttribute('data-entry-id', id);
                card.setAttribute('data-entry-index', String(index));
                card.setAttribute('data-entry-key', id);

                var toolbar = document.createElement('div');
                toolbar.className = 'experience-card-toolbar';
                var toggle = document.createElement('button');
                toggle.type = 'button';
                toggle.className = 'experience-card-toggle';
                toggle.setAttribute('data-toggle-entry', id);
                toggle.setAttribute('aria-expanded', 'true');
                var badge = document.createElement('span');
                badge.className = 'experience-card-badge';
                badge.textContent = pack.itemN + ' ' + (index + 1);
                toggle.appendChild(badge);
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
                toolbar.append(toggle, remove);

                function makeInput(attr, placeholder, value, fieldName) {
                    var input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'studio-field w-full bg-slate-900/60 border border-slate-600 p-2.5 text-sm rounded-lg text-white outline-none min-h-11';
                    input.setAttribute(attr, '1');
                    if (fieldName) input.setAttribute('data-entry-field', fieldName);
                    if (fieldName === 'position' || fieldName === 'role' || fieldName === 'title') input.name = 'role';
                    else if (fieldName === 'years' || fieldName === 'dates') input.name = 'dates';
                    else if (fieldName === 'company' || fieldName === 'org') input.name = 'company';
                    input.placeholder = placeholder;
                    input.value = value == null ? '' : String(value);
                    input.addEventListener('input', function () {
                        handleEntryChange(id, fieldName, input.value || '');
                    });
                    input.addEventListener('change', function () {
                        handleEntryChange(id, fieldName, input.value || '');
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
                notes.value = notesVal;
                notes.addEventListener('input', function () {
                    handleEntryChange(id, 'description', notes.value || '');
                });
                notes.addEventListener('change', function () {
                    handleEntryChange(id, 'description', notes.value || '');
                });

                var fields = document.createElement('div');
                fields.className = 'experience-card-fields';
                var orgField = labeled(pack.org, makeInput('data-entry-org', pack.orgPh, org, 'company'));
                var titleField = labeled(pack.title, makeInput('data-entry-title', pack.titlePh, title, 'position'));
                var datesField = labeled(pack.dates, makeInput('data-entry-dates', pack.datesPh, dates, 'years'));
                if (config.layout === 'military') fields.append(titleField, datesField);
                else if (config.orgFirst === false) fields.append(titleField, orgField, datesField);
                else fields.append(orgField, titleField, datesField);
                if (config.includeNotes !== false) fields.append(labeled(pack.notes, notes));
                card.append(toolbar, fields);
                frag.appendChild(card);
            });
            host.setAttribute('role', 'list');
            host.replaceChildren(frag);
        }

        function refreshFromTextarea(opts) {
            if (syncing) return;
            if (config.layout === 'military') {
                if (opts && opts.replaceFromRaw) {
                    var milEl = fieldEl();
                    var parsedMil = parseItems(milEl ? milEl.value : '');
                    var filledMil = parsedMil.filter(function (row) { return !isBlank(row); });
                    items = filledMil.length ? [normalize(filledMil[0])] : [emptyItem()];
                    paintMilitaryDom();
                } else {
                    readMilitaryDomIntoItems();
                }
                ensureItems();
                publishEntries();
                bindMilitaryInputs();
                return;
            }
            collectCards();
            var emptySlots = trailingBlanks().length;
            if (opts && opts.replaceFromRaw) {
                var el = fieldEl();
                var parsed = parseItems(el ? el.value : '');
                var filled = parsed.filter(function (row) { return !isBlank(row); }).map(normalize);
                if (config.hideAdd) {
                    items = filled.length ? [normalize(filled[0])] : [emptyItem()];
                } else if (opts.wipeEmpty) {
                    items = filled.length ? filled : [emptyItem()];
                } else {
                    items = filled.slice();
                    while (emptySlots > 0) {
                        items = items.concat([emptyItem()]);
                        emptySlots -= 1;
                    }
                    if (!items.length) items = [emptyItem()];
                }
            }
            ensureItems();
            if (!rawMode && config.layout !== 'military') render();
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
                if (config.hideAdd) hideAddButton();
                else {
                    addBtn.hidden = false;
                    addBtn.removeAttribute('hidden');
                    addBtn.removeAttribute('aria-hidden');
                }
            }
            if (toggle) toggle.hidden = true;
        }

        function toggleRaw(e) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            rawMode = false;
            applyRawUi();
            return false;
        }

        function hideAddButton() {
            var addBtn = document.getElementById(config.addBtnId);
            if (!addBtn) return;
            addBtn.hidden = true;
            addBtn.setAttribute('hidden', '');
            addBtn.setAttribute('aria-hidden', 'true');
            addBtn.style.setProperty('display', 'none', 'important');
        }

        function ensureAddButtonVisible() {
            if (config.hideAdd) {
                hideAddButton();
                return;
            }
            var host = document.getElementById(config.hostId);
            var addBtn = document.getElementById(config.addBtnId);
            if (host && addBtn && addBtn.closest('#military-section')) {
                host.insertAdjacentElement('afterend', addBtn);
            }
            if (host && addBtn && addBtn.previousElementSibling !== host) {
                host.insertAdjacentElement('afterend', addBtn);
            }
            bindAddButton();
            if (addBtn && !config.hideAdd) {
                addBtn.hidden = false;
                addBtn.removeAttribute('hidden');
            }
        }

        function bindAddButton() {
            if (config.hideAdd) {
                hideAddButton();
                return;
            }
            var addBtn = document.getElementById(config.addBtnId);
            if (!addBtn) return;
            addBtn.type = 'button';
            addBtn.setAttribute('type', 'button');
            addBtn.disabled = false;
            addBtn.hidden = false;
            addBtn.removeAttribute('disabled');
            addBtn.removeAttribute('hidden');
            addBtn.removeAttribute('aria-disabled');
            addBtn.style.setProperty('pointer-events', 'auto', 'important');
            addBtn.style.setProperty('cursor', 'pointer', 'important');
            addBtn.style.setProperty('display', 'inline-flex', 'important');
            addBtn.style.setProperty('z-index', '40', 'important');
            if (name === 'education') {
                global.addEducation = addItem;
                global.handleAddEducation = addItem;
            }
            addBtn.onclick = function (e) {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                addItem(e);
                return false;
            };
            if (addBtn.dataset.qcAddBound === '1') return;
            addBtn.dataset.qcAddBound = '1';
            addBtn.addEventListener('click', function (e) {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                addItem(e);
                return false;
            });
        }

        function bindDocumentAdd() {
            if (config.hideAdd) return;
            var flag = '__qcAdd' + name + 'Delegated';
            if (global[flag]) return;
            global[flag] = true;
            document.addEventListener('click', function (e) {
                var t = e.target;
                if (!t || typeof t.closest !== 'function') return;
                if (!t.closest('#' + config.addBtnId)) return;
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                addItem(e);
            }, true);
        }

        function addItem(e) {
            if (config.hideAdd) return false;
            var evt = e || (global.event && global.event.target ? global.event : null);
            // React FormDataContext may call us after already updating QCCvData — sync DOM only.
            if (evt && evt.__qcFromReact) {
                var fromCtx = (global.QCCvData && Array.isArray(QCCvData[name])) ? QCCvData[name] : null;
                if (fromCtx && fromCtx.length > items.length) {
                    items = fromCtx.map(function (row) {
                        return normalize({
                            id: row.id || Date.now().toString(),
                            degree: row.degree || row.title || '',
                            institution: row.institution || row.org || row.company || '',
                            dates: row.years || row.dates || '',
                            title: row.degree || row.title || '',
                            org: row.institution || row.org || '',
                            company: row.institution || row.company || '',
                            position: row.degree || row.position || '',
                            notes: row.details || row.notes || row.description || '',
                            bullets: row.bullets || []
                        });
                    });
                    visibleCount = items.length;
                    ensureItems();
                    render();
                    writeField(true);
                    ensureAddButtonVisible();
                }
                return false;
            }
            if (evt) {
                if (evt.__qcEntryHandled) return false;
                evt.__qcEntryHandled = true;
                if (typeof evt.preventDefault === 'function') evt.preventDefault();
                if (typeof evt.stopPropagation === 'function') evt.stopPropagation();
            }
            if (addInFlight) return false;
            addInFlight = true;
            try {
                collectCards();
                if (items.length >= MAX_SLOTS) return false;
                items = items.concat([normalize({
                    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 7),
                    institution: '',
                    degree: '',
                    dates: '',
                    company: '',
                    position: '',
                    org: '',
                    title: '',
                    notes: '',
                    bullets: []
                })]);
                visibleCount = items.length;
                ensureItems();
                render();
                writeField(true);
                ensureAddButtonVisible();
                var host = document.getElementById(config.hostId);
                var lastCard = host && host.querySelector('.entry-card:last-child');
                var last = lastCard && lastCard.querySelector('input, textarea');
                if (last && typeof last.focus === 'function') {
                    try { last.focus(); } catch (err) { /* ignore */ }
                }
                if (lastCard && typeof lastCard.scrollIntoView === 'function') {
                    try { lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (err) { /* ignore */ }
                }
            } finally {
                addInFlight = false;
            }
            return false;
        }

        function removeItem(id) {
            collectCards();
            var idToDelete = String(id == null ? '' : id);
            var next = (items || []).filter(function (item) {
                return item && String(item.id) !== idToDelete;
            });
            if (next.length === items.length) {
                var index = itemIndexById(id);
                if (index < 0) index = Number(id);
                if (Number.isFinite(index) && index >= 0 && index < items.length) {
                    next = items.filter(function (_item, i) { return i !== index; });
                }
            }
            items = next.length ? next : [emptyItem()];
            visibleCount = items.length;
            ensureItems();
            render();
            writeField(true);
            ensureAddButtonVisible();
        }

        function applyI18n() {
            var pack = t();
            var addLabel = document.getElementById(config.addLabelId);
            if (addLabel) addLabel.textContent = pack.add;
            applyRawUi();
            if (rawMode) return;
            if (config.layout === 'military') {
                hideAddButton();
                readMilitaryDomIntoItems();
                bindMilitaryInputs();
                publishEntries();
                return;
            }
            collectCards();
            ensureItems();
            var host = document.getElementById(config.hostId);
            var hasBoundCards = host && host.querySelector('.entry-card [data-entry-field], .entry-card [data-entry-org]');
            if (!hasBoundCards || (items.length > (host ? host.querySelectorAll('.entry-card').length : 0))) {
                render();
            } else {
                Array.prototype.forEach.call(host.querySelectorAll('.entry-card'), function (card) {
                    card.classList.add('is-open');
                    var badge = card.querySelector('.experience-card-badge');
                    if (badge) badge.textContent = pack.itemN + ' ' + (Number(card.getAttribute('data-entry-index') || 0) + 1);
                });
            }
            ensureAddButtonVisible();
        }

        function bind() {
            if (bound) {
                applyI18n();
                return;
            }
            bound = true;
            bindDocumentAdd();
            var host = document.getElementById(config.hostId);
            if (host && !host.dataset.qcBound) {
                host.dataset.qcBound = '1';
                host.addEventListener('input', function (e) {
                    var field = e.target;
                    if (!field || !host.contains(field)) return;
                    if (config.layout === 'military') {
                        var milName = field.getAttribute('data-entry-field') || field.getAttribute('name');
                        if (field.hasAttribute('data-entry-dates') || milName === 'dates' || milName === 'years') {
                            updateMilitaryField('years', field.value || '');
                        } else {
                            updateMilitaryField('role', field.value || '');
                        }
                        return;
                    }
                    var card = field.closest('.entry-card');
                    if (!card) return;
                    var fieldName = field.getAttribute('data-entry-field');
                    if (!fieldName) {
                        if (field.hasAttribute('data-entry-org')) fieldName = 'company';
                        else if (field.hasAttribute('data-entry-title')) fieldName = 'position';
                        else if (field.hasAttribute('data-entry-dates')) fieldName = 'years';
                        else if (field.hasAttribute('data-entry-notes')) fieldName = 'description';
                    }
                    if (!fieldName) return;
                    var id = card.getAttribute('data-entry-id') || card.getAttribute('data-entry-index');
                    handleEntryChange(id, fieldName, field.value || '');
                }, true);
                host.addEventListener('click', function (e) {
                    var btn = e.target && e.target.closest && e.target.closest('button');
                    if (!btn || !host.contains(btn)) return;
                    e.preventDefault();
                    if (btn.hasAttribute('data-remove-entry') && !btn.disabled) {
                        removeItem(btn.getAttribute('data-remove-entry'));
                        return;
                    }
                    if (btn.hasAttribute('data-toggle-entry') || btn.closest('[data-toggle-entry]')) {
                        var card = btn.closest('.entry-card');
                        if (card) {
                            card.classList.toggle('is-open');
                            var toggleBtn = card.querySelector('[data-toggle-entry]');
                            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', card.classList.contains('is-open') ? 'true' : 'false');
                        }
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
            var filled = (items || []).filter(function (row) { return !isBlank(row); });
            if (config.hideAdd) items = filled.length ? [normalize(filled[0])] : [emptyItem()];
            else items = filled.length ? filled.map(normalize) : [emptyItem()];
            visibleCount = items.length;
            ensureItems();
            if (config.layout === 'military') {
                bindMilitaryInputs();
                if (filled.length) paintMilitaryDom();
                else readMilitaryDomIntoItems();
                publishEntries();
            } else {
                if (!filled.length && document.querySelector('#' + config.hostId + ' .entry-card') && items.length <= 1) {
                    collectCards();
                    ensureItems();
                    if (items[0]) items[0].id = items[0].id || 'education-seed-0';
                    var seed = document.querySelector('#' + config.hostId + ' .entry-card');
                    if (seed && items[0]) {
                        seed.setAttribute('data-entry-id', items[0].id);
                        seed.classList.add('is-open');
                    }
                } else {
                    render();
                }
            }
            applyI18n();
            ensureAddButtonVisible();
            if (config.layout !== 'military') writeField(true);

            function wrap(fnName) {
                var fn = global[fnName];
                if (typeof fn !== 'function' || fn['__qc' + name + 'Wrapped']) return;
                var wrapped = function () {
                    var result = fn.apply(this, arguments);
                    rawMode = false;
                    var wipe = fnName === 'fillCvSample' || fnName === 'loadExample' || fnName === 'loadRoleExample' || fnName === 'replaceRoleExample' || fnName === 'clearCvForm' || fnName === 'resetForm';
                    refreshFromTextarea({
                        replaceFromRaw: wipe,
                        wipeEmpty: wipe
                    });
                    applyI18n();
                    return result;
                };
                wrapped['__qc' + name + 'Wrapped'] = true;
                global[fnName] = wrapped;
            }
            ['loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang', 'clearCvForm', 'resetForm', 'fillCvSample'].forEach(wrap);
            window.setTimeout(function () {
                ['loadExample', 'loadRoleExample', 'replaceRoleExample', 'setCvLang', 'clearCvForm', 'resetForm', 'fillCvSample'].forEach(wrap);
                if (name === 'education') {
                    global.handleAddEducation = addItem;
                    global.addEducation = addItem;
                }
            }, 0);
        }

        var api = {
            refresh: refreshFromTextarea,
            applyI18n: applyI18n,
            addItem: addItem,
            addEducation: addItem,
            handleEntryChange: handleEntryChange,
            updateMilitary: function (field, value) {
                return updateMilitaryField(field, value);
            },
            getMilitary: function () {
                readMilitaryDomIntoItems();
                publishEntries();
                return (global.QCCvData && global.QCCvData.military) || null;
            },
            previewItems: function () {
                if (config.layout === 'military') readMilitaryDomIntoItems();
                else collectCards();
                publishEntries();
                return items.map(toPreviewItem).filter(function (row) {
                    return row.company || row.position || row.years || row.description;
                });
            },
            toggleRaw: toggleRaw,
            parse: parseItems,
            ensure: function () {
                if (config.layout === 'military') {
                    bindMilitaryInputs();
                    readMilitaryDomIntoItems();
                    ensureItems();
                    publishEntries();
                    hideAddButton();
                    return items.slice();
                }
                // Trust visible cards first so newly added empty entries are kept.
                collectCards();
                ensureItems();
                var host = document.getElementById(config.hostId);
                var cards = host ? host.querySelectorAll('.entry-card').length : 0;
                if (!host || cards !== items.length) render();
                else {
                    Array.prototype.forEach.call(host.querySelectorAll('.entry-card'), function (card) {
                        card.classList.add('is-open');
                    });
                }
                ensureAddButtonVisible();
                return items.slice();
            }
        };
        items = [emptyItem()];
        visibleCount = 1;
        ensureItems();
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
        maxSlots: 40,
        defaultVisible: 1,
        copy: {
            he: {
                add: 'הוסף השכלה נוספת',
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
                add: 'Add Another Education',
                remove: 'Delete education',
                itemN: 'Education',
                title: 'Degree / certificate / major',
                org: 'Institution',
                dates: 'Years',
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
        hideAdd: true,
        maxSlots: 1,
        defaultVisible: 1,
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
                title: 'Role',
                org: 'Unit',
                dates: 'Dates / years',
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

    global.QCCvData = global.QCCvData || {};
    if (!Array.isArray(global.QCCvData.education) || global.QCCvData.education.length < 1) {
        global.QCCvData.education = [{ id: 'education-seed-0', institution: '', degree: '', dates: '' }];
    }

    global.QCEducation = education;
    global.QCMilitary = military;
    global.handleAddEducation = education.addItem;
    global.addEducation = education.addItem;
    global.handleEducationChange = education.handleEntryChange;
    global.handleAddMilitary = military.addItem;
    global.handleMilitaryChange = military.handleEntryChange;
    global.updateMilitary = function (nameOrEvent, value) {
        var field = nameOrEvent;
        var next = value;
        if (nameOrEvent && nameOrEvent.target) {
            field = nameOrEvent.target.name || nameOrEvent.target.getAttribute('data-entry-field') || nameOrEvent.target.getAttribute('data-entry-title') && 'role';
            next = nameOrEvent.target.value;
        }
        if (military && typeof military.updateMilitary === 'function') {
            return military.updateMilitary(field, next == null ? '' : next);
        }
        return military.handleEntryChange(0, field, next == null ? '' : next);
    };
    global.toggleEducationRaw = education.toggleRaw;
    global.toggleMilitaryRaw = military.toggleRaw;
    if (!document.documentElement.dataset.qcSectionAdd) {
        document.documentElement.dataset.qcSectionAdd = '1';
        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('#btn-add-education');
            if (!btn) return;
            education.addItem(e);
        }, true);
    }
    global.toggleExperienceRaw = global.toggleExperienceRaw || function (e) {
        if (global.QCExperience && typeof QCExperience.toggleRaw === 'function') return QCExperience.toggleRaw(e);
        return false;
    };
})(typeof window !== 'undefined' ? window : globalThis);
