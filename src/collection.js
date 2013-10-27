var Resource = require("./resource");

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
 * @extends Resource
 * @constructor
 */
var Collection = Resource.extend({
    constructor: function (params) {
        Resource.call(this, params); // super() constructor
        params = (params || {});
        this.items = [];
        this.ProtoResource = Resource;
        if (params.resource !== undefined) {
            this.ProtoResource = params.resource;
        }
    }
});

/**
 * @method add
 * Adds a resource to the collection.
 * @param {Resource} resource The resource to add
 * @chainable
 */
Collection.prototype.add = function (resource) {
    if (!(resource instanceof this.ProtoResource)) {
        throw new Error(
            "Collection can only contain resources of type " +
            this.ProtoResource
        );
    }
    this.items.push(resource);
    return this;
}

/**
 * @method get
 * Retrieves a resource from the collection
 * @param {Number} index The 0-based index of the resource to fetch
 * @return {Resource}
 */
Collection.prototype.get = function (index) {
    return this.items[index];
}

/**
 * @method size
 * Gets the number of items in the collection
 * @return {Number}
 */
Collection.prototype.size = function () {
    return this.items.length;
};

/**
 * @method remove
 * Removes a resource from the collection
 * @param {Resource} resource The resource to remove
 * @return {Resource}
 * @throws {Error}
 */
Collection.prototype.remove = function (resource) {
    for (var i = 0; i < this.items.length; i++) {
        if (this.items[i] == resource) {
            var removed = this.items.splice(i, 1);
            return removed[0];
        }
    }
    throw new Error("Cannot remove non-member resource");
}

/**
 * @method parse
 * Parses multiple resources into the collection.
 * @inheritdoc Resource#parse
 */
Collection.prototype.parse = function (data) {
    return data;
}

/** @ignore */
Collection.prototype.defaultParse = function (data) {
    var self = this;
    data.forEach(function (datum) {
        self.add(new self.ProtoResource(datum));
    });
    return data;
}

/**
 * @method extend
 * @inheritdoc Resource#extend
 * @static
 */
Collection.extend = Resource.extend;

module.exports = Collection;