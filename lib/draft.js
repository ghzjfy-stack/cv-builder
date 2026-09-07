(function (global) {
    var KEY = 'qc_cv_draft_v1';
    var FIELDS = [
        'in-name', 'in-title', 'in-phone', 'in-email', 'in-location', 'in-linkedin',
        'in-summary', 'in-experience', 'in-education', 'in-military', 'in-skills', 'in-languages'
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
        save: save,
        saveSoon: saveSoon,
        restore: restore,
        clear: clear,
        fields: FIELDS
    };
})(window);
