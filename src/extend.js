var util = require("util");

/**
 * @class
 * @method extend
 * Extends a class or an object.
 * 
 *     @example
 *     var Animal = function () {}
 *     Animal.extend = require("extend");
 *     var Cow = Animal.extend({ sound: "moo" });
 *
 * @param {Object} args Arguments with which to extend
 * @return {Object} The extended class
 */
module.exports = function extend(args) {
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
