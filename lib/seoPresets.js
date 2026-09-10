(function (global) {
    var SEO_SLUG_TO_FIELD = {
        sales: "sales",
        "hi-tech": "tech",
        hitech: "tech",
        tech: "tech",
        students: "student",
        student: "student",
        intern: "student",
        "customer-service": "cs",
        cs: "cs",
        service: "cs",
        support: "cs",
        marketing: "marketing",
        "digital-marketing": "marketing",
        education: "edu",
        edu: "edu",
        teaching: "edu",
        operations: "ops",
        ops: "ops",
        logistics: "ops",
        hr: "hr",
        people: "hr",
        recruiting: "hr",
        finance: "finance",
        accounting: "finance",
        healthcare: "healthcare",
        nursing: "healthcare",
        clinic: "healthcare",
        legal: "legal",
        law: "legal",
        product: "product",
        pm: "product",
        design: "design",
        ux: "design",
        ui: "design",
        hospitality: "hospitality",
        food: "hospitality",
        restaurant: "hospitality",
        admin: "admin",
        office: "admin",
        assistant: "admin",
        engineering: "engineering",
        civil: "engineering",
        site: "engineering"
    };

    var PRESET_LAYOUT = {
        sales: "sage",
        tech: "slate",
        student: "intern",
        cs: "cream",
        marketing: "wine",
        edu: "simple",
        ops: "ivory",
        hr: "blush",
        finance: "gold",
        healthcare: "clinic",
        legal: "split",
        product: "espresso",
        design: "azure",
        hospitality: "mint",
        admin: "pearl",
        engineering: "compact"
    };

    function resolve(raw) {
        return SEO_SLUG_TO_FIELD[String(raw || "").trim().toLowerCase()] || "";
    }

    global.QCSeoPresets = {
        resolve: resolve,
        layoutFor: function (field) {
            return PRESET_LAYOUT[field] || "";
        }
    };
})(window);
