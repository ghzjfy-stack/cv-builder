(function (global) {
    var SAMPLE_HTML = ''
        + '<article class="sample-pdf-page" dir="rtl" lang="he">'
        + '<header class="sample-pdf-head">'
        + '<div>'
        + '<p class="sample-pdf-kicker">קורות חיים</p>'
        + '<h1>נועה כהן</h1>'
        + '<p class="sample-pdf-role">מנהלת מכירות ארצית</p>'
        + '</div>'
        + '<ul class="sample-pdf-contact">'
        + '<li>050-1234567</li>'
        + '<li>noa.cohen@email.com</li>'
        + '<li>תל אביב</li>'
        + '<li>linkedin.com/in/noacohen</li>'
        + '</ul>'
        + '</header>'
        + '<section>'
        + '<h2>תקציר מקצועי</h2>'
        + '<p>מנהלת מכירות עם 8 שנות ניסיון בהובלת צוותים, בניית תהליכי CRM והגדלת מחזור. מתמחה בהפיכת יעדים שנתיים לתוכנית עבודה מדידה — עם דגש על שימור לקוחות וצמיחה בשוק B2B.</p>'
        + '</section>'
        + '<section>'
        + '<h2>ניסיון תעסוקתי</h2>'
        + '<div class="sample-pdf-job">'
        + '<div class="sample-pdf-job-top"><strong>מנהלת מכירות ארצית</strong><span>2021 – היום</span></div>'
        + '<p class="sample-pdf-org">Verde Commerce, תל אביב</p>'
        + '<ul>'
        + '<li>הובלתי צוות של 12 נציגים והגדלתי את היעדים השנתיים ב-35% תוך שנתיים.</li>'
        + '<li>בניתי תהליך Onboarding שאיחד 4 אזורים תפעוליים וקיצר את זמן ההכשרה ב-40%.</li>'
        + '<li>ניהלתי הסכמים אסטרטגיים מול 9 לקוחות מפתח בהיקף של כ-14 מיליון ₪.</li>'
        + '</ul>'
        + '</div>'
        + '<div class="sample-pdf-job">'
        + '<div class="sample-pdf-job-top"><strong>מנהלת פרויקטים</strong><span>2018 – 2021</span></div>'
        + '<p class="sample-pdf-org">Shoreline B2B, הרצליה</p>'
        + '<ul>'
        + '<li>ניהלתי תקציב שנתי של 2.4 מיליון ₪ ועמדתי ב-96% מאבני הדרך.</li>'
        + '<li>שיפרתי דיוק תחזית מכירות ב-22% באמצעות דשבורד CRM אחיד.</li>'
        + '</ul>'
        + '</div>'
        + '</section>'
        + '<div class="sample-pdf-split">'
        + '<section>'
        + '<h2>השכלה</h2>'
        + '<p><strong>BA במנהל עסקים</strong> · אוניברסיטת תל אביב · 2015–2018</p>'
        + '<p>קורס ניהול מוצר, 2019</p>'
        + '</section>'
        + '<section>'
        + '<h2>כישורים</h2>'
        + '<p>ניהול צוותים · CRM · Excel מתקדם · משא ומתן · עברית ואנגלית</p>'
        + '</section>'
        + '</div>'
        + '</article>';

    function frame() {
        return document.getElementById('sample-pdf-frame');
    }

    function fitPage() {
        var stage = document.querySelector('.sample-pdf-stage');
        var page = document.querySelector('.sample-pdf-page');
        if (!stage || !page) return;
        page.style.transform = '';
        var width = page.offsetWidth || 794;
        var available = stage.clientWidth - 8;
        if (width > 0 && available > 0 && available < width) {
            page.style.transform = 'scale(' + (available / width) + ')';
            page.style.marginBottom = ((width - available) * -1 * 297 / 210) + 'px';
        }
    }

    function openModal() {
        var modal = document.getElementById('sample-pdf-modal');
        var host = frame();
        if (!modal || !host) return;
        host.innerHTML = SAMPLE_HTML;
        if (typeof global.lockQcModalScroll === 'function') global.lockQcModalScroll('sample-pdf');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('aria-hidden', 'false');
        window.setTimeout(fitPage, 30);
        window.setTimeout(function () {
            var closeBtn = document.getElementById('btn-sample-pdf-close');
            if (closeBtn) closeBtn.focus();
        }, 40);
    }

    function closeModal() {
        var modal = document.getElementById('sample-pdf-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.setAttribute('aria-hidden', 'true');
        var host = frame();
        if (host) host.innerHTML = '';
        if (typeof global.unlockQcModalScroll === 'function') global.unlockQcModalScroll('sample-pdf');
        var opener = document.querySelector('[data-sample-pdf-opener]:not([hidden])') || document.getElementById('btn-sample-pdf-home');
        if (opener && typeof opener.focus === 'function') opener.focus();
    }

    function bind() {
        if (document.documentElement.__qcSampleBound) return;
        document.documentElement.__qcSampleBound = true;
        document.querySelectorAll('[data-sample-pdf-opener]').forEach(function (btn) {
            btn.addEventListener('click', openModal);
        });
        document.getElementById('btn-sample-pdf-close')?.addEventListener('click', closeModal);
        document.getElementById('sample-pdf-modal')?.querySelector('.examples-backdrop')?.addEventListener('click', closeModal);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    global.QCSamplePreview = {
        open: openModal,
        close: closeModal,
        bind: bind
    };
    global.openSamplePdfPreview = openModal;
    global.closeSamplePdfPreview = closeModal;
})(window);
