(function (global) {
    var lastOpener = null;
    var PAGE_W = '210mm';
    var PAGE_H = '297mm';

    function t(key, fallback) {
        var lang = global.QCCvLang === 'en' ? 'en' : 'he';
        var pack = (global.CV_I18N && global.CV_I18N[lang]) || {};
        return pack[key] || fallback;
    }

    function modalEl() {
        return document.getElementById('sample-pdf-modal');
    }

    function frame() {
        return document.getElementById('sample-pdf-frame');
    }

    function copyVars(node) {
        var src = document.documentElement;
        ['--accent', '--cv-font', '--cv-scale', '--cv-leading', '--cv-density'].forEach(function (name) {
            var value = src.style.getPropertyValue(name) || getComputedStyle(src).getPropertyValue(name);
            if (value) node.style.setProperty(name, value.trim());
        });
    }

    function copyBg(from, to) {
        Array.prototype.forEach.call(from.classList, function (cls) {
            if (String(cls).indexOf('bg-preview-') === 0) to.classList.remove(cls);
        });
        to.classList.add('bg-preview-white');
        to.style.backgroundColor = '#ffffff';
        to.style.backgroundImage = 'none';
        var cs = getComputedStyle(from);
        to.style.padding = cs.padding;
        to.style.color = cs.color;
    }

    function scrubClone(root) {
        root.querySelectorAll('.cv-watermark, .cv-shield').forEach(function (el) {
            el.remove();
        });
        root.querySelectorAll('[id]').forEach(function (el) {
            if (el === root) return;
            var id = el.id;
            if (id === 'cv-target' || id === 'cv-header' || id.indexOf('out-') === 0 || id.indexOf('cv-') === 0) {
                return;
            }
            el.removeAttribute('id');
        });
    }

    function makeSheet(target, wrap, pageIndex) {
        var sheet = document.createElement('article');
        sheet.className = 'sample-pdf-sheet';
        sheet.setAttribute('data-page', String(pageIndex));
        sheet.style.width = PAGE_W;
        sheet.style.minHeight = PAGE_H;
        sheet.style.height = PAGE_H;
        copyVars(sheet);
        if (wrap) copyBg(wrap, sheet);
        var inner = target.cloneNode(true);
        if (pageIndex === 1) inner.id = 'cv-target';
        else {
            inner.removeAttribute('id');
            inner.id = 'cv-target-page2';
        }
        inner.style.transform = 'none';
        inner.style.setProperty('--cv-fit-scale', '1');
        inner.style.width = '100%';
        inner.style.maxWidth = '100%';
        inner.style.minHeight = '0';
        inner.style.height = 'auto';
        inner.style.overflow = 'visible';
        inner.style.margin = '0';
        scrubClone(inner);
        if (pageIndex > 1) {
            inner.style.transform = 'translateY(-' + PAGE_H + ')';
        }
        var clip = document.createElement('div');
        clip.className = 'sample-pdf-clip';
        clip.appendChild(inner);
        sheet.appendChild(clip);
        return sheet;
    }

    function renderLiveCv(host) {
        var target = document.getElementById('cv-target');
        var wrap = document.getElementById('cv-preview-wrapper');
        host.innerHTML = '';
        if (!target) return false;
        var pages = document.createElement('div');
        pages.className = 'sample-pdf-pages';
        pages.appendChild(makeSheet(target, wrap, 1));
        var page2Live = document.getElementById('cv-preview-page-2');
        var twoPages = !!(page2Live && !page2Live.hidden && page2Live.getAttribute('aria-hidden') !== 'true');
        if (!twoPages && global.QCPageFit && typeof QCPageFit.pageCount === 'function') {
            twoPages = QCPageFit.pageCount() > 1;
        }
        if (twoPages) pages.appendChild(makeSheet(target, wrap, 2));
        host.appendChild(pages);
        return true;
    }

    function syncDownloadLabel() {
        var btn = document.getElementById('btn-sample-pdf-download');
        if (!btn) return;
        var pack = (global.CV_I18N && global.CV_I18N[global.QCCvLang === 'en' ? 'en' : 'he']) || {};
        var amount = '10';
        var live = document.querySelector('#btn-download-pdf [data-price], [data-price]');
        if (live && live.textContent) amount = live.textContent.trim() || '10';
        var prefix = pack.downloadPdfCta || t('samplePdfDownload', 'הורד PDF ב-');
        btn.innerHTML = prefix + '<span data-price>' + amount + '</span> ₪';
    }

    function openModal(e) {
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        var modal = modalEl();
        var host = frame();
        if (!modal || !host) return false;
        lastOpener = (e && e.currentTarget) || document.activeElement;
        if (typeof global.updateCV === 'function') {
            try { global.updateCV(); } catch (err) { /* keep last render */ }
        }
        renderLiveCv(host);
        syncDownloadLabel();
        if (typeof global.lockQcModalScroll === 'function') global.lockQcModalScroll('sample-pdf');
        modal.classList.remove('hidden');
        modal.classList.add('flex', 'is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('qc-sample-pdf-open');
        document.body.classList.add('qc-sample-pdf-open');
        window.setTimeout(function () {
            var closeBtn = document.getElementById('btn-sample-pdf-close');
            if (closeBtn) closeBtn.focus();
        }, 40);
        return false;
    }

    function closeModal(e) {
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        var modal = modalEl();
        if (!modal) return false;
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('qc-sample-pdf-open');
        document.body.classList.remove('qc-sample-pdf-open');
        var host = frame();
        if (host) host.innerHTML = '';
        if (typeof global.unlockQcModalScroll === 'function') global.unlockQcModalScroll('sample-pdf');
        var opener = lastOpener && document.contains(lastOpener)
            ? lastOpener
            : document.querySelector('[data-sample-pdf-opener]:not([hidden])');
        if (opener && typeof opener.focus === 'function' && opener.offsetParent !== null) opener.focus();
        lastOpener = null;
        return false;
    }

    function downloadFromPreview(e) {
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        closeModal();
        window.setTimeout(function () {
            if (typeof global.openPaymentModal === 'function') global.openPaymentModal();
        }, 30);
        return false;
    }

    function isOpener(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.getAttribute('data-sample-pdf-opener') != null) return true;
        var id = el.id;
        return id === 'btn-sample-pdf-home' || id === 'btn-sample-pdf-form';
    }

    function bind() {
        if (document.documentElement.__qcSampleBound) {
            document.querySelectorAll('[data-sample-pdf-opener], #btn-sample-pdf-home, #btn-sample-pdf-form').forEach(function (btn) {
                btn.onclick = openModal;
            });
            return;
        }
        document.documentElement.__qcSampleBound = true;
        document.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest && e.target.closest('[data-sample-pdf-opener], #btn-sample-pdf-home, #btn-sample-pdf-form');
            if (!btn || !isOpener(btn)) return;
            openModal(e);
        }, true);
        document.addEventListener('click', function (e) {
            var modal = modalEl();
            if (!modal || modal.classList.contains('hidden')) return;
            var close = e.target && e.target.closest && e.target.closest('#btn-sample-pdf-close, #sample-pdf-backdrop');
            if (close) {
                closeModal(e);
                return;
            }
            var stage = e.target && e.target.closest && e.target.closest('.sample-pdf-stage');
            if (!stage) return;
            if (e.target.closest && e.target.closest('.sample-pdf-sheet, .sample-pdf-download, .sample-pdf-close, .sample-pdf-bar')) return;
            if (e.target === stage || e.target.id === 'sample-pdf-frame' || (e.target.classList && e.target.classList.contains('sample-pdf-pages'))) {
                closeModal(e);
            }
        });
        document.querySelectorAll('[data-sample-pdf-opener], #btn-sample-pdf-home, #btn-sample-pdf-form').forEach(function (btn) {
            btn.onclick = openModal;
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    global.QCSamplePreview = {
        open: openModal,
        close: closeModal,
        download: downloadFromPreview,
        bind: bind
    };
    global.openSamplePdfPreview = openModal;
    global.closeSamplePdfPreview = closeModal;
    global.openPaymentModalFromPreview = downloadFromPreview;
})(window);
