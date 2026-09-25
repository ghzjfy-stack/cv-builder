(function (global) {
    var UNLOCK_KEY = 'quickcv.highResUnlocked';
    var PAID_UNTIL_KEY = 'quickcv_paid_until';
    var WRONG_CODE_MSG = 'קוד שגוי, אנא בדוק את הקוד שקיבלת ב-Bit/WhatsApp';

    function normalize(code) {
        return String(code || '').replace(/\s+/g, '');
    }

    function paidUntil() {
        try {
            var until = Number(localStorage.getItem(PAID_UNTIL_KEY) || 0);
            if (Number.isFinite(until) && until > Date.now()) return until;
            if (localStorage.getItem(PAID_UNTIL_KEY)) localStorage.removeItem(PAID_UNTIL_KEY);
        } catch (e) { /* ignore */ }
        return 0;
    }

    function isUnlocked() {
        try {
            try { localStorage.removeItem(UNLOCK_KEY); } catch (e2) { /* ignore */ }
            if (paidUntil() > Date.now()) return true;
            if (typeof global.isUnlocked === 'function') return !!global.isUnlocked();
            return sessionStorage.getItem(UNLOCK_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function setUnlocked() {
        try {
            var until = Date.now() + (24 * 60 * 60 * 1000);
            localStorage.setItem(PAID_UNTIL_KEY, String(until));
            sessionStorage.setItem(UNLOCK_KEY, '1');
            global.QCIsPaid = true;
            global.QCPaidUntil = until;
        } catch (e) { /* ignore */ }
    }

    function verify(input) {
        var limit = global.QCRateLimit.status();
        if (limit.locked) {
            return { ok: false, locked: true, remainingMs: limit.remainingMs, message: WRONG_CODE_MSG };
        }

        var code = normalize(input).replace(/\D/g, '');
        if (code.length === 6) {
            return { ok: false, locked: false, remainingMs: 0, message: 'נא לאמת את הקוד דרך טופס התשלום.' };
        }

        global.QCLog.add('auth_fail', 'bad code');
        var after = global.QCRateLimit.fail();
        return {
            ok: false,
            locked: after.locked,
            remainingMs: after.remainingMs,
            message: WRONG_CODE_MSG
        };
    }

    global.QCAccess = {
        verify: verify,
        isUnlocked: isUnlocked,
        setUnlocked: setUnlocked,
        paidUntil: paidUntil
    };

    global.QuickCVSecurity = {
        getLog: function () { return global.QCLog.get(); }
    };
})(window);
