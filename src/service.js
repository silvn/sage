/**
 * @ module service
 *
 * The base service, providing all service functionality
 * Includes the Service API
 */

var util = require('util');

function Service() { }

Service.extend = function (args) {
    var Extended = function () {
        for (var prop in args) {
            this[prop] = args[prop];
        }
    };
    util.inherits(Extended, Service);
    return Extended;
};

Service.prototype.start = function (params) {
    params = params || {};
    if (params.port === undefined) {
        throw new Error("port is a required parameter");
    }
    return this;
};

module.exports = Service;