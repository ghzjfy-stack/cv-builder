(function (global) {
    /** Core distinct templates only. Legacy IDs resolve via TEMPLATE_ALIASES. */
    var TEMPLATES = {
        premium: {
            title: "פרימיום",
            titleHe: "פרימיום",
            titleEn: "Executive Split",
            subHe: "יונתן כהן · סמנכ״ל תפעול",
            subEn: "Jonathan Cohen · VP Operations",
            thumb: "lay-premium",
            layout: "premium",
            skin: "",
            accent: "#4a4a4a",
            font: "Frank Ruhl Libre",
            bg: "bg-preview-white",
            field: "ops",
            preferredLang: "he",
            atsOptimized: true,
            supportsPhoto: true,
            category: "management",
            styleTags: ["executive","professional","minimal"],
            he: {
                name: "יונתן כהן",
                title: "סמנכ״ל תפעול",
                phone: "054-7788123",
                email: "yonatan.cohen@example.com",
                location: "הרצליה",
                linkedin: "linkedin.com/in/yonatancohen",
                summary: "מנהל תפעול בכיר עם ניסיון בהובלת צוותים רב-אתריים, שיפור תהליכים ועמידה ביעדי צמיחה. פריסת Executive Split מקצועית — קריאה נוחה לעין ולמערכות ATS.",
                experience: "2020 - נוכחי | NovaOps\nסמנכ״ל תפעול\n• הובלת 65 עובדים בשלושה אתרים ושיפור עמידה ב-SLA ל-97%.\n• בניית תהליכי תכנון רבעוני והפחתת עלויות תפעול ב-14%.\n• הטמעת מדדי KPI והעלאת יעילות ב-20%.\n\n2016 - 2020 | Apex Logistics\nמנהל תפעול\n• ניהול שרשרת אספקה ושיפור זמני אספקה ב-22%.\n• בניית שגרות בקרה יומיות לצוותי שטח.",
                education: "2010 - 2014 | אוניברסיטת תל אביב\nBA במנהל עסקים\n2018 | תוכנית מנהלים — INSEAD",
                military: "2007 - 2010 | קצין תכנון",
                skills: "ניהול תפעול, KPI, שרשרת אספקה, מנהיגות, Excel מתקדם",
                languages: "עברית (שפת אם), אנגלית (שוטפת), ערבית (בינונית)",
                references: ""
            },
            en: {
                name: "Jonathan Cohen",
                title: "VP Operations",
                phone: "054-7788123",
                email: "yonatan.cohen@example.com",
                location: "Herzliya",
                linkedin: "linkedin.com/in/yonatancohen",
                summary: "Senior operations leader with a track record of scaling multi-site teams, refining processes, and hitting growth targets. An ATS-friendly Executive Split layout that stays elegant on one page.",
                experience: "2020 - Present | NovaOps\nVP Operations\n• Led 65 people across three sites and lifted SLA to 97%.\n• Built quarterly planning rhythms and cut ops cost by 14%.\n• Rolled out KPI dashboards and raised efficiency by 20%.\n\n2016 - 2020 | Apex Logistics\nOperations Manager\n• Ran supply chain and improved delivery times by 22%.\n• Built daily control routines for field teams.",
                education: "2010 - 2014 | Tel Aviv University\nBA in Business Administration\n2018 | Executive program — INSEAD",
                military: "2007 - 2010 | Planning officer",
                skills: "Operations, KPIs, supply chain, leadership, advanced Excel",
                languages: "Hebrew (native), English (fluent), Arabic (intermediate)",
                references: ""
            }
        },
        charcoal: {
            title: "קלאסית נקייה",
            titleHe: "קלאסית נקייה",
            titleEn: "Clean Classic",
            subHe: "רועי • מנהל מוצר",
            subEn: "Roy • Product Manager",
            thumb: "lay-charcoal",
            layout: "charcoal",
            skin: "",
            accent: "#4c4c4c",
            font: "Lato",
            bg: "bg-preview-white",
            field: "marketing",
            preferredLang: "en",
            atsOptimized: false,
            supportsPhoto: false,
            category: "creative",
            styleTags: ["professional"],
            he: {
                name: "רועי לוי",
                title: "מנהל מוצר",
                phone: "052-4455667",
                email: "roy.levi@example.com",
                location: "תל אביב",
                linkedin: "linkedin.com/in/roylevi",
                summary: "מנהל מוצר עם ניסיון בהובלת פיצ׳רים, עבודה מול פיתוח ושיווק, ומדידת תוצאות עסקיות.",
                experience: "2020 - נוכחי | הלקס דיגיטל\nמנהל מוצר\n• הובלת מפת דרכים למוצר B2B והשקת 6 פיצ׳רים בשנה.\n• שיפור המרה ב-18% בשיתוף עם צוותי פיתוח ושיווק.\n\n2017 - 2020 | נובה סיסטמס\nרכז מוצר\n• איסוף דרישות, כתיבת אפיון וליווי ספרינטים.",
                education: "2013 - 2017 | אוניברסיטת תל אביב\nBA במנהל עסקים",
                military: "2010 - 2013 | קצין תכנון",
                skills: "ניהול מוצר, אפיון, Roadmap, SQL בסיסי, A/B Testing",
                languages: "עברית (שפת אם), אנגלית (שוטפת)",
                references: ""
            },
            en: {
                name: "Roy Levi",
                title: "Product Manager",
                phone: "052-4455667",
                email: "roy.levi@example.com",
                location: "Tel Aviv",
                linkedin: "linkedin.com/in/roylevi",
                summary: "Product manager with a record of shipping features, working with engineering and marketing, and measuring business results.",
                experience: "2020 - Present | Helix Digital\nProduct Manager\n• Led the B2B product roadmap and launched 6 features in a year.\n• Improved conversion by 18% with engineering and marketing.\n\n2017 - 2020 | Nova Systems\nProduct coordinator\n• Gathered requirements, wrote specs, and supported sprints.",
                education: "2013 - 2017 | Tel Aviv University\nBA in Business Administration",
                military: "2010 - 2013 | Planning officer",
                skills: "Product, specs, roadmap, basic SQL, A/B testing",
                languages: "Hebrew (native), English (fluent)",
                references: ""
            }
        },
        emerald: {
            title: "מודרנית עם תמונה",
            titleHe: "מודרנית עם תמונה",
            titleEn: "Modern with Photo",
            subHe: "נועה • שיווק ודיגיטל",
            subEn: "Noa • Marketing & Digital",
            thumb: "lay-emerald",
            layout: "navy",
            skin: "emerald",
            accent: "#31443b",
            font: "Montserrat",
            bg: "bg-preview-white",
            field: "ops",
            preferredLang: "he",
            atsOptimized: false,
            supportsPhoto: true,
            category: "management",
            styleTags: ["professional"],
            he: {
                name: "נועה ברק",
                title: "מנהלת שיווק דיגיטלי",
                phone: "052-6677001",
                email: "sivan.barak@example.com",
                location: "חיפה",
                linkedin: "linkedin.com/in/sivanbarak",
                summary: "מנהלת שיווק דיגיטלי עם ניסיון בקמפיינים, לידים וצמיחת מותג.",
                experience: "2021 - נוכחי | Verde Digital\nמנהלת שיווק דיגיטלי\n• בניית קמפיינים בגוגל ובמטא והגדלת לידים איכותיים ב-32%.\n• ניהול תקציב מדיה ומעקב ביצועים מול מכירות.\n\n2017 - 2021 | Coastal Labs\nרכזת דיגיטל\n• ניהול רשתות, תוכן ממומן ודוחות שבועיים.",
                education: "2013 - 2017 | המכללה למנהל\nBA בשיווק",
                military: "2010 - 2012 | קצינת שלישות",
                skills: "שיווק דיגיטלי, Google Ads, Meta, אנליטיקס, תוכן",
                languages: "עברית (שפת אם), אנגלית (גבוהה)",
                references: ""
            },
            en: {
                name: "Noa Barak",
                title: "Digital Marketing Manager",
                phone: "052-6677001",
                email: "sivan.barak@example.com",
                location: "Haifa",
                linkedin: "linkedin.com/in/sivanbarak",
                summary: "Digital marketing manager with campaigns, leads, and brand growth.",
                experience: "2021 - Present | Verde Digital\nDigital Marketing Manager\n• Built Google and Meta campaigns and grew qualified leads 32%.\n• Owned media budget and weekly reporting with sales.\n\n2017 - 2021 | Coastal Labs\nDigital coordinator\n• Social, paid content, and weekly performance reports.",
                education: "2013 - 2017 | College of Management\nBA in Marketing",
                military: "2010 - 2012 | Personnel officer",
                skills: "Digital marketing, Google Ads, Meta, analytics, content",
                languages: "Hebrew (native), English (advanced)",
                references: ""
            }
        },
        simple: {
            title: "אקספרס",
            titleHe: "אקספרס",
            titleEn: "ATS-Friendly",
            subHe: "יעל שמעוני · מורה",
            subEn: "Yael Shimony · Teacher",
            thumb: "lay-simple",
            layout: "classic",
            skin: "",
            accent: "#1c1917",
            font: "Heebo",
            bg: "bg-preview-white",
            field: "edu",
            preferredLang: "he",
            atsOptimized: true,
            supportsPhoto: false,
            category: "minimal",
            styleTags: ["minimal","professional"],
            he: {
                name: "יעל שמעוני",
                title: "מורה ללשון ולספרות",
                phone: "052-4412270",
                email: "yael.shimony@example.com",
                location: "רחובות",
                linkedin: "linkedin.com/in/yaelshimony",
                summary: "מורה עם ניסיון בהוראת לשון, בניית מערכים וליווי תלמידים. מסמך נקי שעובר סינון אוטומטי וגם נקרא היטב בעין.",
                experience: "2020 - נוכחי | תיכון גן רווה\nמורה ללשון ולספרות\n• בניית מערכי שיעור מותאמים והעלאת אחוזי הצלחה בבגרות.\n• ליווי מחנכת כיתה ושיתוף פעולה עם הורים וצוות מקצועי.\n\n2017 - 2020 | חטיבת ביניים אורט\nמורה לעברית\n• שילוב כלים דיגיטליים בהוראה ומעקב התקדמות אישי.",
                education: "2013 - 2017 | B.Ed. הוראת לשון\n2019 | תעודת הוראה לחטיבה עליונה",
                military: "2011 - 2013 | מש\"קית חינוך",
                skills: "הוראה, בניית מערכים, הנחיה, עבודת צוות, כלים דיגיטליים",
                languages: "עברית (שפת אם), אנגלית (גבוהה)",
                references: ""
            },
            en: {
                name: "Yael Shimony",
                title: "Hebrew Language Teacher",
                phone: "052-4412270",
                email: "yael.shimony@example.com",
                location: "Rehovot",
                linkedin: "linkedin.com/in/yaelshimony",
                summary: "Teacher experienced in language instruction, lesson design, and student support. A clean one-column resume that reads well for people and ATS scans.",
                experience: "2020 - Present | Gan Raveh High School\nLanguage and literature teacher\n• Designed lesson plans and raised matriculation pass rates.\n• Homeroom support and partnership with parents and staff.\n\n2017 - 2020 | Ort Middle School\nHebrew teacher\n• Used digital tools in class and tracked individual progress.",
                education: "2013 - 2017 | B.Ed. Language Education\n2019 | Upper-secondary teaching certificate",
                military: "2011 - 2013 | Education NCO",
                skills: "Teaching, lesson design, facilitation, teamwork, digital tools",
                languages: "Hebrew (native), English (advanced)",
                references: ""
            }
        },
        cobalt: {
            title: "פרופיל כחול",
            titleHe: "פרופיל כחול",
            titleEn: "Blue Profile",
            subHe: "דנה • מנהלת לקוחות",
            subEn: "Dana • Account Manager",
            thumb: "lay-cobalt",
            layout: "cobalt",
            skin: "",
            accent: "#2c4a7c",
            font: "Heebo",
            bg: "bg-preview-white",
            field: "sales",
            preferredLang: "he",
            atsOptimized: false,
            supportsPhoto: true,
            category: "modern",
            styleTags: ["professional","modern"],
            he: {
                name: "דנה אברהם",
                title: "מנהלת לקוחות B2B",
                phone: "052-7788012",
                email: "dana.avraham@example.com",
                location: "רעננה",
                linkedin: "linkedin.com/in/danaavraham",
                summary: "מנהלת לקוחות עם ניסיון בבניית קשרים ארוכי טווח, עמידה ביעדים והובלת תהליכי מכירה מול ארגונים.",
                experience: "2021 - נוכחי | Orbit Solutions\nמנהלת לקוחות B2B\n• ניהול תיק לקוחות אסטרטגיים והגדלת הכנסות חוזרות ב-27%.\n• בניית תהליך Onboarding והעלאת שימור לקוחות.\n\n2017 - 2021 | North Peak\nרכזת מכירות\n• ניהול משפך לידים וסגירת עסקאות מול לקוחות בינוניים.",
                education: "2013 - 2017 | המרכז האקדמי פרס\nBA במנהל עסקים\n2019 | קורס ניהול לקוחות — מכללת המי״ל",
                military: "2010 - 2012 | מש\"קית משאבי אנוש",
                skills: "ניהול לקוחות, CRM, מצגות, משא ומתן, Excel",
                languages: "עברית (שפת אם), אנגלית (שוטפת)",
                references: ""
            },
            en: {
                name: "Dana Avraham",
                title: "B2B Account Manager",
                phone: "052-7788012",
                email: "dana.avraham@example.com",
                location: "Ra'anana",
                linkedin: "linkedin.com/in/danaavraham",
                summary: "Account manager experienced in long-term relationships, quota attainment, and B2B sales processes.",
                experience: "2021 - Present | Orbit Solutions\nB2B Account Manager\n• Owned a strategic book of business and grew recurring revenue 27%.\n• Built onboarding playbooks and improved retention.\n\n2017 - 2021 | North Peak\nSales coordinator\n• Managed the lead funnel and closed mid-market deals.",
                education: "2013 - 2017 | Peres Academic Center\nBA in Business Administration\n2019 | Account management course — MIL",
                military: "2010 - 2012 | HR NCO",
                skills: "Account management, CRM, presentations, negotiation, Excel",
                languages: "Hebrew (native), English (fluent)",
                references: ""
            }
        }
    };

    var ORDER = ["premium","charcoal","emerald","simple","cobalt"];

    var TEMPLATE_ALIASES = {
        "midnight": "emerald",
        "navy": "emerald",
        "petra": "emerald",
        "dev-navy": "emerald",
        "ops-midnight": "emerald",
        "espresso": "charcoal",
        "sage": "charcoal",
        "slate": "charcoal",
        "wine": "charcoal",
        "forest": "charcoal",
        "product-slate": "charcoal",
        "consult-forest": "charcoal",
        "marketing-wine": "charcoal",
        "azure": "charcoal",
        "mint": "charcoal",
        "blush": "charcoal",
        "terracotta": "charcoal",
        "cream": "charcoal",
        "clinic": "charcoal",
        "europass": "charcoal",
        "sales-azure": "charcoal",
        "entry-mint": "charcoal",
        "hr-blush": "charcoal",
        "designer-terra": "charcoal",
        "sand": "charcoal",
        "split": "charcoal",
        "teal-sidebar": "charcoal",
        "creative-split": "charcoal",
        "sales": "charcoal",
        "tech": "charcoal",
        "marketing": "charcoal",
        "ink": "simple",
        "harvard": "simple",
        "compact": "simple",
        "intern": "simple",
        "academic": "simple",
        "pearl": "simple",
        "swiss": "simple",
        "ivory": "simple",
        "gold": "simple",
        "ink-exec": "simple",
        "student-modern": "simple",
        "entry-clean": "simple",
        "heebo-ats": "simple",
        "assistant-ats": "simple",
        "rubik-pro": "simple",
        "finance-ats": "simple",
        "legal-ats": "simple",
        "health-ats": "simple",
        "student-ats": "simple",
        "mgmt-ats": "simple",
        "nurse-clean": "simple",
        "grad-compact": "simple",
        "bank-gold": "simple"
    };

    function resolveTemplateId(id) {
        id = String(id || "").trim();
        if (TEMPLATE_ALIASES[id]) id = TEMPLATE_ALIASES[id];
        if (TEMPLATES[id]) return id;
        return ORDER[0] || "premium";
    }

    Object.keys(TEMPLATES).forEach(function (id) {
        var t = TEMPLATES[id];
        t.id = id;
        if (typeof t.atsOptimized !== "boolean") t.atsOptimized = id === "simple" || id === "premium";
        if (!t.category) {
            t.category = id === "simple" ? "minimal" : id === "premium" ? "management" : id === "emerald" ? "modern" : "management";
        }
        if (!t.styleTags) t.styleTags = t.atsOptimized ? ["minimal", "professional"] : ["professional"];
        if (!t.colorPalette) {
            t.colorPalette = { primary: t.accent || "#1c1917", secondary: t.accent || "#1c1917", text: "#1c1917", background: "#ffffff" };
        }
        if (!t.fontPairing) t.fontPairing = t.font || "Heebo";
        if (!t.layoutStyle) {
            t.layoutStyle = (t.layout === "sidebar" || t.layout === "charcoal" || t.layout === "navy" || t.layout === "premium" || t.layout === "cobalt")
                ? "two-column-left"
                : t.layout === "split" ? "two-column-right"
                : (t.layout === "azure" || t.layout === "executive" || t.layout === "modern") ? "header-accent"
                : "single-column";
        }
        if (typeof t.supportsPhoto !== "boolean") {
            t.supportsPhoto = t.layout === "premium" || t.layout === "navy" || t.layout === "cobalt";
        }
    });

    global.QCTemplates = TEMPLATES;
    global.QCTemplateOrder = ORDER;
    global.QCTemplateAliases = TEMPLATE_ALIASES;
    global.QCResolveTemplateId = resolveTemplateId;
})(window);
