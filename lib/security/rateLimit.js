(function (global) {
    var KEY = 'qc_code_attempts';
    var MAX_FAILS = 5;
    var WINDOW_MS = 10 * 60 * 1000;

    function load() {
        try {
            var raw = JSON.parse(localStorage.getItem(KEY) || '{}');
            return { fails: raw.fails || 0, until: raw.until || 0 };
        } catch (e) {
            return { fails: 0, until: 0 };
        }
    }

    function save(state) {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) { /* ignore */ }
    }

    function status() {
        var state = load();
        var now = Date.now();
        if (state.until && now >= state.until) {
            state = { fails: 0, until: 0 };
            save(state);
        }
        var locked = !!(state.until && now < state.until);
        return {
            locked: locked,
            remainingMs: locked ? state.until - now : 0,
            fails: state.fails
        };
    }

    function fail() {
        var state = load();
        var now = Date.now();
        if (state.until && now < state.until) return status();
        state.fails += 1;
        if (state.fails >= MAX_FAILS) {
            state.until = now + WINDOW_MS;
            if (global.QCLog) global.QCLog.add('lockout', 'code lockout 10m');
        }
        save(state);
        return status();
    }

    function reset() {
        save({ fails: 0, until: 0 });
    }

    global.QCRateLimit = {
        maxFails: MAX_FAILS,
        windowMs: WINDOW_MS,
        status: status,
        fail: fail,
        reset: reset
    };
})(window);
