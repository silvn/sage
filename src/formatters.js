var XML = require("js2xmlparser");

(function (module) {
    module.exports.formatXML = function (req, res, body, cb) {
        if (body instanceof Error) {
            res.statusCode = body.statusCode || 500;
            if (body.body) {
                body = body.body;
            } else {
                body = { message: body.message };
            }
        }
        var xml = XML("sage", body, {
            prettyPrinting: { enabled: false },
            wrapArray: { enabled: true }
        });
        res.setHeader('Content-Length', Buffer.byteLength(xml));
        return (xml);
    };
    
    module.exports.formatJSON = function (req, res, body) {
        if (body instanceof Error) {
            res.statusCode = body.statusCode || 500;
            if (body.body) {
                body = body.body;
            } else {
                body = { message: body.message };
            }
        } else if (Buffer.isBuffer(body)) {
            body = body.toString('base64');
        }
        var data = JSON.stringify(body);
        res.setHeader('Content-Length', Buffer.byteLength(data));
        return (data);
    };
})(module);