(function (global) {
    var FIELD_IDS = [
        'in-name', 'in-title', 'in-summary', 'in-experience', 'in-education',
        'in-military', 'in-skills', 'in-references', 'in-location',
        'in-cl-company', 'in-cl-recipient', 'in-cl-role', 'in-cl-body'
    ];

    var EN = {
        recieve: 'receive', recieved: 'received', seperate: 'separate', seperately: 'separately',
        occuring: 'occurring', occured: 'occurred', sucess: 'success', sucessful: 'successful',
        manger: 'manager', managment: 'management', experiance: 'experience', experince: 'experience',
        profesional: 'professional', reccomend: 'recommend', recommand: 'recommend',
        adress: 'address', lenght: 'length', independant: 'independent', definately: 'definitely',
        acheive: 'achieve', acheived: 'achieved', responisble: 'responsible',
        comunication: 'communication', knowlege: 'knowledge', enviroment: 'environment',
        oppurtunity: 'opportunity', beleive: 'believe', untill: 'until', wich: 'which',
        teh: 'the', adn: 'and', becuase: 'because', buisness: 'business',
        responsability: 'responsibility', persue: 'pursue', reccomendation: 'recommendation',
        intersted: 'interested', availible: 'available', neccessary: 'necessary',
        orgnization: 'organization', organisaton: 'organisation', skils: 'skills',
        teamate: 'teammate', liason: 'liaison', gaurantee: 'guarantee'
    };

    var HE = {
        'נסיון': 'ניסיון',
        'פרוייקט': 'פרויקט',
        'פרוייקטים': 'פרויקטים',
        'אחריותת': 'אחריות',
        'מקצועיי': 'מקצועי',
        'מנוסהה': 'מנוסה',
        'יעודים': 'יעדים',
        'ארגוון': 'ארגון',
        'צוותיםם': 'צוותים',
        'השכללה': 'השכלה',
        'תפקידד': 'תפקיד',
        'קורותחיימ': 'קורות חיים',
        'אימיילל': 'אימייל',
        'טלפוןן': 'טלפון',
        'מכתבמקדים': 'מכתב מקדים'
    };

    function skipToken(raw) {
        var t = String(raw || '');
        if (t.length < 3) return true;
        if (/[0-9@:/._]/.test(t)) return true;
        if (/^[A-Z]{2,6}$/.test(t)) return true;
        if (/^[•\-*|]+$/.test(t)) return true;
        return false;
    }

    function normalize(word) {
        return String(word || '').replace(/^[^\w\u0590-\u05FF]+|[^\w\u0590-\u05FF]+$/g, '');
    }

    function issuesInText(text) {
        var src = String(text || '');
        var found = [];
        if (!src.trim()) return found;

        if (/\s{3,}/.test(src)) found.push({ type: 'spaces', hint: 'רווחים כפולים' });
        if (/(^|[^\n]) {2,}(?=\S)/.test(src) && found.every(function (x) { return x.type !== 'spaces'; })) {
            found.push({ type: 'spaces', hint: 'רווחים כפולים' });
        }

        var dup = src.match(/([\u0590-\u05FFa-zA-Z]{2,})\s+\1\b/gi);
        if (dup) {
            found.push({ type: 'repeat', word: dup[0], hint: 'מילה חוזרת' });
        }

        var tokens = src.split(/[\s,;:|()]+/);
        var seen = {};
        tokens.forEach(function (raw) {
            var word = normalize(raw);
            if (skipToken(word)) return;
            if (/(.)\1{3,}/.test(word)) {
                found.push({ type: 'stretch', word: word, hint: word });
                return;
            }
            if (/[A-Za-z]/.test(word) && /[\u0590-\u05FF]/.test(word)) {
                found.push({ type: 'mixed', word: word, hint: word });
                return;
            }
            var low = word.toLowerCase();
            if (EN[low] && !seen[low]) {
                seen[low] = true;
                found.push({ type: 'en', word: word, hint: EN[low] });
            }
            if (HE[word] && !seen[word]) {
                seen[word] = true;
                found.push({ type: 'he', word: word, hint: HE[word] });
            }
        });
        return found;
    }

    function fieldLabel(id) {
        var map = {
            'in-name': 'שם',
            'in-title': 'תפקיד',
            'in-summary': 'תקציר',
            'in-experience': 'ניסיון',
            'in-education': 'השכלה',
            'in-military': 'שירות',
            'in-skills': 'כישורים',
            'in-references': 'המלצות',
            'in-location': 'עיר',
            'in-cl-company': 'חברה',
            'in-cl-recipient': 'נמען',
            'in-cl-role': 'משרה',
            'in-cl-body': 'מכתב מקדים'
        };
        var en = global.QCCvLang === 'en';
        if (!en) return map[id] || id;
        var enMap = {
            'in-name': 'Name', 'in-title': 'Title', 'in-summary': 'Summary',
            'in-experience': 'Experience', 'in-education': 'Education',
            'in-military': 'Service', 'in-skills': 'Skills', 'in-references': 'References',
            'in-location': 'City', 'in-cl-company': 'Company', 'in-cl-recipient': 'Recipient',
            'in-cl-role': 'Role', 'in-cl-body': 'Cover letter'
        };
        return enMap[id] || id;
    }

    function hintFor(issues) {
        var en = global.QCCvLang === 'en';
        return issues.slice(0, 4).map(function (item) {
            if (item.type === 'spaces') return en ? 'Extra spaces' : 'רווחים מיותרים';
            if (item.type === 'repeat') return en ? 'Repeated word' : 'מילה שחוזרת ברצף';
            if (item.type === 'mixed') return (en ? 'Mixed script: ' : 'ערבוב עברית/אנגלית: ') + item.word;
            if (item.hint && item.word && item.hint !== item.word) {
                return item.word + ' → ' + item.hint;
            }
            return item.word || item.hint;
        }).join(en ? ' · ' : ' · ');
    }

    function ensureHint(el) {
        var id = el.id + '-spell';
        var node = document.getElementById(id);
        if (node) return node;
        node = document.createElement('p');
        node.id = id;
        node.className = 'qc-spell-hint';
        node.hidden = true;
        el.insertAdjacentElement('afterend', node);
        return node;
    }

    function paintField(el, issues) {
        if (!el) return;
        var hint = ensureHint(el);
        el.classList.toggle('qc-spell-flag', issues.length > 0);
        if (issues.length) {
            hint.hidden = false;
            hint.textContent = hintFor(issues);
        } else {
            hint.hidden = true;
            hint.textContent = '';
        }
    }

    function scanField(id) {
        var el = document.getElementById(id);
        if (!el) return [];
        var issues = issuesInText(el.value);
        paintField(el, issues);
        return issues.map(function (item) {
            return { field: id, label: fieldLabel(id), issue: item };
        });
    }

    function scanAll() {
        var all = [];
        FIELD_IDS.forEach(function (id) {
            all = all.concat(scanField(id));
        });
        return all;
    }

    function bind() {
        if (global.__qcSpellBound) return;
        global.__qcSpellBound = true;
        var timer;
        document.addEventListener('input', function (e) {
            var t = e.target;
            if (!t || FIELD_IDS.indexOf(t.id) < 0) return;
            clearTimeout(timer);
            timer = setTimeout(function () { scanField(t.id); }, 220);
        }, true);
    }

    global.QCSpell = {
        scanAll: scanAll,
        scanField: scanField,
        bind: bind,
        fields: FIELD_IDS
    };
})(window);
