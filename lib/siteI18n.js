/**
 * Site-wide chrome i18n (home, pay modal, SEO shell, misc UI).
 * Merges into window.CV_I18N and applies by element id / data-i18n-ui.
 */
(function (global) {
    var EXTRA = {
        he: {
            pageTitle: 'QuickCV - מחולל קורות חיים',
            pageDescription: 'מחולל קורות חיים בעברית: תבניות מוכנות, תצוגה חיה, והורדת PDF אחרי תשלום ב-Bit.',
            skipLink: 'דלג לתוכן',
            homeTitle: 'קורות חיים מקצועיים שפותחים דלתות',
            homeSubhead: 'קורות חיים מותאמים למערכות סינון (ATS) • עיצוב נקי ומקצועי',
            homeLead: 'ממלאים פרטים, בוחרים עיצוב נקי ומורידים קובץ PDF מוכן להגשה. תשלום חד-פעמי של 10 ₪ בלבד – ללא הרשמה וללא מנוי מוסתר.',
            homeCta: 'התחילו עכשיו — 10 ₪',
            homeSeoNav: 'תבניות לפי תחום',
            seoCatHitech: 'הייטק',
            seoCatSales: 'מכירות',
            seoCatStudents: 'סטודנטים',
            seoCatCs: 'שירות לקוחות',
            homePaperBadge: 'פורמט ATS מאושר',
            band1Title: 'עברית ואנגלית',
            band1Body: 'פריסה מיושרת לימין או לשמאל לפי שפת הקורות חיים',
            band2Title: 'תבניות מנצחות',
            band2Body: 'עיצובים נקיים, מקצועיים ומותאמים לסינון ATS',
            band3Title: 'הורדה מאובטחת',
            band3Body: 'תשלום מאובטח ב-Bit • הורדה מיידית',
            howKicker: 'איך זה עובד',
            homeHow: '3 צעדים פשוטים לקורות חיים מושלמים',
            homeHowLead: 'בלי להסתבך עם מעצבים או קבצי Word שמתפרקים. פשוט, מהיר ומקצועי.',
            step1Title: 'מזינים פרטים',
            step1Body: 'ממלאים את הניסיון, ההשכלה והכישורים בטופס הנגיש. שדות שאין בהם צורך פשוט לא יופיעו.',
            step2Title: 'בוחרים עיצוב',
            step2Body: 'בוחרים צבעים, פונט עברי וסגנון פריסה. השינוי משתקף מיד בתצוגה המקדימה.',
            step3Title: 'מורידים PDF',
            baVs: 'מול',
            baAria: 'השוואת לפני ואחרי',
            homeCraft: 'עיצוב מקצועי ברמת מעצב – בלי להסתבך',
            toolPhrasesTitle: 'משפטים לפי תחום',
            toolPhrasesBody: 'מאגר ניסוחים מקצועיים להייטק, מכירות ועוד – שמוסיפים בלחיצה אחת.',
            toolSaveTitle: 'שמירה אוטומטית',
            toolSaveBody: 'כל הפרטים נשמרים בדפדפן באופן מאובטח, כך שתוכלו לחזור ולערוך בכל רגע.',
            toolPdfTitle: 'הורדה מיידית ב-PDF',
            toolPdfBody: 'קובץ PDF נקי, מעוצב ומוכן למשלוח מיידי למעסיקים ולמגייסים.',
            rolesKicker: 'לפי תפקיד',
            homeRoles: 'תבניות מוכנות למכירות, הייטק ועוד',
            homeRolesLead: 'בחרו את התחום שלכם לקבלת תבנית מותאמת אישית עם ניסוחים מקצועיים מוכנים לשימוש.',
            roleSalesTitle: 'מכירות',
            roleSalesBody: 'דגש על עמידה ביעדים, ניהול משא ומתן והרחבת מעגל הלקוחות.',
            roleTechTitle: 'הייטק',
            roleTechBody: 'דגש על טכנולוגיות, שפות פיתוח, פרויקטים ופריסה נקייה ל-ATS.',
            roleStudentsTitle: 'סטודנטים',
            roleStudentsBody: 'הבלטת השכלה, פרויקטי גמר ויכולות אישיות גם ללא ניסיון קודם.',
            roleCsTitle: 'שירות לקוחות',
            roleCsBody: 'הצגת יחסי אנוש מעולים, פתרון בעיות וניהול קשרי לקוחות.',
            allFields: 'כל התחומים',
            offerKicker: 'מחיר השקה',
            homeOffer: 'קורות חיים מוכנים להגשה',
            homeOfferLead: 'תשלום מאובטח ב-Bit, אישור מיידי במערכת והורדת קובץ PDF ישר למחשב. בלי מנוי ובלי הפתעות.',
            homeOfferCoffee: 'פורמט מקצועי המותאם למערכות סינון (ATS) ב-10 ₪ בלבד.',
            homeOfferFoot: 'תשלום חד-פעמי • הורדה מיידית בדפדפן',
            homeOfferCta: 'יצירת קורות החיים',
            homeFooterTag: 'QuickCV · מחולל קורות חיים פרימיום',
            seoShellKicker: 'תבניות לפי תחום',
            seoShellTitle: 'קורות חיים ממוקדים',
            seoShellCta: 'התחילו עם דוגמה',
            seoShellStudio: 'לסטודיו ריק',
            seoShellExamplesKicker: 'דוגמאות מוכנות',
            seoShellExamplesHeading: 'בחרו תבנית וערכו מיד',
            langSwitchAria: 'שפת האתר',
            studioStepsAria: 'שלבי יצירת קורות החיים',
            payTitle: 'תשלום ₪10 בלבד',
            paySubDesktop: 'סרקו את הקוד באמצעות הטלפון כדי להשלים את התשלום ב-Bit',
            paySubMobile: 'לחצו לפתיחת אפליקציית Bit והשלימו את התשלום',
            payPhoneLabel: 'מספר טלפון לזיהוי ההעברה',
            payQrCaption: 'Bit · 10 ₪',
            payQrAlt: 'קוד QR לתשלום 10 ₪ ב-Bit',
            payClose: 'סגור תשלום',
            payWait: 'ממתין לאישור תשלום... (ההורדה תתחיל אוטומטית)',
            paySuccess: 'התשלום אושר בהצלחה!',
            payAccessNotice: 'תודה! הרכישה מקנה לך גישה חופשית לעריכה והורדה של כל התבניות ל-24 השעות הקרובות.',
            paySuccessHint: 'במחשב ההורדה מתחילה אוטומטית. בנייד (בעיקר Safari) לחצו על הכפתור הירוק אם הקובץ לא נשמר.',
            payCoverNote: 'נכלל מכתב מקדים — אפשר להוריד אותו למטה.',
            payDownloadCv: 'הורד קורות חיים ב-PDF',
            paySendWa: 'שלח PDF לוואטסאפ שלי',
            payWaPhone: 'נייד לשליחה',
            payCoverDl: 'הורד מכתב מקדים',
            payShareTitle: 'שתפו עם חברים',
            payShareLead: 'קישור הפניה אישי — וואטסאפ או העתקה.',
            payCopyLink: 'העתק קישור',
            payShareWa: 'שיתוף ב-WhatsApp',
            payBackCv: 'חזרה לקורות החיים',
            payLaunchBadge: 'מחיר השקה — 10 ₪ בלבד',
            payCopied: 'הועתק',
            payCopyNumber: 'העתק מספר',
            payFallbackToast: 'המספר הועתק! שנה לאפליקציית התשלום',
            shotTitle: 'התצוגה המקדימה מוגנת',
            shotLead: 'לאחר תשלום של 10 ₪ אפשר להוריד PDF נקי.',
            pdfSpinTitle: 'מכין PDF...',
            pdfSpinLead: 'הקובץ יירד באיכות מלאה כמו בתצוגה החיה',
            bitCta: 'שלמו 10 ₪ ב-Bit',
            waitStatus: 'ממתין לאישור תשלום... (ההורדה תתחיל אוטומטית)',
            orderRejected: 'ההזמנה נדחתה.',
            orderRejectedFb: 'ההזמנה לא אושרה. אפשר לפתוח הזמנה חדשה.',
            accessExpired: 'פג תוקף הגישה.',
            accessExpiredFb: 'פג תוקף הגישה. יש לבצע הזמנה חדשה.',
            orderOpenFail: 'לא הצלחנו לפתוח הזמנה. נסו שוב.',
            autoDownloadTry: 'מנסה להוריד אוטומטית... אם זה לא מתחיל, לחצו על הכפתור הירוק.',
            autoDownloadTryMobile: 'מכין PDF… אם לא נפתח שיתוף/הורדה, לחצו על הכפתור הירוק.',
            downloadReadyMobile: 'ה-PDF מוכן. אם לא נשמר — לחצו שוב על הכפתור הירוק.',
            preparingPdfMobile: 'מכין PDF באיכות מלאה לתצוגה שלכם…',
            clickGreenDownload: 'לחצו על הכפתור הירוק להורדת ה-PDF.',
            sharePickWa: 'בחרו WhatsApp בשיתוף כדי לשלוח את הקובץ.',
            waPdfSent: 'ה-PDF נשלח לוואטסאפ.',
            waPreparing: 'מכין PDF לשליחה...',
            waDownloadedAttach: 'הקובץ ירד. צרפו אותו בשיחת WhatsApp שנפתחה.',
            waLinkOpened: 'נפתח WhatsApp עם קישור לצפייה ושמירה של קורות החיים.',
            waLinkShareOpened: 'נפתח WhatsApp — בחרו צ\'אט כדי לשלוח את הקישור.',
            waSendFail: 'לא הצלחנו לשלוח. נסו הורדה רגילה.',
            waShareText: 'הנה קישור לצפייה ושמירה של קורות החיים שלך מ-QuickCV:',
            pdfShareTitle: 'קורות החיים מ-QuickCV',
            downloadStarted: 'ההורדה התחילה.',
            downloadFailed: 'ההורדה נכשלה. נסו שוב.',
            preparingPdf: 'מכין קובץ PDF...',
            preparingFile: 'מכין קובץ...',
            coverDownloaded: 'המכתב המקדים ירד.',
            needPayBeforeDl: 'יש לאמת תשלום או קוד לפני ההורדה.',
            clipGuard: 'QuickCV — התצוגה המקדימה מוגנת עד לאחר התשלום.'
        },
        en: {
            pageTitle: 'QuickCV - Professional CV Builder',
            pageDescription: 'Build a professional resume: ready templates, live preview, and instant PDF download after Bit payment.',
            skipLink: 'Skip to content',
            homeTitle: 'Professional resumes that open doors',
            homeSubhead: 'ATS-ready resumes • Clean, professional design',
            homeLead: 'Fill in your details, pick a clean design, and download a submission-ready PDF. One-time payment of only 10 ₪ — no signup, no hidden subscription.',
            homeCta: 'Start now — 10 ₪',
            homeSeoNav: 'Templates by field',
            seoCatHitech: 'Hi-Tech',
            seoCatSales: 'Sales',
            seoCatStudents: 'Students',
            seoCatCs: 'Customer service',
            homePaperBadge: 'ATS-approved format',
            band1Title: 'Hebrew & English',
            band1Body: 'Right-to-left or left-to-right layout based on CV language',
            band2Title: 'Winning templates',
            band2Body: 'Clean, professional designs built for ATS screening',
            band3Title: 'Secure download',
            band3Body: 'Secure Bit payment • Instant download',
            howKicker: 'How it works',
            homeHow: '3 simple steps to a polished resume',
            homeHowLead: 'No designers, no broken Word files. Simple, fast, and professional.',
            step1Title: 'Enter your details',
            step1Body: 'Fill in experience, education, and skills. Empty fields simply stay hidden.',
            step2Title: 'Pick a design',
            step2Body: 'Choose colors, typography, and layout. Changes show instantly in the live preview.',
            step3Title: 'Download PDF',
            baVs: 'vs',
            baAria: 'Before and after comparison',
            homeCraft: 'Designer-level polish — without the hassle',
            toolPhrasesTitle: 'Phrases by field',
            toolPhrasesBody: 'Professional wording for tech, sales, and more — add with one tap.',
            toolSaveTitle: 'Auto-save',
            toolSaveBody: 'Your details stay securely in the browser so you can come back anytime.',
            toolPdfTitle: 'Instant PDF download',
            toolPdfBody: 'A clean, designed PDF ready to send to employers and recruiters.',
            rolesKicker: 'By role',
            homeRoles: 'Ready templates for sales, tech, and more',
            homeRolesLead: 'Pick your field for a tailored template with ready-to-use professional wording.',
            roleSalesTitle: 'Sales',
            roleSalesBody: 'Highlight targets, negotiation, and growing your client base.',
            roleTechTitle: 'Hi-Tech',
            roleTechBody: 'Highlight technologies, languages, projects, and clean ATS-friendly layout.',
            roleStudentsTitle: 'Students',
            roleStudentsBody: 'Showcase education, final projects, and strengths even without prior experience.',
            roleCsTitle: 'Customer service',
            roleCsBody: 'Show strong people skills, problem-solving, and client relationship management.',
            allFields: 'All fields',
            offerKicker: 'Launch price',
            homeOffer: 'Submission-ready resumes',
            homeOfferLead: 'Secure Bit payment, instant confirmation, and PDF download straight to your device. No subscription, no surprises.',
            homeOfferCoffee: 'Professional ATS-ready format for only 10 ₪.',
            homeOfferFoot: 'One-time payment • Instant in-browser download',
            homeOfferCta: 'Create your resume',
            homeFooterTag: 'QuickCV · Premium resume builder',
            seoShellKicker: 'Templates by field',
            seoShellTitle: 'Focused resumes',
            seoShellCta: 'Start with a sample',
            seoShellStudio: 'Empty studio',
            seoShellExamplesKicker: 'Ready examples',
            seoShellExamplesHeading: 'Pick a template and edit right away',
            langSwitchAria: 'Site language',
            studioStepsAria: 'Resume creation steps',
            payTitle: 'Pay only ₪10',
            paySubDesktop: 'Scan the code with your phone to complete payment in Bit',
            paySubMobile: 'Tap to open the Bit app and complete payment',
            payPhoneLabel: 'Phone number to identify the transfer',
            payQrCaption: 'Bit · 10 ₪',
            payQrAlt: 'QR code for 10 ₪ Bit payment',
            payClose: 'Close payment',
            payWait: 'Waiting for payment approval... (download starts automatically)',
            paySuccess: 'Payment approved!',
            payAccessNotice: 'Thanks! Your purchase gives you free access to edit and download every template for the next 24 hours.',
            paySuccessHint: 'On desktop the download starts automatically. On mobile (especially Safari), tap the green button if the file did not save.',
            payCoverNote: 'A cover letter is included — download it below.',
            payDownloadCv: 'Download resume PDF',
            paySendWa: 'Send PDF to my WhatsApp',
            payWaPhone: 'Mobile for delivery',
            payCoverDl: 'Download cover letter',
            payShareTitle: 'Share with friends',
            payShareLead: 'Your personal referral link — WhatsApp or copy.',
            payCopyLink: 'Copy link',
            payShareWa: 'Share on WhatsApp',
            payBackCv: 'Back to resume',
            payLaunchBadge: 'Launch price — only 10 ₪',
            payCopied: 'Copied',
            payCopyNumber: 'Copy number',
            payFallbackToast: 'Number copied! Switch to the payment app',
            shotTitle: 'Preview is protected',
            shotLead: 'After a 10 ₪ payment you can download a clean PDF.',
            pdfSpinTitle: 'Preparing PDF...',
            pdfSpinLead: 'Your file will download in full preview quality',
            bitCta: 'Pay 10 ₪ with Bit',
            waitStatus: 'Waiting for payment approval... (download starts automatically)',
            orderRejected: 'Order declined.',
            orderRejectedFb: 'The order was not approved. You can open a new order.',
            accessExpired: 'Access expired.',
            accessExpiredFb: 'Access expired. Please place a new order.',
            orderOpenFail: 'Could not open an order. Try again.',
            autoDownloadTry: 'Trying automatic download... If it does not start, tap the green button.',
            autoDownloadTryMobile: 'Preparing PDF… If share/download does not open, tap the green button.',
            downloadReadyMobile: 'PDF is ready. If it did not save — tap the green button again.',
            preparingPdfMobile: 'Preparing a full-quality PDF matching your preview…',
            clickGreenDownload: 'Tap the green button to download the PDF.',
            sharePickWa: 'Choose WhatsApp in the share sheet to send the file.',
            waPdfSent: 'PDF sent to WhatsApp.',
            waPreparing: 'Preparing PDF to send...',
            waDownloadedAttach: 'File downloaded. Attach it in the WhatsApp chat that opened.',
            waLinkOpened: 'WhatsApp opened with a link to view and save your resume.',
            waLinkShareOpened: 'WhatsApp opened — pick a chat to send the link.',
            waSendFail: 'Could not send. Try a regular download.',
            waShareText: 'Here\'s a link to view and save your QuickCV resume:',
            pdfShareTitle: 'Resume from QuickCV',
            downloadStarted: 'Download started.',
            downloadFailed: 'Download failed. Try again.',
            preparingPdf: 'Preparing PDF...',
            preparingFile: 'Preparing file...',
            coverDownloaded: 'Cover letter downloaded.',
            needPayBeforeDl: 'Verify payment or a code before downloading.',
            clipGuard: 'QuickCV — preview is protected until after payment.'
        }
    };

    var ID_MAP = {
        'skip-link': 'skipLink',
        'home-title': 'homeTitle',
        'home-subhead': 'homeSubhead',
        'home-lead': 'homeLead',
        'home-cta': 'homeCta',
        'home-paper-badge': 'homePaperBadge',
        'home-how-kicker': 'howKicker',
        'home-how': 'homeHow',
        'home-how-lead': 'homeHowLead',
        'home-step-1-title-text': 'step1Title',
        'home-step-1-body': 'step1Body',
        'home-step-2-title-text': 'step2Title',
        'home-step-2-body': 'step2Body',
        'home-step-3-title-text': 'step3Title',
        'ba-vs': 'baVs',
        'home-craft': 'homeCraft',
        'home-tool-phrases-title': 'toolPhrasesTitle',
        'home-tool-phrases-body': 'toolPhrasesBody',
        'home-tool-save-title': 'toolSaveTitle',
        'home-tool-save-body': 'toolSaveBody',
        'home-tool-pdf-title': 'toolPdfTitle',
        'home-tool-pdf-body': 'toolPdfBody',
        'home-roles-kicker': 'rolesKicker',
        'home-roles': 'homeRoles',
        'home-roles-lead': 'homeRolesLead',
        'home-role-sales-title': 'roleSalesTitle',
        'home-role-sales-body': 'roleSalesBody',
        'home-role-tech-title': 'roleTechTitle',
        'home-role-tech-body': 'roleTechBody',
        'home-role-students-title': 'roleStudentsTitle',
        'home-role-students-body': 'roleStudentsBody',
        'home-role-cs-title': 'roleCsTitle',
        'home-role-cs-body': 'roleCsBody',
        'home-all-fields': 'allFields',
        'home-offer-kicker': 'offerKicker',
        'home-offer': 'homeOffer',
        'home-offer-lead': 'homeOfferLead',
        'home-offer-coffee': 'homeOfferCoffee',
        'home-offer-foot': 'homeOfferFoot',
        'home-offer-cta': 'homeOfferCta',
        'home-footer-tag': 'homeFooterTag',
        'home-footer-all': 'allFields',
        'seo-landing-kicker-static': 'seoShellKicker',
        'seo-shell-cta-fallback': 'seoShellCta',
        'seo-landing-examples-kicker': 'seoShellExamplesKicker',
        'seo-landing-examples-heading': 'seoShellExamplesHeading',
        'seo-landing-studio-empty': 'seoShellStudio',
        'pay-title': 'payTitle',
        'pay-sub-desktop': 'paySubDesktop',
        'pay-sub-mobile': 'paySubMobile',
        'checkout-phone-label': 'payPhoneLabel',
        'pay-qr-caption': 'payQrCaption',
        'manual-order-status': 'payWait',
        'pay-success-title': 'paySuccess',
        'pay-access-notice': 'payAccessNotice',
        'pay-success-hint': 'paySuccessHint',
        'download-complete-note': 'payCoverNote',
        'btn-download-cv-pdf': 'payDownloadCv',
        'btn-send-pdf-whatsapp': 'paySendWa',
        'wa-pdf-phone-label': 'payWaPhone',
        'cover-letter-download': 'payCoverDl',
        'pay-share-title': 'payShareTitle',
        'pay-share-lead': 'payShareLead',
        'btn-copy-referral': 'payCopyLink',
        'btn-referral-whatsapp': 'payShareWa',
        'btn-back-checkout': 'payBackCv',
        'shot-title': 'shotTitle',
        'shot-lead': 'shotLead',
        'pdf-spin-title': 'pdfSpinTitle',
        'pdf-spin-lead': 'pdfSpinLead'
    };

    function merge() {
        var base = global.CV_I18N || (global.CV_I18N = { he: {}, en: {} });
        ['he', 'en'].forEach(function (lang) {
            base[lang] = base[lang] || {};
            var src = EXTRA[lang] || {};
            Object.keys(src).forEach(function (k) {
                base[lang][k] = src[k];
            });
        });
        return base;
    }

    function packFor(lang) {
        merge();
        return (global.CV_I18N && global.CV_I18N[lang === 'en' ? 'en' : 'he']) || EXTRA.he;
    }

    function t(key, lang) {
        var pack = packFor(lang || (global.QCCvLang === 'en' ? 'en' : 'he'));
        if (!key) return '';
        if (pack[key] != null) return pack[key];
        var parts = String(key).split('.');
        var cur = pack;
        for (var i = 0; i < parts.length; i++) {
            if (cur == null) return '';
            cur = cur[parts[i]];
        }
        return cur == null ? '' : cur;
    }

    function setText(id, text) {
        if (!text) return;
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function apply(lang) {
        var L = lang === 'en' ? 'en' : 'he';
        var pack = packFor(L);
        var dir = L === 'en' ? 'ltr' : 'rtl';

        document.documentElement.lang = L;
        document.documentElement.dir = dir;
        if (document.body) document.body.setAttribute('dir', dir);

        ['home-view', 'seo-landing-view', 'payment-modal', 'examples-modal', 'handoff-modal', 'sample-pdf-modal'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.setAttribute('dir', dir);
        });

        Object.keys(ID_MAP).forEach(function (id) {
            setText(id, pack[ID_MAP[id]]);
        });

        document.querySelectorAll('[data-i18n-ui]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-ui');
            var val = t(key, L);
            if (!val) return;
            var attr = el.getAttribute('data-i18n-attr');
            if (attr) el.setAttribute(attr, val);
            else el.textContent = val;
        });

        document.querySelectorAll('.seo-cat-chip[data-seo-cat]').forEach(function (el) {
            var cat = el.getAttribute('data-seo-cat');
            var map = { tech: 'seoCatHitech', sales: 'seoCatSales', students: 'seoCatStudents', cs: 'seoCatCs' };
            if (map[cat] && pack[map[cat]]) el.textContent = pack[map[cat]];
        });

        document.querySelectorAll('[data-i18n-footer-cat]').forEach(function (el) {
            var cat = el.getAttribute('data-i18n-footer-cat');
            var map = { tech: 'seoCatHitech', sales: 'seoCatSales', students: 'seoCatStudents' };
            if (map[cat] && pack[map[cat]]) el.textContent = pack[map[cat]];
        });

        var band1t = document.getElementById('home-band-1-title');
        var band1b = document.getElementById('home-band-1-body');
        var band2t = document.getElementById('home-band-2-title');
        var band2b = document.getElementById('home-band-2-body');
        var band3t = document.getElementById('home-band-3-title');
        var band3b = document.getElementById('home-band-3-body');
        if (band1t) band1t.textContent = pack.band1Title;
        if (band1b) band1b.textContent = pack.band1Body;
        if (band2t) band2t.textContent = pack.band2Title;
        if (band2b) band2b.textContent = pack.band2Body;
        if (band3t) band3t.textContent = pack.band3Title;
        if (band3b) band3b.textContent = pack.band3Body;

        var homeLang = document.getElementById('home-lang-switch');
        if (homeLang) homeLang.setAttribute('aria-label', pack.langSwitchAria || '');
        var stepsNav = document.querySelector('.studio-toolbar nav[aria-label]');
        if (stepsNav && pack.studioStepsAria) stepsNav.setAttribute('aria-label', pack.studioStepsAria);

        var closePay = document.getElementById('btn-close-modal');
        if (closePay && pack.payClose) closePay.setAttribute('aria-label', pack.payClose);

        var bitQr = document.getElementById('bit-qr');
        if (bitQr && pack.payQrAlt) bitQr.setAttribute('alt', pack.payQrAlt);

        var baCompare = document.querySelector('.ba-compare');
        if (baCompare && pack.baAria) baCompare.setAttribute('aria-label', pack.baAria);

        var seoNav = document.querySelector('#home-view .seo-cat-row');
        if (seoNav && pack.homeSeoNav) seoNav.setAttribute('aria-label', pack.homeSeoNav);

        var offerCoffee = document.getElementById('home-offer-coffee');
        if (offerCoffee && pack.homeOfferCoffee) {
            offerCoffee.innerHTML = String(pack.homeOfferCoffee).replace(
                '10',
                '<span data-price>' + ((document.querySelector('[data-price]') || {}).textContent || '10') + '</span>'
            );
        }

        var shotLead = document.getElementById('shot-lead');
        if (shotLead && pack.shotLead) {
            shotLead.innerHTML = String(pack.shotLead).replace(
                '10',
                '<span data-price>' + ((document.querySelector('[data-price]') || {}).textContent || '10') + '</span>'
            );
        }

        // Document title / meta when not on a filled SEO landing
        var onSeo = document.getElementById('seo-landing-view') && !document.getElementById('seo-landing-view').hidden;
        if (!onSeo && pack.pageTitle) {
            document.title = pack.pageTitle;
            var desc = document.getElementById('meta-description') || document.querySelector('meta[name="description"]');
            if (desc && pack.pageDescription) desc.setAttribute('content', pack.pageDescription);
        }

        document.querySelectorAll('#download-step .grid, #download-step .text-right, #download-step .text-left').forEach(function (el) {
            el.classList.toggle('text-right', L !== 'en');
            el.classList.toggle('text-left', L === 'en');
        });

        document.querySelectorAll('#home-lang-he, #home-lang-en, #seo-lang-he, #seo-lang-en').forEach(function (el) {
            var value = el.getAttribute('data-lang') || (el.id && el.id.indexOf('-en') >= 0 ? 'en' : 'he');
            el.setAttribute('aria-pressed', value === L ? 'true' : 'false');
        });
    }

    global.QCSiteI18n = {
        EXTRA: EXTRA,
        merge: merge,
        apply: apply,
        t: t
    };
    global.qcT = function (key) {
        return t(key);
    };
})(typeof window !== 'undefined' ? window : globalThis);
