(function (global) {
    /** Standard A4 portrait ratio (297mm / 210mm). */
    var A4_RATIO = 297 / 210;
    /** Tolerance so sub-pixel / padding noise does not fake overflow. */
    var OVER_TOLERANCE_PX = 10;
    /** Floor so tiny CVs are not crushed. */
    var MIN_SCALE = 0.72;
    /** Live preview never invents more than two sheets. */
    var MAX_PAGES = 2;
    var timer;
    var observer;
    var lastPageCount = 1;

    function copy() {
        if (global.QCCvLang === 'en') {
            return {
                over: 'Content was scaled to fit the page. Shorten text for a sharper PDF.',
                ok: 'Fits on one page'
            };
        }
        return {
            over: 'התוכן הותאם לגובה העמוד. לקובץ חדים יותר — קצרו מעט את הטקסט.',
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

    function copyPreviewChrome(wrap, page2) {
        Array.prototype.slice.call(page2.classList).forEach(function (cls) {
            if (cls.indexOf('bg-preview-') === 0) page2.classList.remove(cls);
        });
        Array.prototype.slice.call(wrap.classList).forEach(function (cls) {
            if (cls.indexOf('bg-preview-') === 0) page2.classList.add(cls);
        });
        page2.classList.toggle('paid', wrap.classList.contains('paid'));
        var cs = global.getComputedStyle(wrap);
        page2.style.paddingTop = cs.paddingTop;
        page2.style.paddingRight = cs.paddingRight;
        page2.style.paddingBottom = cs.paddingBottom;
        page2.style.paddingLeft = cs.paddingLeft;
        page2.style.borderRadius = cs.borderRadius;
        page2.style.backgroundColor = cs.backgroundColor;
        page2.style.backgroundImage = cs.backgroundImage;
        page2.style.backgroundSize = cs.backgroundSize;
    }

    function showPage2(wrap, target, pageH, usableH, scale) {
        var page2 = document.getElementById('cv-preview-page-2');
        var clip = document.getElementById('cv-preview-page-2-clip');
        var shift = document.getElementById('cv-preview-page-2-shift');
        if (!page2 || !shift) return;

        page2.hidden = false;
        page2.removeAttribute('hidden');
        page2.setAttribute('aria-hidden', 'false');
        page2.style.display = '';
        page2.style.setProperty('--a4-page-height', pageH + 'px');
        page2.style.setProperty('--cv-fit-scale', String(scale));
        page2.style.height = pageH + 'px';
        page2.style.maxHeight = pageH + 'px';
        copyPreviewChrome(wrap, page2);

        if (clip) {
            clip.style.height = '100%';
            clip.style.overflow = 'hidden';
        }

        shift.replaceChildren();
        var clone = target.cloneNode(true);
        clone.removeAttribute('id');
        clone.id = 'cv-target-page2';
        clone.classList.add('cv-page2-sheet');
        clone.setAttribute('aria-hidden', 'true');
        clone.style.setProperty('--cv-fit-scale', String(scale));
        clone.style.transform = 'none';
        clone.style.overflow = 'visible';
        shift.appendChild(clone);
        shift.style.transformOrigin = 'top center';
        shift.style.transform = 'translateY(-' + usableH + 'px) scale(' + scale + ')';
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

        var contentH = measureContentHeight(target);
        var over = contentH > usableH + OVER_TOLERANCE_PX;
        var pages = over ? MAX_PAGES : 1;
        var fitH = usableH * pages;
        var scale = 1;
        if (contentH > fitH + OVER_TOLERANCE_PX && contentH > 0) {
            scale = Math.max(MIN_SCALE, Math.min(1, fitH / contentH));
        }

        lastPageCount = pages;
        wrap.dataset.pageCount = String(pages);
        wrap.style.setProperty('--cv-fit-scale', String(scale));
        target.style.setProperty('--cv-fit-scale', String(scale));
        wrap.classList.toggle('cv-over-one-page', over);
        wrap.classList.toggle('cv-two-pages', pages > 1);
        wrap.classList.toggle('cv-fit-scaled', scale < 0.999);

        if (pages > 1) showPage2(wrap, target, pageH, usableH, scale);
        else hidePage2();

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
        bind: bind,
        pageCount: function () { return lastPageCount; }
    };
})(window);
