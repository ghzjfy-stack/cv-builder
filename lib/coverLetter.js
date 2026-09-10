(function (global) {
    function val(id) {
        var el = document.getElementById(id);
        var raw = el && 'value' in el ? el.value : '';
        return global.QCSanitize ? global.QCSanitize.text(raw) : String(raw || '');
    }

    function collect() {
        if (typeof global.QCExport?.data === 'function') return global.QCExport.data();
        return {
            name: val('in-name'),
            title: val('in-title'),
            phone: val('in-phone'),
            email: val('in-email'),
            location: val('in-location'),
            summary: val('in-summary')
        };
    }

    function isEnglish() {
        var target = document.getElementById('cv-target');
        return global.QCCvLang === 'en' || (target && target.getAttribute('dir') === 'ltr');
    }

    function enabled() {
        var box = document.getElementById('include-cover-letter');
        return !!(box && box.checked);
    }

    function generateBody() {
        var d = collect();
        var company = val('in-cl-company');
        var role = val('in-cl-role') || d.title;
        var name = d.name || (isEnglish() ? 'Applicant' : 'מועמד/ת');
        var summary = String(d.summary || '').trim();
        if (isEnglish()) {
            return [
                'I am writing to apply' + (role ? ' for the ' + role + ' role' : '') + (company ? ' at ' + company : '') + '.',
                summary,
                'I would welcome the chance to discuss how I can contribute, and I have attached my resume.'
            ].filter(Boolean).join('\n\n');
        }
        return [
            'אני פונה' + (role ? ' למשרת ' + role : '') + (company ? ' ב' + company : '') + '.',
            summary,
            'אשמח להרחיב בשיחה קצרה. מצורפים קורות החיים.'
        ].filter(Boolean).join('\n\n');
    }

    function buildText() {
        var d = collect();
        var name = d.name || (isEnglish() ? 'Applicant' : 'מועמד/ת');
        var recipient = val('in-cl-recipient');
        var body = val('in-cl-body') || generateBody();
        if (isEnglish()) {
            return ['Dear ' + (recipient || 'Hiring Team') + ',', '', body, '', 'Kind regards,', name, d.phone, d.email].filter(function (x, i, arr) {
                return x || (i && arr[i - 1]);
            }).join('\n').trim() + '\n';
        }
        return ['לכבוד ' + (recipient || 'צוות הגיוס') + ',', '', 'שלום רב,', body, '', 'בברכה,', name, d.phone, d.email].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    function fillGenerated() {
        var body = document.getElementById('in-cl-body');
        if (body) {
            body.value = generateBody();
            body.dataset.autogen = '1';
        }
        render();
        if (global.QCDraft && QCDraft.saveSoon) QCDraft.saveSoon();
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text || '';
    }

    function render() {
        var d = collect();
        var target = document.getElementById('cl-target');
        if (target) target.setAttribute('dir', isEnglish() ? 'ltr' : 'rtl');
        setText('cl-out-date', new Date().toLocaleDateString(isEnglish() ? 'en-GB' : 'he-IL'));
        setText('cl-out-name', d.name);
        setText('cl-out-title', d.title);
        setText('cl-out-contact', [d.phone, d.email, d.location].filter(Boolean).join(' · '));
        var meta = [val('in-cl-recipient'), val('in-cl-company'), val('in-cl-role')].filter(Boolean).join(' · ');
        setText('cl-out-meta', meta);
        var body = val('in-cl-body') || generateBody();
        var out = document.getElementById('cl-out-body');
        if (out) out.textContent = body;
    }

    function filename() {
        var safe = global.QCSanitize && global.QCSanitize.filename
            ? global.QCSanitize.filename(val('in-name'))
            : 'cover';
        return (isEnglish() ? 'Cover_Letter_' : 'מכתב_מקדים_') + (safe || 'letter') + '.txt';
    }

    function download() {
        if (!val('in-cl-body')) fillGenerated();
        var blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename();
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }

    global.QCCoverLetter = {
        enabled: enabled,
        generateBody: generateBody,
        buildText: buildText,
        fillGenerated: fillGenerated,
        render: render,
        filename: filename,
        download: download
    };

    if (!global.QCStudioExtras) {
        var extras = document.createElement('script');
        extras.src = 'lib/studioExtras.js';
        extras.defer = true;
        document.head.appendChild(extras);
    }
})(window);
