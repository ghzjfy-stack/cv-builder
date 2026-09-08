(function (global) {
    var ROLE_IDS = [
        'sales', 'tech', 'marketing', 'cs', 'edu', 'ops',
        'hr', 'finance', 'healthcare', 'legal', 'product',
        'design', 'student', 'hospitality', 'admin', 'engineering'
    ];

    var he = {
        fields: [
            { id: 'sales', label: 'מכירות' },
            { id: 'tech', label: 'הייטק / פיתוח' },
            { id: 'marketing', label: 'שיווק' },
            { id: 'cs', label: 'שירות לקוחות' },
            { id: 'edu', label: 'חינוך' },
            { id: 'ops', label: 'תפעול ולוגיסטיקה' },
            { id: 'hr', label: 'משאבי אנוש' },
            { id: 'finance', label: 'כספים וחשבונאות' },
            { id: 'healthcare', label: 'רפואה וטיפול' },
            { id: 'legal', label: 'משפטים' },
            { id: 'product', label: 'ניהול מוצר' },
            { id: 'design', label: 'עיצוב' },
            { id: 'student', label: 'סטודנט / בוגר טרי' },
            { id: 'hospitality', label: 'אירוח ומזון' },
            { id: 'admin', label: 'מנהלה ומשרד' },
            { id: 'engineering', label: 'הנדסה' }
        ],
        titles: {
            sales: ['מנהלת מכירות ארצית', 'מנהל לקוחות עסקיים', 'נציג מכירות B2B'],
            tech: ['מפתח Full Stack', 'מהנדסת תוכנה', 'ראש צוות פיתוח'],
            marketing: ['מנהלת שיווק דיגיטלי', 'מנהל קמפיינים', 'רכזת תוכן'],
            cs: ['מנהלת שירות לקוחות', 'נציג תמיכה', 'רכזת הצלחת לקוח'],
            edu: ['מורה ללשון ולספרות', 'גננת', 'רכזת פדגוגית'],
            ops: ['מנהל תפעול', 'רכזת לוגיסטיקה', 'מנהל מחסן'],
            hr: ['מנהלת משאבי אנוש', 'מגייסת טאלנט', 'HR Business Partner'],
            finance: ['מנהלת כספים', 'חשבת', 'אנליסטית פיננסית'],
            healthcare: ['אחות אחראית', 'פיזיותרפיסט', 'רכזת קלינית'],
            legal: ['עורכת דין מסחרית', 'יועץ משפטי פנים', 'מתמחה'],
            product: ['מנהל מוצר', 'Product Owner', 'רכזת מוצר'],
            design: ['מעצבת UX/UI', 'מעצב גרפי', 'מנהלת סטודיו'],
            student: ['סטודנט לכלכלה — מחפש משרה ראשונה', 'בוגרת מדעי המחשב', 'מתמחה שיווק'],
            hospitality: ['מנהלת משמרת', 'שף', 'רכזת אירועים'],
            admin: ['מנהלת משרד', 'רכזת פרויקטים', 'עוזרת אישית'],
            engineering: ['מהנדס אזרחי', 'מהנדסת חשמל', 'מנהל פרויקטים הנדסי']
        },
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
            ],
            hr: [
                'ניהול גיוס מקצה לקצה וקיצור זמן לגיוס.',
                'ליווי מנהלים בתהליכי משוב, קידום ושימור.',
                'בניית תהליכי קליטה והדרכה לעובדים חדשים.',
                'שמירה על ציות, רווחה ותרבות ארגונית ברורה.'
            ],
            finance: [
                'בניית תקציב שנתי ומעקב שוטף מול יחידות העסק.',
                'סגירות חודשיות, בקרה ודוחות להנהלה.',
                'שיפור תזרים וניהול קשרי ספקים וגבייה.',
                'הטמעת כלי BI לדיווח ברור לדירקטוריון.'
            ],
            healthcare: [
                'טיפול במטופלים לפי פרוטוקול ושמירה על בטיחות.',
                'תיאום בין צוותים קליניים, משפחות ומערכות מידע.',
                'תיעוד מדויק ומעקב אחרי תוכניות טיפול.',
                'הדרכת צוות זוטר ושיפור מדדי איכות.'
            ],
            legal: [
                'ניסוח וליווי הסכמים מסחריים מול לקוחות וספקים.',
                'מחקר משפטי ותמיכה בעסקאות וברגולציה.',
                'ניהול משא ומתן והפחתת סיכונים משפטיים.',
                'עבודה מול הנהלה, ביטוח ורשויות.'
            ],
            product: [
                'בניית מפת דרכים רבעונית והשקת פיצ\'רים מדידים.',
                'מחקר משתמשים, תעדוף ברור והגדרת מדדי הצלחה.',
                'תיאום בין עיצוב, פיתוח, שיווק ומכירות.',
                'מעקב אחרי שימור, המרה ומשוב לקוחות.'
            ],
            design: [
                'עיצוב ממשקים ומסעות לקוח ברורים ונגישים.',
                'בניית זהות מותג, דפוס ונכסים דיגיטליים.',
                'עבודה עם מחקר, פיתוח וקריאייטיב עד להשקה.',
                'שמירה על מערכת עיצוב עקבית וקריאה.'
            ],
            student: [
                'פרויקט גמר / התמחות עם תוצאה מדידה.',
                'עבודה בצוות, עמידה בלוחות זמנים ולמידה עצמאית.',
                'שילוב כלים דיגיטליים וניתוח נתונים בסיסי.',
                'התנדבות או פעילות חברתית עם אחריות ברורה.'
            ],
            hospitality: [
                'ניהול משמרת, צוות ושירות אורחים ברמה גבוהה.',
                'שמירה על סטנדרט איכות, ניקיון ובטיחות מזון.',
                'טיפול בתלונות ושיפור ציון שביעות רצון.',
                'תיאום ספקים, מלאי ולוחות אירועים.'
            ],
            admin: [
                'ניהול יומן, התכתבות ותיאום מול הנהלה ולקוחות.',
                'מעקב מסמכים, רכש קטן ותהליכי משרד.',
                'הפקת דוחות, מצגות ואירועי צוות.',
                'נקודת קשר מסודרת בין מחלקות.'
            ],
            engineering: [
                'ניהול תכנון וביצוע מול יועצים, קבלנים ולקוח.',
                'בקרת תקציב, לוחות זמנים ואיכות בשטח.',
                'הכנת מפרטים, כתבי כמויות ואישורי רשות.',
                'פתרון תקלות הנדסיות ותיעוד מסודר.'
            ]
        },
        skills: {
            sales: 'ניהול צוותים, CRM, משא ומתן, Excel, יעדי מכירות',
            tech: 'JavaScript, Git, APIs, SQL, עבודה בצוות אג\'ייל',
            marketing: 'Google Ads, Meta Ads, תוכן, GA4, קריאייטיב',
            cs: 'שירות לקוחות, CRM, SLA, תקשורת בינאישית, הדרכה',
            edu: 'הוראה, בניית מערכים, הנחיה, עבודת צוות, כלים דיגיטליים',
            ops: 'לוגיסטיקה, Excel, ניהול מלאי, ספקים, בקרת תהליכים',
            hr: 'גיוס, LinkedIn Recruiter, קליטה, דיני עבודה בסיסיים, Excel',
            finance: 'Excel מתקדם, תקציב, בקרה, SAP, דוחות הנהלה',
            healthcare: 'טיפול קליני, תיעוד, עבודת צוות, פרוטוקולים, אמפתיה',
            legal: 'חוזים, מחקר משפטי, משא ומתן, עברית משפטית, ציות',
            product: 'Roadmap, מחקר משתמשים, Jira, SQL בסיסי, סדנאות אפיון',
            design: 'Figma, Illustrator, זהות מותג, נגישות, עימוד',
            student: 'Excel, מצגות, עבודת צוות, למידה עצמאית, אנגלית',
            hospitality: 'שירות, ניהול משמרת, מלאי, קופה, עבודה בלחץ',
            admin: 'Office, יומן, רכש, תיאום, דיסקרטיות',
            engineering: 'AutoCAD, ניהול פרויקט, מפרטים, בטיחות, פיקוח'
        },
        examples: {
            sales: {
                title: 'מנהלת מכירות ארצית',
                summary: 'מנהלת מכירות עם ניסיון בהובלת צוותים, בניית משפך והגדלת מחזור בשוק B2B.',
                experience: '2021 - נוכחי | Verde Commerce\nמנהלת מכירות ארצית\n• הגדלת מחזור שנתי ב-35% תוך בניית צוות של 12 נציגים.\n• הטמעת CRM ומעקב KPI שבועי.\n\n2018 - 2021 | Shoreline B2B\nמנהלת לקוחות עסקיים\n• סגירת עסקאות מורכבות ושימור לקוחות אסטרטגיים.',
                education: '2014 - 2017 | המרכז הבינתחומי\nBA במנהל עסקים',
                military: '2011 - 2013 | קצינת הדרכה',
                skills: 'ניהול צוותים, CRM, משא ומתן, Excel, יעדי מכירות',
                languages: 'עברית (שפת אם), אנגלית (שוטפת)'
            },
            tech: {
                title: 'מפתח Full Stack',
                summary: 'מפתח עם ניסיון במוצרי SaaS, עבודה בצוות אג\'ייל ושיפור ביצועים בסביבת ייצור.',
                experience: '2022 - נוכחי | Cloudlane\nמפתח Full Stack\n• פיתוח פיצ\'רים מקצה לקצה ב-React ו-Node.\n• שיפור זמני טעינה ב-40% והוספת בדיקות אוטומטיות.\n\n2019 - 2022 | Stackyard\nמפתח Frontend\n• בניית ממשקים נגישים ועבודה מול עיצוב ו-QA.',
                education: '2016 - 2019 | הטכניון\nB.Sc מדעי המחשב',
                military: '2013 - 2016 | ממר"ם',
                skills: 'JavaScript, Git, APIs, SQL, עבודה בצוות אג\'ייל',
                languages: 'עברית (שפת אם), אנגלית (טכנית גבוהה)'
            },
            marketing: {
                title: 'מנהלת שיווק דיגיטלי',
                summary: 'מנהלת שיווק דיגיטלי עם דגש על לידים איכותיים, תוכן ואופטימיזציית תקציב.',
                experience: '2020 - נוכחי | Maroon Media\nמנהלת שיווק דיגיטלי\n• ניהול קמפיינים ב-Google ו-Meta והגדלת לידים ב-50%.\n• בניית מסרים למותג ותוכן לרשתות.\n\n2017 - 2020 | Pulse Agency\nרכזת דיגיטל\n• ניתוח GA ואופטימיזציה שבועית של קריאייטיב.',
                education: '2013 - 2016 | אוניברסיטת חיפה\nBA בתקשורת',
                military: '2010 - 2012 | דוברת יחידה',
                skills: 'Google Ads, Meta Ads, תוכן, GA4, קריאייטיב',
                languages: 'עברית (שפת אם), אנגלית (גבוהה)'
            },
            cs: {
                title: 'מנהלת שירות לקוחות',
                summary: 'מנהלת שירות עם דגש על שביעות רצון, זמני מענה ותיעוד תהליכים בצוות גדול.',
                experience: '2020 - נוכחי | Softline Retail\nמנהלת שירות לקוחות\n• שיפור ציון שביעות רצון מ-4.1 ל-4.7 וקיצור זמן מענה ב-30%.\n• תיעוד תהליכים והדרכת 15 נציגים.\n\n2017 - 2020 | Callora\nנציגת שירות\n• טיפול בפניות מורכבות וזיהוי דפוסי תקלות למוצר.',
                education: '2013 - 2017 | המכללה האקדמית אשקלון\nBA במנהל עסקים',
                military: '2010 - 2012 | פקידת מבצעים',
                skills: 'שירות לקוחות, CRM, SLA, תקשורת בינאישית, הדרכה',
                languages: 'עברית (שפת אם), אנגלית (שוטפת)'
            },
            edu: {
                title: 'מורה ללשון ולספרות',
                summary: 'מורה עם ניסיון בהוראת לשון, בניית מערכים וליווי תלמידים עד לבגרות.',
                experience: '2020 - נוכחי | תיכון גן רווה\nמורה ללשון ולספרות\n• בניית מערכי שיעור מותאמים והעלאת אחוזי הצלחה בבגרות.\n• ליווי מחנכת כיתה ושיתוף פעולה עם הורים וצוות.\n\n2017 - 2020 | חטיבת ביניים אורט\nמורה לעברית\n• שילוב כלים דיגיטליים בהוראה ומעקב התקדמות אישי.',
                education: '2013 - 2017 | B.Ed. הוראת לשון\n2019 | תעודת הוראה לחטיבה עליונה',
                military: '2011 - 2013 | מש"קית חינוך',
                skills: 'הוראה, בניית מערכים, הנחיה, עבודת צוות, כלים דיגיטליים',
                languages: 'עברית (שפת אם), אנגלית (גבוהה)'
            },
            ops: {
                title: 'מנהל תפעול ולוגיסטיקה',
                summary: 'מנהל תפעול עם ניסיון בשרשרת אספקה, SLA וצוותי שטח.',
                experience: '2019 - נוכחי | Harbor Logistics\nמנהל תפעול\n• שיפור דיוק הזמנות ל-99.2% וקיצור זמן אספקה ב-18%.\n• ניהול ספקים, מלאי וצוות של 22 עובדים.\n\n2015 - 2019 | Fieldline\nרכז לוגיסטיקה\n• תיאום מחסן, שטח ומערכות מידע.',
                education: '2011 - 2015 | המכללה למנהל\nBA בניהול תעשייתי',
                military: '2008 - 2011 | קצין לוגיסטיקה',
                skills: 'לוגיסטיקה, Excel, ניהול מלאי, ספקים, בקרת תהליכים',
                languages: 'עברית (שפת אם), אנגלית (מקצועית)'
            },
            hr: {
                title: 'מנהלת משאבי אנוש',
                summary: 'מנהלת HR עם ניסיון בגיוס, קליטה, שימור וליווי מנהלים בארגון צומח.',
                experience: '2020 - נוכחי | Northwind Apps\nמנהלת משאבי אנוש\n• קיצור זמן לגיוס ב-25% ובניית תהליך קליטה אחיד.\n• ליווי 40 מנהלים במשוב, קידום ותרבות.\n\n2016 - 2020 | Cedar Digital\nמגייסת טאלנט\n• גיוס הייטק מקצה לקצה וניהול מותג מעסיק.',
                education: '2012 - 2016 | אוניברסיטת תל אביב\nBA בפסיכולוגיה וניהול',
                military: '2009 - 2011 | מש"קית משא"ן',
                skills: 'גיוס, LinkedIn Recruiter, קליטה, דיני עבודה בסיסיים, Excel',
                languages: 'עברית (שפת אם), אנגלית (שוטפת)'
            },
            finance: {
                title: 'מנהלת כספים',
                summary: 'מנהלת כספים עם ניסיון בתקציב, בקרה ודוחות להנהלה בחברות צומחות.',
                experience: '2020 - נוכחי | Northwind Finance\nמנהלת כספים\n• בניית תקציב שנתי ומעקב שוטף מול יחידות העסק.\n• שיפור תזרים ודיווח ברור לדירקטוריון.\n\n2016 - 2020 | Apex Holdings\nחשבת\n• סגירות חודשיות, ספקים ומשכורות.',
                education: '2012 - 2016 | המכללה למנהל\nBA בכלכלה וחשבונאות',
                military: '2009 - 2011 | פקידת שלישות',
                skills: 'Excel מתקדם, תקציב, בקרה, SAP, דוחות הנהלה',
                languages: 'עברית (שפת אם), אנגלית (מקצועית)'
            },
            healthcare: {
                title: 'אחות אחראית מחלקה',
                summary: 'אחות עם ניסיון בניהול מחלקה, בטיחות מטופל והדרכת צוות קליני.',
                experience: '2019 - נוכחי | בית חולים וולפסון\nאחות אחראית\n• ניהול משמרות, תיעוד ומדדי איכות במחלקה פנימית.\n• הדרכת אחים חדשים והפחתת אירועי בטיחות.\n\n2015 - 2019 | קופת חולים כללית\nאחות קהילה\n• טיפול כרוני, חינוך מטופלים ותיאום רופאים.',
                education: '2011 - 2015 | אוניברסיטת תל אביב\nB.S.N סיעוד',
                military: '2008 - 2010 | חובשת פלוגתית',
                skills: 'טיפול קליני, תיעוד, עבודת צוות, פרוטוקולים, הדרכה',
                languages: 'עברית (שפת אם), אנגלית (מקצועית)'
            },
            legal: {
                title: 'עורכת דין מסחרית',
                summary: 'עורכת דין עם ניסיון בחוזים, ליווי עסקאות ומשא ומתן מסחרי.',
                experience: '2018 - נוכחי | אזולאי ושות\'\nעורכת דין\n• ליווי רכישות וניסוח הסכמים מסחריים.\n• משא ומתן מול ספקים ולקוחות אסטרטגיים.\n\n2015 - 2018 | משרד גולן\nמתמחה ועורכת דין זוטרה\n• מחקר משפטי ותמיכה בהתדיינות.',
                education: '2011 - 2015 | אוניברסיטת תל אביב\nLL.B. משפטים',
                military: '2008 - 2010 | קצינת שלישות',
                skills: 'חוזים, עסקאות, מחקר משפטי, משא ומתן, עברית משפטית',
                languages: 'עברית (שפת אם), אנגלית משפטית'
            },
            product: {
                title: 'מנהל מוצר',
                summary: 'מנהל מוצר עם דגש על מסע לקוח, תעדוף ברור ושיתוף פעולה בין עיצוב, פיתוח ומכירות.',
                experience: '2021 - נוכחי | Northwind Apps\nמנהל מוצר\n• בניית מפת דרכים רבעונית והשקת פיצ\'רים שהעלו שימור ב-18%.\n• ניהול מחקר משתמשים והגדרת מדדי הצלחה מול ההנהלה.\n\n2018 - 2021 | Cedar Digital\nרכז מוצר\n• כתיבת אפיון, מעקב באגים ותיאום השקות עם שיווק.',
                education: '2014 - 2018 | אוניברסיטת תל אביב\nB.A. בניהול וכלכלה',
                military: '2011 - 2014 | קצין מבצעים',
                skills: 'Roadmap, מחקר משתמשים, Jira, SQL בסיסי, סדנאות אפיון',
                languages: 'עברית (שפת אם), אנגלית (שוטפת)'
            },
            design: {
                title: 'מעצבת UX/UI',
                summary: 'מעצבת מוצר עם ניסיון בממשקים, מחקר קל ומערכות עיצוב למוצרי דיגיטל.',
                experience: '2021 - נוכחי | Skyline Studio\nמעצבת UX/UI\n• עיצוב מסעות לקוח באפליקציה והעלאת המרה ב-22%.\n• בניית Design System ועבודה צמודה עם פיתוח.\n\n2018 - 2021 | Studio Arava\nמעצבת גרפית\n• זהות מותג, אתרים ונכסים לרשתות.',
                education: '2014 - 2018 | שנקר\nB.Design תקשורת חזותית',
                military: '2011 - 2013 | מעצבת ביחידה',
                skills: 'Figma, Illustrator, מחקר משתמשים, נגישות, עימוד',
                languages: 'עברית (שפת אם), אנגלית (גבוהה)'
            },
            student: {
                title: 'בוגרת כלכלה — מחפשת משרה ראשונה',
                summary: 'בוגרת כלכלה עם התמחות באנליזה, פרויקט גמר מדיד וניסיון בעבודה חלקית בצוות שירות.',
                experience: '2024 - 2025 | התמחות | DataNest\nמתמחה אנליזה\n• בניית דוחות Excel ודשבורד בסיסי להנהלה.\n• איסוף נתונים ותמיכה בצוות המוצר.\n\n2022 - 2024 | רשת קמעונאית\nנציגת שירות (חלקי)\n• טיפול בלקוחות, קופה ועבודה במשמרות.',
                education: '2021 - 2025 | אוניברסיטת בן-גוריון\nBA בכלכלה',
                military: '2018 - 2020 | מש"קית תכנון',
                skills: 'Excel, מצגות, עבודת צוות, למידה עצמאית, אנגלית',
                languages: 'עברית (שפת אם), אנגלית (גבוהה)'
            },
            hospitality: {
                title: 'מנהלת משמרת',
                summary: 'מנהלת משמרת במסעדנות עם דגש על שירות, צוות ותפעול משמרת עמוסה.',
                experience: '2021 - נוכחי | מסעדת הכרם\nמנהלת משמרת\n• ניהול צוות של 14 מלצרים ומטבח במשמרות שיא.\n• שיפור ציון גוגל מ-4.3 ל-4.7 וטיפול בתלונות במקום.\n\n2018 - 2021 | Café North\nמלצרית בכירה\n• שירות, קופה והדרכת עובדים חדשים.',
                education: '2019 | קורס ניהול אירוח, מכללת תדמור',
                military: '2015 - 2017 | מש"קית ת״ש',
                skills: 'שירות, ניהול משמרת, מלאי, קופה, עבודה בלחץ',
                languages: 'עברית (שפת אם), אנגלית (שוטפת)'
            },
            admin: {
                title: 'מנהלת משרד',
                summary: 'מנהלת משרד שמסדרת יומן, מסמכים ותיאום בין הנהלה, לקוחות וספקים.',
                experience: '2020 - נוכחי | משרד עורכי דין ברק\nמנהלת משרד\n• ניהול יומן שותפים, רכש ותיקי לקוח.\n• הפקת דוחות ואירועי משרד, ונקודת קשר ללקוחות.\n\n2016 - 2020 | חברת ביטוח\nרכזת מנהלה\n• התכתבות, קליטת עובדים ותפעול שוטף.',
                education: '2014 - 2016 | מנהל עסקים, המכללה למינהל (לימודי תעודה)',
                military: '2012 - 2014 | פקידת שלישות',
                skills: 'Office, יומן, רכש, תיאום, דיסקרטיות',
                languages: 'עברית (שפת אם), אנגלית (מקצועית)'
            },
            engineering: {
                title: 'מהנדס אזרחי ומנהל פרויקטים',
                summary: 'מהנדס אזרחי עם ניסיון בתכנון, פיקוח וניהול פרויקטי מגורים ותשתיות.',
                experience: '2019 - נוכחי | בניין פלוס\nמנהל פרויקטים\n• ניהול 3 אתרי מגורים מול קבלנים, יועצים ולקוח.\n• עמידה בתקציב וקיצור לוח זמנים ב-8% בפרויקט אחרון.\n\n2015 - 2019 | משרד מהנדסים דרום\nמהנדס ביצוע\n• פיקוח, מפרטים ואישורי רשות.',
                education: '2011 - 2015 | הטכניון\nB.Sc הנדסה אזרחית',
                military: '2008 - 2011 | קצין הנדסה',
                skills: 'AutoCAD, ניהול פרויקט, מפרטים, בטיחות, פיקוח',
                languages: 'עברית (שפת אם), אנגלית (מקצועית)'
            }
        }
    };

    var en = {
        fields: [
            { id: 'sales', label: 'Sales' },
            { id: 'tech', label: 'Tech / Engineering' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'cs', label: 'Customer Service' },
            { id: 'edu', label: 'Education' },
            { id: 'ops', label: 'Operations & Logistics' },
            { id: 'hr', label: 'Human Resources' },
            { id: 'finance', label: 'Finance & Accounting' },
            { id: 'healthcare', label: 'Healthcare' },
            { id: 'legal', label: 'Legal' },
            { id: 'product', label: 'Product' },
            { id: 'design', label: 'Design' },
            { id: 'student', label: 'Student / Recent graduate' },
            { id: 'hospitality', label: 'Hospitality & Food' },
            { id: 'admin', label: 'Office & Administration' },
            { id: 'engineering', label: 'Civil / Project Engineering' }
        ],
        titles: {
            sales: ['National Sales Manager', 'Account Manager', 'B2B Sales Representative'],
            tech: ['Full Stack Developer', 'Software Engineer', 'Engineering Team Lead'],
            marketing: ['Digital Marketing Manager', 'Campaign Manager', 'Content Coordinator'],
            cs: ['Customer Service Manager', 'Support Specialist', 'Customer Success Lead'],
            edu: ['Language & Literature Teacher', 'Kindergarten Teacher', 'Pedagogical Coordinator'],
            ops: ['Operations Manager', 'Logistics Coordinator', 'Warehouse Manager'],
            hr: ['HR Manager', 'Talent Recruiter', 'HR Business Partner'],
            finance: ['Finance Manager', 'Accountant', 'Financial Analyst'],
            healthcare: ['Charge Nurse', 'Physical Therapist', 'Clinical Coordinator'],
            legal: ['Commercial Attorney', 'In-house Counsel', 'Legal Intern'],
            product: ['Product Manager', 'Product Owner', 'Product Coordinator'],
            design: ['UX/UI Designer', 'Graphic Designer', 'Studio Lead'],
            student: ['Economics graduate — first role', 'Computer Science graduate', 'Marketing intern'],
            hospitality: ['Shift Manager', 'Chef', 'Events Coordinator'],
            admin: ['Office Manager', 'Project Coordinator', 'Executive Assistant'],
            engineering: ['Civil Engineer', 'Electrical Engineer', 'Engineering Project Manager']
        },
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
            ],
            hr: [
                'Ran end-to-end hiring and shortened time-to-hire.',
                'Coached managers on feedback, promotion, and retention.',
                'Built onboarding and training for new hires.',
                'Held compliance, wellbeing, and a clear company culture.'
            ],
            finance: [
                'Built the annual budget and tracked units against plan.',
                'Ran month-end close, controls, and leadership reports.',
                'Improved cash flow and vendor / collections follow-up.',
                'Rolled out BI reporting for the board.'
            ],
            healthcare: [
                'Treated patients to protocol while keeping safety high.',
                'Coordinated clinical teams, families, and records.',
                'Documented care plans and tracked outcomes.',
                'Trained junior staff and improved quality metrics.'
            ],
            legal: [
                'Drafted and supported commercial agreements.',
                'Researched issues and backed deals and regulation.',
                'Negotiated terms and reduced legal risk.',
                'Worked with leadership, insurance, and authorities.'
            ],
            product: [
                'Built quarterly roadmaps and shipped measurable features.',
                'Ran user research, prioritized clearly, and set success metrics.',
                'Aligned design, engineering, marketing, and sales.',
                'Tracked retention, conversion, and customer feedback.'
            ],
            design: [
                'Designed clear, accessible interfaces and journeys.',
                'Built brand identity, print, and digital assets.',
                'Partnered with research, engineering, and creative through launch.',
                'Kept a consistent, readable design system.'
            ],
            student: [
                'Capstone / internship with a measurable result.',
                'Teamwork, deadlines, and independent learning.',
                'Used digital tools and basic data analysis.',
                'Volunteer or community work with clear ownership.'
            ],
            hospitality: [
                'Ran shifts, teams, and high-standard guest service.',
                'Held quality, cleanliness, and food-safety standards.',
                'Handled complaints and lifted satisfaction scores.',
                'Coordinated vendors, inventory, and event schedules.'
            ],
            admin: [
                'Managed calendars, correspondence, and stakeholder coordination.',
                'Tracked documents, small purchasing, and office processes.',
                'Prepared reports, decks, and team events.',
                'Served as a reliable point of contact across teams.'
            ],
            engineering: [
                'Led design and delivery with consultants, contractors, and clients.',
                'Controlled budget, schedule, and on-site quality.',
                'Prepared specs, quantities, and authority approvals.',
                'Solved engineering issues and kept clean documentation.'
            ]
        },
        skills: {
            sales: 'Team leadership, CRM, negotiation, Excel, sales targets',
            tech: 'JavaScript, Git, APIs, SQL, agile teamwork',
            marketing: 'Google Ads, Meta Ads, content, GA4, creative',
            cs: 'Customer service, CRM, SLA, communication, training',
            edu: 'Teaching, lesson planning, facilitation, teamwork, digital tools',
            ops: 'Logistics, Excel, inventory, vendors, process control',
            hr: 'Recruiting, LinkedIn Recruiter, onboarding, basic labor law, Excel',
            finance: 'Advanced Excel, budgeting, controls, SAP, board reporting',
            healthcare: 'Clinical care, documentation, teamwork, protocols, empathy',
            legal: 'Contracts, legal research, negotiation, legal Hebrew, compliance',
            product: 'Roadmaps, user research, Jira, basic SQL, discovery workshops',
            design: 'Figma, Illustrator, brand identity, accessibility, layout',
            student: 'Excel, presentations, teamwork, self-learning, English',
            hospitality: 'Service, shift leadership, inventory, POS, working under pressure',
            admin: 'Office, calendar, purchasing, coordination, discretion',
            engineering: 'AutoCAD, project management, specs, safety, site supervision'
        },
        examples: {
            sales: {
                title: 'National Sales Manager',
                summary: 'Sales manager experienced in leading teams, building pipelines, and growing B2B revenue.',
                experience: '2021 - Present | Verde Commerce\nNational Sales Manager\n• Grew annual revenue 35% while building a team of 12.\n• Rolled out CRM and weekly KPI reviews.\n\n2018 - 2021 | Shoreline B2B\nAccount Manager\n• Closed complex deals and retained strategic clients.',
                education: '2014 - 2017 | Reichman University\nBA in Business Administration',
                military: '2011 - 2013 | Training officer',
                skills: 'Team leadership, CRM, negotiation, Excel, sales targets',
                languages: 'Hebrew (native), English (fluent)'
            },
            tech: {
                title: 'Full Stack Developer',
                summary: 'Developer with SaaS product experience, agile teamwork, and production performance work.',
                experience: '2022 - Present | Cloudlane\nFull Stack Developer\n• Shipped end-to-end features in React and Node.\n• Cut load times 40% and added automated tests.\n\n2019 - 2022 | Stackyard\nFrontend Developer\n• Built accessible interfaces with design and QA.',
                education: '2016 - 2019 | Technion\nB.Sc. Computer Science',
                military: '2013 - 2016 | Mamram',
                skills: 'JavaScript, Git, APIs, SQL, agile teamwork',
                languages: 'Hebrew (native), English (professional)'
            },
            marketing: {
                title: 'Digital Marketing Manager',
                summary: 'Digital marketing manager focused on quality leads, content, and paid-media optimization.',
                experience: '2020 - Present | Maroon Media\nDigital Marketing Manager\n• Ran Google and Meta campaigns and grew leads 50%.\n• Built brand messaging and social content.\n\n2017 - 2020 | Pulse Agency\nDigital Coordinator\n• Analyzed GA and optimized creative weekly.',
                education: '2013 - 2016 | University of Haifa\nBA in Communications',
                military: '2010 - 2012 | Unit spokesperson',
                skills: 'Google Ads, Meta Ads, content, GA4, creative',
                languages: 'Hebrew (native), English (advanced)'
            },
            cs: {
                title: 'Customer Service Manager',
                summary: 'Service manager focused on satisfaction scores, response times, and documented processes in a large team.',
                experience: '2020 - Present | Softline Retail\nCustomer Service Manager\n• Lifted CSAT from 4.1 to 4.7 and cut response time 30%.\n• Documented processes and trained 15 agents.\n\n2017 - 2020 | Callora\nService specialist\n• Handled complex cases and flagged product issue patterns.',
                education: '2013 - 2017 | Ashkelon Academic College\nBA in Business Administration',
                military: '2010 - 2012 | Operations clerk',
                skills: 'Customer service, CRM, SLA, communication, training',
                languages: 'Hebrew (native), English (fluent)'
            },
            edu: {
                title: 'Hebrew Language Teacher',
                summary: 'Teacher experienced in language instruction, lesson design, and student support through matriculation.',
                experience: '2020 - Present | Gan Raveh High School\nLanguage and literature teacher\n• Designed lesson plans and raised matriculation pass rates.\n• Homeroom support and partnership with parents and staff.\n\n2017 - 2020 | Ort Middle School\nHebrew teacher\n• Used digital tools in class and tracked individual progress.',
                education: '2013 - 2017 | B.Ed. Language Education\n2019 | Upper-secondary teaching certificate',
                military: '2011 - 2013 | Education NCO',
                skills: 'Teaching, lesson design, facilitation, teamwork, digital tools',
                languages: 'Hebrew (native), English (advanced)'
            },
            ops: {
                title: 'Operations & Logistics Manager',
                summary: 'Operations leader with supply-chain, SLA, and field-team experience.',
                experience: '2019 - Present | Harbor Logistics\nOperations Manager\n• Raised order accuracy to 99.2% and cut delivery time 18%.\n• Managed vendors, inventory, and a team of 22.\n\n2015 - 2019 | Fieldline\nLogistics Coordinator\n• Coordinated warehouse, field, and information systems.',
                education: '2011 - 2015 | College of Management\nBA in Industrial Management',
                military: '2008 - 2011 | Logistics officer',
                skills: 'Logistics, Excel, inventory, vendors, process control',
                languages: 'Hebrew (native), English (professional)'
            },
            hr: {
                title: 'HR Manager',
                summary: 'HR manager experienced in hiring, onboarding, retention, and coaching managers in a growing company.',
                experience: '2020 - Present | Northwind Apps\nHR Manager\n• Cut time-to-hire 25% and built a consistent onboarding path.\n• Coached 40 managers on feedback, promotion, and culture.\n\n2016 - 2020 | Cedar Digital\nTalent Recruiter\n• Ran end-to-end tech hiring and employer branding.',
                education: '2012 - 2016 | Tel Aviv University\nBA in Psychology and Management',
                military: '2009 - 2011 | Personnel NCO',
                skills: 'Recruiting, LinkedIn Recruiter, onboarding, basic labor law, Excel',
                languages: 'Hebrew (native), English (fluent)'
            },
            finance: {
                title: 'Finance Manager',
                summary: 'Finance manager with experience in budgeting, controls, and leadership reporting in growing companies.',
                experience: '2020 - Present | Northwind Finance\nFinance Manager\n• Built the annual budget and tracked units against plan.\n• Improved cash flow and board reporting.\n\n2016 - 2020 | Apex Holdings\nAccountant\n• Month-end close, vendors, and payroll.',
                education: '2012 - 2016 | College of Management\nBA in Economics and Accounting',
                military: '2009 - 2011 | Personnel clerk',
                skills: 'Advanced Excel, budgeting, controls, SAP, board reporting',
                languages: 'Hebrew (native), English (professional)'
            },
            healthcare: {
                title: 'Charge Nurse',
                summary: 'Nurse with experience running a ward, patient safety, and clinical team training.',
                experience: '2019 - Present | Wolfson Medical Center\nCharge nurse\n• Ran shifts, documentation, and quality metrics on an internal-medicine ward.\n• Trained new nurses and reduced safety incidents.\n\n2015 - 2019 | Clalit Health Services\nCommunity nurse\n• Chronic-care follow-up, patient education, and physician coordination.',
                education: '2011 - 2015 | Tel Aviv University\nB.S.N. Nursing',
                military: '2008 - 2010 | Company medic',
                skills: 'Clinical care, documentation, teamwork, protocols, training',
                languages: 'Hebrew (native), English (professional)'
            },
            legal: {
                title: 'Commercial Attorney',
                summary: 'Attorney with experience in contracts, deal support, and commercial negotiation.',
                experience: '2018 - Present | Azulay & Co.\nAssociate\n• Supported acquisitions and drafted commercial agreements.\n• Negotiated with vendors and strategic clients.\n\n2015 - 2018 | Golan Law\nIntern and junior attorney\n• Legal research and litigation support.',
                education: '2011 - 2015 | Tel Aviv University\nLL.B. Law',
                military: '2008 - 2010 | Personnel officer',
                skills: 'Contracts, deals, legal research, negotiation, legal Hebrew',
                languages: 'Hebrew (native), legal English'
            },
            product: {
                title: 'Product Manager',
                summary: 'Product manager focused on customer journeys, clear prioritization, and tight collaboration across design, engineering, and sales.',
                experience: '2021 - Present | Northwind Apps\nProduct Manager\n• Built quarterly roadmaps and launched features that lifted retention 18%.\n• Ran user research and defined success metrics with leadership.\n\n2018 - 2021 | Cedar Digital\nProduct Coordinator\n• Wrote specs, tracked bugs, and coordinated launches with marketing.',
                education: '2014 - 2018 | Tel Aviv University\nB.A. in Management and Economics',
                military: '2011 - 2014 | Operations officer',
                skills: 'Roadmaps, user research, Jira, basic SQL, discovery workshops',
                languages: 'Hebrew (native), English (fluent)'
            },
            design: {
                title: 'UX/UI Designer',
                summary: 'Product designer with experience in interfaces, light research, and design systems for digital products.',
                experience: '2021 - Present | Skyline Studio\nUX/UI Designer\n• Designed app journeys and lifted conversion 22%.\n• Built a design system and partnered closely with engineering.\n\n2018 - 2021 | Studio Arava\nGraphic designer\n• Brand identity, websites, and social assets.',
                education: '2014 - 2018 | Shenkar\nB.Design Visual Communication',
                military: '2011 - 2013 | Unit designer',
                skills: 'Figma, Illustrator, user research, accessibility, layout',
                languages: 'Hebrew (native), English (advanced)'
            },
            student: {
                title: 'Economics graduate — seeking a first role',
                summary: 'Economics graduate with an analysis internship, a measurable capstone, and part-time service experience.',
                experience: '2024 - 2025 | Internship | DataNest\nAnalysis intern\n• Built Excel reports and a basic leadership dashboard.\n• Collected data and supported the product team.\n\n2022 - 2024 | Retail chain\nPart-time service associate\n• Customer care, cashier work, and shift teamwork.',
                education: '2021 - 2025 | Ben-Gurion University\nBA in Economics',
                military: '2018 - 2020 | Planning NCO',
                skills: 'Excel, presentations, teamwork, self-learning, English',
                languages: 'Hebrew (native), English (advanced)'
            },
            hospitality: {
                title: 'Shift Manager',
                summary: 'Hospitality shift manager focused on service, team leadership, and busy-floor operations.',
                experience: '2021 - Present | Kerem Restaurant\nShift manager\n• Led a team of 14 waitstaff and kitchen on peak shifts.\n• Raised Google rating from 4.3 to 4.7 and handled complaints on the floor.\n\n2018 - 2021 | Café North\nSenior waiter\n• Service, POS, and training new staff.',
                education: '2019 | Hospitality management course, Tadmor',
                military: '2015 - 2017 | Welfare NCO',
                skills: 'Service, shift leadership, inventory, POS, working under pressure',
                languages: 'Hebrew (native), English (fluent)'
            },
            admin: {
                title: 'Office Manager',
                summary: 'Office manager who keeps calendars, documents, and coordination tidy across leadership, clients, and vendors.',
                experience: '2020 - Present | Barak Law Office\nOffice manager\n• Ran partner calendars, purchasing, and client files.\n• Prepared reports and office events; first point of contact for clients.\n\n2016 - 2020 | Insurance firm\nAdmin coordinator\n• Correspondence, new-hire intake, and day-to-day operations.',
                education: '2014 - 2016 | Business administration certificate, College of Management',
                military: '2012 - 2014 | Personnel clerk',
                skills: 'Office, calendar, purchasing, coordination, discretion',
                languages: 'Hebrew (native), English (professional)'
            },
            engineering: {
                title: 'Civil Engineer & Project Manager',
                summary: 'Civil engineer with experience in design, site supervision, and residential / infrastructure project delivery.',
                experience: '2019 - Present | Binyan Plus\nProject manager\n• Ran 3 residential sites with contractors, consultants, and the client.\n• Held budget and cut schedule 8% on the latest project.\n\n2015 - 2019 | Southern Engineering Office\nSite engineer\n• Supervision, specifications, and authority approvals.',
                education: '2011 - 2015 | Technion\nB.Sc. Civil Engineering',
                military: '2008 - 2011 | Engineering officer',
                skills: 'AutoCAD, project management, specs, safety, site supervision',
                languages: 'Hebrew (native), English (professional)'
            }
        }
    };

    global.QCPhrases = {
        he: he,
        en: en,
        fields: he.fields,
        bullets: he.bullets,
        skills: he.skills,
        examples: he.examples,
        titles: he.titles,
        roleIds: ROLE_IDS,
        forLang: function (lang) {
            return lang === 'en' ? en : he;
        }
    };
})(window);
