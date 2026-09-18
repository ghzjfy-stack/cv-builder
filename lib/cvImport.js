(function (global) {
    var PDF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    var PDF_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    var MAX_BYTES = 8 * 1024 * 1024;
    var pdfJsPromise = null;

    function t(key, fallback) {
        var lang = global.QCCvLang === 'en' ? 'en' : 'he';
        var pack = (global.CV_I18N && global.CV_I18N[lang]) || {};
        return pack[key] || fallback;
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

    function loadPdfJs() {
        if (global.pdfjsLib) {
            global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
            return Promise.resolve(global.pdfjsLib);
        }
        if (pdfJsPromise) return pdfJsPromise;
        pdfJsPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = PDF_JS;
            script.async = true;
            script.onload = function () {
                if (!global.pdfjsLib) {
                    reject(new Error('pdfjs'));
                    return;
                }
                global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
                resolve(global.pdfjsLib);
            };
            script.onerror = function () {
                pdfJsPromise = null;
                reject(new Error('pdfjs'));
            };
            document.head.appendChild(script);
        });
        return pdfJsPromise;
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

    function extractDocxText(buffer) {
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

    function extractPdfText(buffer) {
        return loadPdfJs().then(function (pdfjs) {
            return pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        }).then(function (doc) {
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
        });
    }

    function parsedHasContent(parsed) {
        if (!parsed) return false;
        return !!(parsed.name || parsed.email || parsed.phone || parsed.experience || parsed.summary || parsed.education || parsed.skills);
    }

    function applyImport(parsed) {
        if (global.QCQuickPaste && typeof QCQuickPaste.apply === 'function') {
            QCQuickPaste.apply(parsed, { replace: true });
        }
        if (global.QCExperience && typeof QCExperience.refresh === 'function') QCExperience.refresh();
        if (typeof global.hydrateLanguagePicker === 'function') global.hydrateLanguagePicker();
        if (typeof global.updateCV === 'function') global.updateCV();
        if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
        if (typeof global.goStep === 'function') global.goStep(1);
    }

    function importBuffer(name, buffer) {
        var lower = String(name || '').toLowerCase();
        var job;
        if (lower.endsWith('.pdf')) job = extractPdfText(buffer);
        else if (lower.endsWith('.docx')) job = extractDocxText(buffer);
        else return Promise.reject(new Error('type'));
        return job.then(function (text) {
            if (!String(text || '').trim()) throw new Error('empty');
            if (!global.QCQuickPaste || typeof QCQuickPaste.parse !== 'function') throw new Error('parser');
            var parsed = QCQuickPaste.parse(text);
            if (!parsedHasContent(parsed)) throw new Error('empty');
            applyImport(parsed);
        });
    }

    function onFile(file) {
        if (!file) return;
        var lower = String(file.name || '').toLowerCase();
        if (file.size > MAX_BYTES) {
            setStatus(t('importTooBig', 'הקובץ גדול מדי (עד 8MB).'), 'error');
            return;
        }
        if (lower.endsWith('.doc') && !lower.endsWith('.docx')) {
            setStatus(t('importOldDoc', 'שמרו כ-Word (.docx) או PDF ואז העלו שוב.'), 'error');
            return;
        }
        setStatus(t('importBusy', 'קוראים את הקובץ…'), 'busy');
        file.arrayBuffer().then(function (buf) {
            return importBuffer(file.name, buf);
        }).then(function () {
            setStatus(t('importOk', 'השדות מולאו מקורות החיים שהעליתם. עברו על הפרטים ועדכנו לפי הצורך.'), 'ok');
        }).catch(function (err) {
            var code = err && err.message;
            if (code === 'type') setStatus(t('importType', 'אפשר להעלות PDF או Word (.docx) בלבד.'), 'error');
            else if (code === 'jszip') setStatus(t('importFail', 'לא הצלחנו לקרוא את הקובץ. נסו PDF, או הדביקו טקסט.'), 'error');
            else setStatus(t('importFail', 'לא הצלחנו לקרוא את הקובץ. נסו PDF, או הדביקו טקסט.'), 'error');
        });
    }

    function bind() {
        var input = document.getElementById('cv-import-file');
        var button = document.getElementById('btn-cv-import');
        if (!input || !button || button.__qcImportBound) return;
        button.__qcImportBound = true;
        button.addEventListener('click', function () {
            input.value = '';
            input.click();
        });
        input.addEventListener('change', function () {
            onFile(input.files && input.files[0]);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }

    global.QCCvImport = {
        bind: bind,
        importFile: onFile
    };
})(window);
