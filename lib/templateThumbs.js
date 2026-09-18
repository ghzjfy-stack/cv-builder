(function (global) {
    var W = 72;
    var H = 96;
    var BADGES = {
        simple: { kind: "popular", he: "פופולרי", en: "Popular" },
        ink: { kind: "minimal", he: "מינימלי", en: "Minimal" },
        harvard: { kind: "ats", he: "ATS Friendly", en: "ATS Friendly" },
        swiss: { kind: "modern", he: "מודרני", en: "Modern" },
        compact: { kind: "compact", he: "עמוד אחד", en: "One Page" },
        intern: { kind: "student", he: "סטודנט", en: "Student" },
        academic: { kind: "academic", he: "אקדמי", en: "Academic" },
        pearl: { kind: "modern", he: "מודרני", en: "Modern" },
        cobalt: { kind: "tech", he: "הייטק", en: "Tech" },
        "entry-clean": { kind: "entry", he: "כניסה", en: "Entry" },
        "heebo-ats": { kind: "ats", he: "ATS Friendly", en: "ATS Friendly" },
        "assistant-ats": { kind: "minimal", he: "רך", en: "Soft" },
        "rubik-pro": { kind: "professional", he: "מקצועי", en: "Professional" },
        "finance-ats": { kind: "finance", he: "כספים", en: "Finance" },
        "legal-ats": { kind: "legal", he: "משפטים", en: "Legal" },
        "health-ats": { kind: "healthcare", he: "בריאות", en: "Healthcare" },
        "student-ats": { kind: "student", he: "סטודנט", en: "Student" },
        "mgmt-ats": { kind: "executive", he: "הנהלה", en: "Executive" },
        charcoal: { kind: "photo", he: "עם תמונה", en: "Photo" },
        navy: { kind: "corporate", he: "תאגידי", en: "Corporate" },
        petra: { kind: "timeline", he: "ציר־זמן", en: "Timeline" },
        midnight: { kind: "executive", he: "הנהלה", en: "Executive" },
        emerald: { kind: "colorful", he: "צבעוני", en: "Colorful" },
        azure: { kind: "popular", he: "פופולרי", en: "Popular" },
        mint: { kind: "modern", he: "מודרני", en: "Modern" },
        blush: { kind: "creative", he: "יצירתי", en: "Creative" },
        terracotta: { kind: "creative", he: "יצירתי", en: "Creative" },
        cream: { kind: "elegant", he: "אלגנטי", en: "Elegant" },
        clinic: { kind: "healthcare", he: "בריאות", en: "Healthcare" },
        europass: { kind: "europe", he: "אירופה", en: "Europe" },
        ivory: { kind: "executive", he: "הנהלה", en: "Executive" },
        gold: { kind: "finance", he: "פיננסי", en: "Finance" },
        espresso: { kind: "professional", he: "עורכי", en: "Editorial" },
        sage: { kind: "professional", he: "מקצועי", en: "Professional" },
        slate: { kind: "tech", he: "דו־טורי", en: "Two-Column" },
        wine: { kind: "creative", he: "יצירתי", en: "Creative" },
        forest: { kind: "consulting", he: "ייעוץ", en: "Consulting" },
        sand: { kind: "sidebar", he: "סרגל צד", en: "Sidebar" },
        split: { kind: "split", he: "מפוצל", en: "Split" },
        "teal-sidebar": { kind: "sidebar", he: "סרגל צד", en: "Sidebar" },
        "ink-exec": { kind: "executive", he: "הנהלה", en: "Executive" },
        "student-modern": { kind: "student", he: "סטודנט", en: "Student" },
        "dev-navy": { kind: "tech", he: "הייטק", en: "Tech" },
        "sales-azure": { kind: "sales", he: "מכירות", en: "Sales" },
        "creative-split": { kind: "creative", he: "יצירתי", en: "Creative" },
        "entry-mint": { kind: "entry", he: "כניסה", en: "Entry" },
        "product-slate": { kind: "tech", he: "מוצר", en: "Product" },
        "consult-forest": { kind: "consulting", he: "ייעוץ", en: "Consulting" },
        "bank-gold": { kind: "finance", he: "בנקאות", en: "Banking" },
        "nurse-clean": { kind: "healthcare", he: "סיעוד", en: "Nursing" },
        "grad-compact": { kind: "compact", he: "עמוד אחד", en: "One Page" },
        "hr-blush": { kind: "people", he: "משאבי אנוש", en: "People" },
        "ops-midnight": { kind: "executive", he: "הנהלה", en: "Executive" },
        "marketing-wine": { kind: "creative", he: "שיווק", en: "Marketing" },
        "designer-terra": { kind: "creative", he: "עיצוב", en: "Design" }
    };

    function hex(value, fallback) {
        var v = String(value || "").trim();
        return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ? v : fallback;
    }
    function salt(id) {
        var n = 2166136261;
        for (var i = 0; i < id.length; i++) {
            n ^= id.charCodeAt(i);
            n = Math.imul(n, 16777619);
        }
        return n >>> 0;
    }
    function paperOf(tpl) {
        return "#ffffff";
    }
    function inkOf(tpl) {
        return hex(tpl.colorPalette && tpl.colorPalette.text, "#1c1917");
    }
    function charcoalTone(tpl) {
        if (tpl.skin === "espresso") return "#3e342c";
        if (tpl.skin === "sage") return "#4d5d52";
        if (tpl.skin === "slate") return "#3e4c58";
        if (tpl.skin === "wine") return "#5a3640";
        if (tpl.skin === "forest") return "#31443b";
        return hex(tpl.accent, "#4c4c4c");
    }
    function navyTone(tpl) {
        if (tpl.skin === "midnight") return "#0b1020";
        if (tpl.skin === "emerald") return "#1a3c34";
        return hex(tpl.accent, "#12192b");
    }
    function azureHead(tpl) {
        if (tpl.id === "europass") return "#1e4b8c";
        if (tpl.id === "clinic") return "#cfe8e4";
        if (tpl.skin === "mint") return "#d7ece8";
        if (tpl.skin === "blush") return "#ead9d4";
        if (tpl.skin === "terracotta") return "#f0ddd3";
        if (tpl.skin === "cream") return "#f3eadc";
        return "#dce8f0";
    }
    function r(x, y, w, h, fill, extra) {
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '" ' + (extra || "") + "/>";
    }
    function lines(x, y, w, n, gap, fill, opacity, saltN) {
        var out = "";
        for (var i = 0; i < n; i++) {
            var shorten = ((saltN || 0) + i * 17) % 5;
            var ww = +(w * (shorten === 0 ? 0.58 : shorten === 1 ? 0.78 : shorten === 2 ? 0.92 : 1)).toFixed(2);
            out += r(x, +(y + i * gap).toFixed(2), ww, 1.35, fill, 'rx="0.45" opacity="' + opacity + '"');
        }
        return out;
    }
    function sectionRule(x, y, w, fill) {
        return r(x, y, w, 1.1, fill, 'rx="0.4" opacity="0.85"');
    }
    function innerFor(tpl, lang) {
        var paper = paperOf(tpl);
        var ink = inkOf(tpl);
        var accent = hex(tpl.accent, "#1c1917");
        var s = salt(tpl.id || "");
        var rtl = lang !== "en";
        var layout = tpl.layout;
        var style = tpl.layoutStyle;
        if (layout === "navy") {
            var nsw = 25;
            var side = navyTone(tpl);
            var timeline = tpl.id === "petra";
            return r(0, 0, W, H, paper) + r(0, 0, nsw, H, side) +
                '<circle cx="' + (nsw / 2) + '" cy="14" r="7.2" fill="#c9cdd6"/>' +
                r(4, 24, nsw - 8, 2.2, "#ffffff", 'opacity="0.7"') +
                lines(4, 30, nsw - 8, 8, 6.4, "#ffffff", 0.4, s) +
                r(nsw + 6, 8, 30, 3.4, side, 'rx="0.4"') +
                r(nsw + 6, 13.4, 20, 1.4, ink, 'opacity="0.35"') +
                (timeline
                    ? '<circle cx="' + (nsw + 8) + '" cy="24" r="1.35" fill="' + side + '"/>' +
                      '<circle cx="' + (nsw + 8) + '" cy="40" r="1.35" fill="' + side + '"/>' +
                      '<circle cx="' + (nsw + 8) + '" cy="56" r="1.35" fill="' + side + '"/>' +
                      r(nsw + 7.6, 25.4, 0.8, 30, side, 'opacity="0.35"') +
                      lines(nsw + 12, 22, 28, 12, 5.2, ink, 0.2, s)
                    : sectionRule(nsw + 6, 22, 16, side) + lines(nsw + 6, 27, 35, 12, 4.6, ink, 0.2, s));
        }
        if (layout === "charcoal") {
            var csw = 24;
            var cside = charcoalTone(tpl);
            return r(0, 0, W, H, paper) + r(0, 0, csw, H, cside) + r(csw, 0, W - csw, 16, cside) +
                r(5, 6, 14, 14, "#d8d0c8", 'rx="1.2"') +
                r(5, 23, 14, 1.5, "#ffffff", 'opacity="0.55"') +
                lines(5, 28, 14, 8, 6, "#ffffff", 0.38, s) +
                r(csw + 6, 20, 28, 3.2, ink, 'rx="0.4"') +
                r(csw + 6, 25, 18, 1.3, cside) +
                lines(csw + 6, 32, 36, 11, 4.6, ink, 0.2, s + 5);
        }
        if (layout === "sidebar" || style === "two-column-left") {
            var ssw = 22;
            var sideX = rtl ? W - ssw : 0;
            var mainX = rtl ? 6 : ssw + 5;
            return r(0, 0, W, H, paper) +
                r(sideX, 0, ssw, H, accent, 'opacity="0.16"') +
                r(rtl ? W - 3.2 : 0, 0, 3.2, H, accent) +
                '<circle cx="' + (sideX + ssw / 2) + '" cy="12" r="5.5" fill="' + accent + '"/>' +
                lines(sideX + 3, 22, ssw - 6, 8, 6.4, accent, 0.55, s) +
                r(mainX, 8, 32, 3.4, ink, 'rx="0.4"') +
                r(mainX, 13, 18, 1.3, accent) +
                lines(mainX, 22, 38, 12, 5, ink, 0.2, s + 2);
        }
        if (layout === "split" || style === "two-column-right") {
            var psw = 22;
            var psideX = rtl ? 0 : W - psw;
            var pmainX = rtl ? psw + 5 : 6;
            return r(0, 0, W, H, paper) +
                r(psideX, 4, psw, H - 8, accent, 'rx="1.4"') +
                lines(psideX + 3, 12, psw - 6, 9, 7, "#ffffff", 0.55, s) +
                r(pmainX, 8, 32, 3.6, ink, 'rx="0.4"') +
                r(pmainX, 14, 20, 1.2, accent) +
                lines(pmainX, 22, 38, 12, 5, ink, 0.2, s + 4);
        }
        if (layout === "azure") {
            var head = azureHead(tpl);
            var headH = tpl.id === "europass" ? 20 : 16;
            var darkHead = tpl.id === "europass";
            var nameFill = darkHead ? "#ffffff" : accent;
            var rule = darkHead ? "#9bb7e0" : "#d4d8dd";
            var clinicMark = tpl.id === "clinic"
                ? r(58, 5, 7, 2.2, accent, 'rx="0.4"') + r(60.4, 2.6, 2.2, 7, accent, 'rx="0.4"')
                : "";
            return r(0, 0, W, H, paper) + r(0, 0, W, headH, head) +
                r(8, 5, 32, 3.4, nameFill, 'rx="0.45"') +
                r(8, 10, 20, 1.4, nameFill, 'opacity="0.55"') +
                clinicMark +
                r(26, headH + 4, 1, H - headH - 8, rule) +
                r(8, headH + 6, 14, 1.8, accent, 'opacity="0.85"') +
                lines(8, headH + 11, 14, 8, 6.2, ink, 0.22, s) +
                r(31, headH + 6, 18, 1.8, accent, 'opacity="0.7"') +
                lines(31, headH + 11, 33, 11, 5.4, ink, 0.2, s + 3);
        }
        if (layout === "executive") {
            var gold = tpl.id === "gold" || tpl.id === "bank-gold";
            return r(0, 0, W, H, paper) + r(0, 0, W, 22, accent) +
                r(8, 6, 36, 4, "#ffffff", 'rx="0.5"') +
                r(8, 12, 22, 1.6, "#ffffff", 'opacity="0.7"') +
                (gold ? r(0, 22, W, 2.4, "#c4a574") : "") +
                sectionRule(8, 22 + (gold ? 8 : 6), 16, accent) +
                lines(8, 22 + (gold ? 12 : 10), 56, 12, 4, ink, 0.2, s);
        }
        if (layout === "modern" || style === "header-accent") {
            var bar = tpl.id === "cobalt" ? "#1e3a5f" : accent;
            return r(0, 0, W, H, paper) + r(0, 7, 3.2, 16, bar) +
                r(8, 8, 42, 4, ink, 'rx="0.5"') +
                r(8, 14, 26, 1.6, ink, 'rx="0.4" opacity="0.35"') +
                r(8, 24, 16, 3.4, bar, 'rx="1.2" opacity="0.22"') +
                r(8, 30, 48, 1.2, ink, 'opacity="0.16"') +
                r(8, 34, 40, 1.2, ink, 'opacity="0.16"') +
                r(8, 42, 14, 3.4, bar, 'rx="1.2" opacity="0.22"') +
                lines(8, 48, 50, 9, 4.2, ink, 0.2, s);
        }
        if (layout === "compact") {
            return r(0, 0, W, H, paper) + r(6, 6, 60, 3.4, accent, 'rx="0.4"') +
                r(6, 11.2, 34, 1.5, ink, 'opacity="0.35"') +
                r(6, 16, W - 12, 0.7, accent, 'opacity="0.35"') +
                lines(6, 20, 60, 18, 3.6, ink, 0.2, s);
        }
        if (layout === "minimal") {
            return r(0, 0, W, H, paper) + r(16, 10, 40, 3.2, ink, 'rx="0.5"') +
                r(22, 15.4, 28, 1.4, ink, 'rx="0.4" opacity="0.32"') +
                r(26, 19, 20, 0.9, accent, 'rx="0.4"') +
                lines(12, 28, 48, 10, 5.2, ink, accent !== "#1c1917" ? 0.2 : 0.16, s);
        }
        var centered = layout === "classic" || tpl.id === "harvard" || tpl.id === "academic";
        var nameW = centered ? 38 : 44;
        var nameX = centered ? (W - nameW) / 2 : 8;
        var ruleW = centered ? 22 : 28;
        var ruleX = centered ? (W - ruleW) / 2 : 8;
        return r(0, 0, W, H, paper) +
            r(nameX, 8, nameW, 4.2, ink, 'rx="0.6"') +
            r(ruleX, 14.4, ruleW, 1.2, accent, 'rx="0.4"') +
            r(centered ? 24 : 8, 17.2, centered ? 24 : 20, 1.6, ink, 'rx="0.4" opacity="0.35"') +
            sectionRule(8, 26, 18, accent) +
            lines(8, 30, 56, 12, 3.6, ink, 0.22, s);
    }
    function badgeOf(tpl) {
        if (BADGES[tpl.id]) return BADGES[tpl.id];
        var tags = tpl.styleTags || [];
        if (tags.indexOf("executive") >= 0) return { kind: "executive", he: "הנהלה", en: "Executive" };
        if (tags.indexOf("creative") >= 0) return { kind: "creative", he: "יצירתי", en: "Creative" };
        if (tags.indexOf("minimal") >= 0) return { kind: "minimal", he: "מינימלי", en: "Minimal" };
        if (tpl.atsOptimized) return { kind: "ats", he: "ATS Friendly", en: "ATS Friendly" };
        if (tags.indexOf("modern") >= 0) return { kind: "modern", he: "מודרני", en: "Modern" };
        if (tags.indexOf("colorful") >= 0) return { kind: "colorful", he: "צבעוני", en: "Colorful" };
        return { kind: "professional", he: "מקצועי", en: "Professional" };
    }
    function badgeHtml(tpl, lang) {
        var badge = badgeOf(tpl);
        var label = lang === "en" ? badge.en : badge.he;
        var aria = badge.kind === "ats" ? (lang === "en" ? "ATS optimized template" : "תבנית מותאמת ל-ATS") : label;
        return '<span class="tpl-badge tpl-badge-' + badge.kind + '" aria-label="' + aria + '">' + label + "</span>";
    }
    function thumbHtml(tpl, lang) {
        var paper = paperOf(tpl);
        return '<div class="template-thumb tpl-mini" data-thumb-id="' + (tpl.id || "") + '" data-thumb-layout="' + (tpl.layout || "") + '" aria-hidden="true">' +
            '<svg viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="background:' + paper + '">' +
            innerFor(tpl, lang) + "</svg></div>";
    }
    function cardHtml(tpl, lang, id) {
        id = id || tpl.id;
        var useLabel = lang === "en" ? "Use This Template" : "השתמש בתבנית זו";
        var sub = lang === "en" ? (tpl.subEn || tpl.subHe || "") : (tpl.subHe || tpl.subEn || "");
        var title = lang === "en" ? (tpl.titleEn || tpl.title || "") : (tpl.titleHe || tpl.title || "");
        return '<article class="template-card" data-example="' + id + '" data-ats="' + (tpl.atsOptimized ? "1" : "0") + '" aria-pressed="false">' +
            badgeHtml(tpl, lang) + thumbHtml(tpl, lang) +
            '<div class="template-card-meta"><span class="template-card-title">' + title + "</span>" +
            '<span class="template-card-sub">' + sub + "</span></div>" +
            '<span class="template-card-hover" aria-hidden="true"><button type="button" class="template-use-btn" data-use-template="' + id + '">' + useLabel + "</button></span>" +
            "</article>";
    }

    global.QCTemplateThumbs = { badgeOf: badgeOf, badgeHtml: badgeHtml, thumbHtml: thumbHtml, cardHtml: cardHtml };
})(typeof window !== "undefined" ? window : this);
