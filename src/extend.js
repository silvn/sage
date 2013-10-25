var _ = require("underscore");

/**
 * @class
 * @method extend
 * Extends a class or an .
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
    args = (args || {});
    var Super = this;
    var Extended;

    if (args.hasOwnProperty("constructor")) {
        Extended = args["constructor"];
    } else {
        Extended = function () { return Super.apply(this, arguments); };
    }

    _.extend(Extended, Super);

    // Set prototype chain
    var Proto = function () { this.constructor = Extended; };
    Proto.prototype = Super.prototype;
    Extended.prototype = new Proto();

    _.extend(Extended.prototype, args);
    Extended.extend = extend;

    Extended.__super__ = Super.prototype;

    return Extended;
};
