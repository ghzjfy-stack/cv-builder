(function (global) {
    var PAGES = {
        tech: {
            slug: 'tech',
            field: 'tech',
            example: 'cobalt',
            examples: ['cobalt', 'azure', 'swiss'],
            title: 'קורות חיים להייטק | QuickCV',
            description: 'תבניות קורות חיים להייטק ולפיתוח תוכנה — ATS נקי, דוגמאות Full Stack ו-DevOps, והורדת PDF אחרי תשלום ב-Bit.',
            kicker: 'הייטק ופיתוח',
            h1: 'קורות חיים להייטק שנראים מוכנים לראיון',
            lead: 'פריסות נקיות למגייסות ולסינון אוטומטי, עם דוגמאות מוכנות למפתחים, DevOps וצוותי מוצר. ערכו בעברית או באנגלית והורידו PDF חד.',
            bullets: [
                'דוגמאות Full Stack, DevOps וניהול מוצר',
                'מבנה חד-עמודי שעובר ATS',
                'עברית מימין לשמאל או אנגלית משמאל לימין'
            ],
            cta: 'התחילו עם דוגמת הייטק',
            quote: 'שלחתי באותו ערב. המגייסת כתבה שהמסמך נקי ומדויק.',
            cite: 'דניאל · Full Stack'
        },
        sales: {
            slug: 'sales',
            field: 'sales',
            example: 'navy',
            examples: ['navy', 'charcoal', 'wine'],
            title: 'קורות חיים למכירות | QuickCV',
            description: 'תבניות קורות חיים לאנשי מכירות — יעדים, משפך ו-CRM בדוגמאות מוכנות. עריכה חיה והורדת PDF ב-9.9 ₪.',
            kicker: 'מכירות ופיתוח עסקי',
            h1: 'קורות חיים למכירות שמציגים תוצאות',
            lead: 'תבניות ניהוליות בעברית עם דגש על יעדים, לקוחות וצמיחה. טענו דוגמה, התאימו מספרים, והגישו מסמך שנראה תאגידי בלי עמוד שני.',
            bullets: [
                'דוגמאות למנהלי מכירות, B2B וחשבונות',
                'משפטים מוכנים על משפך, CRM ו-KPI',
                'עיצוב ניהולי שמתאים להגשה מהירה'
            ],
            cta: 'התחילו עם דוגמת מכירות',
            quote: 'חיפשתי משהו שנראה ניהולי בעברית, לא תבנית אמריקאית.',
            cite: 'נועה · מכירות'
        },
        students: {
            slug: 'students',
            field: 'student',
            example: 'intern',
            examples: ['intern', 'academic', 'compact'],
            title: 'קורות חיים לסטודנטים | QuickCV',
            description: 'תבניות קורות חיים לסטודנטים ולבוגרים טריים — התמחות, פרויקטים אקדמיים ומשרה ראשונה. דוגמאות מוכנות להגשה.',
            kicker: 'סטודנטים ובוגרים',
            h1: 'קורות חיים למשרה ראשונה בלי דף ריק',
            lead: 'מלאו פרויקטי לימודים, התמחות ושירות — והמסמך נשאר חד-עמודי. דוגמאות לסטודנטים למדמח, כלכלה ושיווק, עם עריכה חיה.',
            bullets: [
                'דוגמת סטודנט/מתמחה מוכנה לעריכה',
                'מקום לפרויקטים, האקאתון והתנסות חלקית',
                'מחיר השקה נוח להגשה ראשונה'
            ],
            cta: 'התחילו עם דוגמת סטודנט',
            quote: 'חמש דקות, והיה לי מסמך שאפשר לשלוח להתמחות.',
            cite: 'מאיה · מדעי המחשב'
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

    function list() {
        return [PAGES.tech, PAGES.sales, PAGES.students];
    }

    function get(slug) {
        var key = ALIASES[String(slug || '').trim().toLowerCase()];
        return key ? PAGES[key] : null;
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

    global.QCLandings = {
        pages: PAGES,
        list: list,
        get: get,
        fromPath: fromPath
    };
})(window);
