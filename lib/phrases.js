(function (global) {
    var he = {
        fields: [
            { id: 'sales', label: 'מכירות' },
            { id: 'tech', label: 'הייטק / פיתוח' },
            { id: 'marketing', label: 'שיווק' },
            { id: 'cs', label: 'שירות לקוחות' },
            { id: 'edu', label: 'חינוך' },
            { id: 'ops', label: 'תפעול ולוגיסטיקה' }
        ],
        bullets: {
            sales: [
                'ניהול משפך מכירות מקצה לקצה והגדלת מחזור ב-X%.',
                'בניית קשרי לקוחות אסטרטגיים וסגירת עסקאות מורכבות.',
                'הובלת צוות נציגים, קביעת יעדים ומעקב KPI שבועי.',
                'שיפור תהליכי CRM והעלאת אחוזי המרה.'
            ],
            tech: [
                'פיתוח ותחזוקה של פיצ\'רים בסביבת ייצור בקנה מידה גדול.',
                'שיפור ביצועים, יציבות וזמני טעינה של המערכת.',
                'עבודה בצוות אג\'ייל מול מוצר, עיצוב ו-QA.',
                'כתיבת קוד נקי, בדיקות אוטומטיות ותיעוד טכני.'
            ],
            marketing: [
                'ניהול קמפיינים דיגיטליים והגדלת לידים איכותיים.',
                'בניית מסרים למותג ותוכן לרשתות חברתיות.',
                'ניתוח נתונים (GA / Meta) ואופטימיזציה של תקציב פרסום.',
                'שיתוף פעולה עם מכירות לשיפור מסע הלקוח.'
            ],
            cs: [
                'טיפול בפניות מורכבות ושמירה על שביעות רצון גבוהה.',
                'תיעוד תהליכים ושיפור זמני מענה (SLA).',
                'זיהוי דפוסי תקלות והעברת משוב לצוות המוצר.',
                'הדרכת נציגים חדשים וליווי בזמן אמת.'
            ],
            edu: [
                'בניית מערכי שיעור מותאמים והובלת כיתה מגוונת.',
                'מעקב התקדמות תלמידים ומתן משוב בונה.',
                'שיתוף פעולה עם הורים וצוות מקצועי.',
                'שילוב כלים דיגיטליים בהוראה.'
            ],
            ops: [
                'ניהול מלאי, ספקים ולוחות זמנים תפעוליים.',
                'שיפור תהליכי אספקה והפחתת עלויות שילוח.',
                'מעקב KPI: דיוק הזמנות, זמני אספקה ותקלות.',
                'תיאום בין מחסן, שטח ומערכות מידע.'
            ]
        },
        skills: {
            sales: 'ניהול צוותים, CRM, משא ומתן, Excel, יעדי מכירות',
            tech: 'JavaScript, Git, APIs, SQL, עבודה בצוות אג\'ייל',
            marketing: 'Google Ads, Meta Ads, תוכן, GA4, קריאייטיב',
            cs: 'שירות לקוחות, CRM, SLA, תקשורת בינאישית, סבלנות',
            edu: 'הוראה, בניית מערכים, הנחיה, עבודת צוות, כלים דיגיטליים',
            ops: 'לוגיסטיקה, Excel, ניהול מלאי, ספקים, בקרת תהליכים'
        }
    };

    var en = {
        fields: [
            { id: 'sales', label: 'Sales' },
            { id: 'tech', label: 'Tech / Engineering' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'cs', label: 'Customer Service' },
            { id: 'edu', label: 'Education' },
            { id: 'ops', label: 'Operations & Logistics' }
        ],
        bullets: {
            sales: [
                'Owned the full sales funnel and grew revenue by X%.',
                'Built strategic accounts and closed complex deals.',
                'Led a sales team, set targets, and tracked weekly KPIs.',
                'Improved CRM processes and raised conversion rates.'
            ],
            tech: [
                'Built and maintained production features at scale.',
                'Improved performance, reliability, and load times.',
                'Worked in an agile team with product, design, and QA.',
                'Wrote clean code, automated tests, and technical docs.'
            ],
            marketing: [
                'Ran digital campaigns and grew high-quality leads.',
                'Built brand messaging and social content.',
                'Analyzed GA / Meta data and optimized ad spend.',
                'Partnered with sales to improve the customer journey.'
            ],
            cs: [
                'Handled complex tickets while keeping satisfaction high.',
                'Documented processes and improved response times (SLA).',
                'Spotted issue patterns and fed insights back to product.',
                'Trained new agents and coached in real time.'
            ],
            edu: [
                'Designed lesson plans and led a diverse classroom.',
                'Tracked student progress and gave constructive feedback.',
                'Collaborated with parents and professional staff.',
                'Integrated digital tools into teaching.'
            ],
            ops: [
                'Managed inventory, vendors, and operational timelines.',
                'Improved fulfillment and reduced shipping costs.',
                'Tracked KPIs: order accuracy, delivery times, and issues.',
                'Coordinated warehouse, field, and information systems.'
            ]
        },
        skills: {
            sales: 'Team leadership, CRM, negotiation, Excel, sales targets',
            tech: 'JavaScript, Git, APIs, SQL, agile teamwork',
            marketing: 'Google Ads, Meta Ads, content, GA4, creative',
            cs: 'Customer service, CRM, SLA, communication, patience',
            edu: 'Teaching, lesson planning, facilitation, teamwork, digital tools',
            ops: 'Logistics, Excel, inventory, vendors, process control'
        }
    };

    global.QCPhrases = {
        he: he,
        en: en,
        fields: he.fields,
        bullets: he.bullets,
        skills: he.skills,
        forLang: function (lang) {
            return lang === 'en' ? en : he;
        }
    };
})(window);
