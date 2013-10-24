var util = require("util");

/**
 * @method extend
 * Extends an object.
 * 
 * @param {Object} args Arguments with which to extend
 * @return {Object} The extended object
 * 
 * @static
 */
function extend(args) {
    var Super = this;
    var Extended = function () {
        Super.apply(this, arguments);
        for (var prop in args) {
            this[prop] = args[prop];
        }
    };
    util.inherits(Extended, this);
    return Extended;
};

module.exports = extend;