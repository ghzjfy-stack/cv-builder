(function (global) {
    var KEY = 'qc_security_log';
    var MAX = 50;

    function read() {
        try {
            var raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function write(events) {
        try {
            localStorage.setItem(KEY, JSON.stringify(events.slice(-MAX)));
        } catch (e) { /* quota / private mode */ }
    }

    function add(type, detail) {
        var events = read();
        events.push({
            t: Date.now(),
            type: type,
            detail: String(detail || '').slice(0, 180)
        });
        write(events);
    }

    global.QCLog = {
        add: add,
        get: read
    };
})(window);
