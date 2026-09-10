(function (global) {
    var KEY = 'qc_cv_draft_v1';
    var FIELDS = [
        'in-name', 'in-title', 'in-phone', 'in-email', 'in-location', 'in-linkedin',
        'in-summary', 'in-experience', 'in-education', 'in-military', 'in-skills', 'in-languages',
        'in-references', 'in-cl-company', 'in-cl-recipient', 'in-cl-role', 'in-cl-body'
    ];
    var PHOTO_MAX = 280000;
    var timer;

    function read() {
        try {
            var raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function currentPreviewBg() {
        var wrap = document.getElementById('cv-preview-wrapper');
        if (!wrap) return '';
        var cls = Array.prototype.find.call(wrap.classList, function (c) {
            return String(c).indexOf('bg-preview-') === 0;
        });
        return cls || '';
    }

    function save() {
        var data = {};
        FIELDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) data[id] = el.value;
        });
        var phrase = document.getElementById('phrase-field');
        if (phrase) data['phrase-field'] = phrase.value;
        var scale = document.getElementById('font-scale');
        if (scale) data.fontScale = scale.value;
        var leading = document.getElementById('line-height');
        if (leading) data.lineHeight = leading.value;
        data.previewBg = currentPreviewBg();
        data.cvLang = global.QCCvLang || 'he';
        data.layout = global.QCLayout || 'classic';
        data.accent = document.documentElement.style.getPropertyValue('--accent') || '';
        data.font = document.documentElement.style.getPropertyValue('--cv-font') || '';
        data.example = global.QCExample || '';
        data.skin = global.QCSkin || '';
        data.includeCoverLetter = !!(document.getElementById('include-cover-letter') && document.getElementById('include-cover-letter').checked);
        var photo = global.QCPhotoDataUrl || '';
        if (photo && photo.length <= PHOTO_MAX) data.photo = photo;
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) { /* quota / private mode */ }
    }

    function saveSoon() {
        clearTimeout(timer);
        timer = setTimeout(save, 180);
    }

    function applyPhoto(dataUrl) {
        if (!dataUrl || String(dataUrl).indexOf('data:image') !== 0) return;
        global.QCPhotoDataUrl = dataUrl;
        var img = document.getElementById('out-photo');
        var fallback = document.getElementById('out-photo-fallback');
        if (img) {
            img.src = dataUrl;
            img.hidden = false;
        }
        if (fallback) fallback.style.display = 'none';
    }

    function restore() {
        var data = read();
        if (!data) return false;
        FIELDS.forEach(function (id) {
            if (data[id] == null) return;
            var el = document.getElementById(id);
            if (el) el.value = data[id];
        });
        var phrase = document.getElementById('phrase-field');
        if (phrase && data['phrase-field']) phrase.value = data['phrase-field'];
        if (data.cvLang === 'en' || data.cvLang === 'he') global.QCCvLang = data.cvLang;
        if (data.photo) applyPhoto(data.photo);
        return true;
    }

    function clear() {
        try {
            localStorage.removeItem(KEY);
        } catch (e) { /* ignore */ }
        FIELDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        global.QCPhotoDataUrl = '';
    }

    function bindLifecycle() {
        if (global.__qcDraftLife) return;
        global.__qcDraftLife = true;
        document.addEventListener('input', function (e) {
            var t = e.target;
            if (!t || !t.id) return;
            if (FIELDS.indexOf(t.id) >= 0 || t.id === 'phrase-field' || t.id === 'font-scale' || t.id === 'line-height' || t.id === 'include-cover-letter') saveSoon();
        }, true);
        document.addEventListener('change', function (e) {
            var t = e.target;
            if (!t || !t.id) return;
            if (FIELDS.indexOf(t.id) >= 0 || t.id === 'phrase-field' || t.id === 'font-scale' || t.id === 'line-height' || t.id === 'include-cover-letter') saveSoon();
        }, true);
        window.addEventListener('pagehide', save);
        window.addEventListener('beforeunload', save);
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') save();
        });
    }

    bindLifecycle();

    global.QCDraft = {
        read: read,
        save: save,
        saveSoon: saveSoon,
        restore: restore,
        clear: clear,
        fields: FIELDS
    };
})(window);
