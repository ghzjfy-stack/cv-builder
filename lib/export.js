(function (global) {
    function xmlEscape(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function collectResume() {
        var g = function (id) { return global.QCSanitize.text(document.getElementById(id).value); };
        return {
            name: g('in-name') || 'שם מלא',
            title: g('in-title') || 'תפקיד',
            phone: g('in-phone'),
            email: g('in-email'),
            location: g('in-location'),
            linkedin: g('in-linkedin'),
            summary: g('in-summary'),
            experience: g('in-experience'),
            education: g('in-education'),
            military: g('in-military'),
            skills: g('in-skills'),
            languages: g('in-languages')
        };
    }

    function fileBase() {
        return 'קורות_חיים_' + global.QCSanitize.filename(document.getElementById('in-name').value);
    }

    function triggerDownload(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    }

    function toTxt(data) {
        var lines = [
            data.name,
            data.title,
            [data.phone, data.email, data.location, data.linkedin].filter(Boolean).join(' | '),
            '',
            data.summary ? 'תקציר מקצועי\n' + data.summary : '',
            data.experience ? 'ניסיון תעסוקתי\n' + data.experience : '',
            data.education ? 'השכלה\n' + data.education : '',
            data.military ? 'שירות צבאי / לאומי\n' + data.military : '',
            data.skills ? 'כישורים\n' + data.skills : '',
            data.languages ? 'שפות\n' + data.languages : ''
        ];
        return lines.filter(function (b) { return b; }).join('\n\n');
    }

    function paraXml(text, opts) {
        opts = opts || {};
        var size = opts.size || 22;
        var bold = opts.bold ? '<w:b/><w:bCs/>' : '';
        var color = opts.color ? '<w:color w:val="' + opts.color + '"/>' : '';
        var after = opts.after != null ? opts.after : 120;
        var lines = String(text || '').split(/\n/);
        return lines.map(function (line) {
            return '<w:p>' +
                '<w:pPr><w:bidi/><w:jc w:val="right"/><w:spacing w:after="' + after + '"/></w:pPr>' +
                '<w:r><w:rPr><w:rtl/><w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/>' + bold + color + '</w:rPr>' +
                '<w:t xml:space="preserve">' + xmlEscape(line) + '</w:t></w:r></w:p>';
        }).join('');
    }

    function headingXml(title) {
        return paraXml(title, { size: 24, bold: true, color: '1D4ED8', after: 80 });
    }

    function buildDocx(data) {
        var contact = [data.phone, data.email, data.location, data.linkedin].filter(Boolean).join('  |  ');
        var body = paraXml(data.name, { size: 44, bold: true, after: 40 }) +
            paraXml(data.title, { size: 24, after: 80 }) +
            (contact ? paraXml(contact, { size: 18, after: 200 }) : '') +
            (data.summary ? headingXml('תקציר מקצועי') + paraXml(data.summary) : '') +
            (data.experience ? headingXml('ניסיון תעסוקתי') + paraXml(data.experience) : '') +
            (data.education ? headingXml('השכלה וקורסים') + paraXml(data.education) : '') +
            (data.military ? headingXml('שירות צבאי / לאומי') + paraXml(data.military) : '') +
            (data.skills ? headingXml('כישורים') + paraXml(data.skills) : '') +
            (data.languages ? headingXml('שפות') + paraXml(data.languages) : '') +
            '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>';

        var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
            '<w:body>' + body + '</w:body></w:document>';

        var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
            '<Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
            '</Types>';

        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
            '</Relationships>';

        var zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypes);
        zip.folder('_rels').file('.rels', rels);
        zip.folder('word').file('document.xml', documentXml);
        return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }

    function exportPdf() {
        if (typeof global.QCHighResPdf === 'function') {
            return global.QCHighResPdf();
        }
        return Promise.reject(new Error('pdf export missing'));
    }

    function exportImage(type) {
        var mime = type === 'jpg' ? 'image/jpeg' : 'image/png';
        var ext = type === 'jpg' ? '.jpg' : '.png';
        var el = document.getElementById('cv-target');
        var run = (typeof html2canvas === 'function')
            ? html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
            : html2pdf().set({ html2canvas: { scale: 2, backgroundColor: '#ffffff' } }).from(el).outputImg('canvas');
        return Promise.resolve(run).then(function (canvas) {
            return new Promise(function (resolve) {
                canvas.toBlob(function (blob) {
                    triggerDownload(blob, fileBase() + ext);
                    resolve();
                }, mime, 0.92);
            });
        });
    }

    global.QCExport = {
        data: collectResume,
        txt: function () {
            var blob = new Blob([toTxt(collectResume())], { type: 'text/plain;charset=utf-8' });
            triggerDownload(blob, fileBase() + '.txt');
            return Promise.resolve();
        },
        docx: function () {
            return buildDocx(collectResume()).then(function (blob) {
                triggerDownload(blob, fileBase() + '.docx');
            });
        },
        pdf: exportPdf,
        png: function () { return exportImage('png'); },
        jpg: function () { return exportImage('jpg'); }
    };
})(window);
