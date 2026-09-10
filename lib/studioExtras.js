(function (global) {
    var LABELS = {
        he: {
            clTitle: 'מכתב מקדים תואם',
            clHint: 'עמוד אחד באותו גופן וצבע הדגשה. נכלל בהורדה בלי תשלום נוסף.',
            clCompany: 'שם החברה',
            clRecipient: 'נמען (אופציונלי)',
            clRole: 'משרה אליה פונים',
            clBody: 'גוף המכתב',
            clGenerate: 'צור מכתב מהקורות חיים',
            clTab: 'מכתב מקדים',
            cvTab: 'קורות חיים',
            spell: 'נמצאו שגיאות אפשריות ב: {labels}. אפשר להמשיך לתשלום או לחזור ולתקן.'
        },
        en: {
            clTitle: 'Matching cover letter',
            clHint: 'One page in the same font and accent. Included with download at no extra charge.',
            clCompany: 'Company',
            clRecipient: 'Recipient (optional)',
            clRole: 'Role you are applying for',
            clBody: 'Letter body',
            clGenerate: 'Generate from the CV',
            clTab: 'Cover letter',
            cvTab: 'Resume',
            spell: 'Possible typos in: {labels}. You can still pay, or go back and fix them.'
        }
    };

    function pack() {
        return LABELS[global.QCCvLang === 'en' ? 'en' : 'he'];
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el && text) el.textContent = text;
    }

    function applyClLabels() {
        var p = pack();
        setText('cl-toggle-title', p.clTitle);
        setText('cl-toggle-hint', p.clHint);
        setText('label-cl-company', p.clCompany);
        setText('label-cl-recipient', p.clRecipient);
        setText('label-cl-role', p.clRole);
        setText('label-cl-body', p.clBody);
        setText('btn-cl-generate', p.clGenerate);
        setText('doc-tab-cv', p.cvTab);
        setText('doc-tab-letter', p.clTab);
    }

    function setStudioDoc(kind) {
        var letter = kind === 'letter';
        document.body.classList.toggle('qc-doc-letter', letter);
        var cvTab = document.getElementById('doc-tab-cv');
        var clTab = document.getElementById('doc-tab-letter');
        if (cvTab) cvTab.setAttribute('aria-pressed', letter ? 'false' : 'true');
        if (clTab) clTab.setAttribute('aria-pressed', letter ? 'true' : 'false');
        if (letter) {
            var box = document.getElementById('include-cover-letter');
            if (box && !box.checked) {
                box.checked = true;
                onCoverLetterToggle();
            }
            if (global.QCCoverLetter) QCCoverLetter.render();
        }
    }

    function onCoverLetterToggle() {
        var on = !!(document.getElementById('include-cover-letter') && document.getElementById('include-cover-letter').checked);
        var panel = document.getElementById('cover-letter-panel');
        if (panel) panel.hidden = !on;
        if (on && global.QCCoverLetter) {
            var body = document.getElementById('in-cl-body');
            if (body && !String(body.value || '').trim()) QCCoverLetter.fillGenerated();
            else QCCoverLetter.render();
        }
        if (!on) setStudioDoc('cv');
        var bump = document.getElementById('order-bump');
        if (bump && bump.checked !== on) {
            bump.checked = on;
            bump.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (global.QCDraft) QCDraft.saveSoon();
    }

    function onCoverLetterBodyInput() {
        var body = document.getElementById('in-cl-body');
        if (body) body.dataset.autogen = '0';
        if (typeof global.updateCV === 'function') global.updateCV();
    }

    function syncCoverLetterPreview() {
        var bodyEl = document.getElementById('in-cl-body');
        if (!global.QCCoverLetter) return;
        if (bodyEl && bodyEl.dataset.autogen === '1' && QCCoverLetter.enabled()) {
            bodyEl.value = QCCoverLetter.generateBody();
        }
        QCCoverLetter.render();
    }

    function bindBeforeAfter() {
        var range = document.getElementById('ba-range');
        var before = document.getElementById('ba-before');
        var handle = document.getElementById('ba-handle');
        if (!range || !before || range.dataset.bound) return;
        range.dataset.bound = '1';
        var apply = function () {
            var pct = Number(range.value);
            before.style.width = pct + '%';
            if (handle) handle.style.left = pct + '%';
        };
        range.addEventListener('input', apply);
        apply();
    }

    function ensureCss() {
        if (document.querySelector('link[href*="marketing.css"]')) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './marketing.css';
        document.head.appendChild(link);
    }

    function wrapUpdate() {
        var orig = global.updateCV;
        if (typeof orig !== 'function' || orig.__qcExtras) return;
        var wrapped = function () {
            orig.apply(this, arguments);
            try { syncCoverLetterPreview(); } catch (e) { /* ignore */ }
        };
        wrapped.__qcExtras = true;
        global.updateCV = wrapped;
    }

    function wrapPay() {
        var orig = global.openPaymentModal;
        if (typeof orig !== 'function' || orig.__qcExtras) return;
        var wrapped = function () {
            var issues = global.QCSpell ? QCSpell.scanAll() : [];
            var banner = document.getElementById('pay-spell-banner');
            if (banner) {
                if (issues.length) {
                    var labels = [];
                    issues.forEach(function (item) {
                        if (labels.indexOf(item.label) < 0) labels.push(item.label);
                    });
                    banner.textContent = pack().spell.replace('{labels}', labels.join(', '));
                    banner.classList.add('is-on');
                } else {
                    banner.textContent = '';
                    banner.classList.remove('is-on');
                }
            }
            return orig.apply(this, arguments);
        };
        wrapped.__qcExtras = true;
        global.openPaymentModal = wrapped;
    }

    function wrapLang() {
        var orig = global.setCvLang;
        if (typeof orig !== 'function' || orig.__qcExtras) return;
        var wrapped = function () {
            var result = orig.apply(this, arguments);
            applyClLabels();
            return result;
        };
        wrapped.__qcExtras = true;
        global.setCvLang = wrapped;
    }

    function restoreCoverLetter() {
        var draft = global.QCDraft && QCDraft.read ? QCDraft.read() : null;
        if (draft && draft.includeCoverLetter) {
            var box = document.getElementById('include-cover-letter');
            if (box) box.checked = true;
            onCoverLetterToggle();
        }
    }

    function applyGuaranteeCopy() {
        var copy = 'חופש עריכה והורדה ל-30 יום ללא תשלום נוסף';
        document.querySelectorAll('.guarantee-badge, .pay-guarantee, #studio-pay-guarantee, #modal-pay-guarantee, #form-pay-guarantee').forEach(function (el) {
            el.classList.add('guarantee-badge');
            var mark = el.querySelector('.gb-mark');
            var text = el.querySelector('span:not(.gb-mark)');
            if (mark && text) {
                text.textContent = copy;
                return;
            }
            el.innerHTML = '<span class="gb-mark" aria-hidden="true">30</span><span>' + copy + '</span>';
        });
        if (!document.getElementById('pay-spell-banner')) {
            var modal = document.getElementById('modal-pay-guarantee');
            if (modal) {
                var banner = document.createElement('p');
                banner.id = 'pay-spell-banner';
                banner.className = 'qc-spell-banner mt-3';
                banner.setAttribute('role', 'status');
                modal.insertAdjacentElement('afterend', banner);
            }
        }
    }

    function boot() {
        ensureCss();
        applyGuaranteeCopy();
        wrapUpdate();
        wrapPay();
        wrapLang();
        bindBeforeAfter();
        applyClLabels();
        if (global.QCSpell) QCSpell.bind();
        restoreCoverLetter();
        syncCoverLetterPreview();
    }

    global.setStudioDoc = setStudioDoc;
    global.onCoverLetterToggle = onCoverLetterToggle;
    global.onCoverLetterBodyInput = onCoverLetterBodyInput;
    global.QCStudioExtras = { boot: boot };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { window.setTimeout(boot, 0); });
    } else {
        window.setTimeout(boot, 0);
    }
    window.addEventListener('load', function () { window.setTimeout(boot, 80); });
})(window);
