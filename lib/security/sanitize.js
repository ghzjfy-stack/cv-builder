(function (global) {
    var MAX_LEN = 4000;

    function sanitizeText(value) {
        if (value == null) return '';
        var text = String(value)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/javascript:/gi, '');
        if (text.length > MAX_LEN) text = text.slice(0, MAX_LEN);
        return text.trim();
    }

    function looksSuspicious(value) {
        var text = String(value || '');
        return /<\s*script|javascript:|onerror\s*=|onload\s*=|data:text\/html/i.test(text);
    }

    function sanitizeFilename(value) {
        var name = sanitizeText(value) || 'CV';
        return name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 80);
    }

    global.QCSanitize = {
        text: sanitizeText,
        filename: sanitizeFilename,
        looksSuspicious: looksSuspicious
    };
})(window);
