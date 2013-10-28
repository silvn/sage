/**
 * @class Promise
 * The world's smallest, most-useless Promise library.
 * 
 * @constructor
 * @param {Object} (optional) context The callback context
 */
function Promise(context) {
    this.resolved = false;
    this.done = function (callback) {
        if (this.resolved) {
            callback.apply(context, this.args);
        } else {
            this.doneCallback = callback;
        }
        return this;
    };
    this.fail = function (callback) {
        if (this.resolved) {
            callback.apply(context, this.args);
        } else {
            this.failCallback = callback;
        }
        return this;
    };
    this.resolve = function () {
        this.resolved = true;
        if (this.doneCallback !== undefined) {
            this.doneCallback.apply(context, arguments);
        } else {
            this.args = Array.prototype.slice.call(arguments, 0);
        }
        return this;
    };
    this.resolveFail = function () {
        this.resolved = true;
        if (this.failCallback !== undefined) {
            this.failCallback.apply(context, arguments);
        } else {
            this.args = Array.prototype.slice.call(arguments, 0);
        }
        return this;
    };
    return this;
};

module.exports = Promise;