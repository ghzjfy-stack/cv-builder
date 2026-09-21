(function (global) {
    /** Standard A4 portrait ratio (297mm / 210mm). */
    var A4_RATIO = 297 / 210;
    /** Tolerance so sub-pixel / padding noise does not fake overflow. */
    var OVER_TOLERANCE_PX = 8;
    /** Floor so a long CV still stays readable on one sheet. */
    var MIN_SCALE = 0.56;
    var timer;
    var observer;
    var lastPageCount = 1;

    function copy() {
        if (global.QCCvLang === 'en') {
            return {
                over: 'Content was scaled to fit one page. Shorten text for a sharper PDF.',
                ok: 'Fits on one page'
            };
        }
        return {
            over: 'התוכן הותאם לעמוד אחד. לקובץ חד יותר — קצרו מעט את הטקסט.',
            ok: 'מתאים לעמוד אחד'
        };
    }

    function rangeHeight(node) {
        try {
            var range = document.createRange();
            range.selectNodeContents(node);
            var rect = range.getBoundingClientRect();
            if (typeof range.detach === 'function') range.detach();
            return rect && rect.height > 0 ? rect.height : 0;
        } catch (err) {
            return 0;
        }
    }

    function measureContentHeight(target) {
        var prevTransform = target.style.transform;
        var prevOverflow = target.style.overflow;
        var prevMin = target.style.minHeight;
        target.style.transform = 'none';
        target.style.overflow = 'visible';
        target.style.minHeight = '0px';
        target.style.setProperty('--cv-fit-scale', '1');

        var h = Math.max(
            rangeHeight(target),
            target.scrollHeight || 0,
            target.offsetHeight || 0
        );
        var parts = target.querySelectorAll('.cv-header, #cv-header, .cv-columns, .cv-sidebar, .cv-sidebar-inner, .cv-main, .cv-photo-block');
        for (var i = 0; i < parts.length; i++) {
            var el = parts[i];
            var top = 0;
            try {
                var tRect = target.getBoundingClientRect();
                var eRect = el.getBoundingClientRect();
                top = Math.max(0, eRect.top - tRect.top);
            } catch (err) {
                top = el.offsetTop || 0;
            }
            h = Math.max(h, top + (el.scrollHeight || 0), top + (el.offsetHeight || 0));
        }

        target.style.transform = prevTransform;
        target.style.overflow = prevOverflow;
        target.style.minHeight = prevMin;
        return h;
    }

    function hidePage2() {
        var page2 = document.getElementById('cv-preview-page-2');
        var shift = document.getElementById('cv-preview-page-2-shift');
        if (page2) {
            page2.hidden = true;
            page2.setAttribute('aria-hidden', 'true');
            page2.style.display = 'none';
        }
        if (shift) shift.replaceChildren();
    }

    function update() {
        var wrap = document.getElementById('cv-preview-wrapper');
        var target = document.getElementById('cv-target');
        var overlay = document.getElementById('cv-page-fit');
        var line = document.getElementById('cv-page-break-line');
        var msg = document.getElementById('cv-page-fit-msg');
        if (!wrap || !target) return;

        var wrapW = wrap.getBoundingClientRect().width || wrap.clientWidth;
        if (wrapW < 40) {
            lastPageCount = 1;
            hidePage2();
            return;
        }

        var cs = global.getComputedStyle(wrap);
        var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        var pageH = wrapW * A4_RATIO;
        var usableH = Math.max(48, pageH - padY);

        wrap.style.setProperty('--a4-page-height', pageH + 'px');
        wrap.style.maxHeight = pageH + 'px';
        wrap.style.height = pageH + 'px';

        wrap.classList.remove('cv-two-pages', 'cv-over-one-page');
        hidePage2();

        var contentH = measureContentHeight(target);
        var over = contentH > usableH + OVER_TOLERANCE_PX;
        var scale = 1;
        if (over && contentH > 0) {
            scale = Math.max(MIN_SCALE, Math.min(1, usableH / contentH));
        }

        lastPageCount = 1;
        wrap.dataset.pageCount = '1';
        wrap.style.setProperty('--cv-fit-scale', String(scale));
        target.style.setProperty('--cv-fit-scale', String(scale));
        wrap.classList.toggle('cv-fit-scaled', scale < 0.999);
        wrap.classList.toggle('cv-over-one-page', over && scale <= MIN_SCALE + 0.001);

        if (line) line.style.display = 'none';
        if (overlay) {
            var showHint = scale < 0.9;
            overlay.hidden = !showHint;
            overlay.setAttribute('aria-hidden', showHint ? 'false' : 'true');
            if (msg) msg.textContent = showHint ? copy().over : copy().ok;
        }

        var banner = document.getElementById('cv-page-fit-banner');
        if (banner) {
            var showBanner = scale < 0.9;
            banner.hidden = !showBanner;
            banner.textContent = copy().over;
        }
    }

    function updateSoon() {
        clearTimeout(timer);
        timer = setTimeout(update, 60);
    }

    function bind() {
        if (observer) return;
        var wrap = document.getElementById('cv-preview-wrapper');
        var target = document.getElementById('cv-target');
        if (typeof ResizeObserver === 'function' && wrap && target) {
            observer = new ResizeObserver(updateSoon);
            observer.observe(wrap);
            observer.observe(target);
        }
        window.addEventListener('resize', updateSoon);
        updateSoon();
    }

    global.QCPageFit = {
        update: update,
        updateSoon: updateSoon,
        bind: bind,
        pageCount: function () { return lastPageCount; }
    };
})(window);
