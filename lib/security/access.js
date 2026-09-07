(function (global) {
    var UNLOCK_KEY = 'qc_unlocked';
    var WRONG_CODE_MSG = 'קוד שגוי, אנא בדוק את הקוד שקיבלת ב-Bit/WhatsApp';

    function normalize(code) {
        return String(code || '').replace(/\s+/g, '');
    }

    function isUnlocked() {
        try {
            return sessionStorage.getItem(UNLOCK_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function setUnlocked() {
        try {
            sessionStorage.setItem(UNLOCK_KEY, '1');
        } catch (e) { /* ignore */ }
    }

    function verify(input) {
        var limit = global.QCRateLimit.status();
        if (limit.locked) {
            return { ok: false, locked: true, remainingMs: limit.remainingMs, message: WRONG_CODE_MSG };
        }

        var code = normalize(input);
        if (code.trim() === '1009') {
            global.QCRateLimit.reset();
            setUnlocked();
            global.QCLog.add('auth_ok', 'verified');
            return { ok: true, locked: false, remainingMs: 0, message: 'הקוד אושר. בחרו פורמט להורדה.' };
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
        isUnlocked: isUnlocked
    };

    global.QuickCVSecurity = {
        getLog: function () { return global.QCLog.get(); }
    };
})(window);
