(function (global) {
    var DISMISS_KEY = 'qc_handoff_dismissed_v1';
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function t(key, fallback) {
        var lang = global.QCCvLang === 'en' ? 'en' : 'he';
        var pack = (global.CV_I18N && global.CV_I18N[lang]) || {};
        return pack[key] || fallback;
    }

    function isMobile() {
        if (document.documentElement.classList.contains('qc-narrow')) return true;
        return window.matchMedia && window.matchMedia('(max-width: 1023px)').matches;
    }

    function dismissed() {
        try {
            return localStorage.getItem(DISMISS_KEY) === '1';
        } catch (e) {
            return false;
        }
    }

    function setDismissed() {
        try {
            localStorage.setItem(DISMISS_KEY, '1');
        } catch (e) { /* ignore */ }
    }

    function setStatus(msg, kind) {
        var el = document.getElementById('handoff-status');
        if (!el) return;
        el.textContent = msg || '';
        el.className = 'handoff-status' + (kind ? ' is-' + kind : '');
    }

    function snapshot() {
        if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
        var data = global.QCDraft && QCDraft.read ? QCDraft.read() : null;
        if (!data) return {};
        var copy = {};
        Object.keys(data).forEach(function (key) {
            if (key === 'photo') return;
            copy[key] = data[key];
        });
        return copy;
    }

    function encodeCompact(obj) {
        var json = JSON.stringify(obj || {});
        return btoa(unescape(encodeURIComponent(json)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '');
    }

    function decodeCompact(raw) {
        var s = String(raw || '').replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        return JSON.parse(decodeURIComponent(escape(atob(s))));
    }

    function originLink(search) {
        var url = new URL(location.href);
        url.hash = 'studio';
        url.search = search || '';
        return url.toString();
    }

    function applyDraft(draft) {
        if (!draft || typeof draft !== 'object') return false;
        if (global.QCDraft && typeof QCDraft.apply === 'function') QCDraft.apply(draft);
        else if (global.QCDraft && typeof QCDraft.restore === 'function') {
            try {
                localStorage.setItem('qc_cv_draft_v1', JSON.stringify(draft));
                QCDraft.restore();
            } catch (e) {
                return false;
            }
        }
        if (global.QCDraft && typeof QCDraft.save === 'function') QCDraft.save();
        return true;
    }

    function stripHandoffParams() {
        try {
            var url = new URL(location.href);
            url.searchParams.delete('h');
            url.searchParams.delete('d');
            var hash = url.hash || '#studio';
            history.replaceState(null, '', url.pathname + url.search + hash);
        } catch (e) { /* ignore */ }
    }

    function hasPending() {
        try {
            var params = new URLSearchParams(location.search);
            if (params.get('h') || params.get('d')) return true;
            return /(?:^|[&#])d=/.test(location.hash || '');
        } catch (e) {
            return false;
        }
    }

    function consume() {
        var params = new URLSearchParams(location.search);
        var id = (params.get('h') || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
        var compact = params.get('d') || '';
        if (!compact) {
            var hashMatch = String(location.hash || '').match(/(?:^|[&#])d=([^&]+)/);
            if (hashMatch) compact = decodeURIComponent(hashMatch[1]);
        }

        function finish(draft) {
            if (!applyDraft(draft)) return false;
            stripHandoffParams();
            return true;
        }

        if (compact) {
            try {
                return Promise.resolve(finish(decodeCompact(compact)));
            } catch (e) {
                return Promise.resolve(false);
            }
        }
        if (!id) return Promise.resolve(false);

        return fetch('/api/handoff?id=' + encodeURIComponent(id), { credentials: 'same-origin' })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data || !data.ok || !data.draft) return false;
                return finish(data.draft);
            })
            .catch(function () { return false; });
    }

    function createLink() {
        var draft = snapshot();
        return fetch('/api/handoff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ draft: draft })
        }).then(function (res) { return res.json(); }).then(function (data) {
            if (data && data.ok && data.id) {
                return originLink('?h=' + encodeURIComponent(data.id));
            }
            throw new Error('api');
        }).catch(function () {
            var encoded = encodeCompact(draft);
            if (encoded.length > 12000) throw new Error('too_long');
            return originLink('?d=' + encodeURIComponent(encoded));
        });
    }

    function shareWhatsApp(link) {
        if (String(link).length > 1800) {
            copyLink(link);
            setStatus(t('handoffCopied', 'הקישור הועתק. פתחו אותו במחשב תוך 24 שעות.'), 'ok');
            return;
        }
        var text = t('handoffShareText', 'המשיכו לערוך את קורות החיים ב-QuickCV במחשב:') + '\n' + link;
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    }

    function shareEmail(link) {
        var input = document.getElementById('handoff-email');
        var email = input ? String(input.value || '').trim() : '';
        if (email && !EMAIL_RE.test(email)) {
            setStatus(t('handoffEmailInvalid', 'כתובת האימייל לא תקינה.'), 'error');
            if (input) input.focus();
            return;
        }
        var subject = t('handoffMailSubject', 'המשיכו לערוך ב-QuickCV במחשב');
        var body = t('handoffShareText', 'המשיכו לערוך את קורות החיים ב-QuickCV במחשב:') + '\n\n' + link;
        location.href = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    function copyLink(link) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(link).then(function () {
                setStatus(t('handoffCopied', 'הקישור הועתק. פתחו אותו במחשב תוך 24 שעות.'), 'ok');
            });
        }
        setStatus(link, 'ok');
        return Promise.resolve();
    }

    function withLink(action) {
        setStatus(t('handoffBusy', 'מכינים קישור מאגי…'), 'busy');
        return createLink().then(function (link) {
            setStatus('', '');
            action(link);
        }).catch(function () {
            setStatus(t('handoffFail', 'לא הצלחנו ליצור קישור קצר. העתיקו את הטיוטה ידנית, או נסו שוב.'), 'error');
        });
    }

    function openModal() {
        var modal = document.getElementById('handoff-modal');
        if (!modal) return;
        if (typeof global.lockQcModalScroll === 'function') global.lockQcModalScroll('handoff');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.setAttribute('aria-hidden', 'false');
        setStatus('', '');
        window.setTimeout(function () {
            var email = document.getElementById('handoff-email');
            if (email) email.focus();
        }, 40);
    }

    function closeModal() {
        var modal = document.getElementById('handoff-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.setAttribute('aria-hidden', 'true');
        if (typeof global.unlockQcModalScroll === 'function') global.unlockQcModalScroll('handoff');
        var reopen = document.getElementById('btn-handoff-open');
        if (reopen) reopen.focus();
    }

    function syncBanner() {
        var banner = document.getElementById('handoff-banner');
        if (!banner) return;
        var show = document.body.classList.contains('on-studio') && isMobile() && !dismissed();
        banner.hidden = !show;
        banner.setAttribute('aria-hidden', show ? 'false' : 'true');
    }

    function bind() {
        var banner = document.getElementById('handoff-banner');
        if (!banner || banner.__qcBound) return;
        banner.__qcBound = true;
        document.getElementById('btn-handoff-open')?.addEventListener('click', openModal);
        document.getElementById('btn-handoff-dismiss')?.addEventListener('click', function () {
            setDismissed();
            syncBanner();
        });
        document.getElementById('btn-handoff-close')?.addEventListener('click', closeModal);
        document.getElementById('handoff-modal')?.querySelector('.examples-backdrop')?.addEventListener('click', closeModal);
        document.getElementById('btn-handoff-whatsapp')?.addEventListener('click', function () {
            withLink(shareWhatsApp);
        });
        document.getElementById('btn-handoff-email')?.addEventListener('click', function () {
            withLink(shareEmail);
        });
        document.getElementById('btn-handoff-copy')?.addEventListener('click', function () {
            withLink(function (link) { copyLink(link); });
        });
        window.addEventListener('resize', syncBanner);
        syncBanner();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();

    global.QCHandoff = {
        bind: bind,
        sync: syncBanner,
        consume: consume,
        hasPending: hasPending,
        open: openModal,
        close: closeModal
    };
    global.closeHandoffModal = closeModal;
})(window);
