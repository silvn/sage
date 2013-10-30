var Resource = require("./resource");
var extend   = require("./extend");

/**
 * @class Collection
 * A collection of {@link Resource}s.
 * 
 *     @example
 *     var Cats = Collection.extend({ url: "http://catserver.com" });
 *     var cats = new Cats();
 *     cats.add(new Resource());
 *     cats.fetch().done(function () { ... });
 * 
 * A collection acts as a pseudo-{link Array}, exposing Array API (while not
 * having an {link Array} prototype, for [very obscure reasons][1].)
 * 
 * [1]: http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
 * @extends Resource
 * @constructor
 */
(function (module) {
    "use strict";
    var Collection = Resource.extend({
        constructor: function (params) {
            params = (params || {});
            Resource.call(this, params); // super() constructor
            this.ProtoResource = Resource;
            if (params.resource !== undefined) {
                this.ProtoResource = params.resource;
            }
            // Hack to get this to start behaving like an Array
            this.push({}); this.pop();
            return this;
        }
    });

    [
        "join", "reverse", "sort", "push", "pop", "shift", "unshift",
        "splice", "concat", "slice", "indexOf", "lastIndexOf",
        "forEach", "map", "reduce", "reduceRight", "filter",
        "some", "every", "isArray"
    ].forEach(function (fn) {
        Collection.prototype[fn] = function () {
            return Array.prototype[fn].apply(this, arguments);
        };
    });

    /**
     * @method add
     * Adds a resource to the collection.
     * @param {Resource} resource The resource to add
     * @chainable
     */
    Collection.prototype.add = function (resource) {
        if (resource instanceof Resource) {
            if (!(resource instanceof this.ProtoResource)) {
                throw new Error(
                    "Collection can only contain resources of type " +
                    this.ProtoResource
                );
            }
        } else { // POJO
            resource = new this.ProtoResource(resource);
        }
        this.push(resource);
        return this;
    };

    /**
     * @method get
     * Retrieves a resource from the collection
     * @param {Number} index The 0-based index of the resource to fetch
     * @return {Resource}
     */
    Collection.prototype.get = function (index) {
        return this[index];
    };

    /**
     * @method size
     * Gets the number of items in the collection
     * @return {Number}
     */
    Collection.prototype.size = function () {
        return this.length;
    };

    /**
     * @method remove
     * Removes a resource from the collection
     * @param {Resource} resource The resource to remove
     * @return {Resource}
     * @throws {Error}
     */
    Collection.prototype.remove = function (resource) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == resource) {
                var removed = this.splice(i, 1);
                return removed[0];
            }
        }
        throw new Error("Cannot remove non-member resource");
    };

    /**
     * @method parse
     * Parses multiple resources into the collection.
     * @inheritdoc Resource#parse
     */
    Collection.prototype.parse = function (data) {
        return data;
    };

    /** @ignore */
    Collection.prototype.defaultParse = function (data) {
        var self = this;
        if (data !== null) {
            if (!Array.isArray(data)) {
                throw new TypeError(
                    "Attempting to parse non-array into collection");
            }
            data.forEach(function (datum) {
                self.add(new self.ProtoResource(datum));
            });
        }
        return data;
    };

    /**
     * @method extend
     * @inheritdoc Resource#extend
     * @static
     */
    Collection.extend = Resource.extend;

    module.exports = Collection;
})(module);