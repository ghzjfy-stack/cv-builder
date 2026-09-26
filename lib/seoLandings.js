(function (global) {
    var PAGES = {
        tech: {
            slug: 'tech',
            field: 'tech',
            example: 'slate',
            examples: ['slate', 'indigo', 'espresso'],
            he: {
                title: 'קורות חיים להייטק | QuickCV',
                description: 'תבניות קורות חיים להייטק ולפיתוח תוכנה — ATS נקי, דוגמאות למפתח Full-Stack ו-DevOps, והורדת PDF אחרי תשלום ב-Bit.',
                kicker: 'הייטק ופיתוח',
                h1: 'קורות חיים להייטק שנראים מוכנים לראיון',
                lead: 'פריסות נקיות למגייסות ולסינון אוטומטי, עם דוגמאות מוכנות למפתחים, DevOps וצוותי מוצר. ערכו בעברית או באנגלית והורידו PDF חד.',
                bullets: [
                    'דוגמאות למפתח Full-Stack, DevOps וניהול מוצר',
                    'מבנה חד-עמודי שעובר ATS',
                    'עברית מימין לשמאל או אנגלית משמאל לימין'
                ],
                cta: 'התחילו עם דוגמת הייטק',
                quote: 'שלחתי באותו ערב. המגייסת כתבה שהמסמך נקי ומדויק.',
                cite: 'דניאל · מפתח Full-Stack'
            },
            en: {
                title: 'Hi-Tech Resume Templates | QuickCV',
                description: 'Hi-tech and software resume templates — clean ATS layouts, Full-Stack and DevOps samples, PDF download after Bit payment.',
                kicker: 'Hi-Tech & Engineering',
                h1: 'Hi-tech resumes that look interview-ready',
                lead: 'Clean layouts for recruiters and ATS scans, with ready samples for developers, DevOps, and product teams. Edit in Hebrew or English and download a sharp PDF.',
                bullets: [
                    'Samples for Full-Stack, DevOps, and product roles',
                    'One-page structure that passes ATS',
                    'Hebrew RTL or English LTR'
                ],
                cta: 'Start with a tech sample',
                quote: 'I sent it the same evening. The recruiter said the document was clean and precise.',
                cite: 'Daniel · Full-Stack developer'
            }
        },
        sales: {
            slug: 'sales',
            field: 'sales',
            example: 'navy',
            examples: ['navy', 'charcoal', 'wine'],
            he: {
                title: 'קורות חיים למכירות | QuickCV',
                description: 'תבניות קורות חיים לאנשי מכירות — יעדים, משפך ו-CRM בדוגמאות מוכנות. עריכה חיה והורדת PDF ב-10 ₪.',
                kicker: 'מכירות ופיתוח עסקי',
                h1: 'קורות חיים למכירות שמציגים תוצאות',
                lead: 'תבניות ניהוליות בעברית עם דגש על יעדים, לקוחות וצמיחה. טענו דוגמה, התאימו מספרים, והגישו מסמך שנראה עסקי בלי עמוד שני.',
                bullets: [
                    'דוגמאות למנהלי מכירות, B2B וחשבונות',
                    'משפטים מוכנים על משפך, CRM ו-KPI',
                    'עיצוב ניהולי שמתאים להגשה מהירה'
                ],
                cta: 'התחילו עם דוגמת מכירות',
                quote: 'חיפשתי משהו שנראה ניהולי בעברית, לא תבנית אמריקאית.',
                cite: 'נועה · מכירות'
            },
            en: {
                title: 'Sales Resume Templates | QuickCV',
                description: 'Sales resume templates — targets, funnel, and CRM in ready samples. Live editing and PDF download for 10 ₪.',
                kicker: 'Sales & Business Development',
                h1: 'Sales resumes that show results',
                lead: 'Management-ready layouts focused on targets, clients, and growth. Load a sample, tune the numbers, and submit a business-ready one-pager.',
                bullets: [
                    'Samples for sales managers, B2B, and accounts',
                    'Ready phrases on funnel, CRM, and KPIs',
                    'Executive look for fast applications'
                ],
                cta: 'Start with a sales sample',
                quote: 'I wanted something that looked managerial — not a generic US template.',
                cite: 'Noa · Sales'
            }
        },
        students: {
            slug: 'students',
            field: 'student',
            example: 'emerald',
            examples: ['emerald', 'indigo', 'forest'],
            he: {
                title: 'קורות חיים לסטודנטים | QuickCV',
                description: 'תבניות קורות חיים לסטודנטים ולבוגרים טריים — התמחות, פרויקטים אקדמיים ומשרה ראשונה. דוגמאות מוכנות להגשה.',
                kicker: 'סטודנטים ובוגרים',
                h1: 'קורות חיים למשרה ראשונה בלי דף ריק',
                lead: 'מלאו פרויקטי לימודים, התמחות ושירות — והמסמך נשאר חד-עמודי. דוגמאות לסטודנטים למדעי המחשב, כלכלה ושיווק, עם עריכה חיה.',
                bullets: [
                    'דוגמת סטודנט/מתמחה מוכנה לעריכה',
                    'מקום לפרויקטים, האקאתון והתנסות חלקית',
                    'מחיר השקה נוח להגשה ראשונה'
                ],
                cta: 'התחילו עם דוגמת סטודנט',
                quote: 'חמש דקות, והיה לי מסמך שאפשר לשלוח להתמחות.',
                cite: 'מאיה · מדעי המחשב'
            },
            en: {
                title: 'Student Resume Templates | QuickCV',
                description: 'Resume templates for students and new grads — internships, academic projects, and first jobs. Ready samples to submit.',
                kicker: 'Students & New Grads',
                h1: 'First-job resumes without a blank page',
                lead: 'Add coursework, internships, and service — and stay on one page. Samples for CS, economics, and marketing with live editing.',
                bullets: [
                    'Student / intern sample ready to edit',
                    'Room for projects, hackathons, and part-time work',
                    'Launch pricing for a first application'
                ],
                cta: 'Start with a student sample',
                quote: 'Five minutes later I had a document I could send for an internship.',
                cite: 'Maya · Computer Science'
            }
        }
    };

    var ALIASES = {
        student: 'students',
        students: 'students',
        tech: 'tech',
        hiitech: 'tech',
        hightech: 'tech',
        'hi-tech': 'tech',
        hitech: 'tech',
        הייטק: 'tech',
        sales: 'sales',
        מכירות: 'sales',
        סטודנטים: 'students',
        intern: 'students'
    };

    function lang() {
        return global.QCCvLang === 'en' ? 'en' : 'he';
    }

    function localize(page) {
        if (!page) return null;
        var copy = page[lang()] || page.he || page;
        return Object.assign({}, page, copy);
    }

    function list() {
        return [localize(PAGES.tech), localize(PAGES.sales), localize(PAGES.students)];
    }

    function get(slug) {
        var key = ALIASES[String(slug || '').trim().toLowerCase()];
        return key ? localize(PAGES[key]) : null;
    }

    function fromPath(pathname) {
        var path = String(pathname || '').replace(/\/+$/, '') || '/';
        var match = path.match(/^\/(?:cv-templates|templates)\/([^/]+)$/i);
        if (!match) return null;
        try {
            return get(decodeURIComponent(match[1]));
        } catch {
            return get(match[1]);
        }
    }

    function refreshActive() {
        try {
            var page = fromPath(location.pathname);
            if (page && typeof global.renderSeoLanding === 'function') global.renderSeoLanding(page);
            else if (page && global.showSeoLanding) {
                /* keep meta in sync when language flips on a landing */
                if (typeof global.applySeoMeta === 'function') global.applySeoMeta(page);
            }
        } catch (err) { /* ignore */ }
    }

    global.QCLandings = {
        pages: PAGES,
        list: list,
        get: get,
        fromPath: fromPath,
        localize: localize,
        refreshActive: refreshActive
    };
})(window);
