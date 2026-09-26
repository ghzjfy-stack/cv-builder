/** QuickCV Canva-style template library — source of truth for QCTemplates */

export type TemplateCategory =
  | "hi-tech"
  | "management"
  | "creative"
  | "students"
  | "entry"
  | "academic"
  | "sales"
  | "healthcare"
  | "finance"
  | "minimal"
  | "modern";

export type StyleTag =
  | "minimal"
  | "colorful"
  | "professional"
  | "creative"
  | "executive"
  | "modern";

export type LayoutStyle =
  | "classic"
  | "sidebar"
  | "split"
  | "minimal"
  | "executive"
  | "modern"
  | "compact"
  | "charcoal"
  | "azure"
  | "navy"
  | "banner";

export type SamplePack = {
  name: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  summary: string;
  experience: string;
  education: string;
  military: string;
  skills: string;
  languages: string;
  references?: string;
};

export type ColorPalette = {
  primary: string;
  secondary: string;
  text: string;
  background: string;
};

export type CvTemplate = {
  id: string;
  name: string;
  title: string;
  titleHe: string;
  titleEn: string;
  subHe: string;
  subEn: string;
  category: TemplateCategory;
  categories?: TemplateCategory[];
  styleTags: StyleTag[];
  layout: LayoutStyle;
  /** structural hint for UI copy */
  layoutStyle: "single-column" | "two-column-left" | "two-column-right" | "header-accent";
  colorPalette: ColorPalette;
  fontPairing: string;
  font: string;
  accent: string;
  skin: string;
  bg: string;
  thumb: string;
  field: string;
  preferredLang: "he" | "en";
  atsOptimized: boolean;
  he: SamplePack;
  en: SamplePack;
};

type Seed = {
  id: string;
  titleHe: string;
  titleEn: string;
  category: TemplateCategory;
  styleTags: StyleTag[];
  layout: LayoutStyle;
  layoutStyle: CvTemplate["layoutStyle"];
  accent: string;
  secondary?: string;
  text?: string;
  background?: string;
  font: string;
  skin?: string;
  bg?: string;
  thumb: string;
  field: string;
  preferredLang?: "he" | "en";
  atsOptimized: boolean;
  pack: "tech" | "sales" | "mgmt" | "creative" | "student" | "entry" | "academic" | "cs" | "finance" | "health" | "ops" | "legal";
  categories?: TemplateCategory[];
  subHe: string;
  subEn: string;
};

const PACKS: Record<Seed["pack"], { he: SamplePack; en: SamplePack }> = {
  tech: {
    he: {
      name: "אלון כץ",
      title: "מפתח Full-Stack",
      phone: "050-1122334",
      email: "alon.katz@example.com",
      location: "תל אביב",
      linkedin: "linkedin.com/in/alonkatz",
      summary: "מפתח Full-Stack עם כתיבה נקייה, בדיקות וארכיטקטורה פשוטה. מתאים להגשה במערכות גיוס ובדיקת עיניים.",
      experience:
        "2022 - נוכחי | Helix Systems\nמפתח Full-Stack\n• פיתוח שירותי Backend ב-Go ו-PostgreSQL.\n• הפחתת תקלות ייצור באמצעות בדיקות וניטור.\n\n2019 - 2022 | Pixel Forge\nמפתח\n• תחזוקת קוד קיים והעברת מודולים לשירותים.",
      education: "2015 - 2019 | אוניברסיטת בן-גוריון\nB.Sc הנדסת תוכנה",
      military: "2012 - 2015 | מפתח ביחידת מודיעין",
      skills: "Go, PostgreSQL, Docker, Git, בדיקות",
      languages: "עברית (שפת אם), אנגלית (טכנית)",
    },
    en: {
      name: "Alon Katz",
      title: "Full-Stack Developer",
      phone: "050-1122334",
      email: "alon.katz@example.com",
      location: "Tel Aviv",
      linkedin: "linkedin.com/in/alonkatz",
      summary: "Software engineer focused on clean code, tests, and simple architecture.",
      experience:
        "2022 - Present | Helix Systems\nSoftware Engineer\n• Built backend services in Go and PostgreSQL.\n• Reduced production incidents with tests and monitoring.\n\n2019 - 2022 | Pixel Forge\nDeveloper\n• Maintained legacy code and extracted services.",
      education: "2015 - 2019 | Ben-Gurion University\nB.Sc. Software Engineering",
      military: "2012 - 2015 | Intelligence-unit developer",
      skills: "Go, PostgreSQL, Docker, Git, testing",
      languages: "Hebrew (native), English (technical)",
    },
  },
  sales: {
    he: {
      name: "נועה כהן",
      title: "מנהלת מכירות ארצית",
      phone: "052-5550188",
      email: "noa.cohen@example.com",
      location: "הרצליה",
      linkedin: "linkedin.com/in/noacohen",
      summary: "מנהלת מכירות עם 8 שנות ניסיון בהובלת צוותים, בניית משפך מכירות והגדלת מחזור.",
      experience:
        "2021 - נוכחי | Verde Commerce\nמנהלת מכירות ארצית\n• הגדלת מחזור שנתי ב-35% תוך בניית צוות של 12 נציגים.\n• הטמעת CRM ומעקב KPI שבועי.\n\n2018 - 2021 | Shoreline B2B\nמנהלת לקוחות עסקיים\n• סגירת עסקאות מורכבות ושימור לקוחות אסטרטגיים.",
      education: "2014 - 2017 | המרכז הבינתחומי\nBA במנהל עסקים",
      military: "2011 - 2013 | קצינת הדרכה",
      skills: "ניהול צוותים, CRM, משא ומתן, Excel, יעדי מכירות",
      languages: "עברית (שפת אם), אנגלית (שוטפת)",
    },
    en: {
      name: "Noa Cohen",
      title: "National Sales Manager",
      phone: "052-5550188",
      email: "noa.cohen@example.com",
      location: "Herzliya",
      linkedin: "linkedin.com/in/noacohen",
      summary: "Sales manager with 8 years leading teams, pipelines, and revenue growth.",
      experience:
        "2021 - Present | Verde Commerce\nNational Sales Manager\n• Grew annual revenue 35% while building a team of 12.\n• Rolled out CRM and weekly KPI reviews.\n\n2018 - 2021 | Shoreline B2B\nAccount Manager\n• Closed complex deals and retained strategic clients.",
      education: "2014 - 2017 | Reichman University\nBA in Business Administration",
      military: "2011 - 2013 | Training officer",
      skills: "Team leadership, CRM, negotiation, Excel, sales targets",
      languages: "Hebrew (native), English (fluent)",
    },
  },
  mgmt: {
    he: {
      name: "רועי נחום",
      title: "מנהל תפעול",
      phone: "054-3311220",
      email: "roy.nahum@example.com",
      location: "פתח תקווה",
      linkedin: "linkedin.com/in/roynahum",
      summary: "מנהל תפעול עם ניסיון בשרשרת אספקה, SLA וצוותים בשטח.",
      experience:
        "2019 - נוכחי | LogiPath\nמנהל תפעול\n• שיפור עמידה ב-SLA מ-82% ל-96% תוך שנה.\n• ניהול 40 עובדים בשלושה אתרים.\n\n2015 - 2019 | Retail Hub\nמנהל לוגיסטיקה\n• תכנון מלאי וספקים לחברה קמעונאית.",
      education: "2011 - 2015 | המכללה האקדמית ספיר\nBA בלוגיסטיקה",
      military: "2008 - 2011 | קצין לוגיסטיקה",
      skills: "SLA, שרשרת אספקה, ניהול אתרים, Excel, תכנון כוח אדם",
      languages: "עברית (שפת אם), אנגלית (מקצועית)",
    },
    en: {
      name: "Roy Nahum",
      title: "Operations Director",
      phone: "054-3311220",
      email: "roy.nahum@example.com",
      location: "Petah Tikva",
      linkedin: "linkedin.com/in/roynahum",
      summary: "Operations leader with supply-chain, SLA, and field-team experience.",
      experience:
        "2019 - Present | LogiPath\nOperations Director\n• Lifted SLA from 82% to 96% within a year.\n• Led 40 people across three sites.\n\n2015 - 2019 | Retail Hub\nLogistics Manager\n• Inventory and vendor planning for a retail company.",
      education: "2011 - 2015 | Sapir Academic College\nBA in Logistics",
      military: "2008 - 2011 | Logistics officer",
      skills: "SLA, supply chain, site management, Excel, workforce planning",
      languages: "Hebrew (native), English (professional)",
    },
  },
  creative: {
    he: {
      name: "ליאור חדד",
      title: "מעצבת UX / UI",
      phone: "050-9988771",
      email: "lior.hadad@example.com",
      location: "תל אביב",
      linkedin: "linkedin.com/in/liorhadad",
      summary: "מעצבת מוצר עם דגש על מחקר, מערכות עיצוב ומסכים נקיים להגשה מקצועית.",
      experience:
        "2021 - נוכחי | Nimbus Studio\nמעצבת UX\n• עיצוב מסכי ליבה למוצר B2B והעלאת השלמת משימה ב-22%.\n• בניית Design System משותף עם הפיתוח.\n\n2018 - 2021 | Brightline\nמעצבת UI\n• דשבורדים, מצגות לקוח וספריית קומפוננטות.",
      education: "2014 - 2018 | שנקר\nB.Des עיצוב תקשורת חזותית",
      military: "2011 - 2013 | מעצבת גרפית ביחידה",
      skills: "Figma, מחקר משתמשים, Design Systems, פרוטוטייפ, הנגשה",
      languages: "עברית (שפת אם), אנגלית (גבוהה)",
    },
    en: {
      name: "Lior Hadad",
      title: "UX / UI Designer",
      phone: "050-9988771",
      email: "lior.hadad@example.com",
      location: "Tel Aviv",
      linkedin: "linkedin.com/in/liorhadad",
      summary: "Product designer focused on research, design systems, and clean delivery.",
      experience:
        "2021 - Present | Nimbus Studio\nUX Designer\n• Designed core B2B flows and lifted task completion 22%.\n• Built a shared design system with engineering.\n\n2018 - 2021 | Brightline\nUI Designer\n• Dashboards, client decks, and a component library.",
      education: "2014 - 2018 | Shenkar\nB.Des Visual Communication",
      military: "2011 - 2013 | Unit graphic designer",
      skills: "Figma, user research, design systems, prototyping, accessibility",
      languages: "Hebrew (native), English (advanced)",
    },
  },
  student: {
    he: {
      name: "מאיה רוזן",
      title: "סטודנטית למדעי המחשב · מחפשת התמחות",
      phone: "050-6677881",
      email: "maya.rosen@example.com",
      location: "ראשון לציון",
      linkedin: "linkedin.com/in/mayarosen",
      summary: "סטודנטית שנה ג' עם פרויקטי קורס, האקאתון וניסיון ראשון בפיתוח במשרה חלקית.",
      experience:
        "2024 - נוכחי | Campus Labs\nמתמחה פיתוח (חלקי)\n• בניית דפי פנימיים ב-React ותיקוני באגים בליווי מנטור.\n• כתיבת בדיקות בסיסיות ותיעוד.\n\n2023 | האקאתון Technion\nמשתתפת\n• אב-טיפוס לכלי סיכום שיעורים ב-48 שעות.",
      education: "2022 - נוכחי | אוניברסיטת תל אביב\nB.Sc מדעי המחשב (שנה ג')",
      military: "2019 - 2021 | מש\"קית תקשוב",
      skills: "JavaScript, Python, Git, HTML/CSS, עבודת צוות",
      languages: "עברית (שפת אם), אנגלית (גבוהה)",
    },
    en: {
      name: "Maya Rosen",
      title: "Computer Science student · Seeking internship",
      phone: "050-6677881",
      email: "maya.rosen@example.com",
      location: "Rishon LeZion",
      linkedin: "linkedin.com/in/mayarosen",
      summary: "Third-year student with course projects, a hackathon, and part-time development experience.",
      experience:
        "2024 - Present | Campus Labs\nSoftware intern (part-time)\n• Built internal React pages and fixed bugs with a mentor.\n• Wrote basic tests and documentation.\n\n2023 | Technion Hackathon\nParticipant\n• Prototype for a lecture-summary tool in 48 hours.",
      education: "2022 - Present | Tel Aviv University\nB.Sc. Computer Science (year 3)",
      military: "2019 - 2021 | Communications NCO",
      skills: "JavaScript, Python, Git, HTML/CSS, teamwork",
      languages: "Hebrew (native), English (advanced)",
    },
  },
  entry: {
    he: {
      name: "יואב שמש",
      title: "נציג שירות לקוחות",
      phone: "053-4411220",
      email: "yoav.shemesh@example.com",
      location: "אשדוד",
      linkedin: "linkedin.com/in/yoavshemesh",
      summary: "נציג שירות עם אוריינטציה ללקוח, עבודה תחת לחץ ולמידה מהירה — מתאים למשרת כניסה.",
      experience:
        "2024 - נוכחי | Softline Retail\nנציג שירות\n• טיפול ב-40 פניות ביום ושמירה על CSAT גבוה.\n• תיעוד תקלות והעברה מסודרת לצוות הטכני.\n\n2023 | קמעונאות מקומית\nמוכר\n• שירות פנים אל פנים ומכירה משלימה.",
      education: "2021 - 2024 | מכללת אשקלון\nלימודי תעודה בניהול",
      military: "2018 - 2021 | מש\"ק שלישות",
      skills: "שירות לקוחות, CRM, תקשורת, Excel בסיסי, עבודת צוות",
      languages: "עברית (שפת אם), אנגלית (בינונית)",
    },
    en: {
      name: "Yoav Shemesh",
      title: "Customer Service Representative",
      phone: "053-4411220",
      email: "yoav.shemesh@example.com",
      location: "Ashdod",
      linkedin: "linkedin.com/in/yoavshemesh",
      summary: "Service-minded representative with calm under pressure — built for entry-level roles.",
      experience:
        "2024 - Present | Softline Retail\nService representative\n• Handled 40 tickets a day with strong CSAT.\n• Documented issues and handed off cleanly to tech.\n\n2023 | Local retail\nSales associate\n• In-person service and add-on sales.",
      education: "2021 - 2024 | Ashkelon College\nManagement certificate",
      military: "2018 - 2021 | Personnel NCO",
      skills: "Customer service, CRM, communication, basic Excel, teamwork",
      languages: "Hebrew (native), English (intermediate)",
    },
  },
  academic: {
    he: {
      name: "ד\"ר עדי נחום",
      title: "חוקרת · מדעי החברה",
      phone: "052-3304411",
      email: "adi.nahum@example.com",
      location: "ירושלים",
      linkedin: "linkedin.com/in/adinahum",
      summary: "חוקרת עם ניסיון בהוראה אקדמית, פרסומים שפיטים וניהול מענק מחקר.",
      experience:
        "2021 - נוכחי | האוניברסיטה העברית\nעמיתת מחקר והוראה\n• הוראת שני קורסי מבוא והנחיית סמינר תואר ראשון.\n• פרסום שני מאמרים שפיטים וניהול מענק פנימי.\n\n2018 - 2021 | אוניברסיטת בן-גוריון\nדוקטורנטית\n• מחקר כמותי, איסוף נתונים וכתיבה אקדמית.",
      education: "2018 - 2021 | אוניברסיטת בן-גוריון\nPh.D. מדעי החברה\n2015 - 2018 | האוניברסיטה העברית\nM.A. סוציולוגיה",
      military: "2010 - 2012 | קצינת הדרכה",
      skills: "הוראה, מחקר כמותי, כתיבה אקדמית, SPSS, הנחיית סטודנטים",
      languages: "עברית (שפת אם), אנגלית אקדמית",
    },
    en: {
      name: "Dr. Adi Nahum",
      title: "Researcher · Social Sciences",
      phone: "052-3304411",
      email: "adi.nahum@example.com",
      location: "Jerusalem",
      linkedin: "linkedin.com/in/adinahum",
      summary: "Researcher with teaching, peer-reviewed publications, and grant management.",
      experience:
        "2021 - Present | Hebrew University\nResearch and teaching fellow\n• Taught two intro courses and advised an undergraduate seminar.\n• Published two peer-reviewed papers and managed an internal grant.\n\n2018 - 2021 | Ben-Gurion University\nPh.D. candidate\n• Quantitative research, data collection, and academic writing.",
      education: "2018 - 2021 | Ben-Gurion University\nPh.D. Social Sciences\n2015 - 2018 | Hebrew University\nM.A. Sociology",
      military: "2010 - 2012 | Training officer",
      skills: "Teaching, quantitative research, academic writing, SPSS, student advising",
      languages: "Hebrew (native), academic English",
    },
  },
  cs: {
    he: {
      name: "עומר חדד",
      title: "מנהל הצלחת לקוח",
      phone: "054-2201188",
      email: "omer.hadad@example.com",
      location: "גבעתיים",
      linkedin: "linkedin.com/in/omerhadad",
      summary: "מנהל הצלחת לקוח עם דגש על שימור, הרחבת חשבון וטיפול בפניות מורכבות ב-SaaS.",
      experience:
        "2021 - נוכחי | Folia Cloud\nמנהל הצלחת לקוח\n• שימור 96% בתיק של 40 חשבונות והרחבת ARR ב-18%.\n• בניית תהליך קליטה ומעקב SLA מול התמיכה.\n\n2018 - 2021 | Helpdesk Pro\nנציג בכיר\n• טיפול בפניות מורכבות והדרכת נציגים חדשים.",
      education: "2014 - 2018 | האוניברסיטה הפתוחה\nBA בניהול",
      military: "2011 - 2014 | מש\"ק שלישות",
      skills: "הצלחת לקוח, CRM, SLA, תקשורת בינאישית, Zendesk",
      languages: "עברית (שפת אם), אנגלית (שוטפת)",
    },
    en: {
      name: "Omer Hadad",
      title: "Customer Success Manager",
      phone: "054-2201188",
      email: "omer.hadad@example.com",
      location: "Givatayim",
      linkedin: "linkedin.com/in/omerhadad",
      summary: "Customer success manager focused on retention and complex SaaS support.",
      experience:
        "2021 - Present | Folia Cloud\nCustomer Success Manager\n• Held 96% retention across 40 accounts and grew ARR 18%.\n• Built onboarding and SLA tracking with support.\n\n2018 - 2021 | Helpdesk Pro\nSenior support specialist\n• Handled complex tickets and trained new agents.",
      education: "2014 - 2018 | Open University\nBA in Management",
      military: "2011 - 2014 | Personnel NCO",
      skills: "Customer success, CRM, SLA, communication, Zendesk",
      languages: "Hebrew (native), English (fluent)",
    },
  },
  finance: {
    he: {
      name: "תמר אברהם",
      title: "מנהלת כספים",
      phone: "053-2203344",
      email: "tamar.a@example.com",
      location: "רמת גן",
      linkedin: "linkedin.com/in/tamarabraham",
      summary: "מנהלת כספים עם ניסיון בתקציב, בקרה ודוחות להנהלה בחברות צומחות.",
      experience:
        "2020 - נוכחי | Northwind Finance\nמנהלת כספים\n• בניית תקציב שנתי ומעקב שוטף מול יחידות העסק.\n• שיפור תזרים ודיווח ברור לדירקטוריון.\n\n2016 - 2020 | Apex Holdings\nחשבת\n• סגירות חודשיות, ספקים ומשכורות.",
      education: "2012 - 2016 | המכללה למנהל\nBA בכלכלה וחשבונאות",
      military: "2009 - 2011 | פקידת שלישות",
      skills: "Excel מתקדם, תקציב, בקרה, SAP, דוחות הנהלה",
      languages: "עברית (שפת אם), אנגלית (מקצועית)",
    },
    en: {
      name: "Tamar Abraham",
      title: "Finance Manager",
      phone: "053-2203344",
      email: "tamar.a@example.com",
      location: "Ramat Gan",
      linkedin: "linkedin.com/in/tamarabraham",
      summary: "Finance manager with budgeting, controls, and leadership reporting.",
      experience:
        "2020 - Present | Northwind Finance\nFinance Manager\n• Built the annual budget and tracked units against plan.\n• Improved cash flow and board reporting.\n\n2016 - 2020 | Apex Holdings\nAccountant\n• Month-end close, vendors, and payroll.",
      education: "2012 - 2016 | College of Management\nBA in Economics and Accounting",
      military: "2009 - 2011 | Personnel clerk",
      skills: "Advanced Excel, budgeting, controls, SAP, board reporting",
      languages: "Hebrew (native), English (professional)",
    },
  },
  health: {
    he: {
      name: "יעל מזרחי",
      title: "אחות מוסמכת · מחלקה פנימית",
      phone: "052-3344556",
      email: "yael.mizrahi@example.com",
      location: "פתח תקווה",
      linkedin: "linkedin.com/in/yaelmizrahi",
      summary: "אחות מוסמכת עם ניסיון במחלקה פנימית, תיעוד קליני וליווי מטופלים.",
      experience:
        "2020 - נוכחי | בית חולים בילינסון\nאחות מוסמכת\n• טיפול ב-12–14 מטופלים במשמרת ותיעוד מדויק ב-EMR.\n• הדרכת מטופלים ומשפחות לשחרור בטוח.\n\n2017 - 2020 | קופת חולים כללית\nאחות בקהילה\n• חיסונים, מעקב כרוני ותיאום עם רופאי משפחה.",
      education: "2013 - 2017 | אוניברסיטת תל אביב\nB.S.N סיעוד",
      military: "2010 - 2012 | חובשת",
      skills: "סיעוד, EMR, ACLS, תקשורת עם מטופלים, עבודת צוות",
      languages: "עברית (שפת אם), אנגלית (מקצועית), ערבית (בסיסית)",
    },
    en: {
      name: "Yael Mizrahi",
      title: "Registered Nurse · Internal Medicine",
      phone: "052-3344556",
      email: "yael.mizrahi@example.com",
      location: "Petah Tikva",
      linkedin: "linkedin.com/in/yaelmizrahi",
      summary: "Registered nurse with internal-medicine and patient-education experience.",
      experience:
        "2020 - Present | Beilinson Hospital\nRegistered Nurse\n• Cared for 12–14 patients per shift with accurate EMR notes.\n• Educated patients and families for safe discharge.\n\n2017 - 2020 | Clalit Health Services\nCommunity nurse\n• Vaccinations, chronic follow-up, and coordination with family doctors.",
      education: "2013 - 2017 | Tel Aviv University\nB.S.N. Nursing",
      military: "2010 - 2012 | Combat medic",
      skills: "Nursing, EMR, ACLS, patient communication, teamwork",
      languages: "Hebrew (native), English (professional), Arabic (basic)",
    },
  },
  ops: {
    he: {
      name: "אלון מזרחי",
      title: "סמנכ\"ל תפעול",
      phone: "054-2203344",
      email: "alon.mizrahi@example.com",
      location: "הרצליה",
      linkedin: "linkedin.com/in/alonmizrahi",
      summary: "מנהל תפעול עם ניסיון בהובלת צמיחה, ייעול תהליכים ודיווח להנהלה.",
      experience:
        "2019 - נוכחי | Apex Operations\nסמנכ\"ל תפעול\n• בניית תוכנית תפעול שנתית והורדת עלות יחידה ב-14%.\n• ניהול 90 עובדים בשלושה אתרים.\n\n2015 - 2019 | Harbor Group\nמנהל תפעול\n• שיפור SLA, מלאי וקשרי ספקים.",
      education: "2011 - 2015 | אוניברסיטת תל אביב\nMBA\n2007 - 2011 | הטכניון\nB.Sc הנדסת תעשייה",
      military: "2004 - 2007 | קצין לוגיסטיקה",
      skills: "P&L, KPI, שרשרת אספקה, ניהול אתרים, דיווח דירקטוריון",
      languages: "עברית (שפת אם), אנגלית (שוטפת)",
    },
    en: {
      name: "Alon Mizrahi",
      title: "VP of Operations",
      phone: "054-2203344",
      email: "alon.mizrahi@example.com",
      location: "Herzliya",
      linkedin: "linkedin.com/in/alonmizrahi",
      summary: "Operations executive focused on growth, process discipline, and board-ready reporting.",
      experience:
        "2019 - Present | Apex Operations\nVP of Operations\n• Built the annual operating plan and cut unit cost 14%.\n• Led 90 people across three sites.\n\n2015 - 2019 | Harbor Group\nOperations Director\n• Improved SLA, inventory, and vendor relationships.",
      education: "2011 - 2015 | Tel Aviv University\nMBA\n2007 - 2011 | Technion\nB.Sc. Industrial Engineering",
      military: "2004 - 2007 | Logistics officer",
      skills: "P&L, KPIs, supply chain, site leadership, board reporting",
      languages: "Hebrew (native), English (fluent)",
    },
  },
  legal: {
    he: {
      name: "קרן אזולאי",
      title: "עורכת דין מסחרי",
      phone: "050-3344556",
      email: "keren.azulay@example.com",
      location: "תל אביב",
      linkedin: "linkedin.com/in/kerenazulay",
      summary: "עורכת דין מסחרי עם ניסיון בחוזים, ליווי עסקאות ומשא ומתן.",
      experience:
        "2018 - נוכחי | משרד אזולאי ושות'\nעורכת דין\n• ליווי עסקאות רכישה וניסוח הסכמים מסחריים.\n• משא ומתן מול ספקים ולקוחות אסטרטגיים.\n\n2015 - 2018 | משרד גולן\nמתמחה ועורכת דין זוטרה\n• מחקר משפטי וליווי התדיינויות.",
      education: "2011 - 2015 | אוניברסיטת תל אביב\nLL.B משפטים",
      military: "2008 - 2010 | קצינת שלישות",
      skills: "חוזים, עסקאות, מחקר משפטי, משא ומתן, עברית משפטית",
      languages: "עברית (שפת אם), אנגלית משפטית",
    },
    en: {
      name: "Keren Azulay",
      title: "Commercial Attorney",
      phone: "050-3344556",
      email: "keren.azulay@example.com",
      location: "Tel Aviv",
      linkedin: "linkedin.com/in/kerenazulay",
      summary: "Commercial attorney with contracts, deal support, and negotiation experience.",
      experience:
        "2018 - Present | Azulay & Co.\nAssociate\n• Supported acquisitions and drafted commercial agreements.\n• Negotiated with vendors and strategic clients.\n\n2015 - 2018 | Golan Law\nIntern and junior attorney\n• Legal research and litigation support.",
      education: "2011 - 2015 | Tel Aviv University\nLL.B. Law",
      military: "2008 - 2010 | Personnel officer",
      skills: "Contracts, deals, legal research, negotiation, legal Hebrew",
      languages: "Hebrew (native), legal English",
    },
  },
};

const SEEDS: Seed[] = [
  { id: "lagoon", titleHe: "לגונה", titleEn: "Lagoon", category: "creative", styleTags: ["colorful", "modern"], layout: "banner", layoutStyle: "header-accent", accent: "#0e3b3a", skin: "lagoon", font: "Heebo", thumb: "lay-lagoon", field: "marketing", atsOptimized: true, pack: "creative", subHe: "מאיה • שיווק דיגיטלי", subEn: "Maya • Digital Marketing" },
  { id: "plum", titleHe: "שזיף", titleEn: "Plum", category: "creative", styleTags: ["creative", "colorful"], layout: "banner", layoutStyle: "header-accent", accent: "#4a2158", skin: "plum", font: "Assistant", thumb: "lay-plum", field: "marketing", atsOptimized: false, pack: "creative", subHe: "שירה • עיצוב ומיתוג", subEn: "Shira • Brand Design" },
  { id: "noir", titleHe: "פוסטר", titleEn: "Poster", category: "management", styleTags: ["executive", "modern"], layout: "banner", layoutStyle: "header-accent", accent: "#141414", skin: "noir", font: "Frank Ruhl Libre", thumb: "lay-noir", field: "ops", atsOptimized: false, pack: "mgmt", subHe: "יונתן • ניהול", subEn: "Yonatan • Leadership" },
  { id: "coral", titleHe: "קורל", titleEn: "Coral", category: "creative", styleTags: ["colorful", "creative"], layout: "banner", layoutStyle: "header-accent", accent: "#9c3d2e", skin: "coral", font: "Heebo", thumb: "lay-coral", field: "marketing", atsOptimized: false, pack: "creative", subHe: "הילה • מיתוג", subEn: "Hila • Brand" },
  { id: "indigo", titleHe: "אינדיגו", titleEn: "Indigo", category: "hi-tech", categories: ["students"], styleTags: ["modern", "professional"], layout: "banner", layoutStyle: "header-accent", accent: "#1c2f6e", skin: "indigo", font: "Rubik", thumb: "lay-indigo", field: "tech", atsOptimized: true, pack: "tech", subHe: "דניאל • פיתוח", subEn: "Daniel • Engineering" },
  { id: "emerald", titleHe: "מודרנית עם תמונה", titleEn: "Modern with Photo", category: "management", styleTags: ["colorful", "professional"], layout: "navy", layoutStyle: "two-column-left", accent: "#31443b", skin: "emerald", font: "Montserrat", thumb: "lay-emerald", field: "ops", atsOptimized: false, pack: "mgmt", subHe: "נועה • שיווק ודיגיטל", subEn: "Noa • Marketing & Digital" },
  { id: "midnight", titleHe: "ניהול בכיר", titleEn: "Senior Management", category: "management", styleTags: ["executive", "professional"], layout: "navy", layoutStyle: "two-column-left", accent: "#12192b", skin: "midnight", font: "Montserrat", thumb: "lay-midnight", field: "ops", preferredLang: "en", atsOptimized: false, pack: "ops", subHe: "אלון • סמנכ״ל תפעול", subEn: "Alon • VP Operations" },
  { id: "charcoal", titleHe: "קלאסית נקייה", titleEn: "Clean Classic", category: "management", styleTags: ["professional", "executive"], layout: "charcoal", layoutStyle: "two-column-left", accent: "#4c4c4c", font: "Lato", thumb: "lay-charcoal", field: "marketing", preferredLang: "en", atsOptimized: false, pack: "sales", subHe: "רועי • מנהל מוצר", subEn: "Roy • Product Manager" },
  { id: "navy", titleHe: "עסקי ורשמי", titleEn: "Business Formal", category: "finance", styleTags: ["professional", "executive"], layout: "navy", layoutStyle: "two-column-left", accent: "#12192b", font: "Montserrat", thumb: "lay-navy", field: "sales", atsOptimized: false, pack: "finance", subHe: "תמר • מנהלת כספים", subEn: "Tamar • Finance Manager" },
  { id: "espresso", titleHe: "ניהול מוצר", titleEn: "Product", category: "hi-tech", styleTags: ["professional", "creative"], layout: "charcoal", layoutStyle: "two-column-left", accent: "#3e342c", skin: "espresso", font: "Lato", bg: "bg-preview-cream", thumb: "lay-espresso", field: "tech", atsOptimized: false, pack: "tech", subHe: "עמית • מנהל מוצר", subEn: "Amit • Product Manager" },
  { id: "sage", titleHe: "מכירות", titleEn: "Sales", category: "sales", styleTags: ["professional", "colorful"], layout: "charcoal", layoutStyle: "two-column-left", accent: "#4d5d52", skin: "sage", font: "Lato", bg: "bg-preview-linen", thumb: "lay-sage", field: "sales", atsOptimized: false, pack: "sales", subHe: "נועה • מנהלת מכירות", subEn: "Noa • Sales Manager" },
  { id: "slate", titleHe: "מפתח Full-Stack", titleEn: "Full-Stack", category: "hi-tech", styleTags: ["modern", "professional"], layout: "charcoal", layoutStyle: "two-column-left", accent: "#3e4c58", skin: "slate", font: "IBM Plex Sans Hebrew", thumb: "lay-slate", field: "tech", atsOptimized: false, pack: "tech", subHe: "דניאל • מפתח Full-Stack", subEn: "Daniel • Full-Stack Developer" },
  { id: "wine", titleHe: "שיווק דיגיטלי", titleEn: "Digital Marketing", category: "creative", styleTags: ["colorful", "creative"], layout: "charcoal", layoutStyle: "two-column-left", accent: "#5a3640", skin: "wine", font: "Heebo", bg: "bg-preview-cream", thumb: "lay-wine", field: "marketing", atsOptimized: false, pack: "creative", subHe: "מאיה • מנהלת שיווק דיגיטלי", subEn: "Maya • Digital Marketing" },
  { id: "forest", titleHe: "ייעוץ ארגוני", titleEn: "Consulting", category: "management", styleTags: ["professional", "colorful"], layout: "charcoal", layoutStyle: "two-column-left", accent: "#31443b", skin: "forest", font: "Lato", bg: "bg-preview-linen", thumb: "lay-forest", field: "sales", atsOptimized: false, pack: "mgmt", subHe: "יונתן • יועץ ארגוני", subEn: "Yonatan • Consultant" },
];

function buildTemplate(seed: Seed): CvTemplate {
  const packs = PACKS[seed.pack];
  const secondary = seed.secondary || seed.accent;
  return {
    id: seed.id,
    name: seed.titleHe,
    title: seed.titleHe,
    titleHe: seed.titleHe,
    titleEn: seed.titleEn,
    subHe: seed.subHe,
    subEn: seed.subEn,
    category: seed.category,
    styleTags: seed.styleTags,
    layout: seed.layout,
    layoutStyle: seed.layoutStyle,
    colorPalette: {
      primary: seed.accent,
      secondary,
      text: seed.text || "#1c1917",
      background: seed.background || "#ffffff",
    },
    fontPairing: seed.font,
    font: seed.font,
    accent: seed.accent,
    skin: seed.skin || "",
    bg: seed.bg || "bg-preview-white",
    thumb: seed.thumb,
    field: seed.field,
    preferredLang: seed.preferredLang || "he",
    atsOptimized: seed.atsOptimized,
    categories: seed.categories,
    he: packs.he,
    en: packs.en,
  };
}

export const TEMPLATE_LIST: CvTemplate[] = SEEDS.map(buildTemplate);

export const TEMPLATES: Record<string, CvTemplate> = Object.fromEntries(
  TEMPLATE_LIST.map((t) => [t.id, t])
);

export const TEMPLATE_ORDER: string[] = TEMPLATE_LIST.map((t) => t.id);

export const CATEGORY_FILTERS = [
  { id: "all", labelHe: "הכל", labelEn: "All" },
  { id: "hi-tech", labelHe: "הייטק", labelEn: "High-Tech" },
  { id: "management", labelHe: "ניהול", labelEn: "Management" },
  { id: "creative", labelHe: "יצירתי", labelEn: "Creative" },
  { id: "students", labelHe: "סטודנטים", labelEn: "Students" },
  { id: "ats", labelHe: "ATS", labelEn: "ATS-Friendly" },
] as const;

export const STYLE_FILTERS = [
  { id: "minimal", labelHe: "נקי ומינימליסטי", labelEn: "Minimal" },
  { id: "colorful", labelHe: "צבעוני", labelEn: "Colorful" },
  { id: "professional", labelHe: "מקצועי", labelEn: "Professional" },
  { id: "ats", labelHe: "ATS", labelEn: "ATS" },
] as const;

export const ATS_TOOLTIP_HE =
  "מערכות ATS הן תוכנות סינון של מגייסים. התבניות האלה בנויות במבנה ברור, כדי שהפרטים שלכם ייקראו כמו שצריך גם במערכת וגם בעין.";

export function registerQcTemplates(globalObj: Window & typeof globalThis = window): void {
  const g = globalObj as Window & {
    QCTemplates?: Record<string, CvTemplate>;
    QCTemplateOrder?: string[];
  };
  g.QCTemplates = TEMPLATES;
  g.QCTemplateOrder = TEMPLATE_ORDER;
}
