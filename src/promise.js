/**
 * @class Promise
 * The world's smallest, most-useless Promise library. A user specifies a
 * `done()` and/or `fail()` callbacks. The promise is then either resolved as
 * done (`resolve()`) or failed (`resolveFail()`), along with any associated
 * input arguments, which are then passed to the registered callbacks.
 * 
 * For example:
 * 
 *     @example
 *     var promise = new Promise();
 *     promise.done(function (value) {
 *         console.log("Great success!", value);
 *     }).fail(function (error) {
 *         console.error("Whoawhoawewa!", error);
 *     });
 *     someDeeplyNestedAsyncOperation(function (someValue) {
 *         if (error === undefined) {
 *             promise.resolve(someValue);
 *         } else {
 *             promise.resolveFail(error);
 *         }
 *     });
 * 
 * @constructor
 * Creates a new promise object. If a context object is provided, the callbacks
 * are called with it as their context. Useful for decorating a class as a
 * promise.
 * @param {Object} context (optional) The callback context
 */
function Promise(context) {
    this.resolved = false;
    this.doneCallbacks = [];
    this.failCallbacks = [];
    
    this.runCallbacks = function (callbacks) {
        var args = this.args;
        callbacks.forEach(function (cb) {
            cb.apply(context, args);
        });
    };
    
    
    /**
     * @method done
     * Registers a callback for successful resolution of the promise. The
     * callback is called with any values passed to #resolve().
     * @param {Function} callback The callback
     * @chainable
     */
    this.done = function (callback) {
        var self = this;
        if (this.resolved) {
            callback.apply(context, self.args);
        } else {
            this.doneCallbacks.push(callback);
        }
        return this;
    };
    
    /**
     * @method fail
     * Registers a callback for failed resolution of the promise. The
     * callback is called with any values passed to #resolveFail().
     * @param {Function} callback The callback
     * @chainable
     */
    this.fail = function (callback) {
        if (this.resolved) {
            callback.apply(context, this.args);
        } else {
            this.failCallbacks.push(callback);
        }
        return this;
    };
    
    /**
     * @method resolve
     * Resolve the promise as successful.
     * @param {Array} arguments The value(s) with which to resolve.
     * @chainable
     */
    this.resolve = function () {
        this.resolved = true;
        this.args = Array.prototype.slice.call(arguments, 0);
        this.runCallbacks(this.doneCallbacks);
        return this;
    };
    
    /**
     * @method resolveFail
     * Resolve the promise as failed.
     * @param {Array} arguments The value(s) with which to resolve.
     * @chainable
     */
    this.resolveFail = function () {
        this.resolved = true;
        this.args = Array.prototype.slice.call(arguments, 0);
        this.runCallbacks(this.failCallbacks);
        return this;
    };
    return this;
};

module.exports = Promise;