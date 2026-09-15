(function (global) {
    /** Standard A4 portrait ratio (297mm / 210mm). */
    var A4_RATIO = 297 / 210;
    /** Tolerance so sub-pixel / padding noise does not fake overflow. */
    var OVER_TOLERANCE_PX = 6;
    /** Floor so tiny CVs are not crushed. */
    var MIN_SCALE = 0.72;
    var timer;
    var observer;

    function copy() {
        if (global.QCCvLang === 'en') {
            return {
                over: 'Content was scaled to fit one A4 page. Shorten text for a sharper PDF.',
                ok: 'Fits on one page'
            };
        }
        return {
            over: 'התוכן הותאם לעמוד A4 אחד. לקובץ חדים יותר — קצרו מעט את הטקסט.',
            ok: 'מתאים לעמוד אחד'
        };
    }

    function measureContentHeight(target) {
        var prevTransform = target.style.transform;
        target.style.transform = 'none';
        target.style.setProperty('--cv-fit-scale', '1');
        var h = 0;
        try {
            var range = document.createRange();
            range.selectNodeContents(target);
            var rect = range.getBoundingClientRect();
            if (typeof range.detach === 'function') range.detach();
            if (rect && rect.height > 0) h = rect.height;
        } catch (err) {
            /* fall through */
        }
        if (!h) {
            var prevMin = target.style.minHeight;
            target.style.minHeight = '0px';
            h = Math.max(target.scrollHeight || 0, target.offsetHeight || 0);
            target.style.minHeight = prevMin;
        }
        target.style.transform = prevTransform;
        return h;
    }

    function update() {
        var wrap = document.getElementById('cv-preview-wrapper');
        var target = document.getElementById('cv-target');
        var overlay = document.getElementById('cv-page-fit');
        var line = document.getElementById('cv-page-break-line');
        var msg = document.getElementById('cv-page-fit-msg');
        if (!wrap || !target) return;

        var wrapW = wrap.getBoundingClientRect().width || wrap.clientWidth;
        if (wrapW < 40) return;

        var cs = global.getComputedStyle(wrap);
        var padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        var pageH = wrapW * A4_RATIO;
        var usableH = Math.max(48, pageH - padY);

        // Lock the live sheet to exactly one A4 page — never a blank second page.
        wrap.style.setProperty('--a4-page-height', pageH + 'px');
        wrap.style.maxHeight = pageH + 'px';
        wrap.style.height = pageH + 'px';

        var contentH = measureContentHeight(target);
        var over = contentH > usableH + OVER_TOLERANCE_PX;
        var scale = 1;
        if (over && contentH > 0) {
            scale = Math.max(MIN_SCALE, Math.min(1, usableH / contentH));
        }

        wrap.style.setProperty('--cv-fit-scale', String(scale));
        target.style.setProperty('--cv-fit-scale', String(scale));
        wrap.classList.toggle('cv-over-one-page', over);
        wrap.classList.toggle('cv-fit-scaled', scale < 0.999);

        if (line) line.style.display = 'none';
        if (overlay) {
            var showHint = scale < 0.92;
            overlay.hidden = !showHint;
            overlay.setAttribute('aria-hidden', showHint ? 'false' : 'true');
            if (msg) msg.textContent = showHint ? copy().over : copy().ok;
        }

        var banner = document.getElementById('cv-page-fit-banner');
        if (banner) {
            var showBanner = scale < 0.92;
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
        bind: bind
    };
})(window);
