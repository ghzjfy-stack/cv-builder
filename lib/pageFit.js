(function (global) {
    var A4_RATIO = 297 / 210;
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
        var contentH = Math.max(target.scrollHeight, target.offsetHeight);
        var over = contentH > pageH + 12;
        var top = (target.offsetTop || 0) + pageH;

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
