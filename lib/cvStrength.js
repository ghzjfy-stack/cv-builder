(function (global) {
    var SCORE_ANIM = { from: 0, to: 0, start: 0, raf: 0 };

    function getVal(id) {
        var el = document.getElementById(id);
        return el && 'value' in el ? String(el.value || '').trim() : '';
    }

    function isEn() {
        return global.QCCvLang === 'en';
    }

    function isValidPhone(raw) {
        var digits = String(raw || '').replace(/\D/g, '');
        if (!digits) return false;
        // IL mobile / landline and intl 972
        if (/^972\d{8,9}$/.test(digits)) return true;
        if (/^0\d{8,9}$/.test(digits)) return true;
        if (/^\d{9,15}$/.test(digits)) return true;
        return false;
    }

    function countExperienceEntries(text) {
        if (typeof global.parseDatedBlocks === 'function') {
            var blocks = global.parseDatedBlocks(text);
            if (blocks && blocks.length) return blocks.length;
        }
        return String(text || '')
            .split(/\n\s*\n/)
            .filter(function (chunk) {
                return chunk.trim().length > 20;
            }).length;
    }

    function countSkills(text) {
        return String(text || '')
            .split(/[,،;؛\n]+/)
            .map(function (s) {
                return s.trim();
            })
            .filter(Boolean).length;
    }

    function hasLinkedIn(raw) {
        var v = String(raw || '').trim().toLowerCase();
        if (!v) return false;
        return /linkedin\.com|linkedin|http:\/\/|https:\/\/|www\./i.test(v) || v.length >= 3;
    }

    function hasNumericAchievements(text) {
        var t = String(text || '');
        // Numbers with % or common achievement contexts (he/en)
        if (/\d+\s*%/.test(t)) return true;
        if (/\d{1,3}([,.]\d+)?\s*(מיליון|אלף|m|k|₪|\$|€)/i.test(t)) return true;
        if (/(הגדל|צמח|שיפור|ייעול|הפחת|חיסכון|גידול|עלי[יה]|increased|grew|reduced|saved|improved).{0,24}\d+/i.test(t)) {
            return true;
        }
        if (/\d+.{0,16}(לקוחות|עובדים|פרויקטים|מכירות|לידים|clients|users|sales|leads)/i.test(t)) {
            return true;
        }
        return false;
    }

    function buildChecks() {
        var en = isEn();
        var phone = getVal('in-phone');
        var summary = getVal('in-summary').replace(/\s+/g, ' ').trim();
        var experience = getVal('in-experience');
        var entries = countExperienceEntries(experience);
        var skillCount = countSkills(getVal('in-skills'));
        var linkedin = getVal('in-linkedin');
        var name = getVal('in-name');
        var email = getVal('in-email');

        return [
            {
                id: 'phone',
                weight: 10,
                ok: isValidPhone(phone),
                missing: en
                    ? 'Add a valid phone number'
                    : 'הזינו מספר טלפון תקני'
            },
            {
                id: 'experience',
                weight: 20,
                ok: entries >= 3,
                missing: en
                    ? 'Add at least 3 work experience entries'
                    : 'הוסיפו לפחות 3 פריטים בניסיון התעסוקתי'
            },
            {
                id: 'summary',
                weight: 15,
                ok: summary.length > 100,
                missing: en
                    ? 'Write a professional summary over 100 characters'
                    : 'כתבו תקציר מקצועי באורך סביר (מעל 100 תווים)'
            },
            {
                id: 'skills',
                weight: 15,
                ok: skillCount >= 5,
                missing: en
                    ? 'Add at least 5 skills'
                    : 'הוסיפו לפחות 5 מיומנויות'
            },
            {
                id: 'linkedin',
                weight: 10,
                ok: hasLinkedIn(linkedin),
                missing: en
                    ? 'Add a LinkedIn (or website) link'
                    : 'הוסיפו קישור ל-LinkedIn'
            },
            {
                id: 'metrics',
                weight: 20,
                ok: hasNumericAchievements(experience),
                missing: en
                    ? 'Include measurable achievements (e.g. “increased sales by 20%”)'
                    : 'הוסיפו הישגים מספריים בניסיון (למשל: ״העלאת מכירות ב-20%״)'
            },
            {
                id: 'name',
                weight: 5,
                ok: Boolean(name),
                missing: en ? 'Add your full name' : 'הוסיפו שם מלא'
            },
            {
                id: 'email',
                weight: 5,
                ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
                missing: en ? 'Add a valid email address' : 'הוסיפו כתובת אימייל תקינה'
            }
        ];
    }

    function compute() {
        var checks = buildChecks();
        var score = 0;
        var missing = [];
        checks.forEach(function (c) {
            if (c.ok) score += c.weight;
            else missing.push(c.missing);
        });
        return {
            score: Math.max(0, Math.min(100, score)),
            missing: missing,
            checks: checks
        };
    }

    function tierFor(score) {
        if (score < 50) return 'low';
        if (score < 70) return 'warn';
        if (score < 85) return 'good';
        return 'great';
    }

    function colorFor(score) {
        if (score < 50) return '#ef4444';
        if (score < 70) return '#f97316';
        if (score < 85) return '#86efac';
        return '#15803d';
    }

    /** Semicircle path length for r=78, from 180° to 0° */
    var ARC_LEN = Math.PI * 78;

    function setGaugeVisual(score, animateValue) {
        var meter = document.getElementById('cv-strength-meter');
        var arc = document.getElementById('cv-gauge-arc');
        var valueEl = document.getElementById('cv-strength-value');
        var needle = document.getElementById('cv-gauge-needle');
        if (!meter) return;

        var tier = tierFor(score);
        var color = colorFor(score);
        meter.setAttribute('data-tier', tier);
        meter.style.setProperty('--cv-gauge-color', color);

        if (arc) {
            var clamped = Math.max(0, Math.min(100, score));
            var offset = ARC_LEN * (1 - clamped / 100);
            arc.style.strokeDasharray = String(ARC_LEN);
            arc.style.strokeDashoffset = String(offset);
            arc.setAttribute('stroke', color);
        }

        if (needle) {
            // -90deg empty → +90deg full
            var angle = -90 + (Math.max(0, Math.min(100, score)) / 100) * 180;
            needle.style.transform = 'rotate(' + angle + 'deg)';
        }

        if (valueEl && animateValue !== false) {
            valueEl.textContent = Math.round(score) + '%';
            valueEl.style.color = color;
        }

        var bar = document.getElementById('cv-strength-bar');
        if (bar) bar.setAttribute('aria-valuenow', String(Math.round(score)));
    }

    function animateTo(score) {
        var from = SCORE_ANIM.to;
        SCORE_ANIM.from = from;
        SCORE_ANIM.to = score;
        SCORE_ANIM.start = performance.now();
        if (SCORE_ANIM.raf) cancelAnimationFrame(SCORE_ANIM.raf);

        function frame(now) {
            var t = Math.min(1, (now - SCORE_ANIM.start) / 520);
            var eased = 1 - Math.pow(1 - t, 3);
            var current = SCORE_ANIM.from + (SCORE_ANIM.to - SCORE_ANIM.from) * eased;
            setGaugeVisual(current, true);
            if (t < 1) SCORE_ANIM.raf = requestAnimationFrame(frame);
            else {
                SCORE_ANIM.raf = 0;
                setGaugeVisual(SCORE_ANIM.to, true);
            }
        }
        SCORE_ANIM.raf = requestAnimationFrame(frame);
    }

    function renderFeedback(result) {
        var en = isEn();
        var promptEl = document.getElementById('cv-strength-prompt');
        var listEl = document.getElementById('cv-strength-tips');
        var tipLegacy = document.getElementById('cv-strength-tip');
        var score = result.score;

        if (score >= 90) {
            var done = en
                ? 'Excellent! Your CV is ready to send to recruiters.'
                : 'מצוין! קורות החיים שלך מוכנים לשליחה למגייסים.';
            if (promptEl) {
                promptEl.textContent = done;
                promptEl.classList.add('is-complete');
            }
            if (listEl) {
                listEl.innerHTML = '';
                listEl.hidden = true;
            }
            if (tipLegacy) tipLegacy.textContent = done;
            return;
        }

        var prompt = en
            ? 'Want to reach 100%? Do the following:'
            : 'רוצים להגיע ל-100%? בצעו את הפעולות הבאות:';
        if (promptEl) {
            promptEl.textContent = prompt;
            promptEl.classList.remove('is-complete');
        }
        if (tipLegacy) tipLegacy.textContent = prompt;

        var top = (result.missing || []).slice(0, 3);
        if (listEl) {
            listEl.hidden = top.length === 0;
            listEl.innerHTML = top
                .map(function (item) {
                    return '<li>' + String(item).replace(/</g, '&lt;') + '</li>';
                })
                .join('');
        }
    }

    function update() {
        var result = compute();
        animateTo(result.score);
        renderFeedback(result);
        if (typeof global.updateMobileStudioProgress === 'function') {
            try { global.updateMobileStudioProgress(); } catch (err) { /* dock is optional */ }
        }
        return result;
    }

    global.QCStrength = {
        update: update,
        compute: compute,
        isValidPhone: isValidPhone
    };

    // Back-compat for inline studio helpers
    global.computeCvScore = function () {
        var r = compute();
        return { score: r.score, tips: r.missing, done: isEn()
            ? 'Excellent! Your CV is ready to send to recruiters.'
            : 'מצוין! קורות החיים שלך מוכנים לשליחה למגייסים.' };
    };
    global.updateCvScore = update;
})(typeof window !== 'undefined' ? window : globalThis);
