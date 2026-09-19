(function (global) {
    var PDF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    var PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var MAMMOTH_JS = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js';
    var MAX_BYTES = 8 * 1024 * 1024;
    var FAIL_HE = 'לא הצלחנו לקרוא את הקובץ, יש לנסות קובץ אחר או להדביק טקסט';
    var OK_HE = 'הנתונים חולצו בהצלחה!';
    var BUSY_HE = 'מעבד את הקובץ...';
    var pdfJsPromise = null;
    var mammothPromise = null;
    var toastTimer = null;
    var idleLabel = '';
    var importInflight = false;

    function t(key, fallback) {
        var lang = global.QCCvLang === 'en' ? 'en' : 'he';
        var pack = (global.CV_I18N && global.CV_I18N[lang]) || {};
        return pack[key] || fallback;
    }

    function failMsg() {
        return t('importFail', FAIL_HE);
    }

    function setStatus(msg, kind) {
        var el = document.getElementById('cv-import-status');
        var btn = document.getElementById('btn-cv-import');
        if (el) {
            el.textContent = msg || '';
            el.className = 'cv-import-status' + (kind ? ' is-' + kind : '');
        }
        if (btn) btn.setAttribute('aria-busy', kind === 'busy' ? 'true' : 'false');
    }

    function setBusy(on) {
        var card = document.getElementById('cv-import-card');
        var label = document.getElementById('btn-cv-import-label');
        var input = document.getElementById('cv-import-file');
        if (card) card.classList.toggle('is-busy', !!on);
        if (label) {
            if (on) {
                if (!idleLabel) idleLabel = label.textContent || t('importCv', 'העלאת קובץ PDF / Word');
                label.textContent = t('importBusy', BUSY_HE);
            } else if (idleLabel) {
                label.textContent = idleLabel;
            }
        }
        if (input) input.disabled = !!on;
        setStatus(on ? t('importBusy', BUSY_HE) : '', on ? 'busy' : '');
    }

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var existing = document.querySelector('script[src="' + src + '"]');
            if (existing && (src.indexOf('pdf') >= 0 ? global.pdfjsLib : global.mammoth)) {
                resolve();
                return;
            }
            var script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = function () { resolve(); };
            script.onerror = function () { reject(new Error('script')); };
            document.head.appendChild(script);
        });
    }

    function loadPdfJs() {
        if (global.pdfjsLib) {
            try { global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER; } catch (err) { /* ignore */ }
            return Promise.resolve(global.pdfjsLib);
        }
        if (pdfJsPromise) return pdfJsPromise;
        pdfJsPromise = loadScript(PDF_JS).then(function () {
            if (!global.pdfjsLib) throw new Error('pdfjs');
            global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
            return global.pdfjsLib;
        }).catch(function (err) {
            pdfJsPromise = null;
            throw err;
        });
        return pdfJsPromise;
    }

    function loadMammoth() {
        if (global.mammoth && typeof global.mammoth.extractRawText === 'function') {
            return Promise.resolve(global.mammoth);
        }
        if (mammothPromise) return mammothPromise;
        mammothPromise = loadScript(MAMMOTH_JS).then(function () {
            if (!global.mammoth) throw new Error('mammoth');
            return global.mammoth;
        }).catch(function (err) {
            mammothPromise = null;
            throw err;
        });
        return mammothPromise;
    }

    function decodeXml(value) {
        return String(value || '')
            .replace(/&#x([0-9a-fA-F]+);/g, function (_, hex) {
                return String.fromCharCode(parseInt(hex, 16));
            })
            .replace(/&#(\d+);/g, function (_, num) {
                return String.fromCharCode(Number(num));
            })
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
    }

    function extractDocxViaZip(buffer) {
        if (!global.JSZip) return Promise.reject(new Error('jszip'));
        return global.JSZip.loadAsync(buffer).then(function (zip) {
            var file = zip.file('word/document.xml');
            if (!file) throw new Error('docx');
            return file.async('string');
        }).then(function (xml) {
            var text = String(xml || '')
                .replace(/<w:tab[^/]*\/>/g, '\t')
                .replace(/<w:br[^/]*\/>/g, '\n')
                .replace(/<\/w:p>/g, '\n')
                .replace(/<w:p[\s>]/g, '\n<w:p ')
                .replace(/<[^>]+>/g, '');
            return decodeXml(text).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
        });
    }

    function extractDocxText(buffer) {
        return loadMammoth().then(function (mammoth) {
            return mammoth.extractRawText({ arrayBuffer: buffer.slice(0) });
        }).then(function (res) {
            return String(res && res.value || '').replace(/\n{3,}/g, '\n\n').trim();
        }).catch(function () {
            return extractDocxViaZip(buffer);
        });
    }

    function readPdfPages(doc) {
        var pages = [];
        var index = 1;
        function next() {
            if (index > doc.numPages) return Promise.resolve(pages.join('\n\n'));
            return doc.getPage(index++).then(function (page) {
                return page.getTextContent();
            }).then(function (content) {
                var lines = [];
                var current = [];
                var lastY = null;
                (content.items || []).forEach(function (item) {
                    var str = item && item.str != null ? String(item.str) : '';
                    if (!str) return;
                    var y = item.transform ? item.transform[5] : null;
                    if (lastY != null && y != null && Math.abs(y - lastY) > 3.2) {
                        lines.push(current.join(' ').replace(/\s+/g, ' ').trim());
                        current = [];
                    }
                    current.push(str);
                    if (y != null) lastY = y;
                });
                if (current.length) lines.push(current.join(' ').replace(/\s+/g, ' ').trim());
                pages.push(lines.filter(Boolean).join('\n'));
                return next();
            });
        }
        return next();
    }

    function extractPdfText(buffer) {
        var bytes = new Uint8Array(buffer.slice(0));
        return loadPdfJs().then(function (pdfjs) {
            function open(disableWorker) {
                return pdfjs.getDocument({
                    data: bytes.slice(0),
                    verbosity: 0,
                    disableWorker: !!disableWorker,
                    isEvalSupported: false
                }).promise;
            }
            return open(false).catch(function () {
                return open(true);
            });
        }).then(readPdfPages);
    }

    function parsedHasContent(parsed) {
        if (!parsed) return false;
        return !!(parsed.name || parsed.email || parsed.phone || parsed.experience || parsed.summary || parsed.education || parsed.skills);
    }

    function showImportToast(msg) {
        var el = document.getElementById('qc-import-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'qc-import-toast';
            el.className = 'qc-import-toast';
            el.setAttribute('role', 'status');
            el.setAttribute('aria-live', 'polite');
            document.body.appendChild(el);
        }
        el.textContent = msg || t('importOk', OK_HE);
        el.classList.add('is-visible');
        if (toastTimer) window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () {
            el.classList.remove('is-visible');
        }, 4200);
    }

    function fillFields(parsed) {
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
            'in-languages': parsed.languages
        };
        Object.keys(map).forEach(function (id) {
            var el = document.getElementById(id);
            if (!el || map[id] == null || map[id] === '') return;
            el.value = map[id];
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (err) { /* ignore */ }
        });
    }

    function scrollFormTop() {
        var formCol = document.getElementById('studio-form-column');
        if (formCol) formCol.scrollTop = 0;
        var panel = document.getElementById('details-panel');
        if (panel && typeof panel.scrollIntoView === 'function') {
            panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
        var card = document.getElementById('cv-import-card');
        if (card && typeof card.scrollIntoView === 'function') {
            card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    function applyImport(parsed) {
        if (typeof global.resetForm === 'function') global.resetForm();
        if (global.QCQuickPaste && typeof QCQuickPaste.apply === 'function') {
            QCQuickPaste.apply(parsed, { replace: true });
        } else {
            fillFields(parsed);
        }
        if (global.QCExperience && typeof QCExperience.refresh === 'function') QCExperience.refresh();
        if (typeof global.hydrateLanguagePicker === 'function') global.hydrateLanguagePicker();
        if (typeof global.updateCV === 'function') global.updateCV();
        if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
        if (typeof global.goStep === 'function') global.goStep(1);
        scrollFormTop();
    }

    function kindFromFile(file) {
        var name = String(file && file.name || '').toLowerCase();
        var type = String(file && file.type || '').toLowerCase();
        if (name.endsWith('.pdf') || type === 'application/pdf') return 'pdf';
        if (name.endsWith('.docx') || type.indexOf('wordprocessingml') >= 0) return 'docx';
        if (name.endsWith('.doc') || type === 'application/msword') return 'doc';
        return '';
    }

    function importBuffer(buffer, kind) {
        var job;
        if (kind === 'pdf') job = extractPdfText(buffer);
        else if (kind === 'docx' || kind === 'doc') job = extractDocxText(buffer);
        else return Promise.reject(new Error('type'));
        return job.then(function (text) {
            if (!String(text || '').trim()) throw new Error('empty');
            var parsed = global.QCQuickPaste && typeof QCQuickPaste.parse === 'function'
                ? QCQuickPaste.parse(text)
                : { experience: String(text).trim().slice(0, 4000) };
            if (!parsedHasContent(parsed)) {
                parsed.experience = parsed.experience || String(text).trim().slice(0, 4000);
            }
            if (!parsedHasContent(parsed)) throw new Error('empty');
            applyImport(parsed);
        });
    }

    function onFile(file) {
        if (!file) return Promise.resolve();
        if (importInflight) return Promise.resolve();
        importInflight = true;
        var kind = kindFromFile(file);
        setBusy(true);
        if (file.size > MAX_BYTES) {
            importInflight = false;
            setBusy(false);
            setStatus(t('importTooBig', 'הקובץ גדול מדי (עד 8MB).'), 'error');
            return Promise.resolve();
        }
        if (!kind) {
            importInflight = false;
            setBusy(false);
            setStatus(failMsg(), 'error');
            return Promise.resolve();
        }
        return file.arrayBuffer().then(function (buf) {
            return importBuffer(buf, kind);
        }).then(function () {
            importInflight = false;
            setBusy(false);
            setStatus('', '');
            showImportToast(t('importOk', OK_HE));
        }).catch(function () {
            importInflight = false;
            setBusy(false);
            setStatus(failMsg(), 'error');
        });
    }

    function onCvImportFile(ev) {
        var input = ev && ev.target ? ev.target : document.getElementById('cv-import-file');
        var file = input && input.files && input.files[0];
        if (!file) return;
        onFile(file).then(function () {
            try { if (input) input.value = ''; } catch (err) { /* ignore */ }
        });
    }

    function pick() {
        var input = document.getElementById('cv-import-file');
        if (!input || input.disabled) return;
        try { input.value = ''; } catch (err) { /* ignore */ }
        input.click();
    }

    function bind() {
        var input = document.getElementById('cv-import-file');
        var card = document.getElementById('cv-import-card');
        if (input && !input.__qcImportBound) {
            input.__qcImportBound = true;
        }
        if (card && !card.__qcImportDropBound) {
            card.__qcImportDropBound = true;
            card.addEventListener('dragover', function (e) {
                if (!e.dataTransfer) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                card.classList.add('is-drop');
            });
            card.addEventListener('dragleave', function () {
                card.classList.remove('is-drop');
            });
            card.addEventListener('drop', function (e) {
                e.preventDefault();
                card.classList.remove('is-drop');
                var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
                onFile(file);
            });
        }
        if (global.pdfjsLib) {
            try { global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER; } catch (err) { /* ignore */ }
        }
    }

    if (!document.__qcImportCaptureBound) {
        document.__qcImportCaptureBound = true;
        document.addEventListener('change', function (e) {
            if (e && e.target && e.target.id === 'cv-import-file') onCvImportFile(e);
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    global.QCCvImport = {
        bind: bind,
        importFile: onFile,
        pick: pick
    };
    global.pickCvImport = pick;
    global.onCvImportFile = onCvImportFile;
})(window);
