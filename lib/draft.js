(function (global) {
    var KEY = 'qc_cv_draft_v1';
    var FIELDS = [
        'in-name', 'in-title', 'in-phone', 'in-email', 'in-location', 'in-linkedin',
        'in-summary', 'in-experience', 'in-education', 'in-military', 'in-skills', 'in-languages',
        'in-references'
    ];
    var timer;

    function read() {
        try {
            var raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function save() {
        var data = {};
        FIELDS.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) data[id] = el.value;
        });
        var phrase = document.getElementById('phrase-field');
        if (phrase) data['phrase-field'] = phrase.value;
        data.cvLang = global.QCCvLang || 'he';
        data.layout = global.QCLayout || 'classic';
        data.accent = document.documentElement.style.getPropertyValue('--accent') || '';
        data.font = document.documentElement.style.getPropertyValue('--cv-font') || '';
        data.example = global.QCExample || '';
        data.skin = global.QCSkin || '';
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) { /* quota / private mode */ }
    }

    function saveSoon() {
        clearTimeout(timer);
        timer = setTimeout(save, 180);
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
    }

    global.QCDraft = {
        read: read,
        save: save,
        saveSoon: saveSoon,
        restore: restore,
        clear: clear,
        fields: FIELDS
    };
})(window);
