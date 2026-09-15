(function (global) {
    /** Standard A4 portrait ratio (297mm / 210mm). */
    var A4_RATIO = 297 / 210;
    /** Tolerance so sub-pixel / padding noise does not fake a second page. */
    var OVER_TOLERANCE_PX = 8;
    var timer;
    var observer;

    function copy() {
        if (global.QCCvLang === 'en') {
            return {
                over: 'Content goes past 1 page — shorten text or reduce font size to stay on one page.',
                ok: 'Fits on one page'
            };
        }
        return {
            over: 'התוכן עובר עמוד אחד — קצרו טקסט או הקטינו גופן כדי להישאר בעמוד בודד.',
            ok: 'מתאים לעמוד אחד'
        };
    }

    /** Measure real content height (ignore forced min-heights / empty stretch). */
    function measureContentHeight(target) {
        try {
            var range = document.createRange();
            range.selectNodeContents(target);
            var rect = range.getBoundingClientRect();
            if (typeof range.detach === 'function') range.detach();
            if (rect && rect.height > 0) return rect.height;
        } catch (err) {
            /* fall through */
        }
        var prevMin = target.style.minHeight;
        target.style.minHeight = '0px';
        var h = Math.max(target.scrollHeight || 0, target.offsetHeight || 0);
        target.style.minHeight = prevMin;
        return h;
    }

    function update() {
        var wrap = document.getElementById('cv-preview-wrapper');
        var target = document.getElementById('cv-target');
        var overlay = document.getElementById('cv-page-fit');
        var line = document.getElementById('cv-page-break-line');
        var msg = document.getElementById('cv-page-fit-msg');
        if (!wrap || !target || !overlay || !line || !msg) return;

        var width = target.getBoundingClientRect().width || target.offsetWidth;
        if (width < 40) return;

        var pageH = width * A4_RATIO;
        var contentH = measureContentHeight(target);
        var over = contentH > pageH + OVER_TOLERANCE_PX;
        var top = (target.offsetTop || 0) + pageH;

        // Expose A4 page height for CSS overflow handling
        wrap.style.setProperty('--a4-page-height', pageH + 'px');
        target.style.setProperty('--a4-page-height', pageH + 'px');

        line.style.top = Math.max(0, top) + 'px';
        wrap.classList.toggle('cv-over-one-page', over);
        overlay.hidden = !over;
        overlay.setAttribute('aria-hidden', over ? 'false' : 'true');
        msg.textContent = over ? copy().over : copy().ok;

        var banner = document.getElementById('cv-page-fit-banner');
        if (banner) {
            banner.hidden = !over;
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
    }

    global.QCPageFit = {
        update: update,
        updateSoon: updateSoon,
        bind: bind
    };
})(window);
